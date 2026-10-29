const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");

process.env.NODE_ENV = "test";
const app = require("../server");
const User = require("../models/User");
const Session = require("../models/Session");
const Product = require("../models/Product");
const Order = require("../models/Order");

let listener;
let baseUrl;
before(async () => {
    listener = await new Promise(resolve => {
        const server = app.listen(0, "127.0.0.1", () => resolve(server));
    });
    baseUrl = "http://127.0.0.1:" + listener.address().port;
});
after(async () => { if (listener) await new Promise(resolve => listener.close(resolve)); });

async function request(path, method = "GET", payload, token) {
    const headers = {};
    if (payload !== undefined) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = "Bearer " + token;
    const response = await fetch(baseUrl + path, {
        method, headers,
        ...(payload !== undefined ? { body: JSON.stringify(payload) } : {})
    });
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { text }; }
    return { status: response.status, data };
}

test("server API works and protected endpoints reject unauthenticated requests", async () => {
    assert.equal((await request("/api/test")).status, 200);
    assert.equal((await request("/api/orders")).status, 401);
    assert.equal((await request("/api/orders/customer/another-user")).status, 401);
    assert.equal((await request("/api/orders", "POST", {})).status, 401);
    assert.equal((await request("/api/products", "POST", {})).status, 401);
    assert.equal((await request("/api/products/seed", "POST")).status, 401);
    assert.equal((await request("/api/stats/products-by-category")).status, 401);
    assert.equal((await request("/api/auth/create-admin")).status, 404);
});

test("login session is required, roles and order ownership are server-enforced", async () => {
    const originalFindOne = User.findOne;
    const originalFindById = User.findById;
    const originalSessionCreate = Session.create;
    const originalSessionFind = Session.findOne;
    const originalSessionDelete = Session.deleteOne;
    const passwordHash = await bcrypt.hash("test-password-123", 4);
    const users = {
        customer: { _id: "customer-id", username: "customer", role: "customer", password: passwordHash },
        admin: { _id: "admin-id", username: "admin", role: "admin", password: passwordHash }
    };
    const sessions = new Map();
    User.findOne = async query => users[query.username] || null;
    User.findById = async id => Object.values(users).find(user => user._id === id) || null;
    Session.create = async doc => { sessions.set(doc.tokenHash, doc); return doc; };
    Session.deleteOne = async query => { sessions.delete(query.tokenHash); return { deletedCount: 1 }; };
    Session.findOne = async query => {
        const session = sessions.get(query.tokenHash);
        return session && session.expiresAt > new Date() ? session : null;
    };
    try {
        const login = await request("/api/auth/login", "POST", { username: "customer", password: "test-password-123" });
        assert.equal(login.status, 200);
        assert.match(login.data.token, /^[a-f0-9]{64}$/);
        const customerToken = login.data.token;
        const userInfo = await request("/api/auth/me", "GET", undefined, customerToken);
        assert.equal(userInfo.data.user.role, "customer");

        // A valid customer session cannot become an admin by forging the old header.
        const denied = await request("/api/orders", "GET", undefined, customerToken);
        assert.equal(denied.status, 403);
        const privateOrders = await request("/api/orders/customer/admin", "GET", undefined, customerToken);
        assert.equal(privateOrders.status, 403);

        const invalid = await request("/api/auth/login", "POST", {
            username: { "$ne": "" }, password: "test-password-123"
        });
        assert.notEqual(invalid.status, 200);

        const signOut = await request("/api/auth/logout", "POST", undefined, customerToken);
        assert.equal(signOut.status, 200);
        const afterSignOut = await request("/api/auth/me", "GET", undefined, customerToken);
        assert.equal(afterSignOut.status, 401);
    } finally {
        User.findOne = originalFindOne;
        User.findById = originalFindById;
        Session.create = originalSessionCreate;
        Session.findOne = originalSessionFind;
        Session.deleteOne = originalSessionDelete;
    }
});

test("checkout takes prices and account identity from server instead of forged browser data", async () => {
    const originalUserFind = User.findById;
    const originalSessionFind = Session.findOne;
    const originalStart = mongoose.startSession;
    const originalFindProduct = Product.findById;
    const originalUpdate = Product.updateOne;
    const originalCreate = Order.create;

    const token = "c".repeat(64);
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const id = "507f1f77bcf86cd799439011";
    const product = { _id: id, name: "Dashboard Camera", price: 100, stock: 5, image: "/images/products/dash-camera.jpg" };
    let orderSaved = null;
    Session.findOne = async query => query.tokenHash === tokenHash
        ? { userId: "customer-id", tokenHash } : null;
    User.findById = async id => id === "customer-id"
        ? { _id: id, username: "customer", role: "customer" } : null;
    mongoose.startSession = async () => ({
        withTransaction: async fn => fn(),
        endSession: async () => {}
    });
    Product.findById = queryId => ({ session: async () => queryId === id ? product : null });
    Product.updateOne = async (query, update) => {
        const quantity = -update.$inc.stock;
        if (query._id !== id || product.stock < quantity) return { modifiedCount: 0 };
        product.stock -= quantity;
        return { modifiedCount: 1 };
    };
    Order.create = async data => { orderSaved = data[0]; return [{ ...data[0], _id: "new-order" }]; };

    try {
        const response = await request("/api/orders", "POST", {
            customerUsername: "admin",
            subtotal: 0, shippingFee: 0, totalPrice: 0,
            items: [{ productId: id, quantity: 2, price: 0, name: "Fake name" }],
            shippingAddress: { fullName: "Test Customer", country: "Israel", city: "Tel Aviv", street: "Test St" },
            payment: { status: "Paid - Demo", method: "Demo Credit Card", last4: "4242" }
        }, token);
        assert.equal(response.status, 201);
        assert.equal(orderSaved.customerUsername, "customer");
        assert.equal(orderSaved.items[0].name, "Dashboard Camera");
        assert.equal(orderSaved.items[0].price, 100);
        assert.equal(orderSaved.subtotal, 200);
        assert.equal(orderSaved.shippingFee, 25);
        assert.equal(orderSaved.totalPrice, 225);
        assert.equal(product.stock, 3);
    } finally {
        User.findById = originalUserFind;
        Session.findOne = originalSessionFind;
        mongoose.startSession = originalStart;
        Product.findById = originalFindProduct;
        Product.updateOne = originalUpdate;
        Order.create = originalCreate;
    }
});
