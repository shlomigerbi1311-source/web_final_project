// Pure checkout rules: server-side values never come from the browser subtotal.
const SHIPPING = Object.freeze({
    Israel: { fee: 25, days: "3-5 business days" },
    "United States": { fee: 59, days: "7-10 business days" },
    "United Kingdom": { fee: 49, days: "6-9 business days" },
    Germany: { fee: 45, days: "6-9 business days" },
    France: { fee: 45, days: "6-9 business days" }
});

function roundMoney(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

function calculateCouponDiscount(code, subtotal) {
    const name = String(code || "").trim().toUpperCase();
    const rate = name === "DRIVE10" ? 0.10 : name === "STUDENT15" ? 0.15 : 0;
    return roundMoney(subtotal * rate);
}

function validateOrderItems(items) {
    if (!Array.isArray(items) || items.length < 1 || items.length > 100) {
        throw new Error("Please provide between 1 and 100 order items.");
    }
    const seen = new Set();
    return items.map(item => {
        if (!item || !/^[a-f0-9]{24}$/i.test(String(item.productId || "")) ||
            !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
            throw new Error("Invalid product or quantity.");
        }
        const id = String(item.productId);
        if (seen.has(id)) throw new Error("Duplicate products in the order.");
        seen.add(id);
        return { productId: id, quantity: item.quantity };
    });
}

function validateProductInput(body) {
    if (!body || typeof body.name !== "string" || !body.name.trim() ||
        body.name.length > 140 || typeof body.category !== "string" || body.category.length > 80 ||
        !Number.isFinite(Number(body.price)) || Number(body.price) < 0 ||
        !Number.isSafeInteger(Number(body.stock)) || Number(body.stock) < 0 ||
        Number(body.stock) > 1000000) {
        throw new Error("Invalid product name, category, price or stock.");
    }
    return {
        name: body.name.trim(),
        category: body.category.trim(),
        price: roundMoney(Number(body.price)),
        stock: Number(body.stock),
        image: String(body.image || body.imageUrl || "").slice(0, 1000),
        imageUrl: String(body.imageUrl || body.image || "").slice(0, 1000),
        description: String(body.description || "").slice(0, 3000)
    };
}

function buildCheckoutSummary(products, couponCode, country) {
    const shipping = SHIPPING[country];
    if (!shipping) throw new Error("Unsupported shipping country.");
    const subtotal = roundMoney(products.reduce((sum, item) => sum + item.price * item.quantity, 0));
    const discountAmount = calculateCouponDiscount(couponCode, subtotal);
    const totalPrice = roundMoney(subtotal + shipping.fee - discountAmount);
    return {
        subtotal, shippingFee: shipping.fee, deliveryDays: shipping.days,
        discountAmount, totalPrice,
        couponCode: discountAmount > 0 ? String(couponCode).trim().toUpperCase() : ""
    };
}

module.exports = { SHIPPING, roundMoney, calculateCouponDiscount, validateOrderItems, validateProductInput, buildCheckoutSummary };
