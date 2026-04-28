import assert from "node:assert/strict";
import test from "node:test";
import {
    validateComponentPayload,
    validateRegistrationPayload,
    validateSupportTicketPayload,
} from "../utils/validation.js";

test("validateRegistrationPayload accepts valid developer registration", () => {
    const result = validateRegistrationPayload({
        fullName: "Test User",
        email: "test.user@example.com",
        phone: "9876543210",
        password: "Passw0rd!",
        role: "developer",
        avatarImage: "data:image/png;base64,AAAA",
    });

    assert.equal(result.ok, true);
    assert.equal(result.data.role, "developer");
    assert.equal(result.data.email, "test.user@example.com");
    assert.equal(result.data.avatarImage, "data:image/png;base64,AAAA");
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

test("validateComponentPayload enforces structured tag arrays", () => {
    const stringTags = validateComponentPayload({
        name: "Tag Sample",
        description: "Invalid string tags",
        category: "buttons",
        tags: "alpha,beta",
        jsxCode: "export default function A(){ return <button>A</button>; }",
    });
    assert.equal(stringTags.ok, false);
    assert.equal(stringTags.details.tags, "must be an array");

    const emptyTag = validateComponentPayload({
        name: "Tag Sample",
        description: "Invalid empty tag",
        category: "buttons",
        tags: ["alpha", " "],
        jsxCode: "export default function A(){ return <button>A</button>; }",
    });
    assert.equal(emptyTag.ok, false);
    assert.equal(emptyTag.details.tags, "entries must be non-empty strings");
});

test("validateComponentPayload accepts image URLs and data URLs", () => {
    const result = validateComponentPayload({
        name: "Image Sample",
        description: "Valid image references",
        category: "cards",
        tags: ["image"],
        jsxCode: "export default function A(){ return <div>A</div>; }",
        thumbnail: "https://example.com/thumb.png",
        screenshot: "data:image/png;base64,AAAA",
    });

    assert.equal(result.ok, true);
    assert.equal(result.data.thumbnail, "https://example.com/thumb.png");
});

test("validateSupportTicketPayload rejects honeypot field and accepts valid payload", () => {
    const honeypot = validateSupportTicketPayload({
        name: "Test User",
        title: "Issue",
        category: "Bug Report",
        description: "Details",
        website: "spam-bot-value",
    });
    assert.equal(honeypot.ok, false);

    const valid = validateSupportTicketPayload({
        name: "Test User",
        title: "Issue",
        category: "Bug Report",
        description: "Details",
        website: "",
    });
    assert.equal(valid.ok, true);
});
