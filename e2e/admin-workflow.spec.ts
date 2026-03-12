/**
 * E2E Tests for Admin Workflow
 *
 * Covers: login, tab visibility, service creation, production order creation,
 * user registration, and time entry viewing.
 *
 * Requires seeded data (admin user, products, services, customers, orders, time entries).
 */

import { test, expect, type Page } from "@playwright/test";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/** Logs in as admin and waits for the dashboard to load. */
async function loginAsAdmin(page: Page) {
  await page.goto("/");

  // Fill login form
  await page.locator('input[type="email"]').fill("admin@test.com");
  await page.locator('input[type="password"]').fill("admin123");
  await page.locator('button[type="submit"]').click();

  // Wait for dashboard to fully load (the header title is always visible after login)
  await expect(page.getByText("IoT Data Storage Dashboard")).toBeVisible({
    timeout: 15000,
  });

  // Dismiss any Next.js dev overlay that may intercept clicks
  await page.evaluate(() => {
    document.querySelectorAll('nextjs-portal').forEach(el => el.remove());
  });
}

test.describe("Admin Workflow", () => {
  test("admin can login and see all tabs", async ({ page }) => {
    await loginAsAdmin(page);

    // Verify main tab buttons are visible
    await expect(page.getByRole("button", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Orders" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Hours" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Products" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Materials" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Settings" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Users" })).toBeVisible();
  });

  test("admin can create a new service", async ({ page }) => {
    await loginAsAdmin(page);

    // Open Settings dropdown and click Services
    await page.getByRole("button", { name: "Settings" }).click();
    await page.getByRole("button", { name: "Services" }).click();

    // Wait for the Services tab to load
    await expect(page.getByText("Add Service")).toBeVisible({ timeout: 5000 });

    // Click Add Service button
    await page.getByRole("button", { name: "Add Service" }).click();

    // Wait for dialog to appear
    await expect(page.getByText("Create Service")).toBeVisible({ timeout: 5000 });

    // Fill the form
    await page.locator("#service-code").fill("SVC-TEST");
    await page.locator("#service-name").fill("Test Service");

    // Submit and wait for API response
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes("/services") && resp.request().method() === "POST"
    );
    await page.getByRole("button", { name: "Save" }).click();
    await responsePromise;

    // Wait for dialog to close and table to refresh
    await page.waitForTimeout(1000);

    // Verify the new service appears in the table
    await expect(page.getByRole("cell", { name: "SVC-TEST" })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("cell", { name: "Test Service" })).toBeVisible();
  });

  test("admin can create a production order", async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to Orders tab
    await page.getByRole("button", { name: "Orders" }).click();

    // Wait for the Orders tab to load
    await expect(page.getByText("Add Order")).toBeVisible({ timeout: 5000 });

    // Click Add Order button
    await page.getByRole("button", { name: "Add Order" }).click();

    // Wait for dialog to appear
    await expect(page.getByText("Create Order")).toBeVisible({ timeout: 5000 });

    // Select the first product from the dropdown
    await page.locator("#order-product").selectOption({ index: 1 });

    // Fill quantity
    await page.locator("#order-quantity").fill("25");

    // Fill customer name
    await page.locator("#order-customer").fill("Test Customer");

    // Submit and wait for API response
    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes("/production-orders") && resp.request().method() === "POST"
    );
    await page.getByRole("button", { name: "Save" }).click();
    await responsePromise;

    // Wait for dialog to close and table to refresh
    await page.waitForTimeout(1000);

    // Verify the new order appears — check for quantity and customer in table
    await expect(page.getByText("Test Customer")).toBeVisible({ timeout: 5000 });
  });

  test("admin can register a new worker", async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to Users tab
    await page.getByRole("button", { name: "Users" }).click();

    // Wait for the Users tab to load
    await expect(page.getByText("Add User")).toBeVisible({ timeout: 5000 });

    // Click Add User button
    await page.getByRole("button", { name: "Add User" }).click();

    // Wait for dialog to appear
    await expect(page.getByText("Create User")).toBeVisible({ timeout: 5000 });

    // Fill the form
    await page.locator("#user-name").fill("New Worker");
    await page.locator("#user-email").fill("newworker@test.com");
    await page.locator("#user-password").fill("pass123");
    await page.locator("#user-type").selectOption("worker");

    // Submit and wait for API response
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes("/users") && resp.request().method() === "POST"
    );
    await page.getByRole("button", { name: "Save" }).click();
    await responsePromise;

    // Wait for dialog to close and table to refresh
    await page.waitForTimeout(1000);

    // Verify the new user appears in the table
    await expect(page.getByRole("cell", { name: "New Worker" })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("cell", { name: "newworker@test.com" })).toBeVisible();
  });

  test("admin can view all time entries", async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to Hours tab
    await page.getByRole("button", { name: "Hours" }).click({ timeout: 10000 });

    // Wait for the Hours tab to load
    await expect(page.getByText("Hours Worked")).toBeVisible({ timeout: 5000 });

    // Verify that the table has entries (at least one row with data)
    const rows = page.locator("table tbody tr");
    await expect(rows.first()).toBeVisible({ timeout: 5000 });
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    // Verify that entries from Maria Santos are visible
    await expect(page.getByText("Maria Santos").first()).toBeVisible();
  });
});
