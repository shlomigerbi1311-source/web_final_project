// Runs only against a throwaway MongoDB database in GitHub Actions.
// Never point MONGO_URI at your real DriveX Atlas database.
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

if (!process.env.MONGO_URI || !process.env.MONGO_URI.includes("drivex_ci")) {
    throw new Error("Refusing to run: MONGO_URI must target a throwaway drivex_ci database.");
}
process.env.NODE_ENV = "test";
const app = require("../server");
const User = require("../models/User");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Session = require("../models/Session");
const SupportTicket = require("../models/supportTicket");
const username = "tester";
const password = "Test12345";
let listener;
let base;
let count = 0;

async function api(route, method = "GET", body, token) {
    const headers = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = "Bearer " + token;
    const response = await fetch(base + route, {
        method, headers, ...(body !== undefined ? { body: JSON.stringify(body) } : {})
    });
    const contentType = response.headers.get("content-type") || "";
    const result = contentType.includes("application/json") ? await response.json() : await response.text();
    return { status: response.status, data: result };
}

function check(actual, expected, what) {
    assert.equal(actual, expected, what);
    count++;
    console.log("PASS:", what);
}

async function main() {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    await mongoose.connection.dropDatabase();
    await Promise.all([User.init(), Product.init(), Order.init(), Session.init(), SupportTicket.init()]);
    listener = await new Promise(resolve => {
        const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
    });
    base = "http://127.0.0.1:" + listener.address().port;

    let response = await api("/api/test");
    check(response.status, 200, "Express API starts");
    response = await api("/");
    check(response.status, 200, "Home page is served");
    assert.match(response.data, /DriveX/);
    response = await api("/store.html");
    check(response.status, 200, "Store page is served");
    response = await api("/checkout.html");
    check(response.status, 200, "Checkout page is served");
    response = await api("/admin.html");
    check(response.status, 200, "Admin HTML served (data remains protected)");

    response = await api("/api/products/seed");
    check(response.status, 404, "Destructive legacy GET seeding is removed");
    response = await api("/api/auth/create-admin");
    check(response.status, 404, "Public admin-creation endpoint is removed");
    response = await api("/api/products", "POST", {});
    check(response.status, 401, "Product modification requires authentication");
    response = await api("/api/orders");
    check(response.status, 401, "Admin order list requires authentication");
    response = await api("/api/support");
    check(response.status, 401, "Support ticket list requires authentication");
    response = await api("/api/orders/customer/other");
    check(response.status, 401, "Order history requires authentication");

    response = await api("/api/auth/signup", "POST", { username, password });
    check(response.status, 200, "Customer registration");
    response = await api("/api/auth/login", "POST", { username, password: "wrong-password" });
    check(response.status, 400, "Wrong password rejected");
    response = await api("/api/auth/login", "POST", { username, password });
    check(response.status, 200, "Customer login");
    const token = response.data.token;
    assert.match(token, /^[a-f0-9]{64}$/);
    response = await api("/api/auth/me", "GET", undefined, token);
    check(response.status, 200, "Session identity endpoint");
    check(response.data.user.role, "customer", "Customer role comes from database");

    response = await api("/api/orders", "GET", undefined, token);
    check(response.status, 403, "Customer cannot read all orders");
    response = await api("/api/orders/customer/admin", "GET", undefined, token);
    check(response.status, 403, "Customer cannot read other customers orders");
    response = await api("/api/products/seed", "POST", undefined, token);
    check(response.status, 403, "Customer cannot reseed products");

    const adminPassword = "UniqueAdminPass123!";
    await User.create({ username: "site-admin", password: await bcrypt.hash(adminPassword, 12), role: "admin" });
    response = await api("/api/auth/login", "POST", { username: "site-admin", password: adminPassword });
    check(response.status, 200, "Existing admin logs in using strong password");
    const adminToken = response.data.token;
    response = await api("/api/products/seed", "POST", undefined, adminToken);
    check(response.status, 403, "Admin reseeding requires explicit ENABLE_DEMO_SEED opt-in");

    const productData = { name: "Demo Camera", category: "Electronics", price: 100, stock: 4, description: "CI test item", image: "/images/products/dash-camera.jpg" };
    response = await api("/api/products", "POST", productData, token);
    check(response.status, 403, "Customer cannot create products");
    response = await api("/api/products", "POST", { ...productData, price: -10 }, adminToken);
    check(response.status, 400, "Admin cannot create negative-price product");
    response = await api("/api/products", "POST", productData, adminToken);
    check(response.status, 201, "Admin creates a product");
    const productId = response.data.product._id;
    response = await api("/api/products");
    check(response.status, 200, "Store product listing");
    check(response.data.length, 1, "Product listed in store");
    response = await api("/api/products?search=Demo&sort=price-low");
    check(response.data.length, 1, "Product search and sort");

    const shippingAddress = { fullName: "CI User", country: "Israel", city: "Tel Aviv", street: "CI Street", phone: "0500000000", zipCode: "00000" };
    const payment = { method: "Demo Credit Card", status: "Paid - Demo", last4: "4242" };
    const cart = [{ productId, quantity: 2, name: "Forged cheap product", price: 0 }];
    const orderRequest = { customerUsername: "site-admin", items: cart, subtotal: 0, shippingFee: -100,
        totalPrice: -100, shippingAddress, payment, couponCode: "STUDENT15" };

    response = await api("/api/orders", "POST", orderRequest);
    check(response.status, 401, "Guests cannot submit demo orders");
    response = await api("/api/orders", "POST", { ...orderRequest, items: [{ productId, quantity: -2 }] }, token);
    check(response.status, 400, "Negative item quantity rejected");
    response = await api("/api/orders", "POST", { ...orderRequest, items: [{ productId, quantity: 5 }] }, token);
    check(response.status, 409, "Overselling inventory rejected");
    response = await api("/api/orders", "POST", orderRequest, token);
    check(response.status, 201, "Demo checkout creates database order");
    const order = response.data.order;
    check(order.customerUsername, username, "Customer identity cannot be forged");
    check(order.subtotal, 200, "Checkout subtotal comes from database");
    check(order.discountAmount, 30, "Coupon computed on server");
    check(order.shippingFee, 25, "Shipping fee computed on server");
    check(order.totalPrice, 195, "Order total computed on server");
    check(order.items[0].name, "Demo Camera", "Order name comes from stored product");
    const stored = await Product.findById(productId);
    check(stored.stock, 2, "Stock decreases after valid transaction");
    response = await api("/api/orders/customer/" + username, "GET", undefined, token);
    check(response.status, 200, "Customer order history works");
    check(response.data.length, 1, "Customer sees their own order");

    response = await api("/api/orders", "GET", undefined, adminToken);
    check(response.status, 200, "Admin sees all orders");
    check(response.data.length, 1, "Admin order list has demo purchase");
    response = await api("/api/orders/" + order._id + "/status", "PUT", { status: "Shipped" }, adminToken);
    check(response.status, 200, "Admin can update order status");
    response = await api("/api/support", "POST", { fullName: "CI User", email: "ci@example.com", subject: "Test", message: "Question" });
    check(response.status, 201, "Support request creation");
    response = await api("/api/support", "GET", undefined, adminToken);
    check(response.status, 200, "Admin sees support requests");
    check(response.data.length, 1, "Support ticket list populated");
    response = await api("/api/stats/products-by-category", "GET", undefined, adminToken);
    check(response.status, 200, "Admin category statistics");
    response = await api("/api/stats/average-price-by-category", "GET", undefined, adminToken);
    check(response.status, 200, "Admin average-price statistics");

    response = await api("/api/auth/logout", "POST", undefined, token);
    check(response.status, 200, "Logout revokes session");
    response = await api("/api/auth/me", "GET", undefined, token);
    check(response.status, 401, "Logged-out session cannot be reused");

    console.log("SUCCESS: " + count + " integration checks passed against temporary MongoDB replica set.");
}

main().catch(error => {
    console.error("INTEGRATION FAILURE:", error);
    process.exitCode = 1;
}).finally(async () => {
    if (listener) await new Promise(resolve => listener.close(resolve));
    if (mongoose.connection.readyState) {
        await mongoose.connection.dropDatabase();
        await mongoose.disconnect();
    }
});
