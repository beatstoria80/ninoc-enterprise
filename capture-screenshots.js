const { chromium } = require('playwright');

async function takeScreenshot(url, filename, viewport = { width: 1440, height: 900 }) {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewportSize(viewport);

  console.log(`Navigating to ${url}...`);
  const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  if (!response || response.status() >= 400) {
    console.log(`Failed to load ${url} - status: ${response?.status()}`);
    await browser.close();
    return;
  }

  // Wait a bit for any animations/fonts
  await page.waitForTimeout(2000);

  await page.screenshot({ path: filename, fullPage: false });
  console.log(`Screenshot saved: ${filename}`);

  await browser.close();
}

async function main() {
  console.log('Starting screenshot capture...\n');

  // 1. Admin page - Placeholder tab
  console.log('--- 1. Admin / Placeholder Tab ---');
  await takeScreenshot('http://localhost:3000/admin#placeholder', 'screenshot_admin_placeholder.png');

  // 2. Admin page - Messages tab with Template button
  console.log('\n--- 2. Admin / Support Chat with Template Button ---');
  await takeScreenshot('http://localhost:3000/admin#messages', 'screenshot_admin_messages.png');

  // 3. Customer /profile/returns
  console.log('\n--- 3. Customer Return Tracker ---');
  await takeScreenshot('http://localhost:3000/profile/returns', 'screenshot_returns_page.png');

  // 4. Customer profile page with Return Tracker card
  console.log('\n--- 4. Customer Profile with Return Tracker ---');
  await takeScreenshot('http://localhost:3000/profile', 'screenshot_profile_card.png');

  console.log('\nAll screenshots captured!');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});