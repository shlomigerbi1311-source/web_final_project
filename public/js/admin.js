// בדיקת חיבור: ההודעה הזאת מופיעה ב-Console כשהקובץ נטען בהצלחה.
console.log("Admin page JavaScript is connected");

// =========================
// General Helpers
// =========================

// מחזירה את פרטי המשתמש המחובר שנשמרו ב-localStorage.
function getCurrentUser() {
    // קוראת את המחרוזת השמורה והופכת אותה בחזרה לאובייקט JavaScript.
    return sessionStorage.getItem("authToken") ? JSON.parse(localStorage.getItem("currentUser")) : null;
}

// בונה את ה-Headers שנשלחים לבקשות של מנהל המערכת.
function getAdminHeaders() {
    const token = sessionStorage.getItem("authToken");
    return {
        "Content-Type": "application/json",
        "Authorization": token ? "Bearer " + token : ""
    };
}

// מגינה מפני הכנסת קוד HTML זדוני כאשר מציגים מידע שהגיע מהשרת.
function escapeHtml(value) {
    // ממירה את הערך למחרוזת ומחליפה תווים מיוחדים ב-HTML entities בטוחים.
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// מעצבת תאריך שהגיע מהשרת לפורמט מקומי וקריא.
function formatDate(dateValue) {
    // אם לא התקבל תאריך, מחזירה טקסט ברירת מחדל.
    if (!dateValue) {
        return "No date";
    }

    // יוצרת אובייקט Date ומציגה אותו לפי הגדרות האזור של הדפדפן.
    return new Date(dateValue).toLocaleString();
}

// מעצבת מחיר כמספר עם שתי ספרות אחרי הנקודה וסימן דולר.
function formatPrice(value) {
    // ממירה את הערך למספר; אם ההמרה נכשלת משתמשת ב-0.
    const number = Number(value) || 0;
    return "$" + number.toFixed(2);
}

// מחפשת אלמנט HTML לפי כמה IDs אפשריים ומחזירה את הראשון שנמצא.
function getElementByPossibleIds(ids) {
    // עוברת על כל ID אפשרי ברשימה.
    for (const id of ids) {
        // מנסה למצוא בדף אלמנט עם ה-ID הנוכחי.
        const element = document.getElementById(id);

        // ברגע שנמצא אלמנט מתאים, מחזירים אותו ומפסיקים את החיפוש.
        if (element) {
            return element;
        }
    }

    // אם אף ID לא נמצא בדף, מחזירה null.
    return null;
}

// =========================
// Elements
// =========================

// אלמנט להצגת הודעות הצלחה או שגיאה בדף המנהל.
const adminMessage = getElementByPossibleIds(["adminMessage", "message", "statusMessage"]);

// אלמנטים של טופס הוספה ועריכה של מוצר.
const productForm = getElementByPossibleIds(["productForm", "addProductForm"]);
const productIdInput = getElementByPossibleIds(["productId", "productIdInput", "editProductId"]);
const productNameInput = getElementByPossibleIds(["productName", "name"]);
const productCategoryInput = getElementByPossibleIds(["productCategory", "category"]);
const productPriceInput = getElementByPossibleIds(["productPrice", "price"]);
const productImageInput = getElementByPossibleIds(["productImage", "productImageUrl", "image", "imageUrl"]);
const productStockInput = getElementByPossibleIds(["productStock", "stock"]);
const productDescriptionInput = getElementByPossibleIds(["productDescription", "description"]);

// האזור בדף שבו יוצגו כל המוצרים למנהל.
const productsContainer = getElementByPossibleIds([
    "adminProductsContainer",
    "productsAdminContainer",
    "productsContainer",
    "productsList",
]);

// האזור בדף שבו יוצגו כל ההזמנות.
const ordersContainer = getElementByPossibleIds([
    "ordersContainer",
    "adminOrdersContainer",
    "ordersList",
]);

// האזור בדף שבו יוצגו פניות התמיכה.
const supportTicketsContainer = getElementByPossibleIds([
    "supportTicketsContainer",
    "adminSupportContainer",
    "supportContainer",
    "supportList",
]);

// אלמנט Canvas שעליו יוצג גרף מספר המוצרים לפי קטגוריה.
const productsByCategoryCanvas = getElementByPossibleIds([
    "productsByCategoryChart",
    "categoryChart",
    "productsCategoryChart",
]);

// אלמנט Canvas שעליו יוצג גרף המחיר הממוצע לפי קטגוריה.
const averagePriceCanvas = getElementByPossibleIds([
    "averagePriceChart",
    "averagePriceByCategoryChart",
    "priceChart",
]);

// משתני מצב: רשימת המוצרים והפניות לגרפים הפעילים.
let productsList = [];
let productsByCategoryChart = null;
let averagePriceChart = null;

// =========================
// Admin Guard
// =========================

// בודקת שהמשתמש מחובר ושיש לו role של admin.
function checkAdminAccess() {
    // מקבלת את פרטי המשתמש המחובר.
    const currentUser = getCurrentUser();

    // חוסמת גישה אם אין משתמש או אם המשתמש אינו מנהל.
    if (!currentUser || currentUser.role !== "admin") {
        // מציגה הודעת שגיאה רק אם קיים אלמנט הודעות בדף.
        if (adminMessage) {
            adminMessage.textContent = "Access denied. Admin user only.";
            adminMessage.style.color = "red";
        }

        // false מסמן שאסור להמשיך לטעון את דף המנהל.
        return false;
    }

    // true מסמן שהמשתמש מורשה להיכנס לדף.
    return true;
}

// מציגה הודעה למנהל בצבע ירוק להצלחה או אדום לשגיאה.
function showAdminMessage(message, isSuccess) {
    // אם אלמנט ההודעות לא קיים, אין איפה להציג את ההודעה.
    if (!adminMessage) {
        return;
    }

    // מעדכנת את הטקסט ואת הצבע לפי תוצאת הפעולה.
    adminMessage.textContent = message;
    adminMessage.style.color = isSuccess ? "green" : "red";
}

// =========================
// Products
// =========================

// טוענת את כל המוצרים מהשרת ומציגה אותם בדף המנהל.
async function loadProducts() {
    // אם אין בדף אזור להצגת מוצרים, הפונקציה נעצרת.
    if (!productsContainer) {
        return;
    }

    try {
        // שולחת בקשת GET ל-API כדי לקבל את כל המוצרים.
        const response = await fetch("/api/products");

        // ממירה את תשובת השרת מ-JSON למערך JavaScript.
        const products = await response.json();

        // שומרת את המוצרים בזיכרון כדי שאפשר יהיה לערוך מוצר לפי ה-ID שלו.
        productsList = products;

        // מנקה את התצוגה הקודמת לפני בניית הרשימה מחדש.
        productsContainer.innerHTML = "";

        // מציגה הודעה מתאימה אם לא קיימים מוצרים.
        if (!products || products.length === 0) {
            productsContainer.innerHTML = "<p>No products found.</p>";
            return;
        }

        // עוברת על כל מוצר שהתקבל מהשרת.
        products.forEach(function (product) {
            // יוצרת כרטיס HTML חדש עבור המוצר הנוכחי.
            const productDiv = document.createElement("div");
            productDiv.className = "admin-card admin-product-card";

            // בונה את תוכן הכרטיס ומוסיפה כפתורי Edit ו-Delete.
            productDiv.innerHTML = `
    <img 
        class="admin-product-image"
        src="${escapeHtml(product.image || product.imageUrl || "")}" 
        alt="${escapeHtml(product.name)}"
    >

    <h3>${escapeHtml(product.name)}</h3>
    <p><strong>Category:</strong> ${escapeHtml(product.category)}</p>
                <p><strong>Price:</strong> ${formatPrice(product.price)}</p>
                <p><strong>Stock:</strong> ${product.stock}</p>
                <p><strong>Description:</strong> ${escapeHtml(product.description)}</p>

                <div class="admin-actions">
                    <button type="button" onclick="editProduct('${product._id}')">Edit</button>
                    <button type="button" class="delete-button" onclick="deleteProduct('${product._id}')">Delete</button>
                </div>
            `;

            // מוסיפה את כרטיס המוצר לאזור המוצרים בדף.
            productsContainer.appendChild(productDiv);
        });

        // אם הבקשה לשרת נכשלה, מציגה הודעת שגיאה באזור המוצרים.
    } catch (error) {
        productsContainer.innerHTML = "<p>Error loading products.</p>";
    }
}

// מנקה את כל השדות בטופס המוצר לאחר שמירה או לפני הוספה חדשה.
function clearProductForm() {
    if (productIdInput) productIdInput.value = "";
    if (productNameInput) productNameInput.value = "";
    if (productCategoryInput) productCategoryInput.value = "";
    if (productPriceInput) productPriceInput.value = "";
    if (productImageInput) productImageInput.value = "";
    if (productStockInput) productStockInput.value = "";
    if (productDescriptionInput) productDescriptionInput.value = "";
}

// מכניסה לטופס את פרטי המוצר שנבחר כדי לאפשר עריכה שלו.
function editProduct(productId) {
    // מחפשת ברשימה המקומית את המוצר שה-ID שלו תואם ל-ID שהתקבל.
    const product = productsList.find(function (item) {
        return item._id === productId;
    });

    // אם המוצר לא נמצא, מציגה הודעה ועוצרת.
    if (!product) {
        alert("Product not found");
        return;
    }

    // ממלאת כל שדה בטופס בערך הקיים של המוצר.
    if (productIdInput) productIdInput.value = product._id;
    if (productNameInput) productNameInput.value = product.name || "";
    if (productCategoryInput) productCategoryInput.value = product.category || "";
    if (productPriceInput) productPriceInput.value = product.price || 0;
    if (productImageInput) productImageInput.value = product.image || product.imageUrl || "";
    if (productStockInput) productStockInput.value = product.stock || 0;
    if (productDescriptionInput) productDescriptionInput.value = product.description || "";

    // גוללת בצורה חלקה לראש הדף כדי שהמנהל יראה את הטופס שמולא.
    window.scrollTo({
        top: 0,
        behavior: "smooth",
    });
}

// מוחקת מוצר לפי ה-ID שלו לאחר אישור מהמנהל.
async function deleteProduct(productId) {
    // מבקשת אישור לפני ביצוע מחיקה בלתי הפיכה.
    const confirmDelete = confirm("Are you sure you want to delete this product?");

    // אם המנהל ביטל את האישור, הפעולה נעצרת.
    if (!confirmDelete) {
        return;
    }

    try {
        // שולחת בקשת DELETE לשרת עם הרשאות המנהל.
        const response = await fetch("/api/products/" + productId, {
            method: "DELETE",
            headers: getAdminHeaders(),
        });

        // קוראת את הודעת התשובה שהשרת החזיר.
        const data = await response.json();

        // אם השרת החזיר שגיאה, מציגה אותה ולא ממשיכה.
        if (!response.ok) {
            alert(data.message || "Error deleting product");
            return;
        }

        // מודיעה שהמחיקה הצליחה.
        alert("Product deleted successfully");

        // טוענת מחדש את המוצרים והגרפים כדי להציג את הנתונים המעודכנים.
        loadProducts();
        loadCharts();
    } catch (error) {
        alert("Error deleting product");
    }
}

// מאזינה לשליחת טופס המוצר ומבצעת הוספה או עדכון.
if (productForm) {
    productForm.addEventListener("submit", async function (event) {
        // מונעת מהדפדפן לרענן את הדף בעת שליחת הטופס.
        event.preventDefault();

        // אם קיים ID בטופס מדובר בעריכה; אחרת מדובר במוצר חדש.
        const productId = productIdInput ? productIdInput.value : "";

        // אוספת את כל ערכי הטופס לאובייקט שיישלח לשרת.
        const productData = {
            name: productNameInput ? productNameInput.value : "",
            category: productCategoryInput ? productCategoryInput.value : "",
            price: productPriceInput ? Number(productPriceInput.value) : 0,
            image: productImageInput ? productImageInput.value : "",
            imageUrl: productImageInput ? productImageInput.value : "",
            stock: productStockInput ? Number(productStockInput.value) : 0,
            description: productDescriptionInput ? productDescriptionInput.value : "",
        };

        // בוחרת כתובת API לפי הוספת מוצר חדש או עדכון מוצר קיים.
        const url = productId ? "/api/products/" + productId : "/api/products";

        // POST משמש להוספה ו-PUT משמש לעדכון.
        const method = productId ? "PUT" : "POST";

        try {
            // שולחת את נתוני המוצר לשרת כ-JSON.
            const response = await fetch(url, {
                method: method,
                headers: getAdminHeaders(),
                body: JSON.stringify(productData),
            });

            // קוראת את תשובת השרת.
            const data = await response.json();

            // אם השמירה נכשלה, מציגה את הודעת השגיאה.
            if (!response.ok) {
                showAdminMessage(data.message || "Error saving product", false);
                return;
            }

            // מציגה הודעת הצלחה לאחר שמירת המוצר.
            showAdminMessage("Product saved successfully", true);

            // מנקה את הטופס וטוענת מחדש את המוצרים והגרפים.
            clearProductForm();
            loadProducts();
            loadCharts();
        } catch (error) {
            showAdminMessage("Error saving product", false);
        }
    });
}

// =========================
// Orders
// =========================

// מחברת את שמות המוצרים והכמויות בהזמנה לטקסט אחד קריא.
function buildProductsMap(products) {
    const productsMap = {};

    if (Array.isArray(products)) {
        products.forEach(function (product) {
            productsMap[product._id] = product.name;
        });
    }

    return productsMap;
}

async function getProductsMapForOrders() {
    if (productsList && productsList.length > 0) {
        return buildProductsMap(productsList);
    }

    try {
        const response = await fetch("/api/products");
        const products = await response.json();
        return buildProductsMap(products);
    } catch (error) {
        return {};
    }
}

function getOrderItemsText(order, productsMap) {
    if (!order.items || order.items.length === 0) {
        return "No products";
    }

    return order.items
        .map(function (item) {
            const productName =
                item.name ||
                productsMap[item.productId] ||
                "Unknown product";

            return escapeHtml(productName) + " x" + (Number(item.quantity) || 1);
        })
        .join(", ");
}
// טוענת את כל ההזמנות מהשרת ומציגה אותן בדף המנהל.
async function loadOrders() {
    // אם אין בדף אזור להזמנות, אין צורך להמשיך.
    if (!ordersContainer) {
        return;
    }

    try {
        // שולחת בקשת GET להזמנות עם Headers של מנהל.
        const response = await fetch("/api/orders", {
            headers: getAdminHeaders(),
        });

        // ממירה את תשובת השרת למערך הזמנות.
        const orders = await response.json();

        // מנקה הזמנות ישנות מהתצוגה.
        ordersContainer.innerHTML = "";

        // מציגה הודעה אם עדיין לא קיימות הזמנות.
        if (!orders || orders.length === 0) {
            ordersContainer.innerHTML = "<p>No orders found.</p>";
            return;
        }
        const productsMap = await getProductsMapForOrders();
        // עוברת על כל הזמנה שהתקבלה.
        orders.forEach(function (order) {
            // יוצרת כרטיס HTML חדש להזמנה הנוכחית.
            const orderDiv = document.createElement("div");
            orderDiv.className = "admin-card admin-order-card";
            // מכינה טקסט מסודר של המוצרים והכמויות בהזמנה.
            const productsText = getOrderItemsText(order, productsMap);
            // בונה את פרטי ההזמנה, התשלום, המשלוח ובחירת הסטטוס.
            orderDiv.innerHTML = `
    <h3>Order from ${escapeHtml(order.customerUsername)}</h3>

    <div class="admin-details-grid">
        <p><strong>Order Number:</strong> ${escapeHtml(order.orderNumber || order._id)}</p>
        <p><strong>Date:</strong> ${formatDate(order.createdAt)}</p>
        <p class="admin-full-line"><strong>Products:</strong> ${productsText}</p>

        <p><strong>Subtotal:</strong> ${formatPrice(order.subtotal)}</p>
        <p><strong>Shipping:</strong> ${formatPrice(order.shippingFee)}</p>
        <p><strong>Coupon:</strong> ${escapeHtml(order.couponCode || "No coupon")}</p>
        <p><strong>Discount:</strong> -${formatPrice(order.discountAmount || 0)}</p>
        <p><strong>Total:</strong> ${formatPrice(order.totalPrice)}</p>
        <p><strong>Delivery:</strong> ${escapeHtml(order.deliveryDays || "")}</p>

        <p><strong>Payment:</strong> ${escapeHtml(order.payment ? order.payment.method : "")}</p>
        <p><strong>Payment Status:</strong> ${escapeHtml(order.payment ? order.payment.status : "")}</p>

        <p class="admin-full-line"><strong>Shipping To:</strong>
            ${escapeHtml(order.shippingAddress ? order.shippingAddress.fullName : "")},
            ${escapeHtml(order.shippingAddress ? order.shippingAddress.city : "")},
            ${escapeHtml(order.shippingAddress ? order.shippingAddress.street : "")}
        </p>

        <p><strong>Status:</strong> ${escapeHtml(order.status)}</p>
    </div>

    <div class="admin-status-row">
        <label><strong>Update Status:</strong></label>
        <select onchange="updateOrderStatus('${order._id}', this.value)">
            <option value="Paid - Processing" ${order.status === "Paid - Processing" ? "selected" : ""}>Paid - Processing</option>
            <option value="Shipped" ${order.status === "Shipped" ? "selected" : ""}>Shipped</option>
            <option value="Delivered" ${order.status === "Delivered" ? "selected" : ""}>Delivered</option>
            <option value="Cancelled" ${order.status === "Cancelled" ? "selected" : ""}>Cancelled</option>
        </select>
    </div>

    <div class="admin-actions">
        <button type="button" class="delete-button" onclick="deleteOrder('${order._id}')">Delete Order</button>
    </div>
`;
            // מוסיפה את כרטיס ההזמנה לאזור ההזמנות בדף.
            ordersContainer.appendChild(orderDiv);
        });

        // במקרה של שגיאת תקשורת, מציגה הודעה במקום רשימת ההזמנות.
    } catch (error) {
        ordersContainer.innerHTML = "<p>Error loading orders.</p>";
    }
}

// מעדכנת בשרת את סטטוס ההזמנה שנבחר בתפריט.
async function updateOrderStatus(orderId, newStatus) {
    try {
        // שולחת בקשת PUT עם הסטטוס החדש.
        const response = await fetch("/api/orders/" + orderId + "/status", {
            method: "PUT",
            headers: getAdminHeaders(),
            body: JSON.stringify({
                status: newStatus,
            }),
        });

        // קוראת את תשובת השרת.
        const data = await response.json();

        // אם העדכון נכשל, מציגה את סיבת השגיאה.
        if (!response.ok) {
            alert(data.message || "Error updating order status");
            return;
        }

        // מודיעה על הצלחה וטוענת מחדש את רשימת ההזמנות.
        alert("Order status updated successfully");
        loadOrders();
    } catch (error) {
        alert("Error updating order status");
    }
}

// מוחקת הזמנה לפי ה-ID שלה לאחר אישור.
async function deleteOrder(orderId) {
    // מבקשת מהמנהל לאשר את המחיקה.
    const confirmDelete = confirm("Are you sure you want to delete this order?");

    // אם המחיקה בוטלה, הפונקציה נעצרת.
    if (!confirmDelete) {
        return;
    }

    try {
        // שולחת בקשת DELETE להזמנה המתאימה.
        const response = await fetch("/api/orders/" + orderId, {
            method: "DELETE",
            headers: getAdminHeaders(),
        });

        // קוראת את תשובת השרת.
        const data = await response.json();

        // מציגה שגיאה אם השרת לא הצליח למחוק.
        if (!response.ok) {
            alert(data.message || "Error deleting order");
            return;
        }

        // מודיעה על הצלחה וטוענת מחדש את ההזמנות.
        alert("Order deleted successfully");
        loadOrders();
    } catch (error) {
        alert("Error deleting order");
    }
}

// =========================
// Support Tickets
// =========================

// טוענת את כל פניות התמיכה ומציגה אותן למנהל.
async function loadSupportTickets() {
    // אם אין אזור להצגת פניות, הפעולה נעצרת.
    if (!supportTicketsContainer) {
        return;
    }

    try {
        // שולחת בקשת GET לפניות התמיכה עם הרשאות מנהל.
        const response = await fetch("/api/support", {
            headers: getAdminHeaders(),
        });

        // ממירה את תשובת השרת למערך פניות.
        const tickets = await response.json();

        // מנקה את הפניות הישנות מהתצוגה.
        supportTicketsContainer.innerHTML = "";

        // מציגה הודעה אם אין פניות תמיכה.
        if (!tickets || tickets.length === 0) {
            supportTicketsContainer.innerHTML = "<p>No support tickets found.</p>";
            return;
        }

        // עוברת על כל פנייה שהתקבלה.
        tickets.forEach(function (ticket) {
            // יוצרת כרטיס HTML חדש עבור הפנייה.
            const ticketDiv = document.createElement("div");
            ticketDiv.className = "admin-card admin-ticket-card";
            // בונה את פרטי הפנייה ואת האפשרות לשנות סטטוס או למחוק.
            ticketDiv.innerHTML = `
    <h3>${escapeHtml(ticket.subject || "Support Ticket")}</h3>

    <div class="admin-details-grid">
        <p><strong>Name:</strong> ${escapeHtml(ticket.name || ticket.fullName || "")}</p>
        <p><strong>Email:</strong> ${escapeHtml(ticket.email || "")}</p>
        <p><strong>Username:</strong> ${escapeHtml(ticket.username || ticket.customerUsername || "")}</p>
        <p><strong>Date:</strong> ${formatDate(ticket.createdAt)}</p>
        <p><strong>Status:</strong> ${escapeHtml(ticket.status || "Open")}</p>
        <p class="admin-full-line"><strong>Message:</strong> ${escapeHtml(ticket.message || "")}</p>
    </div>

    <div class="admin-status-row">
        <label><strong>Update Status:</strong></label>
        <select onchange="updateSupportTicketStatus('${ticket._id}', this.value)">
            <option value="Open" ${(ticket.status || "Open") === "Open" ? "selected" : ""}>Open</option>
            <option value="Resolved" ${ticket.status === "Resolved" ? "selected" : ""}>Resolved</option>
        </select>
    </div>

    <div class="admin-actions">
        <button type="button" class="delete-button" onclick="deleteSupportTicket('${ticket._id}')">Delete Ticket</button>
    </div>
`;

            // מוסיפה את כרטיס הפנייה לאזור התמיכה בדף.
            supportTicketsContainer.appendChild(ticketDiv);
        });

        // מציגה הודעת שגיאה אם טעינת הפניות נכשלה.
    } catch (error) {
        supportTicketsContainer.innerHTML = "<p>Error loading support tickets.</p>";
    }
}

// מעדכנת בשרת את סטטוס פניית התמיכה.
async function updateSupportTicketStatus(ticketId, newStatus) {
    try {
        // שולחת בקשת PUT עם הסטטוס החדש.
        const response = await fetch("/api/support/" + ticketId + "/status", {
            method: "PUT",
            headers: getAdminHeaders(),
            body: JSON.stringify({
                status: newStatus,
            }),
        });

        // קוראת את תשובת השרת.
        const data = await response.json();

        // אם העדכון נכשל, מציגה את הודעת השגיאה.
        if (!response.ok) {
            alert(data.message || "Error updating support ticket");
            return;
        }

        // מודיעה על הצלחה וטוענת מחדש את הפניות.
        alert("Support ticket updated successfully");
        loadSupportTickets();
    } catch (error) {
        alert("Error updating support ticket");
    }
}

// מוחקת פניית תמיכה לאחר אישור מהמנהל.
async function deleteSupportTicket(ticketId) {
    // מבקשת אישור לפני המחיקה.
    const confirmDelete = confirm("Are you sure you want to delete this support ticket?");

    // אם המנהל ביטל, הפעולה נעצרת.
    if (!confirmDelete) {
        return;
    }

    try {
        // שולחת בקשת DELETE לפנייה המתאימה.
        const response = await fetch("/api/support/" + ticketId, {
            method: "DELETE",
            headers: getAdminHeaders(),
        });

        // קוראת את תשובת השרת.
        const data = await response.json();

        // מציגה שגיאה אם המחיקה לא הצליחה.
        if (!response.ok) {
            alert(data.message || "Error deleting support ticket");
            return;
        }

        // מודיעה על הצלחה וטוענת מחדש את פניות התמיכה.
        alert("Support ticket deleted successfully");
        loadSupportTickets();
    } catch (error) {
        alert("Error deleting support ticket");
    }
}

// =========================
// Charts
// =========================

// מחזירה את שם הקטגוריה מתוך מבנה הנתונים של הסטטיסטיקה.
function getCategoryName(item) {
    return item._id || item.category || item.name || "Unknown";
}

// מחזירה את מספר המוצרים מתוך אחד משמות השדות האפשריים.
function getCountValue(item) {
    return item.count || item.total || item.totalProducts || item.productsCount || 0;
}

// מחזירה את המחיר הממוצע מתוך אחד משמות השדות האפשריים.
function getAveragePriceValue(item) {
    return item.averagePrice || item.avgPrice || item.avg || item.price || 0;
}

// טוענת נתוני סטטיסטיקה ויוצרת גרף עמודות של מוצרים לפי קטגוריה.
async function loadProductsByCategoryChart() {
    // אם ה-Canvas או ספריית Chart.js אינם זמינים, לא יוצרים גרף.
    if (!productsByCategoryCanvas || typeof Chart === "undefined") {
        return;
    }

    try {
        // מבקשת מהשרת את מספר המוצרים בכל קטגוריה.
        const response = await fetch("/api/stats/products-by-category", {
            headers: getAdminHeaders(),
        });

        // ממירה את תשובת השרת למערך נתונים.
        const data = await response.json();

        // מפרידה את הנתונים לשמות קטגוריות ולערכים מספריים.
        const labels = data.map(getCategoryName);
        const values = data.map(getCountValue);

        // מוחקת את הגרף הקודם כדי למנוע יצירת גרפים כפולים.
        if (productsByCategoryChart) {
            productsByCategoryChart.destroy();
        }

        // יוצרת גרף עמודות חדש בתוך ה-Canvas המתאים.
        productsByCategoryChart = new Chart(productsByCategoryCanvas, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "Products by Category",
                        data: values,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0,
                        },
                    },
                },
            },
        });

        // אם טעינת הנתונים או יצירת הגרף נכשלו, כותבת שגיאה ל-Console.
    } catch (error) {
        console.log("Error loading products by category chart");
    }
}

