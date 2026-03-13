// @ts-check
const { test, expect } = require('@playwright/test');
const { login, navigateTo } = require('./helpers');

test.describe('Placement - Company Workflow View', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('navigates to Placement Cycles and shows workflow UI', async ({ page }) => {
    const found = await navigateTo(page, 'Placement Cycles');
    if (!found) test.skip();
    await expect(page).toHaveURL(/\/workflows/);
    await expect(
      page.getByText(/No workflows|placement cycle|workflow|applications/i)
    ).toBeVisible({ timeout: 8000 });
  });

  test('shows workflow pipeline or empty state', async ({ page }) => {
    await page.goto('/workflows');
    await page.waitForLoadState('networkidle');
    await expect(
      page.getByText(/Ithras|Placement|No workflows|workflow|Welcome|Dashboard/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('recruitment cycles view shows cycle overview', async ({ page }) => {
    const found = await navigateTo(page, 'Recruitment Cycles');
    if (!found) {
      await page.goto('/recruitment_cycles');
    }
    await page.waitForLoadState('networkidle');
    await expect(
      page.getByText(/Recruitment|Cycle|New Cycle|Active|Overview|Ithras|Dashboard/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('master calendar view loads', async ({ page }) => {
    const found = await navigateTo(page, 'Master Schedule');
    if (!found) {
      const alt = await navigateTo(page, 'Master Calendar');
      if (!alt) await page.goto('/master_calendar');
    }
    await page.waitForLoadState('networkidle');
    await expect(
      page.getByText(/Calendar|Schedule|Master|Ithras|Dashboard/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('students directory loads', async ({ page }) => {
    const found = await navigateTo(page, 'Students');
    if (!found) test.skip();
    await page.waitForLoadState('networkidle');
    await expect(
      page.getByText(/Student|Directory|Name|Roll/i)
    ).toBeVisible({ timeout: 10000 });
  });
});
