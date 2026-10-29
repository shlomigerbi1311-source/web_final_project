const crypto = require("crypto");
const Session = require("../models/Session");
const User = require("../models/User");

const SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_FAILURES = 10;
const failedLogins = new Map();

function hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

function bearerToken(req) {
    const match = /^Bearer ([a-f0-9]{64})$/i.exec(req.get("authorization") || "");
    return match ? match[1] : null;
}

async function issueSession(userId) {
    const token = crypto.randomBytes(32).toString("hex");
    await Session.create({
        userId,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + SESSION_LIFETIME_MS)
    });
    return token;
}

async function requireAuth(req, res, next) {
    const token = bearerToken(req);
    if (!token) return res.status(401).json({ message: "Please login to continue." });
    try {
        const session = await Session.findOne({
            tokenHash: hashToken(token),
            expiresAt: { $gt: new Date() }
        });
        if (!session) return res.status(401).json({ message: "Session expired. Please login again." });
        const user = await User.findById(session.userId);
        if (!user) return res.status(401).json({ message: "Account not found. Please login again." });
        req.user = user;
        req.sessionTokenHash = session.tokenHash;
        next();
    } catch (error) {
        next(error);
    }
}

function requireAdmin(req, res, next) {
    requireAuth(req, res, function (error) {
        if (error) return next(error);
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied. Admin only." });
        }
        next();
    });
}

function loginKey(req) {
    return String(req.ip || "unknown");
}

function checkLoginRate(req, res, next) {
    const key = loginKey(req);
    const state = failedLogins.get(key);
    if (state && state.expiresAt > Date.now() && state.count >= MAX_LOGIN_FAILURES) {
        return res.status(429).json({ message: "Too many failed attempts. Try again in 15 minutes." });
    }
    if (state && state.expiresAt <= Date.now()) failedLogins.delete(key);
    next();
}

function recordFailedLogin(req) {
    // Keep a bounded in-memory limiter for the single-instance college demo.
    if (failedLogins.size >= 2000) {
        for (const [key, state] of failedLogins) {
            if (state.expiresAt <= Date.now()) failedLogins.delete(key);
        }
        if (failedLogins.size >= 2000) failedLogins.delete(failedLogins.keys().next().value);
    }
    const key = loginKey(req);
    const state = failedLogins.get(key);
    if (state && state.expiresAt > Date.now()) state.count += 1;
    else failedLogins.set(key, { count: 1, expiresAt: Date.now() + LOGIN_WINDOW_MS });
}

function clearFailedLogins(req) {
    failedLogins.delete(loginKey(req));
}

module.exports = {
    hashToken, bearerToken, issueSession, requireAuth, requireAdmin,
    checkLoginRate, recordFailedLogin, clearFailedLogins
};
