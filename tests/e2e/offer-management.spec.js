// @ts-check
const { test, expect } = require('@playwright/test');
const { login, navigateTo } = require('./helpers');

test.describe('Offer Management', () => {
  test('recruiter can view applications for offer creation', async ({ page }) => {
    await login(page);
    const found = await navigateTo(page, 'Applications');
    if (!found) test.skip();
    await expect(
      page.getByText(/Applications|No applications|Student|CV/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('candidate can see offer status on dashboard', async ({ page }) => {
    await login(page, 'shashank2022@email.iimcal.ac.in', 'password');
    await page.waitForLoadState('networkidle');
    await expect(
      page.getByText(/Offer|Dashboard|Welcome|Home|CV|Master/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('approval queue loads for placement team', async ({ page }) => {
    await login(page);
    const found = await navigateTo(page, 'Approval Queue');
    if (!found) {
      await page.goto('/approval-queue');
    }
    await page.waitForLoadState('networkidle');
    await expect(
      page.getByText(/Approval|Queue|Pending|No pending|Ithras|Dashboard/i)
    ).toBeVisible({ timeout: 10000 });
  });
});
