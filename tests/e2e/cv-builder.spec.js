// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('CV Builder', () => {
  test('login as candidate and load CV Builder', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/email/i).fill('shashank2022@email.iimcal.ac.in');
    await page.getByLabel(/password/i).fill('password');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await page.waitForURL(/\//, { timeout: 5000 });
    await expect(page.getByText(/Master CV|CV Builder|Home|Dashboard/i)).toBeVisible({ timeout: 10000 });
  });
});
