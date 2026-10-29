const test = require("node:test");
const assert = require("node:assert/strict");
const { validateOrderItems, validateProductInput, buildCheckoutSummary } = require("../lib/order-logic");

const id = "507f1f77bcf86cd799439011";
test("order items require valid IDs and positive integer quantities", () => {
    assert.deepEqual(validateOrderItems([{ productId: id, quantity: 2 }]), [{ productId: id, quantity: 2 }]);
    for (const quantity of [0, -1, 1.5, 101, "1", null]) {
        assert.throws(() => validateOrderItems([{ productId: id, quantity }]));
    }
    assert.throws(() => validateOrderItems([{ productId: "bad", quantity: 1 }]));
    assert.throws(() => validateOrderItems([{ productId: id, quantity: 1 }, { productId: id, quantity: 2 }]));
    assert.throws(() => validateOrderItems([]));
});

test("checkout totals are recalculated from server product prices", () => {
    const data = buildCheckoutSummary([{ price: 100, quantity: 2 }], "STUDENT15", "Israel");
    assert.equal(data.subtotal, 200);
    assert.equal(data.discountAmount, 30);
    assert.equal(data.shippingFee, 25);
    assert.equal(data.totalPrice, 195);
    assert.equal(data.couponCode, "STUDENT15");
});

test("unknown coupon has no discount and unknown shipping country is rejected", () => {
    const data = buildCheckoutSummary([{ price: 49.99, quantity: 1 }], "bad", "Germany");
    assert.equal(data.totalPrice, 94.99);
    assert.equal(data.couponCode, "");
    assert.throws(() => buildCheckoutSummary([], "", "unknown"));
});

test("product input rejects negative price/stock and malformed numbers", () => {
    const good = { name: "Cover", category: "Exterior", price: 14.5, stock: 5 };
    assert.equal(validateProductInput(good).price, 14.5);
    assert.throws(() => validateProductInput({ ...good, price: -1 }));
    assert.throws(() => validateProductInput({ ...good, stock: -1 }));
    assert.throws(() => validateProductInput({ ...good, stock: 1.2 }));
    assert.throws(() => validateProductInput({ ...good, price: "NaN" }));
});