// טוענת נתוני סטטיסטיקה ויוצרת גרף מחיר ממוצע לפי קטגוריה.
async function loadAveragePriceChart() {
    // אם ה-Canvas או ספריית Chart.js אינם זמינים, לא יוצרים גרף.
    if (!averagePriceCanvas || typeof Chart === "undefined") {
        return;
    }

    try {
        // מבקשת מהשרת את המחיר הממוצע בכל קטגוריה.
        const response = await fetch("/api/stats/average-price-by-category", {
            headers: getAdminHeaders(),
        });

        // ממירה את תשובת השרת למערך נתונים.
        const data = await response.json();

        // מפרידה את הנתונים לשמות קטגוריות ולמחירים ממוצעים.
        const labels = data.map(getCategoryName);
        const values = data.map(getAveragePriceValue);

        // מוחקת את הגרף הקודם לפני יצירת גרף מעודכן.
        if (averagePriceChart) {
            averagePriceChart.destroy();
        }

        // יוצרת גרף עמודות חדש של המחיר הממוצע.
        averagePriceChart = new Chart(averagePriceCanvas, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "Average Price by Category",
                        data: values,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                    },
                },
            },
        });

        // במקרה של כשל, כותבת הודעת שגיאה ל-Console.
    } catch (error) {
        console.log("Error loading average price chart");
    }
}

