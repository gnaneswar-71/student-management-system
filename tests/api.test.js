const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const app = require("../server");
const { pool } = require("../config/database");

describe("API & Server End-to-End Route Tests", () => {
    let server;
    let baseUrl;

    before(async () => {
        // Start server on an ephemeral random port for isolated testing
        await new Promise((resolve) => {
            server = http.createServer(app);
            server.listen(0, "127.0.0.1", () => {
                const address = server.address();
                baseUrl = `http://127.0.0.1:${address.port}`;
                resolve();
            });
        });
    });

    after(async () => {
        if (server) {
            await new Promise((resolve) => server.close(resolve));
        }
        await new Promise((resolve) => pool.end(resolve));
    });

    it("GET / should serve the frontend HTML dashboard", async () => {
        const res = await fetch(`${baseUrl}/`);
        assert.strictEqual(res.status, 200);
        const text = await res.text();
        assert.ok(text.includes("Studify"), "Expected page to include Studify branding");
        assert.ok(text.includes("Student Management System"));
    });

    it("GET /api/health should report server status and database connectivity", async () => {
        const res = await fetch(`${baseUrl}/api/health`);
        // Status may be 200 (if DB connected) or 503 (if DB offline in current environment)
        assert.ok([200, 503].includes(res.status), `Unexpected status code: ${res.status}`);
        const data = await res.json();
        assert.ok(data.status === "healthy" || data.status === "degraded");
        assert.ok("database" in data);
        assert.ok(typeof data.database.connected === "boolean");
        assert.ok(typeof data.uptime === "string");
    });

    it("GET /api/nonexistent should return 404 JSON response", async () => {
        const res = await fetch(`${baseUrl}/api/nonexistent-route-for-testing`);
        assert.strictEqual(res.status, 404);
        const data = await res.json();
        assert.strictEqual(data.success, false);
        assert.ok(data.message.includes("Route not found"));
    });

    it("POST /api/students should reject empty request body with 400", async () => {
        const res = await fetch(`${baseUrl}/api/students`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
        });
        assert.strictEqual(res.status, 400);
        const data = await res.json();
        assert.strictEqual(data.success, false);
        assert.ok(data.message);
    });

    it("POST /api/students should reject invalid email with 400", async () => {
        const res = await fetch(`${baseUrl}/api/students`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "Test Student",
                email: "not-a-valid-email",
                phone: "+1 555-0123",
                course: "Computer Science",
                age: 21
            })
        });
        assert.strictEqual(res.status, 400);
        const data = await res.json();
        assert.strictEqual(data.success, false);
        assert.ok(data.message.includes("valid email"));
    });

    it("GET /api/students/invalid-id should return 400 for non-integer ID", async () => {
        const res = await fetch(`${baseUrl}/api/students/abc`);
        assert.strictEqual(res.status, 400);
        const data = await res.json();
        assert.strictEqual(data.success, false);
        assert.ok(data.message.includes("Invalid student ID"));
    });

    it("POST /api/students with malformed JSON should return 400 bad request", async () => {
        const res = await fetch(`${baseUrl}/api/students`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "this is not valid json {"
        });
        assert.strictEqual(res.status, 400);
        const data = await res.json();
        assert.strictEqual(data.success, false);
        assert.ok(data.message.includes("Malformed JSON"));
    });
});
