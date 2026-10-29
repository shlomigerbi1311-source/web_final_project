// One-time local setup: ADMIN_USERNAME=admin ADMIN_PASSWORD=<strong password> npm run create-admin
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function main() {
    const username = String(process.env.ADMIN_USERNAME || "admin").trim();
    const password = process.env.ADMIN_PASSWORD || "";
    if (!process.env.MONGO_URI || username.length < 3 || password.length < 12) {
        throw new Error("Set MONGO_URI and a strong ADMIN_PASSWORD (12+ characters) in your environment.");
    }
    await mongoose.connect(process.env.MONGO_URI);
    const existing = await User.findOne({ $or: [{ username }, { email: username }] });
    if (existing) throw new Error("That account already exists; no account was changed.");
    await User.create({
        username, password: await bcrypt.hash(password, 12),
        role: "admin", firstName: "Admin"
    });
    console.log("Admin account created. Remove ADMIN_PASSWORD from your environment.");
}

main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
}).finally(() => mongoose.disconnect());
