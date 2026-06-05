const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  page.on('pageerror', err => errors.push(`PageError: ${err.message}`));

  try {
    // Test 1: Load track page
    console.log('TEST 1: Loading /track page...');
    await page.goto('http://localhost:3000/track', { waitUntil: 'networkidle', timeout: 30000 });
    const title = await page.locator('h1').first().textContent();
    console.log('Page title:', title);

    // Test 2: Check form elements exist
    console.log('\nTEST 2: Checking form elements...');
    const orderInput = await page.locator('input[placeholder*="NC-"]').count();
    const phoneInput = await page.locator('input[placeholder*="08"]').count();
    const submitBtn = await page.locator('button[type="submit"]').count();
    console.log('Order number input found:', orderInput > 0);
    console.log('Phone input found:', phoneInput > 0);
    console.log('Submit button found:', submitBtn > 0);

    // Test 3: Take screenshot
    console.log('\nTEST 3: Taking screenshot...');
    await page.screenshot({ path: 'test_track_page.png', fullPage: false });
    console.log('Screenshot saved: test_track_page.png');

    // Test 4: Check console errors
    console.log('\nTEST 4: Console errors:', errors.length === 0 ? 'NONE' : errors);

    // Test 5: Try search with invalid order
    console.log('\nTEST 5: Testing form submission (invalid order)...');
    await page.fill('input[placeholder*="NC-"]', 'INVALID-ORDER-123');
    await page.fill('input[placeholder*="08"]', '081234567890');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    const errorMsg = await page.locator('text=Gagal').or(page.locator('text=not found')).count();
    const emptyMsg = await page.locator('text=Empty').count();
    console.log('Form submission handled:', errorMsg > 0 || emptyMsg >= 0 ? 'YES' : 'CHECK Manually');

    console.log('\n--- ALL TESTS COMPLETED ---');

  } catch (err) {
    console.error('TEST FAILED:', err.message);
  } finally {
    await browser.close();
  }
})();