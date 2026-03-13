/**
 * Shared E2E helpers for Playwright tests.
 */

/**
 * Login helper — navigates to login page, fills credentials, and waits for dashboard.
 */
async function login(page, email = 'shashank@ithraslabs.in', password = 'password') {
  await page.goto('/');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /Sign in/i }).click();
  await page.waitForURL(/\/(dashboard)?$/, { timeout: 15000 });
}

/**
 * Seed test data via the simulator API.  Returns the generated data object.
 */
async function seedTestData(request, baseURL) {
  const url = `${baseURL || 'http://localhost:3000'}/api/v1/simulator/generate`;
  const resp = await request.post(url, {
    data: {
      num_colleges: 1,
      num_students_per_college: 3,
      num_companies: 2,
      num_recruiters_per_company: 1,
      num_placement_team_per_college: 1,
      num_cycles: 1,
      num_jobs_per_company: 1,
      max_applications_per_student: 1,
    },
  });
  if (resp.ok()) {
    return await resp.json();
  }
  return null;
}

/**
 * Navigate to a sidebar item by name.
 */
async function navigateTo(page, label) {
  const btn = page.getByRole('button', { name: new RegExp(label, 'i') }).or(
    page.getByText(label).first()
  );
  if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await btn.click();
    return true;
  }
  return false;
}

module.exports = { login, seedTestData, navigateTo };
