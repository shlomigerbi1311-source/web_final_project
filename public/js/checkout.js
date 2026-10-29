// בדיקת חיבור: ההודעה תופיע ב-Console כאשר קובץ ה-JavaScript נטען בהצלחה.
console.log("Checkout page JavaScript is connected");

// מקבל את טופס התשלום מתוך דף ה-HTML.
const checkoutForm = document.getElementById("checkoutForm");

// האזור שבו יוצגו המוצרים שנמצאים בעגלת הקניות.
const checkoutItemsContainer = document.getElementById("checkoutItemsContainer");

// האזור שבו יוצגו הודעות הצלחה או שגיאה בתהליך התשלום.
const checkoutMessage = document.getElementById("checkoutMessage");

// שדות פרטי המשלוח של הלקוח.
const fullNameInput = document.getElementById("fullName");
const phoneInput = document.getElementById("phone");
const countrySelect = document.getElementById("country");
const cityInput = document.getElementById("city");
const streetInput = document.getElementById("street");
const zipCodeInput = document.getElementById("zipCode");

// שדות פרטי כרטיס האשראי.
const cardNumberInput = document.getElementById("cardNumber");
const cardNameInput = document.getElementById("cardName");
const expiryDateInput = document.getElementById("expiryDate");
const cvvInput = document.getElementById("cvv");

// האזור שמכיל את כל שדות כרטיס האשראי וניתן להציג או להסתיר אותו.
const creditCardFields = document.getElementById("creditCardFields");

// שדה הכנסת קוד הקופון.
const couponCodeInput = document.getElementById("couponCodeInput");

// הכפתור שמפעיל את בדיקת הקופון.
const applyCouponButton = document.getElementById("applyCouponButton");

// האזור שבו תוצג הודעה לגבי תקינות הקופון.
const couponMessage = document.getElementById("couponMessage");

// אלמנטים שמציגים את סיכום המחירים והמשלוח.
const subtotalText = document.getElementById("subtotalText");
const shippingText = document.getElementById("shippingText");
const discountText = document.getElementById("discountText");
const deliveryText = document.getElementById("deliveryText");
const totalText = document.getElementById("totalText");

// הסכום הכולל של המוצרים לפני משלוח והנחה.
let subtotal = 0;

// מחיר המשלוח לפי המדינה שנבחרה.
let shippingFee = 0;

// סכום ההנחה שהתקבל מהקופון.
let discountAmount = 0;

// קוד הקופון התקין שהופעל.
let appliedCouponCode = "";

// מספר ימי המשלוח הצפוי.
let deliveryDays = "";

// המחיר הסופי לאחר משלוח והנחה.
let totalPrice = 0;

// מחזירה את עגלת הקניות שנשמרה ב-localStorage.
function getCart() {
    // אם אין עגלה שמורה, מחזירה מערך ריק.
    return JSON.parse(localStorage.getItem("cart")) || [];
}

// מחזירה את פרטי המשתמש המחובר מתוך localStorage.
function getCurrentUser() {
    return sessionStorage.getItem("authToken") ? JSON.parse(localStorage.getItem("currentUser")) : null;
}

// מחזירה את מחיר המשלוח וזמן המשלוח לפי המדינה שנבחרה.
function getShippingDetailsByCountry(country) {
    // פרטי משלוח לישראל.
    if (country === "Israel") {
        return {
            fee: 25,
            days: "3-5 business days",
        };
    }

    // פרטי משלוח לארצות הברית.
    if (country === "United States") {
        return {
            fee: 59,
            days: "7-10 business days",
        };
    }

    // פרטי משלוח לבריטניה.
    if (country === "United Kingdom") {
        return {
            fee: 49,
            days: "6-9 business days",
        };
    }

    // פרטי משלוח לגרמניה.
    if (country === "Germany") {
        return {
            fee: 45,
            days: "6-9 business days",
        };
    }

    // פרטי משלוח לצרפת.
    if (country === "France") {
        return {
            fee: 45,
            days: "6-9 business days",
        };
    }

    // ערכי ברירת מחדל כאשר עדיין לא נבחרה מדינה.
    return {
        fee: 0,
        days: "Choose country",
    };
}

// מחשבת את סכום ההנחה לפי קוד הקופון שהוזן.
function calculateCouponDiscount(couponCode) {
    // ממירה את הקוד למחרוזת, מסירה רווחים והופכת לאותיות גדולות.
    const normalizedCode = String(couponCode || "").trim().toUpperCase();

    // הקופון DRIVE10 נותן הנחה של 10% מסכום המוצרים.
    if (normalizedCode === "DRIVE10") {
        return subtotal * 0.1;
    }

    // הקופון STUDENT15 נותן הנחה של 15% מסכום המוצרים.
    if (normalizedCode === "STUDENT15") {
        return subtotal * 0.15;
    }

    // אם הקוד אינו תקין, לא ניתנת הנחה.
    return 0;
}

