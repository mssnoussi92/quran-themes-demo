const { chromium } = require('playwright');
(async () => {
  const dir = process.argv[2];
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1920 }, deviceScaleFactor: 1 });
  for (const name of process.argv.slice(3)) {
    await page.goto(`file://${dir}/${name}.html`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => window.drawn !== false);   // a page that draws with its own script says when it is done
    await page.waitForTimeout(300);
    await page.locator('.f').screenshot({ path: `${dir}/${name}.png` });
  }
  await browser.close();
})();
