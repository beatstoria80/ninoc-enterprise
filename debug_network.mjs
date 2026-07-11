import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  page.on('response', async (response) => {
    const status = response.status();
    if (status >= 400) {
      console.log('[' + status + '] ' + response.url());
      try {
        const text = await response.text();
        if (text.includes('3624467860')) {
          console.log('>>> FOUND DIGEST 3624467860 IN THIS RESPONSE!');
        }
      } catch (e) {}
    }
  });
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  console.log('Navigating to https://ninoc.store...');
  try {
    await page.goto('https://ninoc.store', { waitUntil: 'networkidle0', timeout: 30000 });
  } catch (e) {
    console.log('Navigation error:', e);
  }
  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
  console.log('Done.');
})();
