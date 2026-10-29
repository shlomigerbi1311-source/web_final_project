console.log("Store page JavaScript is connected");

// =========================
// Elements
// =========================

const productsContainer = document.getElementById("productsContainer");
const currencyRateText = document.getElementById("currencyRateText");
const weatherSuggestionText = document.getElementById("weatherSuggestionText");
const cartMessage = document.getElementById("cartMessage");

const sortSelect = document.getElementById("sortSelect");
const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("categorySelect");
const clearFiltersButton = document.getElementById("clearFiltersButton");

// Product Details Modal elements
const productDetailsModal = document.getElementById("productDetailsModal");
const closeProductModalButton = document.getElementById("closeProductModalButton");
const modalProductImage = document.getElementById("modalProductImage");
const modalProductCategory = document.getElementById("modalProductCategory");
const modalProductName = document.getElementById("modalProductName");
const modalProductDescription = document.getElementById("modalProductDescription");
const modalProductPrice = document.getElementById("modalProductPrice");
const modalProductIlsPrice = document.getElementById("modalProductIlsPrice");
const modalProductStock = document.getElementById("modalProductStock");
const modalAddToCartButton = document.getElementById("modalAddToCartButton");
const modalSupplierOffers = document.getElementById("modalSupplierOffers");

// =========================
// Global Variables
// =========================

let usdToIlsRate = 3.7;
let productsList = [];
let searchTimeout = null;
let cartMessageTimeout = null;
let selectedModalProductId = null;

// =========================
// Helper Functions
// =========================

