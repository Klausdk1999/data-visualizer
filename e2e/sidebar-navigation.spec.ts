/**
 * E2E Tests for Sidebar Navigation
 *
 * Covers: sidebar visibility, navigation via sidebar items,
 * collapse/expand toggle, and section headers.
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

test.describe("Sidebar Navigation", () => {
  test("sidebar is visible after login", async ({ page }) => {
    await loginAsAdmin(page);

    await expect(page.locator("aside")).toBeVisible();
    // Sidebar header shows "IoT Dashboard"
    await expect(page.locator("aside").getByText("IoT Dashboard")).toBeVisible();
  });

  test("clicking sidebar items navigates via URL query param", async ({ page }) => {
    await loginAsAdmin(page);

    // Click Equipment and verify URL changes
    await page.getByRole("button", { name: "Equipment" }).click();
    await expect(page).toHaveURL(/[?&]tab=equipment/);

    // Click Orders and verify URL changes
    await page.getByRole("button", { name: "Orders" }).click();
    await expect(page).toHaveURL(/[?&]tab=orders/);

    // Click Dashboard and verify URL changes
    await page.getByRole("button", { name: "Dashboard" }).click();
    await expect(page).toHaveURL(/[?&]tab=dashboard/);

    // Click Users and verify URL changes
    await page.getByRole("button", { name: "Users" }).click();
    await expect(page).toHaveURL(/[?&]tab=users/);
  });

  test("sidebar collapse/expand toggle changes width", async ({ page }) => {
    await loginAsAdmin(page);

    const aside = page.locator("aside");

    // Get the initial (expanded) width
    const expandedWidth = await aside.evaluate((el) => el.getBoundingClientRect().width);
    expect(expandedWidth).toBeGreaterThan(100);

    // Find and click the collapse toggle button (has title "Collapse sidebar")
    const collapseToggle = aside.locator('button[title="Collapse sidebar"]');
    await collapseToggle.click();

    // Wait for transition and check that width decreased
    await page.waitForTimeout(500);
    const collapsedWidth = await aside.evaluate((el) => el.getBoundingClientRect().width);
    expect(collapsedWidth).toBeLessThan(expandedWidth);

    // Click toggle again to expand (title changes when collapsed)
    const expandToggle = aside.locator('button[title="Expand sidebar"]');
    await expandToggle.click();
    await page.waitForTimeout(500);
    const reExpandedWidth = await aside.evaluate((el) => el.getBoundingClientRect().width);
    expect(reExpandedWidth).toBeGreaterThan(collapsedWidth);
  });

  test("section headers are visible when sidebar is expanded", async ({ page }) => {
    await loginAsAdmin(page);

    const aside = page.locator("aside");

    await expect(aside.getByText("MONITORING")).toBeVisible();
    await expect(aside.getByText("MES")).toBeVisible();
    await expect(aside.getByText("SETTINGS")).toBeVisible();
  });
});
