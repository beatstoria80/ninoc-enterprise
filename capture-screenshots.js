const { chromium } = require('playwright');

async function takeScreenshot(url, filename, actions, waitFor, viewport = { width: 1440, height: 900 }) {
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

  // Run actions (array of {click, wait, scroll})
  if (actions) {
    for (const action of actions) {
      if (action.click) {
        console.log(`  Clicking: ${action.click}`);
        await page.click(action.click);
        await page.waitForTimeout(action.wait || 800);
      }
      if (action.scroll) {
        await page.evaluate((sel) => {
          const el = document.querySelector(sel);
          if (el) el.scrollIntoView();
        }, action.scroll);
        await page.waitForTimeout(500);
      }
    }
  }

  if (waitFor) {
    await page.waitForSelector(waitFor, { timeout: 10000 }).catch(() =>
      console.log(`  Could not find: ${waitFor}`)
    );
  }

  await page.waitForTimeout(1500);
  await page.screenshot({ path: filename, fullPage: false });
  console.log(`  Saved: ${filename}`);

  await browser.close();
}

async function main() {
  console.log('Starting screenshot capture...\n');

  // 1. Admin - Placeholder tab (already confirmed good)
  console.log('--- 1. Admin / Placeholder Tab ---');
  await takeScreenshot(
    'http://localhost:3000/admin',
    'screenshot_admin_placeholder.png',
    [{ click: 'text=Placeholder', wait: 1200 }],
    'text=PLACEHOLDER'
  );

  // 2. Admin - Support Chat with Template button (need to select a session)
  console.log('\n--- 2. Admin / Support Chat with Template Button ---');
  await takeScreenshot(
    'http://localhost:3000/admin',
    'screenshot_admin_messages.png',
    [
      { click: 'text=Support Chat', wait: 800 },
      // Click first chat session to open chat area
      { click: '.group >> nth=0', wait: 1200 },
    ],
    'text=Customer Inquiries'
  );

  // 3. Customer /profile/returns
  console.log('\n--- 3. Customer Return Tracker ---');
  await takeScreenshot(
    'http://localhost:3000/profile/returns',
    'screenshot_returns_page.png',
    null,
    'text=Return Tracker'
  );

  // 4. Customer profile page
  console.log('\n--- 4. Customer Profile ---');
  await takeScreenshot(
    'http://localhost:3000/profile',
    'screenshot_profile_card.png',
    null,
    'text=Return Tracker'
  );

  console.log('\nAll screenshots captured!');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});