/**
 * E2E Tests for Worker Workflow
 *
 * Covers: login, restricted tab visibility, read-only services,
 * read-only orders, time entry creation, and own-entries-only filtering.
 *
 * Requires seeded data (worker user Maria Santos, services, production orders, time entries).
 */

import { test, expect, type Page } from "@playwright/test";

/** Logs in as worker and waits for the dashboard to load. */
async function loginAsWorker(page: Page) {
  await page.goto("/");

  // Fill login form
  await page.locator('input[type="email"]').fill("worker@test.com");
  await page.locator('input[type="password"]').fill("worker123");
  await page.locator('button[type="submit"]').click();

  // Wait for dashboard to fully load
  await expect(page.getByText("IoT Data Storage Dashboard")).toBeVisible({
    timeout: 15000,
  });

  // Dismiss any Next.js dev overlay that may intercept clicks
  await page.evaluate(() => {
    document.querySelectorAll('nextjs-portal').forEach(el => el.remove());
  });
}

test.describe("Worker Workflow", () => {
  test("worker can login and sees restricted tabs", async ({ page }) => {
    await loginAsWorker(page);

    // Verify allowed tabs are visible
    await expect(page.getByRole("button", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Orders" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Hours" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Services" })).toBeVisible();

    // Verify restricted tabs are NOT visible
    await expect(page.getByRole("button", { name: "Products" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Materials" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Users" })).not.toBeVisible();

    // Settings dropdown should NOT be visible for workers
    await expect(page.getByRole("button", { name: "Settings" })).not.toBeVisible();
  });

  test("worker can view services read-only", async ({ page }) => {
    await loginAsWorker(page);

    // Click Services tab (directly visible for workers, not inside Settings)
    await page.getByRole("button", { name: "Services" }).click();

    // Wait for the Services tab to load (use role to avoid strict mode with multiple "Services" matches)
    await expect(page.getByRole("heading", { name: "Services" })).toBeVisible({ timeout: 5000 });

    // Verify seeded services appear in the table (exact: true to avoid matching description cells)
    await expect(page.getByRole("cell", { name: "Assembly", exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("cell", { name: "Quality Control", exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Packaging", exact: true })).toBeVisible();

    // Verify no "Add Service" button is visible
    await expect(page.getByRole("button", { name: "Add Service" })).not.toBeVisible();

    // Verify no Edit or Delete buttons in table rows
    await expect(page.getByRole("button", { name: "Edit" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Delete" })).not.toBeVisible();
  });

  test("worker can view orders but not create/edit", async ({ page }) => {
    await loginAsWorker(page);

    // Navigate to Orders tab
    await page.getByRole("button", { name: "Orders" }).click();

    // Wait for the Orders tab content to load
    const rows = page.locator("table tbody tr");
    await expect(rows.first()).toBeVisible({ timeout: 10000 });

    // Verify seeded production orders are visible
    await expect(page.getByText("Steel Bracket").first()).toBeVisible();
    await expect(page.getByText("Aluminum Frame").first()).toBeVisible();

    // Verify no "Add Order" button is visible for workers
    await expect(page.getByRole("button", { name: "Add Order" })).not.toBeVisible();
  });

  test("worker can add a time entry", async ({ page }) => {
    await loginAsWorker(page);

    // Navigate to Hours tab
    await page.getByRole("button", { name: "Hours" }).click();

    // Wait for the Hours tab to load
    await expect(page.getByText("Hours Worked")).toBeVisible({ timeout: 5000 });

    // Click Add Entry button
    await page.getByRole("button", { name: "Add Entry" }).click();

    // Wait for dialog to appear
    await expect(page.getByText("Create Entry")).toBeVisible({ timeout: 5000 });

    // Worker should NOT see the user/worker dropdown (auto-filled)
    await expect(page.locator("#entry-user")).not.toBeVisible();

    // Select first available production order
    await page.locator("#entry-order").selectOption({ index: 1 });

    // Select Assembly service (label format is "CODE - Name")
    await page.locator("#entry-service").selectOption({ label: "SVC-001 - Assembly" });

    // Fill day with today's date
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    await page.locator("#entry-day").fill(today);

    // Fill start and end times
    await page.locator("#entry-start").fill("14:00");
    await page.locator("#entry-end").fill("17:00");

    // Fill observations
    await page.locator("#entry-observations").fill("Afternoon assembly shift");

    // Submit and wait for API response
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes("/time-entries") && resp.request().method() === "POST"
    );
    await page.getByRole("button", { name: "Save" }).click();
    await responsePromise;

    // Wait for dialog to close and table to refresh
    await page.waitForTimeout(1000);

    // Verify the new entry appears in the table
    await expect(page.getByText("Afternoon assembly shift").first()).toBeVisible({ timeout: 5000 });
  });

  test("worker sees only their own time entries", async ({ page }) => {
    await loginAsWorker(page);

    // Navigate to Hours tab
    await page.getByRole("button", { name: "Hours" }).click();

    // Wait for the Hours tab to load
    await expect(page.getByText("Hours Worked")).toBeVisible({ timeout: 5000 });

    // Wait for table rows to appear
    const rows = page.locator("table tbody tr");
    await expect(rows.first()).toBeVisible({ timeout: 5000 });

    // Get the count of rows
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    // Verify every row has "Maria Santos" as the worker name
    for (let i = 0; i < rowCount; i++) {
      const workerCell = rows.nth(i).locator("td").nth(2); // Worker is the 3rd column
      await expect(workerCell).toHaveText("Maria Santos");
    }
  });
});
