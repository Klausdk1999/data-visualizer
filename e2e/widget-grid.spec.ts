/**
 * E2E Tests for Widget Grid
 *
 * Covers: widget add button visibility, widget config dialog,
 * and widget type options on the Dashboard tab.
 *
 * Requires seeded data (admin user).
 */

import { test, expect, type Page } from "@playwright/test";

/** Logs in as admin and waits for the sidebar to appear. */
async function loginAsAdmin(page: Page) {
  await page.goto("/");

  await page.locator('input[type="email"]').fill("admin@test.com");
  await page.locator('input[type="password"]').fill("admin123");
  await page.locator('button[type="submit"]').click();

  await expect(page.locator("aside")).toBeVisible({ timeout: 15000 });

  // Dismiss any Next.js dev overlay that may intercept clicks
  await page.evaluate(() => {
    document.querySelectorAll("nextjs-portal").forEach((el) => el.remove());
  });
}

test.describe("Widget Grid", () => {
  test("widget add button is visible on dashboard", async ({ page }) => {
    await loginAsAdmin(page);

    // Ensure we are on the Dashboard tab
    await page.getByRole("button", { name: "Dashboard" }).click();

    // The "+" button for adding widgets should be visible
    const addButton = page.getByRole("button", { name: "+" });
    await expect(addButton).toBeVisible({ timeout: 5000 });
  });

  test("clicking add button opens widget config dialog", async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to Dashboard tab
    await page.getByRole("button", { name: "Dashboard" }).click();

    // Click the "+" button
    await page.getByRole("button", { name: "+" }).click();

    // Wait for the widget config dialog to appear
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
  });

  test("widget config dialog shows widget type options", async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to Dashboard tab
    await page.getByRole("button", { name: "Dashboard" }).click();

    // Open widget config dialog
    await page.getByRole("button", { name: "+" }).click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });

    // Verify widget type options are available in the dialog
    const dialog = page.locator('[role="dialog"]');
    const widgetTypes = ["line_chart", "bar_chart", "gauge"];

    // Check that at least some widget type options are present (as text or select options)
    let foundTypes = 0;
    for (const wt of widgetTypes) {
      const option = dialog.getByText(wt, { exact: false });
      if (await option.isVisible().catch(() => false)) {
        foundTypes++;
      }
    }
    expect(foundTypes).toBeGreaterThan(0);
  });
});
