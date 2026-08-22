const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const dir = __dirname;
  const htmlPath = path.join(dir, 'cards.html');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
  });
  const page = await browser.newPage();

  // Set a large viewport to cover all poster sizes
  await page.setViewport({ width: 2100, height: 1440, deviceScaleFactor: 1 });

  await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 3000));

  const posters = await page.$$('.poster');
  const names = [
    'xhs-01-cover',
    'xhs-02-misconception-redefine',
    'xhs-03-my-story',
    'xhs-04-annotation-quote',
    'xhs-05-chase-brilliance',
    'xhs-06-closing-interact',
    'wechat-21x9-cover',
    'wechat-1x1-cover'
  ];

  for (let i = 0; i < posters.length; i++) {
    const out = path.join(dir, names[i] + '.png');
    await posters[i].screenshot({ path: out });
    console.log('rendered:', names[i]);
  }

  await browser.close();
  console.log('DONE: 8 cards rendered');
})().catch(e => { console.error('RENDER_ERROR:', e.message, e.stack); process.exit(1); });