// טוענת את מוצרי העגלה ומציגה אותם בעמוד התשלום.
function loadCheckoutItems() {
    // מקבלת את עגלת הקניות מה-localStorage.
    const cart = getCart();

    // מנקה מוצרים שהוצגו קודם.
    checkoutItemsContainer.innerHTML = "";

    // מאפסת את סכום הביניים לפני חישוב מחדש.
    subtotal = 0;

    // אם העגלה ריקה, מציגה הודעה ומעדכנת את סיכום המחיר.
    if (cart.length === 0) {
        checkoutItemsContainer.innerHTML = "<p>Your cart is empty.</p>";
        updateSummary();
        return;
    }

    // עוברת על כל מוצר בעגלת הקניות.
    cart.forEach(function (item) {
        // מוסיפה לסכום הביניים את מחיר המוצר כפול הכמות.
        subtotal = subtotal + item.price * item.quantity;

        // יוצרת אלמנט HTML חדש עבור המוצר.
        const itemDiv = document.createElement("div");

        // מוסיפה לאלמנט את מחלקת העיצוב של מוצר בעמוד התשלום.
        itemDiv.className = "checkout-item";

        // מציגה את שם המוצר, המחיר, הכמות והמחיר הכולל שלו.
        itemDiv.innerHTML = `
            <div>
                <h3></h3>
                <p>Price: $${item.price}</p>
                <p>Quantity: ${item.quantity}</p>
            </div>
            <strong>$${item.price * item.quantity}</strong>
        `;

        // מוסיפה את המוצר לאזור המוצרים בעמוד.
        itemDiv.querySelector("h3").textContent = String(item.name || "");
        checkoutItemsContainer.appendChild(itemDiv);
    });

    // מעדכנת את סיכום המחיר לאחר טעינת כל המוצרים.
    updateSummary();
}

// מחשבת ומציגה את סיכום המחיר, המשלוח, ההנחה והמחיר הסופי.
function updateSummary() {
    // מקבלת את פרטי המשלוח לפי המדינה שנבחרה.
    const shippingDetails = getShippingDetailsByCountry(countrySelect.value);

    // מעדכנת את מחיר המשלוח.
    shippingFee = shippingDetails.fee;

    // מעדכנת את זמן המשלוח הצפוי.
    deliveryDays = shippingDetails.days;

    // מחשבת את המחיר הסופי: מוצרים + משלוח - הנחה.
    totalPrice = subtotal + shippingFee - discountAmount;

    // מציגה את סכום המוצרים עם שתי ספרות אחרי הנקודה.
    subtotalText.textContent = "Subtotal: $" + subtotal.toFixed(2);

    // מציגה את מחיר המשלוח.
    shippingText.textContent = "Shipping: $" + shippingFee.toFixed(2);

    // מציגה את סכום ההנחה.
    discountText.textContent = "Discount: -$" + discountAmount.toFixed(2);

    // מציגה את זמן המשלוח הצפוי.
    deliveryText.textContent = "Delivery: " + deliveryDays;

    // מציגה את המחיר הסופי.
    totalText.textContent = "Total: $" + totalPrice.toFixed(2);
}

// בודקת ומפעילה את קוד הקופון שהמשתמש הזין.
function applyCoupon() {
    // קוראת את הקוד, מסירה רווחים והופכת לאותיות גדולות.
    const couponCode = couponCodeInput.value.trim().toUpperCase();

    // מאפסת הנחה קודמת לפני בדיקת הקוד החדש.
    discountAmount = 0;

    // מאפסת את קוד הקופון שהופעל קודם.
    appliedCouponCode = "";

    // אם המשתמש לא הזין קוד, מציגה הודעת שגיאה.
    if (couponCode === "") {
        couponMessage.style.color = "red";
        couponMessage.textContent = "Please enter a coupon code.";
        updateSummary();
        return;
    }

    // מחשבת את ההנחה המתאימה לקוד שהוזן.
    const calculatedDiscount = calculateCouponDiscount(couponCode);

    // אם סכום ההנחה הוא 0, הקופון אינו תקין.
    if (calculatedDiscount <= 0) {
        couponMessage.style.color = "red";
        couponMessage.textContent = "Invalid coupon code.";
        updateSummary();
        return;
    }

    // שומרת את סכום ההנחה שחושב.
    discountAmount = calculatedDiscount;

    // שומרת את קוד הקופון התקין.
    appliedCouponCode = couponCode;

    // מציגה הודעת הצלחה בצבע ירוק.
    couponMessage.style.color = "green";

    // מציגה איזה קופון הופעל וכמה כסף נחסך.
    couponMessage.textContent =
        "Coupon " + couponCode + " applied. You saved $" + discountAmount.toFixed(2);

    // מחשבת מחדש את המחיר הסופי עם ההנחה.
    updateSummary();
}

