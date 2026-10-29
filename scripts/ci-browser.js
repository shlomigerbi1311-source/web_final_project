const mongoose = require("mongoose");
const { chromium } = require("playwright");
const Product = require("../models/Product");
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
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
