import { test, expect } from "@playwright/test";
import { hasRealName } from "@/lib/auth/identity";

test.describe("hasRealName", () => {
  test("false when name equals the phone number (never-set placeholder from phone signup)", () => {
    expect(hasRealName("+15551234567", "+15551234567")).toBe(false);
  });

  test("false for empty or whitespace-only names", () => {
    expect(hasRealName("   ", null)).toBe(false);
    expect(hasRealName(null, null)).toBe(false);
    expect(hasRealName(undefined, undefined)).toBe(false);
  });

  test("true for a real name distinct from the phone number", () => {
    expect(hasRealName("Alex Owner", "+15551234567")).toBe(true);
  });

  test("true for a real name with no phone on file (e.g. Google signup)", () => {
    expect(hasRealName("Alex Owner", null)).toBe(true);
  });
});
