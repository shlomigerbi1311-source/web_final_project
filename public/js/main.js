// קובץ JavaScript כללי שרץ בכל עמודי האתר
console.log("DriveX main.js is connected");

// תפיסת אלמנטים כלליים מהתפריט
const statusText = document.getElementById("statusText");
const navUserText = document.getElementById("navUserText");
const logoutButton = document.getElementById("logoutButton");

// הודעת בדיקה בדף הבית, אם האלמנט קיים
if (statusText) {
    statusText.textContent = "Website files are connected successfully.";
}

// פונקציה שמחזירה את המשתמש המחובר מהדפדפן
function getCurrentUser() {
    return JSON.parse(localStorage.getItem("currentUser"));
}

// פונקציה שמחזירה את העגלה מהדפדפן
function getCart() {
    return JSON.parse(localStorage.getItem("cart")) || [];
}

// חישוב כמות המוצרים הכוללת בעגלה
function getCartItemsCount() {
    const cart = getCart();

    let totalItems = 0;

    cart.forEach(function (item) {
        totalItems = totalItems + item.quantity;
    });

    return totalItems;
}

// עדכון טקסט Cart בתפריט לפי כמות המוצרים בעגלה
function updateCartCounter() {
    const cartLinks = document.querySelectorAll('a[href="cart.html"]');
    const cartCount = getCartItemsCount();

    cartLinks.forEach(function (cartLink) {
        cartLink.textContent = "Cart (" + cartCount + ")";
    });
}

// הסתרת קישור Admin למי שלא מנהל
function updateAdminLinkVisibility() {
    const currentUser = getCurrentUser();
    const adminLinks = document.querySelectorAll('a[href="admin.html"]');

    adminLinks.forEach(function (adminLink) {
        if (!currentUser || currentUser.role !== "admin") {
            adminLink.style.display = "none";
        } else {
            adminLink.style.display = "inline-block";
        }
    });
}

// הוספת My Orders לתפריט רק אם המשתמש מחובר
function updateMyOrdersLink() {
    const currentUser = getCurrentUser();
    const navLinks = document.querySelector(".nav-links");

    if (!navLinks) {
        return;
    }

    let myOrdersLink = document.querySelector('a[href="my-orders.html"]');

    if (!currentUser) {
        if (myOrdersLink) {
            myOrdersLink.style.display = "none";
        }

        return;
    }

    if (!myOrdersLink) {
        myOrdersLink = document.createElement("a");
        myOrdersLink.href = "my-orders.html";
        myOrdersLink.textContent = "My Orders";

        const supportLink = document.querySelector('a[href="support.html"]');
        const loginLink = document.querySelector('a[href="login.html"]');

        if (supportLink) {
            navLinks.insertBefore(myOrdersLink, supportLink);
        } else if (loginLink) {
            navLinks.insertBefore(myOrdersLink, loginLink);
        } else {
            navLinks.appendChild(myOrdersLink);
        }
    }

    myOrdersLink.style.display = "inline-block";
}

// עדכון Login / Logout / שם משתמש בתפריט
function updateNavbarUser() {
    const currentUser = getCurrentUser();
    const loginLinks = document.querySelectorAll('a[href="login.html"]');

    // לא מציגים יותר את שם המשתמש בטקסט, כדי לשמור על תפריט נקי
    if (navUserText) {
        navUserText.textContent = "";
        navUserText.style.display = "none";
    }

    // אם אין כפתור Logout בעמוד, מפסיקים כאן
    if (!logoutButton) {
        return;
    }

    if (!currentUser) {
        logoutButton.style.display = "none";

        loginLinks.forEach(function (loginLink) {
            loginLink.style.display = "inline-block";
        });

        return;
    }

    logoutButton.style.display = "inline-block";

    loginLinks.forEach(function (loginLink) {
        loginLink.style.display = "none";
    });
}

// יציאה מהחשבון
if (logoutButton) {
    logoutButton.addEventListener("click", async function () {
        const token = sessionStorage.getItem("authToken");
        if (token) {
            try { await fetch("/api/auth/logout", { method: "POST", headers: { Authorization: "Bearer " + token } }); }
            catch (error) { console.warn("Could not revoke session", error); }
        }
        sessionStorage.removeItem("authToken");
        localStorage.removeItem("currentUser");
        window.location.href = "login.html";
    });
}

// הפעלת כל עדכוני התפריט
function updateMainLayout() {
    updateCartCounter();
    updateAdminLinkVisibility();
    updateMyOrdersLink();
    updateNavbarUser();
}

// חשיפה גלובלית כדי שגם cart.js ו-store.js יוכלו לעדכן את התפריט אחרי שינוי בעגלה
window.updateMainLayout = updateMainLayout;

updateMainLayout();
