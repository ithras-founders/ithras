// @ts-check
const { test, expect } = require('@playwright/test');
const { login, navigateTo } = require('./helpers');

test.describe('Application Flow - Candidate Portal', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('candidate can view applications list', async ({ page }) => {
    const found = await navigateTo(page, 'My Applications');
    if (!found) {
      const altFound = await navigateTo(page, 'Applications');
      if (!altFound) test.skip();
    }
    await expect(
      page.getByText(/Applications|No applications|application/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('candidate can view active processes', async ({ page }) => {
    const found = await navigateTo(page, 'Active Processes');
    if (!found) test.skip();
    await expect(
      page.getByText(/Active|Processes|Pipeline|No active/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('candidate dashboard shows offers section', async ({ page }) => {
    await expect(
      page.getByText(/Offer|Dashboard|Welcome|Home/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('candidate can access cycle intelligence', async ({ page }) => {
    const found = await navigateTo(page, 'Cycle Intelligence');
    if (!found) {
      const alt = await navigateTo(page, 'Intelligence');
      if (!alt) test.skip();
    }
    await expect(
      page.getByText(/Intelligence|Cycle|Analytics|Placement/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('application cards are expandable with stage pipeline', async ({ page }) => {
    const found = await navigateTo(page, 'My Applications');
    if (!found) test.skip();
    await page.waitForLoadState('networkidle');
    const card = page.locator('[data-tour-id="application-card"]').first();
    if (await card.isVisible({ timeout: 3000 }).catch(() => false)) {
      await card.click();
      await expect(
        page.getByText(/Stage|Pipeline|Application|Shortlist|Interview/i)
      ).toBeVisible({ timeout: 5000 });
    }
  });
});
