import { describe, expect, it } from "vitest";
import { canAccessAddComponent } from "./authAccess";

describe("authAccess role checks", () => {
  it("allows add-component access for developer and verified users", () => {
    expect(canAccessAddComponent({ role: "developer", isVerifiedDeveloper: false })).toBe(true);
    expect(canAccessAddComponent({ role: "user", isVerifiedDeveloper: true })).toBe(true);
    expect(canAccessAddComponent({ role: "admin", isVerifiedDeveloper: false })).toBe(true);
  });

  it("blocks add-component access for regular users", () => {
    expect(canAccessAddComponent({ role: "user", isVerifiedDeveloper: false })).toBe(false);
    expect(canAccessAddComponent(null)).toBe(false);
  });
});
