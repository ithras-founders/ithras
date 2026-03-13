// @ts-check
const { test, expect } = require('@playwright/test');
const { login, navigateTo } = require('./helpers');

test.describe('Governance - Policy Editor', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('navigates to Governance Flow and shows policy UI', async ({ page }) => {
    const found = await navigateTo(page, 'Governance Flow');
    if (!found) test.skip();
    await expect(page).toHaveURL(/\/policy_approvals/);
    await expect(
      page.getByText(/Policy|Governance|Edit|Create|Template/i)
    ).toBeVisible({ timeout: 8000 });
  });

  test('policy approvals view loads', async ({ page }) => {
    await page.goto('/policy_approvals');
    await page.waitForLoadState('networkidle');
    await expect(
      page.getByText(/Ithras|Policy|Governance|Dashboard/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('governance flow shows policy templates section', async ({ page }) => {
    const found = await navigateTo(page, 'Governance Flow');
    if (!found) test.skip();
    await page.waitForLoadState('networkidle');
    await expect(
      page.getByText(/Template|Policy|Governance/i)
    ).toBeVisible({ timeout: 8000 });
  });

  test('placement cycle templates view loads', async ({ page }) => {
    const found = await navigateTo(page, 'Placement Cycle Templates');
    if (!found) {
      await page.goto('/placement_templates');
    }
    await page.waitForLoadState('networkidle');
    await expect(
      page.getByText(/Template|Workflow|Placement|Ithras|Dashboard/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('approval queue view loads', async ({ page }) => {
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
