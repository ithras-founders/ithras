// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Login flow', () => {
  test('shows Ithras branding on login page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Ithras/i)).toBeVisible();
  });

  test('can sign in with email and password', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/email/i).fill('shashank@ithraslabs.in');
    await page.getByLabel(/password/i).fill('password');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/(dashboard)?$/);
    await expect(page.getByText(/Ithras|Welcome|Dashboard/i)).toBeVisible();
  });
});
