import { test, expect } from "@playwright/test";
import { tempEmailFor, isTempEmail, TEMP_EMAIL_DOMAIN } from "@/lib/auth/tempEmail";

test.describe("temp email", () => {
  test("tempEmailFor strips non-digits and appends the reserved, non-deliverable domain", () => {
    expect(tempEmailFor("+1 (555) 123-4567")).toBe(`15551234567@${TEMP_EMAIL_DOMAIN}`);
  });

  test("isTempEmail recognizes a generated temp email", () => {
    expect(isTempEmail(tempEmailFor("+15551234567"))).toBe(true);
  });

  test("isTempEmail is false for a real email", () => {
    expect(isTempEmail("demo@vehiclecontact.test")).toBe(false);
  });
});
