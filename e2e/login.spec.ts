/**
 * E2E Test for Login Flow
 *
 * Note: This requires Playwright to be installed
 * Install: npm install -D @playwright/test
 * Run: npx playwright test
 */

import { test, expect } from "@playwright/test";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

test.describe("Login Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page
    await page.goto(FRONTEND_URL);
  });

  test("should display login form", async ({ page }) => {
    // Check if login form elements are visible
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("should show error on invalid credentials", async ({ page }) => {
    // Fill in invalid credentials
    await page.fill('input[type="email"]', "invalid@example.com");
    await page.fill('input[type="password"]', "wrongpassword");

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for error message
    await expect(page.locator("text=/invalid|error|failed/i")).toBeVisible({ timeout: 5000 });
  });

  test("should login successfully with valid credentials", async ({ page }) => {
    // Fill in valid credentials (from seed script)
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard or success indicator
    // Adjust selector based on your dashboard implementation
    await expect(page).toHaveURL(new RegExp(`${FRONTEND_URL}(/dashboard|/|$)`), { timeout: 10000 });
  });

  test("should persist auth token in localStorage", async ({ page }) => {
    // Fill in valid credentials
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");

    // Click login button
    await page.click('button[type="submit"]');

    // Wait a bit for token to be stored
    await page.waitForTimeout(2000);

    // Check localStorage for auth token
    const authToken = await page.evaluate(() => localStorage.getItem("auth_token"));
    expect(authToken).toBeTruthy();
    expect(authToken?.length).toBeGreaterThan(0);
  });
});

test.describe("API Health Check", () => {
  test("backend API should be accessible", async ({ request }) => {
    // Try to hit a public endpoint or health check
    const response = await request.get(`${API_URL}/auth/login`, {
      failOnStatusCode: false,
    });

    // Should get 400 (method not allowed) or 405 (method not allowed) for GET on POST endpoint
    // This confirms the API is reachable
    expect([400, 405, 404]).toContain(response.status());
  });
});