function escapeHtml(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatStorePrice(price) {
    return "$" + (Number(price) || 0).toFixed(2);
}

function getIlsPrice(price) {
    const ilsPrice = (Number(price) || 0) * usdToIlsRate;
    return "Estimated: ₪" + ilsPrice.toFixed(2);
}

function getFallbackImage(productName) {
    const name = String(productName || "").toLowerCase();

    if (name.includes("phone")) {
        return "/images/products/phone-holder.jpg";
    }

    if (name.includes("seat")) {
        return "/images/products/seat-covers.jpg";
    }

    if (name.includes("organizer")) {
        return "/images/products/organizer-box.jpg";
    }

    if (name.includes("led") || name.includes("headlight")) {
        return "/images/products/led-headlight.jpg";
    }

    if (name.includes("ambient")) {
        return "/images/products/ambient-lights.jpg";
    }

    if (name.includes("fog")) {
        return "/images/products/fog-lights.jpg";
    }

    if (name.includes("cleaning")) {
        return "/images/products/cleaning-kit.jpg";
    }

    if (name.includes("microfiber")) {
        return "/images/products/microfiber-towels.jpg";
    }

    if (name.includes("anti fog")) {
        return "/images/products/anti-fog-spray.jpg";
    }

    if (name.includes("safety")) {
        return "/images/products/safety-kit.jpg";
    }

    if (name.includes("tire")) {
        return "/images/products/tire-gauge.jpg";
    }

    if (name.includes("dash")) {
        return "/images/products/dash-camera.jpg";
    }

    if (name.includes("usb")) {
        return "/images/products/usb-charger.jpg";
    }

    if (name.includes("bluetooth")) {
        return "/images/products/bluetooth-transmitter.jpg";
    }

    if (name.includes("cover") && !name.includes("steering")) {
        return "/images/products/car-cover.jpg";
    }

    if (name.includes("sunshade") || name.includes("sun shade")) {
        return "/images/products/sunshade.jpg";
    }

    if (name.includes("steering")) {
        return "/images/products/steering-cover.jpg";
    }

    if (name.includes("neck") || name.includes("pillow")) {
        return "/images/products/neck-pillow.jpg";
    }

    return "/images/products/phone-holder.jpg";
}

// =========================
// Product Badges
// =========================

function getProductBadge(product) {
    if (product.stock <= 10) {
        return {
            text: "Low Stock",
            className: "badge-low-stock",
        };
    }

    if (product.name === "Dash Camera" || product.name === "Car Phone Holder") {
        return {
            text: "Best Seller",
            className: "badge-best-seller",
        };
    }

    if (product.name === "USB Car Charger" || product.name === "Ambient Interior Lights") {
        return {
            text: "New",
            className: "badge-new",
        };
    }

    if (product.name === "Anti Fog Spray" || product.name === "Windshield Sunshade") {
        return {
            text: "Recommended",
            className: "badge-recommended",
        };
    }

    return null;
}

function getProductBadgeHtml(product) {
    const badge = getProductBadge(product);

    if (!badge) {
        return "";
    }

    return `<span class="product-badge ${badge.className}">${escapeHtml(badge.text)}</span>`;
}

// =========================
// Product Card Actions
// =========================

function getProductActionsHtml(product) {
    if (product.stock <= 0) {
        return `
            <div class="product-card-actions">
                <button type="button" onclick="openProductDetailsModal('${product._id}')">
                    View Details
                </button>
                <button type="button" class="disabled-cart-button" disabled>
                    Out of Stock
                </button>
            </div>
        `;
    }

    return `
        <div class="product-card-actions">
            <button type="button" onclick="openProductDetailsModal('${product._id}')">
                View Details
            </button>
            <button type="button" onclick="addToCart('${product._id}')">
                Add to Cart
            </button>
        </div>
    `;
}

// =========================
// API / External APIs
// =========================

function buildProductsUrl() {
    const url = new URL("/api/products", window.location.origin);

    if (sortSelect && sortSelect.value) {
        url.searchParams.set("sort", sortSelect.value);
    }

    if (categorySelect && categorySelect.value) {
        url.searchParams.set("category", categorySelect.value);
    }

    if (searchInput && searchInput.value.trim()) {
        url.searchParams.set("search", searchInput.value.trim());
    }

    return url.pathname + url.search;
}

async function loadCurrencyRate() {
    if (currencyRateText) {
        currencyRateText.textContent = "Loading currency rate...";
    }

    try {
        const response = await fetch("https://api.frankfurter.dev/v1/latest?base=USD&symbols=ILS");
        const data = await response.json();

        if (data && data.rates && data.rates.ILS) {
            usdToIlsRate = data.rates.ILS;
        }

        if (currencyRateText) {
            currencyRateText.textContent =
                "Currency rate: 1 USD ≈ ₪" + usdToIlsRate.toFixed(2);
        }
    } catch (error) {
        if (currencyRateText) {
            currencyRateText.textContent =
                "Currency rate is currently unavailable. Showing estimated ILS prices.";
        }
    }
}

function getWeatherRecommendation(temperature) {
    if (temperature >= 28) {
        return "Hot weather today. Sunshades and car covers are recommended.";
    }

    if (temperature <= 15) {
        return "Cool weather today. Cleaning and safety products are recommended.";
    }

    return "Good driving weather today. Check out our comfort and electronics accessories.";
}

async function loadWeatherRecommendation() {
    if (weatherSuggestionText) {
        weatherSuggestionText.textContent = "Loading weather recommendation...";
    }

    try {
        const response = await fetch(
            "https://api.open-meteo.com/v1/forecast?latitude=32.08&longitude=34.78&current_weather=true"
        );

        const data = await response.json();
        const temperature = data.current_weather.temperature;

        if (weatherSuggestionText) {
            weatherSuggestionText.textContent =
                getWeatherRecommendation(temperature) + " Current temperature: " + temperature + "°C.";
        }
    } catch (error) {
        if (weatherSuggestionText) {
            weatherSuggestionText.textContent =
                "Weather recommendation is currently unavailable.";
        }
    }
}

// =========================
// Render Products
// =========================

async function loadProducts() {
    if (!productsContainer) {
        return;
    }

    productsContainer.innerHTML = "<p>Loading products...</p>";

    try {
        const response = await fetch(buildProductsUrl());
        const products = await response.json();

        productsList = Array.isArray(products) ? products : [];
        productsContainer.innerHTML = "";

        if (productsList.length === 0) {
            productsContainer.innerHTML = `
                <div class="empty-state">
                    <h2>No products found</h2>
                    <p>Try changing your search or filters.</p>
                </div>
            `;
            return;
        }

        productsList.forEach(function (product) {
            const productCard = document.createElement("div");
            productCard.className = "product-card";

            const fallbackImage = getFallbackImage(product.name);
            const productImage = product.image || product.imageUrl || fallbackImage;

            productCard.innerHTML = `
                ${getProductBadgeHtml(product)}

                <img 
                    src="${escapeHtml(productImage)}" 
                    alt="${escapeHtml(product.name)}"
                    onerror="this.onerror=null; this.src='${fallbackImage}';"
                >

                <h3>${escapeHtml(product.name)}</h3>
                <p>${escapeHtml(product.description)}</p>
                <p class="category">${escapeHtml(product.category)}</p>

                <p class="price">${formatStorePrice(product.price)}</p>
                <p class="price-ils">${getIlsPrice(product.price)}</p>

                <p class="stock">In stock: ${product.stock}</p>

                ${getProductActionsHtml(product)}
            `;

            productsContainer.appendChild(productCard);
        });
    } catch (error) {
        productsContainer.innerHTML = `
            <div class="empty-state">
                <h2>Error loading products</h2>
                <p>Please try again later.</p>
            </div>
        `;
    }
}

// =========================
// Product Details Modal
// =========================

function openProductDetailsModal(productId) {
    const product = productsList.find(function (item) {
        return item._id === productId;
    });

    if (!product) {
        showCartMessage("Product not found.", false);
        return;
    }

    selectedModalProductId = productId;

    const fallbackImage = getFallbackImage(product.name);
    const productImage = product.image || product.imageUrl || fallbackImage;

    modalProductImage.src = productImage;
    modalProductImage.alt = product.name;
    modalProductImage.onerror = function () {
        modalProductImage.onerror = null;
        modalProductImage.src = fallbackImage;
    };

    modalProductCategory.textContent = product.category;
    modalProductName.textContent = product.name;
    modalProductDescription.textContent = product.description;
    modalProductPrice.textContent = formatStorePrice(product.price);
    modalProductIlsPrice.textContent = getIlsPrice(product.price);
    modalProductStock.textContent = "In stock: " + product.stock;

    if (modalSupplierOffers) {
        modalSupplierOffers.innerHTML = "";
    }

    modalAddToCartButton.style.display = "block";

    if (product.stock <= 0) {
        modalAddToCartButton.disabled = true;
        modalAddToCartButton.textContent = "Out of Stock";
        modalAddToCartButton.classList.add("disabled-cart-button");
    } else {
        modalAddToCartButton.disabled = false;
        modalAddToCartButton.textContent = "Add to Cart";
        modalAddToCartButton.classList.remove("disabled-cart-button");
    }

    productDetailsModal.classList.add("show");
}

function closeProductDetailsModal() {
    productDetailsModal.classList.remove("show");
    selectedModalProductId = null;

    if (modalSupplierOffers) {
        modalSupplierOffers.innerHTML = "";
    }
}

// =========================
// Cart
// =========================

function showCartMessage(message, isSuccess) {
    if (!cartMessage) {
        return;
    }

    cartMessage.classList.remove("cart-message-success", "cart-message-error", "show");

    if (isSuccess) {
        cartMessage.classList.add("cart-message-success");

        cartMessage.innerHTML = `
            <span>${escapeHtml(message)}</span>
            <a href="checkout.html" class="go-to-cart-button">Go to Checkout</a>
        `;
    } else {
        cartMessage.classList.add("cart-message-error");

        cartMessage.innerHTML = `
            <span>${escapeHtml(message)}</span>
        `;
    }

    cartMessage.classList.add("show");

    if (cartMessageTimeout) {
        clearTimeout(cartMessageTimeout);
    }

    cartMessageTimeout = setTimeout(function () {
        cartMessage.innerHTML = "";
        cartMessage.classList.remove("cart-message-success", "cart-message-error", "show");
    }, 3000);
}
function addToCart(productId) {
    const product = productsList.find(function (item) {
        return item._id === productId;
    });

    if (!product) {
        showCartMessage("Product not found.", false);
        return;
    }

    if (product.stock <= 0) {
        showCartMessage("This product is currently out of stock.", false);
        return;
    }

    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    const existingCartItem = cart.find(function (item) {
        return item._id === productId;
    });

    const currentQuantityInCart = existingCartItem ? existingCartItem.quantity : 0;

    if (currentQuantityInCart + 1 > product.stock) {
        showCartMessage("Only " + product.stock + " units are available in stock.", false);
        return;
    }

    if (existingCartItem) {
        existingCartItem.quantity = existingCartItem.quantity + 1;
        existingCartItem.stock = product.stock;
    } else {
        cart.push({
            _id: product._id,
            productId: product._id,
            name: product.name,
            price: product.price,
            image: product.image || product.imageUrl || getFallbackImage(product.name),
            stock: product.stock,
            quantity: 1,
        });
    }

    localStorage.setItem("cart", JSON.stringify(cart));

    if (typeof updateMainLayout === "function") {
        updateMainLayout();
    }

    showCartMessage(product.name + " added to cart.", true);
}

// =========================
// Event Listeners
// =========================

if (closeProductModalButton) {
    closeProductModalButton.addEventListener("click", closeProductDetailsModal);
}

if (productDetailsModal) {
    productDetailsModal.addEventListener("click", function (event) {
        if (event.target === productDetailsModal) {
            closeProductDetailsModal();
        }
    });
}

if (modalAddToCartButton) {
    modalAddToCartButton.addEventListener("click", function () {
        if (!selectedModalProductId) {
            return;
        }

        addToCart(selectedModalProductId);
        closeProductDetailsModal();
    });
}

if (sortSelect) {
    sortSelect.addEventListener("change", loadProducts);
}

if (categorySelect) {
    categorySelect.addEventListener("change", loadProducts);
}

if (searchInput) {
    searchInput.addEventListener("input", function () {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        searchTimeout = setTimeout(function () {
            loadProducts();
        }, 400);
    });
}

if (clearFiltersButton) {
    clearFiltersButton.addEventListener("click", function () {
        if (sortSelect) {
            sortSelect.value = "";
        }

        if (categorySelect) {
            categorySelect.value = "";
        }

        if (searchInput) {
            searchInput.value = "";
        }

        loadProducts();
    });
}

// =========================
// Start Page
// =========================

async function startStorePage() {
    // Third-party weather and currency services must not delay the product catalog.
    await loadProducts();
    void loadCurrencyRate();
    void loadWeatherRecommendation();
}

// חשיפת פונקציות לכפתורים שנוצרים דינמית בתוך productCard.innerHTML
window.openProductDetailsModal = openProductDetailsModal;
window.addToCart = addToCart;

startStorePage();