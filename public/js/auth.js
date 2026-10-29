// הודעה לבדיקה שקובץ ההתחברות נטען בדפדפן
console.log("DriveX auth.js is connected");

/* -------------------------------
   Helper functions
-------------------------------- */

// פונקציה שמחזירה ערך משדה HTML לפי רשימת מזהים אפשריים
function getElementValue(ids) {
    for (let i = 0; i < ids.length; i++) {
        const element = document.getElementById(ids[i]);

        if (element) {
            return element.value;
        }
    }

    return "";
}

// פונקציה שמחזירה אלמנט HTML לפי רשימת מזהים אפשריים
function getElement(ids) {
    for (let i = 0; i < ids.length; i++) {
        const element = document.getElementById(ids[i]);

        if (element) {
            return element;
        }
    }

    return null;
}

// הצגת הודעה למשתמש בצבע מסוים
function showMessage(element, message, color) {
    if (!element) {
        return;
    }

    element.style.color = color;
    element.textContent = message;
}

/* -------------------------------
   Login
-------------------------------- */

// תפיסת טופס ההתחברות
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        // מונע רענון של הדף בשליחת הטופס
        event.preventDefault();

        // קבלת פרטי ההתחברות מהטופס
        const username = getElementValue(["loginUsername", "username"]);
        const email = getElementValue(["loginEmail", "email"]);
        const password = getElementValue(["loginPassword", "password"]);
        const messageElement = getElement(["loginMessage", "message"]);

        try {
            let response;

            // אם יש שם משתמש, מתחברים לפי username
            if (username) {
                response = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        username: username,
                        password: password,
                    }),
                });
            } else {
                // אחרת מתחברים לפי אימייל
                response = await fetch("/api/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password,
                    }),
                });
            }

            const data = await response.json();

            // אם ההתחברות נכשלה, מציגים הודעת שגיאה
            if (!response.ok) {
                showMessage(messageElement, data.message, "red");
                return;
            }

            // יצירת אובייקט של המשתמש המחובר
            const loggedUser = {
                username: data.user.username || data.user.firstName || email || username,
                email: data.user.email || email,
                firstName: data.user.firstName || "",
                lastName: data.user.lastName || "",
                role: data.user.role,
            };

            // שמירת המשתמש המחובר בדפדפן
            localStorage.setItem("currentUser", JSON.stringify(loggedUser));
            sessionStorage.setItem("authToken", data.token);

            showMessage(messageElement, "Login successful!", "green");

            // מעבר לעמוד מתאים לפי סוג המשתמש
            setTimeout(function () {
                if (loggedUser.role === "admin") {
                    window.location.href = "admin.html";
                } else {
                    window.location.href = "store.html";
                }
            }, 1000);
        } catch (error) {
            console.error("Login error:", error);
            showMessage(messageElement, "Something went wrong. Please try again.", "red");
        }
    });
}

/* -------------------------------
   Signup / Register
-------------------------------- */

// תפיסת טפסי הרשמה אפשריים
const signupForm = document.getElementById("signupForm");
const registerForm = document.getElementById("registerForm");

// בחירת הטופס שקיים בפועל בעמוד
const activeRegisterForm = signupForm || registerForm;

if (activeRegisterForm) {
    activeRegisterForm.addEventListener("submit", async function (event) {
        // מונע רענון דף בשליחת הטופס
        event.preventDefault();

        // קבלת פרטי ההרשמה מהטופס
        const username = getElementValue(["signupUsername", "username"]);
        const email = getElementValue(["signupEmail", "email"]);
        const password = getElementValue(["signupPassword", "password"]);
        const firstName = getElementValue(["firstName", "signupFirstName"]);
        const lastName = getElementValue(["lastName", "signupLastName"]);
        const phone = getElementValue(["phone", "signupPhone"]);
        const messageElement = getElement(["signupMessage", "registerMessage", "message"]);

        try {
            let response;

            // אם יש שם משתמש, נרשמים במסלול username
            if (username) {
                response = await fetch("/api/auth/signup", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        username: username,
                        password: password,
                    }),
                });
            } else {
                // אחרת נרשמים במסלול אימייל
                response = await fetch("/api/register", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password,
                        firstName: firstName,
                        lastName: lastName,
                        phone: phone,
                        role: "customer",
                    }),
                });
            }

            const data = await response.json();

            // אם ההרשמה נכשלה, מציגים הודעת שגיאה
            if (!response.ok) {
                showMessage(messageElement, data.message, "red");
                return;
            }

            // הודעת הצלחה ואיפוס הטופס
            showMessage(messageElement, "User created successfully! You can now login.", "green");
            activeRegisterForm.reset();
        } catch (error) {
            console.error("Signup error:", error);
            showMessage(messageElement, "Something went wrong. Please try again.", "red");
        }
    });
}