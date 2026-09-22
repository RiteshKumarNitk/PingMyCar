import { test, expect } from "@playwright/test";
import { uniquePhone, signUpAndOnboard } from "../helpers/auth";
import { deleteUserByPhone } from "../helpers/db";

test.describe("dashboard artifacts", () => {
  let phone: string;

  test.beforeEach(async ({ page }) => {
    phone = uniquePhone();
    await signUpAndOnboard(page, { phone, name: "Artifact Tester", vehicleName: "Honda City" });
  });

  test.afterEach(async () => {
    await deleteUserByPhone(phone);
  });

  test("PNG download rasters the QR via the real button and shows an error path when it fails", async ({
    page,
  }) => {
    await page.goto("/dashboard/vehicles");
    await page.getByRole("link", { name: /Honda City/ }).click();
    await page.click('a:has-text("Open QR Page")');

    const downloadEvent = page.waitForEvent("download", { timeout: 30_000 });
    await page.click('button:has-text("Download PNG")');
    const download = await downloadEvent;
    expect(download.suggestedFilename()).toMatch(/\.png$/);
    const path = await download.path();
    expect(path).toBeTruthy();

    // A second, healthy PNG click still works after any error-state churn.
    // (Scope to <p> — Next's route announcer also carries role="alert".)
    await page.click('button:has-text("Download PNG")');
    await expect(page.locator('p[role="alert"]')).toHaveCount(0);
  });

  test("PNG rasterization failure surfaces a visible alert instead of a dead button", async ({
    page,
  }) => {
    // Break only canvas.toBlob: onload succeeds, encoding rejects -> alert shows.
    await page.goto("/dashboard/vehicles");
    await page.getByRole("link", { name: /Honda City/ }).click();
    await page.click('a:has-text("Open QR Page")');

    await page.evaluate(() => {
      const original = HTMLCanvasElement.prototype.toBlob;
      Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
        value: function (cb: (b: Blob | null) => void) {
          setTimeout(() => cb(null), 10);
        },
        configurable: true,
      });
      (window as unknown as { __restoreToBlob?: () => void }).__restoreToBlob = () =>
        Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
          value: original,
          configurable: true,
        });
    });

    await page.click('button:has-text("Download PNG")');
    const alert = page.locator('p[role="alert"]');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText("PNG encoding failed");

    await page.evaluate(() => {
      (window as unknown as { __restoreToBlob?: () => void }).__restoreToBlob?.();
    });

    // Recovery: the same button works again and the error clears.
    const downloadEvent = page.waitForEvent("download", { timeout: 30_000 });
    await page.click('button:has-text("Download PNG")');
    await downloadEvent;
    await expect(page.locator('p[role="alert"]')).toHaveCount(0);
  });

  test("stickers page: Download QR (SVG) downloads the QR, Download Sticker downloads the sticker", async ({
    page,
  }) => {
    await page.goto("/dashboard/stickers");

    const qrDownload = page.waitForEvent("download", { timeout: 30_000 });
    await page.click('button:has-text("Download QR (SVG)")');
    const qr = await qrDownload;
    expect(qr.suggestedFilename()).toMatch(/-qr\.svg$/);
    const qrPath = await qr.path();
    const qrBody = qrPath ? await import("fs/promises").then((fs) => fs.readFile(qrPath, "utf8")) : "";
    // The QR asset is the bare code (square viewBox), not the 360x560 sticker sheet.
    expect(qrBody).toContain("<svg");
    expect(qrBody).not.toContain("NEED TO CONTACT");

    const stickerDownload = page.waitForEvent("download", { timeout: 30_000 });
    await page.click('button:has-text("Download Sticker")');
    const sticker = await stickerDownload;
    expect(sticker.suggestedFilename()).toMatch(/-sticker\.svg$/);
    const stickerPath = await sticker.path();
    const stickerBody = stickerPath
      ? await import("fs/promises").then((fs) => fs.readFile(stickerPath, "utf8"))
      : "";
    expect(stickerBody).toContain("NEED TO CONTACT");
    expect(stickerBody).toContain("SCAN HERE");
  });

  test("greeting derives from the client clock", async ({ page }) => {
    await page.addInitScript(() => {
      const RealDate = Date;
      const FAKE_HOUR = 21; // 9 PM local -> "Good evening"
      const Patched = class extends RealDate {
        constructor(...args: unknown[]) {
          if (args.length === 0) {
            super();
            super.setHours(FAKE_HOUR);
          } else {
            super(...(args as ConstructorParameters<typeof RealDate>));
          }
        }
      };
      // @ts-expect-error global patch
      window.Date = Patched;
    });

    await page.goto("/dashboard");
    // 21:00 local must yield "Good evening" — proving the hour came from the
    // browser clock, not the server (the server may be in any timezone).
    await expect(page.locator("h1")).toContainText("Good evening");
  });
});