// מחזירה את אמצעי התשלום שהמשתמש סימן.
function getSelectedPaymentMethod() {
    // מחפשת את כפתור הרדיו המסומן מתוך אמצעי התשלום.
    const selectedPayment = document.querySelector("input[name='paymentMethod']:checked");

    // מחזירה את הערך המסומן או כרטיס אשראי כברירת מחדל.
    return selectedPayment ? selectedPayment.value : "credit-card";
}

// בודקת את פרטי כרטיס האשראי הדמי לפי פרטים קבועים מראש.
function validateDemoCreditCard() {
    // מסירה רווחים ומקפים ממספר הכרטיס.
    const cardNumber = cardNumberInput.value.replaceAll(" ", "").replaceAll("-", "");

    // מקבלת את שם בעל הכרטיס ללא רווחים מיותרים.
    const cardName = cardNameInput.value.trim();

    // מקבלת את תאריך התוקף.
    const expiryDate = expiryDateInput.value.trim();

    // מקבלת את קוד האבטחה.
    const cvv = cvvInput.value.trim();

    // בודקת שמספר הכרטיס הוא מספר כרטיס הדמו.
    if (cardNumber !== "4242424242424242") {
        return false;
    }

    // בודקת ששם בעל הכרטיס כולל לפחות שני תווים.
    if (cardName.length < 2) {
        return false;
    }

    // בודקת שתאריך התוקף הוא תאריך הדמו.
    if (expiryDate !== "12/30") {
        return false;
    }

    // בודקת שקוד האבטחה הוא קוד הדמו.
    if (cvv !== "123") {
        return false;
    }

    // אם כל הבדיקות עברו, פרטי הכרטיס תקינים.
    return true;
}

// בונה את אובייקט פרטי התשלום שיישמר בתוך ההזמנה.
function getPaymentData() {
    // מקבלת את אמצעי התשלום שנבחר.
    const paymentMethod = getSelectedPaymentMethod();

    // אם נבחר Google Pay, מחזירה פרטי תשלום דמי של Google Pay.
    if (paymentMethod === "google-pay") {
        return {
            method: "Demo Google Pay",
            status: "Paid - Demo",
            last4: "GPay",
        };
    }

    // מסירה רווחים ומקפים ממספר כרטיס האשראי.
    const cleanCardNumber = cardNumberInput.value.replaceAll(" ", "").replaceAll("-", "");

    // מחזירה את פרטי התשלום של כרטיס האשראי הדמי.
    return {
        method: "Demo Credit Card",
        status: "Paid - Demo",
        last4: cleanCardNumber.slice(-4),
    };
}

// מציגה הודעת הצלחה או שגיאה בעמוד התשלום.
function showMessage(message, isSuccess) {
    // מציגה את תוכן ההודעה.
    checkoutMessage.textContent = message;

    // ירוק מסמן הצלחה ואדום מסמן שגיאה.
    checkoutMessage.style.color = isSuccess ? "green" : "red";
}

// בודקת שכפתור הקופון קיים לפני הוספת מאזין לחיצה.
if (applyCouponButton) {
    // מפעילה את פונקציית הקופון כאשר לוחצים על הכפתור.
    applyCouponButton.addEventListener("click", applyCoupon);
}

// עוברת על כל אפשרויות התשלום מסוג radio.
document.querySelectorAll("input[name='paymentMethod']").forEach(function (radioButton) {
    // מאזינה לשינוי באמצעי התשלום.
    radioButton.addEventListener("change", function () {
        // מקבלת את אמצעי התשלום החדש שנבחר.
        const paymentMethod = getSelectedPaymentMethod();

        // אם נבחר Google Pay, מסתירה את שדות כרטיס האשראי.
        if (paymentMethod === "google-pay") {
            creditCardFields.style.display = "none";
        } else {
            // אם נבחר כרטיס אשראי, מציגה את השדות.
            creditCardFields.style.display = "grid";
        }
    });
});

