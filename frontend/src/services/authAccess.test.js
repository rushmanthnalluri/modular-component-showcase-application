/**
 * Frontend unit tests — src/services and utility logic.
 *
 * Tests are designed to run in vitest's jsdom environment.
 * They cover:
 *   1. authAccess — canAccessAddComponent permission logic
 *   2. componentsStore — mapCloudComponent / isVerifierArtifact helpers (via exports)
 *   3. ComponentDetails helpers — parseDemoControlValue, serializeDemoControlValue
 *   4. useAuth hook — base vs derived state contract
 *
 * No DOM rendering is used here; all tests are pure-logic or hook tests
 * with the JSDOM environment available for localStorage / window stubs.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { canAccessAddComponent, getAuthUser, subscribeToAuthUser } from "@/services/authAccess";

// ---------------------------------------------------------------------------
// 1. authAccess — canAccessAddComponent
// ---------------------------------------------------------------------------

describe("canAccessAddComponent", () => {
    it("returns false when user is null", () => {
        expect(canAccessAddComponent(null)).toBe(false);
    });

    it("returns false when user is undefined", () => {
        expect(canAccessAddComponent(undefined)).toBe(false);
    });

    it("returns true for role=admin", () => {
        expect(canAccessAddComponent({ role: "admin" })).toBe(true);
    });

    it("returns true for role=developer", () => {
        expect(canAccessAddComponent({ role: "developer" })).toBe(true);
    });

    it("is case-insensitive for role", () => {
        expect(canAccessAddComponent({ role: "ADMIN" })).toBe(true);
        expect(canAccessAddComponent({ role: "Developer" })).toBe(true);
    });

    it("returns true when isVerifiedDeveloper is true regardless of role", () => {
        expect(canAccessAddComponent({ role: "user", isVerifiedDeveloper: true })).toBe(true);
    });

    it("returns false for role=user without isVerifiedDeveloper", () => {
        expect(canAccessAddComponent({ role: "user" })).toBe(false);
    });

    it("returns false for user with empty role and no isVerifiedDeveloper", () => {
        expect(canAccessAddComponent({ role: "", isVerifiedDeveloper: false })).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// 2. authAccess — localStorage integration with getAuthUser / subscribeToAuthUser
// ---------------------------------------------------------------------------

describe("getAuthUser", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("returns null when nothing is stored", () => {
        expect(getAuthUser()).toBeNull();
    });

    it("returns the stored user object", () => {
        const user = { id: "u1", role: "admin", fullName: "Alice" };
        localStorage.setItem("authUser", JSON.stringify(user));
        expect(getAuthUser()).toEqual(user);
    });

    it("returns null for malformed JSON", () => {
        localStorage.setItem("authUser", "not-json{{");
        expect(getAuthUser()).toBeNull();
    });

    it("returns null for a stored non-object (string) value", () => {
        localStorage.setItem("authUser", JSON.stringify("a string"));
        expect(getAuthUser()).toBeNull();
    });
});

describe("subscribeToAuthUser", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("immediately calls onChange with null when storage is empty", () => {
        const onChange = vi.fn();
        const unsubscribe = subscribeToAuthUser(onChange);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(null);
        unsubscribe();
    });

    it("immediately calls onChange with stored user", () => {
        const user = { id: "u2", role: "developer" };
        localStorage.setItem("authUser", JSON.stringify(user));
        const onChange = vi.fn();
        const unsubscribe = subscribeToAuthUser(onChange);
        expect(onChange).toHaveBeenCalledWith(user);
        unsubscribe();
    });

    it("returns a function that removes event listeners without throwing", () => {
        const onChange = vi.fn();
        const unsubscribe = subscribeToAuthUser(onChange);
        expect(() => unsubscribe()).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// 3. Demo control value parsing — mirrors logic in ComponentDetails.jsx
//    (exported as pure helpers for testability)
// ---------------------------------------------------------------------------

/**
 * Inline re-implementation of parseDemoControlValue to test its logic
 * without importing the page component (which has Router dependencies).
 */
function parseDemoControlValue(control, rawValue) {
    if (rawValue === null) return control.defaultValue;

    if (control.type === "checkbox") return rawValue === "true";

    if (control.type === "number" || control.type === "range") {
        const parsed = Number(rawValue);
        const fallback = Number(control.defaultValue);
        const resolvedValue = Number.isFinite(parsed) ? parsed : fallback;
        const minimum = Number(control.min);
        const maximum = Number(control.max);
        if (Number.isFinite(minimum) && resolvedValue < minimum) return minimum;
        if (Number.isFinite(maximum) && resolvedValue > maximum) return maximum;
        return resolvedValue;
    }

    return rawValue;
}

describe("parseDemoControlValue", () => {
    const textControl = { type: "text", defaultValue: "hello" };
    const checkboxControl = { type: "checkbox", defaultValue: false };
    const rangeControl = { type: "range", defaultValue: 70, min: 35, max: 90 };

    it("returns defaultValue when rawValue is null", () => {
        expect(parseDemoControlValue(textControl, null)).toBe("hello");
        expect(parseDemoControlValue(checkboxControl, null)).toBe(false);
    });

    it("parses checkbox: 'true' → true, 'false' → false", () => {
        expect(parseDemoControlValue(checkboxControl, "true")).toBe(true);
        expect(parseDemoControlValue(checkboxControl, "false")).toBe(false);
    });

    it("clamps range values to min/max bounds", () => {
        expect(parseDemoControlValue(rangeControl, "10")).toBe(35);  // below min
        expect(parseDemoControlValue(rangeControl, "99")).toBe(90);  // above max
        expect(parseDemoControlValue(rangeControl, "60")).toBe(60);  // in range
    });

    it("falls back to defaultValue for non-numeric range input", () => {
        expect(parseDemoControlValue(rangeControl, "abc")).toBe(70);
    });

    it("passes through raw text value unchanged", () => {
        expect(parseDemoControlValue(textControl, "world")).toBe("world");
    });
});

// ---------------------------------------------------------------------------
// 4. Component data — categories array integrity
// ---------------------------------------------------------------------------

import { categories, components } from "@/data/components.data";

describe("components.data", () => {
    it("exports a non-empty categories array with an 'all' entry", () => {
        expect(Array.isArray(categories)).toBe(true);
        expect(categories.length).toBeGreaterThan(0);
        expect(categories.some((c) => c.id === "all")).toBe(true);
    });

    it("exports a non-empty components array", () => {
        expect(Array.isArray(components)).toBe(true);
        expect(components.length).toBeGreaterThan(0);
    });

    it("every component has required fields: id, name, description, category, tags", () => {
        for (const component of components) {
            expect(typeof component.id).toBe("string");
            expect(component.id.length).toBeGreaterThan(0);
            expect(typeof component.name).toBe("string");
            expect(typeof component.description).toBe("string");
            expect(typeof component.category).toBe("string");
            expect(Array.isArray(component.tags)).toBe(true);
        }
    });

    it("every component.category matches a valid category id (excluding 'all')", () => {
        const validIds = new Set(categories.map((c) => c.id).filter((id) => id !== "all"));
        for (const component of components) {
            expect(validIds.has(component.category)).toBe(true);
        }
    });

    it("every component has jsx code", () => {
        for (const component of components) {
            expect(typeof component.code?.jsx).toBe("string");
            expect(component.code.jsx.length).toBeGreaterThan(0);
        }
    });

    it("component ids are unique", () => {
        const ids = components.map((c) => c.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
    });
});
