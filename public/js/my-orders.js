// הודעה לבדיקה שקובץ ההזמנות של הלקוח נטען
console.log("My Orders page JavaScript is connected");

// תפיסת האזור שבו יוצגו ההזמנות של הלקוח
const customerOrdersContainer = document.getElementById("customerOrdersContainer");

// פונקציה שמונעת הכנסת HTML לא רצוי לעמוד
function escapeHtml(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// פונקציה שמביאה את המשתמש המחובר מהדפדפן
function getCurrentUser() {
    return JSON.parse(localStorage.getItem("currentUser"));
}
function formatMoney(value) {
    return "$" + (Number(value) || 0).toFixed(2);
}

async function getProductsMap() {
    try {
        const response = await fetch("/api/products");
        const products = await response.json();
        const productsMap = {};

        if (Array.isArray(products)) {
            products.forEach(function (product) {
                productsMap[product._id] = product.name;
            });
        }

        return productsMap;
    } catch (error) {
        return {};
    }
}

function formatProducts(items, productsMap) {
    if (!Array.isArray(items) || items.length === 0) {
        return "No products";
    }

    return items.map(function (item) {
        const productName =
            item.name ||
            productsMap[item.productId] ||
            "Unknown product";

        return escapeHtml(productName) + " x" + (Number(item.quantity) || 1);
    }).join(", ");
}

// פונקציה שמציגה את כל ההזמנות של הלקוח המחובר
async function loadCustomerOrders() {
    const currentUser = getCurrentUser();

    // אם אין משתמש מחובר, מציגים הודעה ומפסיקים
    if (!currentUser) {
        customerOrdersContainer.innerHTML = `
            <div class="customer-order-card">
                <h3>Please login to view your orders.</h3>
                <p>You need to login before viewing your order history.</p>
                <a class="main-button" href="login.html">Go to Login</a>
            </div>
        `;
        return;
    }

    const username = currentUser.username || currentUser.email;

    try {
        const productsMap = await getProductsMap();
        // שליחת בקשה לשרת לקבלת ההזמנות של המשתמש המחובר
        const response = await fetch("/api/orders/customer/" + encodeURIComponent(username), {
            headers: { Authorization: "Bearer " + (sessionStorage.getItem("authToken") || "") }
        });
        if (!response.ok) throw new Error("Cannot access orders");
        const orders = await response.json();

        customerOrdersContainer.innerHTML = "";

        // אם אין הזמנות, מציגים הודעה מתאימה
        if (orders.length === 0) {
            customerOrdersContainer.innerHTML = `
                <div class="customer-order-card">
                    <h3>No orders yet</h3>
                    <p>You have not completed any orders yet.</p>
                    <a class="main-button" href="store.html">Start Shopping</a>
                </div>
            `;
            return;
        }

        // הצגת כל ההזמנות של הלקוח
        orders.forEach(function (order) {
            const orderDiv = document.createElement("div");
            orderDiv.className = "customer-order-card";

            const productsText = formatProducts(order.items, productsMap);

            const shippingAddress = order.shippingAddress || {};
            const payment = order.payment || {};

            orderDiv.innerHTML = `
                <div class="customer-order-header">
                    <div>
                        <h3>Order Summary</h3>
                        <p class="order-date">${new Date(order.createdAt).toLocaleString()}</p>
                    </div>

                    <span class="order-status">${escapeHtml(order.status)}</span>
                </div>

<div class="customer-order-section order-details-section">
    <h4>Order Details</h4>

    <div class="order-details-grid">
        <p class="order-detail-line"><strong>Order Number:</strong> ${escapeHtml(order.orderNumber || order._id)}</p>
        <p class="order-detail-line products-line"><strong>Products:</strong> ${productsText}</p>
        <p class="order-detail-line"><strong>Subtotal:</strong> ${formatMoney(order.subtotal)}</p>
        <p class="order-detail-line"><strong>Shipping:</strong> ${formatMoney(order.shippingFee)}</p>
        <p class="order-detail-line"><strong>Coupon:</strong> ${escapeHtml(order.couponCode || "No coupon")}</p>
        <p class="order-detail-line"><strong>Discount:</strong> -${formatMoney(order.discountAmount || 0)}</p>
        <p class="order-detail-line"><strong>Total:</strong> ${formatMoney(order.totalPrice)}</p>
        <p class="order-detail-line"><strong>Delivery:</strong> ${escapeHtml(order.deliveryDays)}</p>
    </div>
</div>

                <div class="customer-order-section">
                    <h4>Shipping Address</h4>
                    <p>
                        ${escapeHtml(shippingAddress.fullName)}, 
                        ${escapeHtml(shippingAddress.street)}, 
                        ${escapeHtml(shippingAddress.city)}, 
                        ${escapeHtml(shippingAddress.country)}
                    </p>
                    <p><strong>Phone:</strong> ${escapeHtml(shippingAddress.phone)}</p>
                    <p><strong>ZIP:</strong> ${escapeHtml(shippingAddress.zipCode)}</p>
                </div>

                <div class="customer-order-section">
                    <h4>Payment</h4>
                    <p><strong>Method:</strong> ${escapeHtml(payment.method)}</p>
                    <p><strong>Status:</strong> ${escapeHtml(payment.status)}</p>
                    <p><strong>Last 4:</strong> ${escapeHtml(payment.last4)}</p>
                </div>
            `;

            customerOrdersContainer.appendChild(orderDiv);
        });
    } catch (error) {
        customerOrdersContainer.innerHTML = `
            <div class="customer-order-card">
                <h3>Error loading orders</h3>
                <p>There was a problem loading your order history.</p>
            </div>
        `;
    }
}

// הפעלת טעינת ההזמנות כשהעמוד נפתח
loadCustomerOrders();