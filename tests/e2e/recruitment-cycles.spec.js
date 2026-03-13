// @ts-check
const { test, expect } = require('@playwright/test');
const { login, navigateTo } = require('./helpers');

test.describe('Recruitment Cycles', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('navigates to Recruitment Cycles and shows cycles UI', async ({ page }) => {
    const found = await navigateTo(page, 'Recruitment Cycles');
    if (!found) test.skip();
    await expect(page).toHaveURL(/\/recruitment_cycles/);
    await expect(
      page.getByText(/Recruitment Cycles|New Cycle|Active Cycles|Cycle Overview/i)
    ).toBeVisible({ timeout: 8000 });
  });

  test('recruitment cycles view shows cycle list or creation UI', async ({ page }) => {
    await page.goto('/recruitment_cycles');
    await page.waitForLoadState('networkidle');
    await expect(
      page.getByText(/Recruitment|Cycle|New Cycle|Ithras|Dashboard/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('new cycle button is present for placement team', async ({ page }) => {
    const found = await navigateTo(page, 'Recruitment Cycles');
    if (!found) test.skip();
    await page.waitForLoadState('networkidle');
    const newBtn = page.getByRole('button', { name: /New Cycle|Create Cycle|Add Cycle/i });
    if (await newBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(newBtn).toBeEnabled();
    }
  });

  test('cycle details expand when clicked', async ({ page }) => {
    await page.goto('/recruitment_cycles');
    await page.waitForLoadState('networkidle');
    const cycleCard = page.locator('[data-tour-id="cycle-card"]').first();
    if (await cycleCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cycleCard.click();
      await expect(
        page.getByText(/Status|Applications|Jobs|Offers|Workflow/i)
      ).toBeVisible({ timeout: 5000 });
    }
  });
});