// מפעילה את שתי פונקציות הגרפים יחד.
function loadCharts() {
    loadProductsByCategoryChart();
    loadAveragePriceChart();
}

// =========================
// Expose functions to HTML buttons
// =========================

// מחברת את הפונקציות ל-window כדי שכפתורים ואירועי onchange ב-HTML יוכלו לקרוא להן.
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.deleteOrder = deleteOrder;
window.updateOrderStatus = updateOrderStatus;
window.updateSupportTicketStatus = updateSupportTicketStatus;
window.deleteSupportTicket = deleteSupportTicket;

// =========================
// Start Admin Page
// =========================

// פונקציית האתחול הראשית של דף המנהל.
async function startAdminPage() {
    // בודקת הרשאת מנהל לפני טעינת מידע רגיש.
    const isAdmin = checkAdminAccess();

    // אם המשתמש אינו מנהל, עוצרים ולא טוענים את נתוני הדף.
    if (!isAdmin) {
        return;
    }

    // לאחר אישור הגישה, טוענת את כל המוצרים, ההזמנות, הפניות והגרפים.
    const token = sessionStorage.getItem("authToken");
    try {
        const response = await fetch("/api/auth/me", { headers: { Authorization: "Bearer " + (token || "") } });
        const data = await response.json();
        if (!response.ok || data.user.role !== "admin") {
            showAdminMessage("Admin session expired. Please login again.", false);
            return;
        }
    } catch (error) {
        showAdminMessage("Cannot verify admin session.", false);
        return;
    }
    loadProducts();
    loadOrders();
    loadSupportTickets();
    loadCharts();
}

// מפעילה את דף המנהל מיד לאחר טעינת קובץ ה-JavaScript.
startAdminPage();