// מעדכנת את מחיר המשלוח והסיכום כאשר המשתמש משנה מדינה.
countrySelect.addEventListener("change", updateSummary);

// מאזינה לשליחת טופס התשלום.
checkoutForm.addEventListener("submit", async function (event) {
    // מונעת מהדפדפן לרענן את העמוד לאחר שליחת הטופס.
    event.preventDefault();

    // מקבלת את פרטי המשתמש המחובר.
    const currentUser = getCurrentUser();

    // מקבלת את עגלת הקניות.
    const cart = getCart();

    // אם המשתמש אינו מחובר, לא ניתן לבצע הזמנה.
    if (!currentUser) {
        showMessage("Please login before checkout.", false);
        return;
    }

    // אם העגלה ריקה, לא ניתן לבצע הזמנה.
    if (cart.length === 0) {
        showMessage("Your cart is empty.", false);
        return;
    }

    // אם לא נבחרה מדינה, לא ניתן לחשב משלוח.
    if (!countrySelect.value) {
        showMessage("Please choose a country.", false);
        return;
    }

    // מקבלת את אמצעי התשלום שנבחר.
    const paymentMethod = getSelectedPaymentMethod();

    // אם נבחר כרטיס אשראי, בודקת את פרטי כרטיס הדמו.
    if (paymentMethod === "credit-card") {
        // מפעילה את בדיקת הכרטיס ושומרת את התוצאה.
        const isCardValid = validateDemoCreditCard();

        // אם פרטי הכרטיס אינם תקינים, עוצרת את התשלום.
        if (!isCardValid) {
            showMessage("Payment failed. Demo card details are incorrect.", false);
            return;
        }
    }

    // יוצרת מערך מוצרים מסודר בפורמט המתאים להזמנה.
    const orderItems = cart.map(function (item) {
        return {
            productId: item.productId || item._id,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: item.quantity,
        };
    });
    // בונה את אובייקט ההזמנה המלא שיישלח לשרת.
    const orderData = {
        // שומרת את שם המשתמש או את כתובת האימייל שלו.
        customerUsername: currentUser.username || currentUser.email,

        // שומרת את רשימת המוצרים בהזמנה.
        items: orderItems,

        // שומרת את סכום המוצרים לפני משלוח והנחה.
        subtotal: subtotal,

        // שומרת את מחיר המשלוח.
        shippingFee: shippingFee,

        // שומרת את קוד הקופון שהופעל.
        couponCode: appliedCouponCode,

        // שומרת את סכום ההנחה.
        discountAmount: discountAmount,

        // שומרת את זמן המשלוח הצפוי.
        deliveryDays: deliveryDays,

        // שומרת את המחיר הסופי.
        totalPrice: totalPrice,

        // שומרת את כתובת המשלוח של הלקוח.
        shippingAddress: {
            fullName: fullNameInput.value,
            phone: phoneInput.value,
            country: countrySelect.value,
            city: cityInput.value,
            street: streetInput.value,
            zipCode: zipCodeInput.value,
        },

        // שומרת את פרטי אמצעי התשלום.
        payment: getPaymentData(),
    };

    try {
        // שולחת בקשת POST לשרת כדי ליצור הזמנה חדשה.
        const response = await fetch("/api/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + (sessionStorage.getItem("authToken") || ""),
            },
            body: JSON.stringify(orderData),
        });

        // ממירה את תשובת השרת מ-JSON לאובייקט JavaScript.
        const data = await response.json();

        // אם השרת החזיר שגיאה, מציגה את ההודעה ועוצרת.
        if (!response.ok) {
            showMessage(data.message || "Order failed.", false);
            return;
        }

        // לאחר יצירת ההזמנה, מוחקת את עגלת הקניות מה-localStorage.
        localStorage.removeItem("cart");

        // אם קיימת פונקציה לעדכון התפריט הראשי, מפעילה אותה.
        if (typeof updateMainLayout === "function") {
            updateMainLayout();
        }

        // מציגה הודעה שהתשלום וההזמנה הצליחו.
        showMessage("Payment approved! Order created successfully.", true);

        // ממתינה שלוש שניות לפני מעבר לעמוד ההזמנות של המשתמש.
        setTimeout(function () {
            window.location.href = "my-orders.html";
        }, 3000);
    } catch (error) {
        // מציגה הודעת שגיאה במקרה של בעיית תקשורת או שגיאה אחרת.
        showMessage("Error completing checkout.", false);
    }
});

// מפעילה את טעינת מוצרי העגלה מיד לאחר טעינת קובץ ה-JavaScript.
loadCheckoutItems();