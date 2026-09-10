const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME = 'C:/Users/Administrator/AppData/Local/Google/Chrome/Application/chrome.exe';
const dir = __dirname;
const htmlPath = 'file://' + path.join(dir, 'cards.html').replace(/\\/g, '/');

const outputNames = [
  'xhs-01-cover',
  'xhs-02-premise',
  'xhs-03-hundred-bucks',
  'xhs-04-probability',
  'xhs-05-learn-others',
  'xhs-06-verify',
  'wechat-21x9-cover',
  'wechat-1x1-cover'
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 2400, height: 1600, deviceScaleFactor: 1 });
  await page.goto(htmlPath, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 3000));

  const posters = await page.$$('section.poster');
  if (posters.length !== outputNames.length) {
    console.warn(`WARNING: found ${posters.length} posters but ${outputNames.length} names defined.`);
  }
  for (let i = 0; i < Math.min(posters.length, outputNames.length); i++) {
    const out = path.join(dir, outputNames[i] + '.jpg');
    await posters[i].screenshot({ path: out, type: 'jpeg', quality: 92 });
    console.log('rendered:', outputNames[i] + '.jpg');
  }
  await browser.close();
  console.log('DONE:', Math.min(posters.length, outputNames.length), 'cards rendered');
})().catch(e => { console.error(e); process.exit(1); });
