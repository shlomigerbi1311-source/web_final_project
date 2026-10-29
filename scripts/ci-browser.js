const mongoose = require("mongoose");
const { chromium } = require("playwright");
const Product = require("../models/Product");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const app = require("../server");
const fs = require("node:fs");

async function run() {
  if (!process.env.MONGO_URI?.includes("drivex_ci")) throw Error("Disposable DB required");
  await mongoose.connect(process.env.MONGO_URI);
  await mongoose.connection.dropDatabase();
  await Product.create({ name: "Dashboard Camera", category: "Electronics", price: 100, stock: 10, image: "/images/products/dash-camera.jpg" });
  const server = await new Promise(resolve => { const s = app.listen(0, "127.0.0.1", () => resolve(s)); });
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    const base = "http://127.0.0.1:" + server.address().port;
    fs.mkdirSync("artifacts", { recursive: true });
    for (const [path, filename] of [["/", "home"], ["/store.html", "store"], ["/login.html", "login"], ["/cart.html", "cart"], ["/admin.html", "admin"]]) {
      const response = await page.goto(base + path);
      if (response.status() !== 200) throw Error("Page failed: " + path);
      if (path === "/store.html") await page.getByText("Dashboard Camera").first().waitFor({ timeout: 15000 });
      await page.screenshot({ path: "artifacts/" + filename + ".png", fullPage: true });
      console.log("PASS: Browser opened " + path);
    }
    await page.goto(base + "/login.html");
    await page.locator("#signupUsername").fill("ui-test-user");
    await page.locator("#signupPassword").fill("TestPassword123!");
    await page.locator("#signupForm button").click();
    await page.getByText("User created successfully!", { exact: false }).waitFor({ timeout: 12000 });
    console.log("PASS: Customer registered from browser form");
    await page.locator("#loginUsername").fill("ui-test-user");
    await page.locator("#loginPassword").fill("TestPassword123!");
    await page.locator("#loginForm button").click();
    await page.waitForURL("**/store.html", { timeout: 12000 });
    if (!await page.evaluate(() => !!sessionStorage.getItem("authToken"))) throw Error("Missing token after login");
    console.log("PASS: Browser login and session work");
    await page.locator("#productsContainer").getByText("Dashboard Camera").first().waitFor({ timeout: 12000 });
    await page.locator("#productsContainer").getByRole("button", { name: "Add to Cart" }).first().click();
    if (!await page.evaluate(() => JSON.parse(localStorage.getItem("cart") || "[]").length === 1)) throw Error("Add to cart failed");
    console.log("PASS: Product added to cart");
    await page.goto(base + "/cart.html");
    await page.getByText("Dashboard Camera").first().waitFor();
    await page.screenshot({ path: "artifacts/cart-with-product.png", fullPage: true });
    await page.locator("#checkoutButton").click();
    await page.waitForURL("**/checkout.html", { timeout: 10000 });
    await page.screenshot({ path: "artifacts/checkout-with-product.png", fullPage: true });
    console.log("PASS: Cart and checkout navigation works");
    await User.create({ username: "ui-admin", role: "admin", password: await bcrypt.hash("StrongBrowserPassword123!", 10) });
    await page.goto(base + "/login.html");
    await page.locator("#loginUsername").fill("ui-admin");
    await page.locator("#loginPassword").fill("StrongBrowserPassword123!");
    await page.locator("#loginForm button").click();
    await page.waitForURL("**/admin.html", { timeout: 12000 });
    await page.getByText("Dashboard Camera").first().waitFor({ timeout: 12000 });
    await page.screenshot({ path: "artifacts/admin-authenticated.png", fullPage: true });
    console.log("PASS: Authenticated admin dashboard works");
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
