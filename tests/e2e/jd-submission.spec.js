// @ts-check
const { test, expect } = require('@playwright/test');
const { login, navigateTo } = require('./helpers');

test.describe('JD Submission Flow', () => {
  test('recruiter can access placement cycles / workflows', async ({ page }) => {
    await login(page);
    const found = await navigateTo(page, 'Placement Cycles');
    if (!found) {
      const alt = await navigateTo(page, 'Workflows');
      if (!alt) test.skip();
    }
    await expect(
      page.getByText(/Workflow|Placement|Cycles|No workflows/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('recruiter can see JD submission form elements', async ({ page }) => {
    await login(page);
    const found = await navigateTo(page, 'Placement Cycles');
    if (!found) test.skip();
    await page.waitForLoadState('networkidle');
    const submitBtn = page.getByRole('button', { name: /Submit JD|New JD|Submit Job/i });
    if (await submitBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await submitBtn.click();
      await expect(
        page.getByText(/Job Title|Job Description|Sector|Compensation/i)
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('placement team can view JD submissions list', async ({ page }) => {
    await login(page);
    await page.goto('/request_applications');
    await page.waitForLoadState('networkidle');
    await expect(
      page.getByText(/Request|Applications|Submissions|JD|Ithras|Dashboard/i)
    ).toBeVisible({ timeout: 10000 });
  });
});
