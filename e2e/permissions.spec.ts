import { test, expect, Page } from "@playwright/test";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * Login helper: fills the login form, submits, waits for navigation,
 * and returns the auth token from localStorage.
 */
async function login(
  page: Page,
  email: string,
  password: string
): Promise<string> {
  await page.goto("/");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for successful navigation away from login
  await page.waitForTimeout(3000);

  // Dismiss any Next.js dev overlay that may intercept clicks
  await page.evaluate(() => {
    document.querySelectorAll('nextjs-portal').forEach(el => el.remove());
  });

  const token = await page.evaluate(() =>
    localStorage.getItem("auth_token")
  );
  expect(token).toBeTruthy();
  return token as string;
}

test.describe("Permission Enforcement", () => {
  test("worker cannot see admin-only tabs", async ({ page }) => {
    await login(page, "worker@test.com", "worker123");

    // Admin-only tabs should NOT be visible
    await expect(
      page.locator('button:has-text("Users"), [role="tab"]:has-text("Users")')
    ).not.toBeVisible();
    await expect(
      page.locator(
        'button:has-text("Products"), [role="tab"]:has-text("Products")'
      )
    ).not.toBeVisible();
    await expect(
      page.locator(
        'button:has-text("Materials"), [role="tab"]:has-text("Materials")'
      )
    ).not.toBeVisible();

    // Settings dropdown should not be visible
    await expect(
      page.locator(
        'button:has-text("Settings"), [role="tab"]:has-text("Settings")'
      )
    ).not.toBeVisible();
  });

  test("worker gets 403 on admin-only API endpoints", async ({
    page,
    request,
  }) => {
    const token = await login(page, "worker@test.com", "worker123");

    const headers = { Authorization: `Bearer ${token}` };

    // POST /services
    const servicesRes = await request.post(`${API_URL}/services`, {
      headers,
      data: { name: "Unauthorized Service", description: "Should fail" },
    });
    expect(servicesRes.status()).toBe(403);

    // GET /users
    const usersRes = await request.get(`${API_URL}/users`, { headers });
    expect(usersRes.status()).toBe(403);

    // POST /products
    const productsRes = await request.post(`${API_URL}/products`, {
      headers,
      data: { name: "Unauthorized Product", description: "Should fail" },
    });
    expect(productsRes.status()).toBe(403);

    // DELETE /services/1
    const deleteRes = await request.delete(`${API_URL}/services/1`, {
      headers,
    });
    expect(deleteRes.status()).toBe(403);
  });

  test("worker can only access own time entries via API", async ({
    page,
    request,
  }) => {
    const token = await login(page, "worker@test.com", "worker123");

    const user = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("user") || "{}")
    );
    expect(user.id).toBeTruthy();

    const headers = { Authorization: `Bearer ${token}` };
    const response = await request.get(`${API_URL}/time-entries`, { headers });
    expect(response.ok()).toBeTruthy();

    const entries = await response.json();

    // Every returned entry must belong to the worker
    if (Array.isArray(entries) && entries.length > 0) {
      for (const entry of entries) {
        expect(entry.user_id).toBe(user.id);
      }
    }
  });

  test("admin has full API access", async ({ page, request }) => {
    const token = await login(page, "admin@test.com", "admin123");

    const headers = { Authorization: `Bearer ${token}` };

    // GET /users
    const usersRes = await request.get(`${API_URL}/users`, { headers });
    expect(usersRes.status()).toBe(200);

    // GET /services
    const servicesRes = await request.get(`${API_URL}/services`, { headers });
    expect(servicesRes.status()).toBe(200);

    // GET /time-entries — admin sees all entries, not just their own
    const timeEntriesRes = await request.get(`${API_URL}/time-entries`, {
      headers,
    });
    expect(timeEntriesRes.status()).toBe(200);

    // GET /production-orders
    const ordersRes = await request.get(`${API_URL}/production-orders`, {
      headers,
    });
    expect(ordersRes.status()).toBe(200);
  });

  test("admin can see all tabs", async ({ page }) => {
    await login(page, "admin@test.com", "admin123");

    const tabNames = [
      "Dashboard",
      "Orders",
      "Hours",
      "Products",
      "Materials",
      "Settings",
      "Users",
    ];

    for (const name of tabNames) {
      await expect(
        page.locator(
          `button:has-text("${name}"), [role="tab"]:has-text("${name}")`
        )
      ).toBeVisible();
    }
  });
});
