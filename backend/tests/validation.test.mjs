import assert from "node:assert/strict";
import test from "node:test";
import {
    validateComponentPayload,
    validateRegistrationPayload,
    validateSupportTicketPayload,
} from "../src/utils/validation.js";

test("validateRegistrationPayload accepts valid developer registration", () => {
    const result = validateRegistrationPayload({
        fullName: "Test User",
        email: "test.user@example.com",
        phone: "9876543210",
        password: "Passw0rd!",
        role: "developer",
    });

    assert.equal(result.ok, true);
    assert.equal(result.data.role, "developer");
    assert.equal(result.data.email, "test.user@example.com");
});

test("validateRegistrationPayload rejects invalid phone", () => {
    const result = validateRegistrationPayload({
        fullName: "Test User",
        email: "test.user@example.com",
        phone: "1234",
        password: "Passw0rd!",
    });

    assert.equal(result.ok, false);
    assert.match(result.message, /10 to 15 digits/i);
});

test("validateComponentPayload enforces category allowlist", () => {
    const invalid = validateComponentPayload({
        name: "A",
        description: "B",
        category: "unknown",
        jsxCode: "export default function A(){ return <div>A</div>; }",
        cssCode: ".a{}",
    });
    assert.equal(invalid.ok, false);

    const valid = validateComponentPayload({
        name: "Button Sample",
        description: "Valid category",
        category: "buttons",
        jsxCode: "export default function A(){ return <button>A</button>; }",
        cssCode: ".a{}",
    });
    assert.equal(valid.ok, true);

    const validDataCategory = validateComponentPayload({
        name: "Chart Sample",
        description: "Data category",
        category: "data",
        jsxCode: "export default function A(){ return <svg role='img'/>; }",
        cssCode: ".a{}",
    });
    assert.equal(validDataCategory.ok, true);
});

test("validateSupportTicketPayload rejects honeypot field and accepts valid payload", () => {
    const honeypot = validateSupportTicketPayload({
        toemail: "user@example.com",
        title: "Issue",
        category: "Bug Report",
        description: "Details",
        website: "spam-bot-value",
    });
    assert.equal(honeypot.ok, false);

    const valid = validateSupportTicketPayload({
        toemail: "user@example.com",
        title: "Issue",
        category: "Bug Report",
        description: "Details",
        website: "",
    });
    assert.equal(valid.ok, true);
});
