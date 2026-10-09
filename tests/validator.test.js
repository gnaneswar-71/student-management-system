const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { validateStudentData } = require("../middleware/validator");

describe("Student Input Validation Unit Tests", () => {
    it("should accept valid student details", () => {
        const payload = {
            name: "Johnathan Doe",
            email: "john.doe@example.com",
            phone: "+1 555-0123",
            course: "Computer Science",
            age: 22
        };

        const result = validateStudentData(payload);
        assert.strictEqual(result.isValid, true);
        assert.strictEqual(result.errors.length, 0);
        assert.strictEqual(result.normalized.name, "Johnathan Doe");
        assert.strictEqual(result.normalized.email, "john.doe@example.com");
        assert.strictEqual(result.normalized.phone, "+1 555-0123");
        assert.strictEqual(result.normalized.course, "Computer Science");
        assert.strictEqual(result.normalized.age, 22);
    });

    it("should trim strings and lowercase emails", () => {
        const payload = {
            name: "  Sarah Connor  ",
            email: "  SARAH.C@EXAMPLE.COM  ",
            phone: "  +1 555-9999  ",
            course: "  Cybersecurity  ",
            age: " 25 "
        };

        const result = validateStudentData(payload);
        assert.strictEqual(result.isValid, true);
        assert.strictEqual(result.normalized.name, "Sarah Connor");
        assert.strictEqual(result.normalized.email, "sarah.c@example.com");
        assert.strictEqual(result.normalized.phone, "+1 555-9999");
        assert.strictEqual(result.normalized.course, "Cybersecurity");
        assert.strictEqual(result.normalized.age, 25);
    });

    it("should reject missing or empty name", () => {
        const result = validateStudentData({
            name: "",
            email: "test@example.com",
            phone: "+1 555-0000",
            course: "Biology",
            age: 20
        });

        assert.strictEqual(result.isValid, false);
        assert.ok(result.errors.some(e => e.includes("Full name is required")));
    });

    it("should reject name that is too short", () => {
        const result = validateStudentData({
            name: "A",
            email: "test@example.com",
            phone: "+1 555-0000",
            course: "Biology",
            age: 20
        });

        assert.strictEqual(result.isValid, false);
        assert.ok(result.errors.some(e => e.includes("between 2 and 100")));
    });

    it("should reject invalid email formats", () => {
        const invalidEmails = ["plainaddress", "test@", "@domain.com", "user@.com", "user@domain..com"];

        for (const badEmail of invalidEmails) {
            const result = validateStudentData({
                name: "Test User",
                email: badEmail,
                phone: "+1 555-0000",
                course: "Physics",
                age: 21
            });

            assert.strictEqual(result.isValid, false, `Expected ${badEmail} to be rejected`);
            assert.ok(result.errors.some(e => e.includes("valid email address")));
        }
    });

    it("should reject invalid phone numbers", () => {
        const invalidPhones = ["123", "abc", "phone#1234"];

        for (const badPhone of invalidPhones) {
            const result = validateStudentData({
                name: "Test User",
                email: "test@example.com",
                phone: badPhone,
                course: "Physics",
                age: 21
            });

            assert.strictEqual(result.isValid, false, `Expected ${badPhone} to be rejected`);
            assert.ok(result.errors.some(e => e.includes("valid phone number")));
        }
    });

    it("should reject invalid ages (negative, 0, >120, float)", () => {
        const invalidAges = [-5, 0, 125, "not-a-number", 21.5];

        for (const badAge of invalidAges) {
            const result = validateStudentData({
                name: "Test User",
                email: "test@example.com",
                phone: "+1 555-0123",
                course: "Physics",
                age: badAge
            });

            assert.strictEqual(result.isValid, false, `Expected age ${badAge} to be rejected`);
            assert.ok(result.errors.some(e => e.includes("between 1 and 120")));
        }
    });
});
