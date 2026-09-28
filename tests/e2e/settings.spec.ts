import { test, expect } from "@playwright/test";
import { signInWithGoogleAndOnboard, type TestOwner } from "../helpers/auth";
import { deleteUserById } from "../helpers/db";

test.describe("settings", () => {
  let owner: TestOwner | undefined;

  test.afterEach(async () => {
    await deleteUserById(owner?.userId);
    owner = undefined;
  });

  test("identity changes persist; settings shows the Google email and no phone login", async ({ page }) => {
    owner = await signInWithGoogleAndOnboard(page, { name: "Alex Owner", vehicleName: "Honda City" });

    // Identity lives on Profile; email lives on Settings.
    await page.goto("/dashboard/profile");
    await expect(page.locator("#settingsName")).toHaveValue("Alex Owner");

    await page.fill("#settingsPreferredName", "AO");
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/auth/update-user")),
      page.click('form:has(#settingsName) button:has-text("Save")'),
    ]);
    await page.reload();
    await expect(page.locator("#settingsPreferredName")).toHaveValue("AO");

    await page.goto("/dashboard/settings");
    await expect(page.locator("#settingsEmail")).toHaveValue(owner.email);
    await expect(page.locator("#settingsPhone")).toHaveCount(0);
    await expect(page.getByText("Used to log in with a one-time code")).toHaveCount(0);
  });

  test("contact profile shows read-only identity with a link to Profile, not editable inputs", async ({ page }) => {
    owner = await signInWithGoogleAndOnboard(page, { name: "Alex Owner", vehicleName: "Honda City" });
    await page.goto("/dashboard/vehicles");
    await page.getByRole("link", { name: /Honda City/ }).click();
    await page.click('a:has-text("Edit contact profile")');
    await expect(page.locator("#displayName")).toHaveCount(0);
    await expect(page.locator('a:has-text("Edit in Settings")')).toBeVisible();
    await expect(page.locator("body")).toContainText("Alex Owner");
  });
});
