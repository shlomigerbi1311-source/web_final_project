const test = require("node:test");
const assert = require("node:assert/strict");
const Session = require("../models/Session");
const User = require("../models/User");
const { hashToken, requireAuth, requireAdmin } = require("../lib/security");

function request(token, username = "admin") {
    return {
        headers: { "x-username": username },
        get(name) {
            return name.toLowerCase() === "authorization" && token ? "Bearer " + token : "";
        }
    };
}
function response() {
    return {
        code: 200, payload: null,
        status(code) { this.code = code; return this; },
        json(payload) { this.payload = payload; return this; }
    };
}
test("a forged admin username header never grants authorization", async () => {
    const res = response();
    let next = false;
    await requireAdmin(request(null, "admin"), res, () => { next = true; });
    assert.equal(res.code, 401);
    assert.equal(next, false);
});
test("invalid session bearer token cannot authorize", async () => {
    const res = response();
    const token = "a".repeat(64);
    const orig = Session.findOne;
    Session.findOne = async () => null;
    try {
        await requireAuth(request(token), res, () => { throw new Error("should not authenticate"); });
        assert.equal(res.code, 401);
    } finally {
        Session.findOne = orig;
    }
});
test("valid customer token authenticates but cannot act as admin", async () => {
    const res = response();
    const token = "b".repeat(64);
    const originalSession = Session.findOne;
    const originalUser = User.findById;
    Session.findOne = async query => {
        assert.equal(query.tokenHash, hashToken(token));
        return { tokenHash: query.tokenHash, userId: "customer-id" };
    };
    User.findById = async () => ({ username: "customer", role: "customer" });
    try {
        let next = false;
        await requireAdmin(request(token), res, () => { next = true; });
        assert.equal(res.code, 403);
        assert.equal(next, false);
    } finally {
        Session.findOne = originalSession;
        User.findById = originalUser;
    }
});
test("verified admin session can reach administrative API", async () => {
    const res = response();
    const token = "c".repeat(64);
    const originalSession = Session.findOne;
    const originalUser = User.findById;
    Session.findOne = async query => ({ tokenHash: query.tokenHash, userId: "admin-id" });
    User.findById = async () => ({ username: "admin", role: "admin" });
    try {
        let next = false;
        await requireAdmin(request(token), res, () => { next = true; });
        assert.equal(next, true);
    } finally {
        Session.findOne = originalSession;
        User.findById = originalUser;
    }
});
