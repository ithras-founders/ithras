/**
 * One-off script to navigate, login, go to tutorials, and capture screenshots.
 * Run: node tests/e2e/screenshot-tutorials.js
 * Requires: npx playwright install chromium (if not already installed)
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

async function main() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  try {
    // Step 1: Navigate to home
    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'step1-home.png'), fullPage: true });
    console.log('Screenshot saved: step1-home.png');

    // Check if login form is visible
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="mail" i]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const signInBtn = page.getByRole('button', { name: /sign in|login/i }).first();

    const hasLogin = await emailInput.isVisible().catch(() => false);

    if (hasLogin) {
      console.log('Login form detected. Logging in...');
      await emailInput.fill('shashank@ithraslabs.in');
      await passwordInput.fill('test123');
      await signInBtn.click();
      await page.waitForURL(/\/(dashboard|tutorials)?(\?.*)?$/, { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(2000); // Let the page settle
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'step2-after-login.png'), fullPage: true });
      console.log('Screenshot saved: step2-after-login.png');
    } else {
      console.log('No login form - may already be logged in.');
    }

    // Step 3: Navigate to tutorials
    console.log('Navigating to /tutorials...');
    await page.goto('http://localhost:3000/tutorials', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'step3-tutorials.png'), fullPage: true });
    console.log('Screenshot saved: step3-tutorials.png');

    // Check for error boundary or white screen
    const bodyText = await page.locator('body').innerText().catch(() => '');
    const hasError = bodyText.includes('Something went wrong') || bodyText.includes('Error') || bodyText.includes('error');
    const hasTutorials = bodyText.toLowerCase().includes('tutorial') || bodyText.includes('Getting Started');

    console.log('\n--- Summary ---');
    console.log('Page has error text:', hasError);
    console.log('Page has tutorials content:', hasTutorials);
    console.log('Screenshots saved to:', SCREENSHOT_DIR);
  } catch (err) {
    console.error('Error:', err.message);
    try {
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'error-state.png'), fullPage: true });
      console.log('Error screenshot saved: error-state.png');
    } catch (_) { /* screenshot may fail if page closed */ }
  } finally {
    await browser.close();
  }
}

main();
