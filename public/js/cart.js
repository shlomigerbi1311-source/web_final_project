// הודעה לבדיקה שקובץ העגלה נטען בדפדפן
console.log("Cart page JavaScript is connected");

// תפיסת אלמנטים מה-HTML
const cartItemsContainer = document.getElementById("cartItemsContainer");
const cartTotalText = document.getElementById("cartTotalText");
const checkoutButton = document.getElementById("checkoutButton");
const clearCartButton = document.getElementById("clearCartButton");
const orderMessage = document.getElementById("orderMessage");

// פונקציה שמביאה את העגלה מהדפדפן
function getCart() {
    return JSON.parse(localStorage.getItem("cart")) || [];
}

// פונקציה ששומרת את העגלה בדפדפן
function saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
}

function formatPrice(value) {
    return "$" + (Number(value) || 0).toFixed(2);
}

let orderMessageTimeout;

function showOrderMessage(message, isSuccess) {
    if (!orderMessage) {
        return;
    }

    orderMessage.textContent = message;
    orderMessage.classList.remove("order-message-success", "order-message-error");

    if (isSuccess) {
        orderMessage.classList.add("order-message-success");
    } else {
        orderMessage.classList.add("order-message-error");
    }

    if (orderMessageTimeout) {
        clearTimeout(orderMessageTimeout);
    }

    orderMessageTimeout = setTimeout(function () {
        orderMessage.textContent = "";
        orderMessage.classList.remove("order-message-success", "order-message-error");
    }, 3000);
}

// טעינת העגלה והצגתה בעמוד
function loadCart() {
    const cart = getCart();

    cartItemsContainer.innerHTML = "";

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart-box">
                <h3>Your cart is empty</h3>
                <p>Looks like you have not added any products yet.</p>
                <a class="main-button" href="store.html">Start Shopping</a>
            </div>
        `;
        cartTotalText.textContent = "Total: " + formatPrice(0);        return;
    }

    let totalPrice = 0;

    cart.forEach(function (item) {
        const itemTotal = item.price * item.quantity;
        totalPrice = totalPrice + itemTotal;

        const cartItem = document.createElement("div");
        cartItem.className = "cart-item";

        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}">

            <div class="cart-item-details">
                <h3></h3>
    <p><strong>Price:</strong> ${formatPrice(item.price)}</p>
<p><strong>Quantity:</strong> ${item.quantity}</p>
<p><strong>Item Total:</strong> ${formatPrice(itemTotal)}</p>
<p><strong>Available stock:</strong> ${item.stock || "Unknown"}</p>
                <div class="cart-item-actions">
                    <button type="button" onclick="addOneItem('${item._id}')">Add One</button>
                    <button type="button" onclick="removeOneItem('${item._id}')">Remove One</button>
                    <button type="button" onclick="removeItemCompletely('${item._id}')">Remove Product</button>
                </div>
            </div>
        `;

        cartItem.querySelector("h3").textContent = String(item.name || "");
        cartItemsContainer.appendChild(cartItem);
    });

    cartTotalText.textContent = "Total: " + formatPrice(totalPrice);}

// הוספת יחידה אחת למוצר שכבר נמצא בעגלה
function addOneItem(productId) {
    const cart = getCart();

    const item = cart.find(function (cartItem) {
        return cartItem._id === productId;
    });

    if (!item) {
        return;
    }

    if (item.stock && item.quantity >= item.stock) {
        alert("Only " + item.stock + " units are available in stock.");
        return;
    }

    item.quantity = item.quantity + 1;

    saveCart(cart);
    loadCart();

    if (typeof updateMainLayout === "function") {
        updateMainLayout();
    }
}

// הסרת יחידה אחת ממוצר
function removeOneItem(productId) {
    const cart = getCart();

    const item = cart.find(function (cartItem) {
        return cartItem._id === productId;
    });

    if (!item) {
        return;
    }

    if (item.quantity > 1) {
        item.quantity = item.quantity - 1;
    } else {
        const itemIndex = cart.findIndex(function (cartItem) {
            return cartItem._id === productId;
        });

        cart.splice(itemIndex, 1);
    }

    saveCart(cart);
    loadCart();

    if (typeof updateMainLayout === "function") {
        updateMainLayout();
    }
}

// הסרת מוצר לגמרי מהעגלה
function removeItemCompletely(productId) {
    const cart = getCart();

    const updatedCart = cart.filter(function (item) {
        return item._id !== productId;
    });

    saveCart(updatedCart);
    loadCart();

    if (typeof updateMainLayout === "function") {
        updateMainLayout();
    }
}

// ניקוי כל העגלה
if (clearCartButton) {
    clearCartButton.addEventListener("click", function () {
        localStorage.removeItem("cart");
        showOrderMessage("Cart cleared successfully.", true);        loadCart();

        if (typeof updateMainLayout === "function") {
            updateMainLayout();
        }
    });
}

// מעבר לעמוד Checkout
if (checkoutButton) {
    checkoutButton.addEventListener("click", function () {
        const currentUser = sessionStorage.getItem("authToken") ? JSON.parse(localStorage.getItem("currentUser")) : null;
        const cart = getCart();

        if (!currentUser) {
            showOrderMessage("Please login before checkout.", false);
            return;
        }

        if (cart.length === 0) {
            showOrderMessage("Your cart is empty.", false);
            return;
        }

        window.location.href = "checkout.html";
    });
}

// טעינת העגלה כשהעמוד נפתח
loadCart();
