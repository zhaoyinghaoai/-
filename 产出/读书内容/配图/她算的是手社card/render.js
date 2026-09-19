const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME = 'C:/Users/Administrator/AppData/Local/Google/Chrome/Application/chrome.exe';
const DIR = __dirname;
const htmlPath = 'file:///' + path.join(DIR, 'cards.html').replace(/\\/g, '/');

const outputNames = [
  'xhs-01-cover',
  'xhs-02-pot',
  'xhs-03-account',
  'xhs-04-mill',
  'xhs-05-rice',
  'xhs-06-column',
  'wechat-21x9-cover',
  'wechat-1x1-cover'
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--force-device-scale-factor=1', '--font-render-hinting=none']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 2400, height: 1600, deviceScaleFactor: 1 });
  await page.goto(htmlPath, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 3000));

  const posters = await page.$$('section.poster');
  console.log('found posters:', posters.length);

  for (let i = 0; i < posters.length; i++) {
    const out = path.join(DIR, outputNames[i] + '.jpg');
    await posters[i].screenshot({ path: out, type: 'jpeg', quality: 92 });
    console.log('saved', outputNames[i] + '.jpg');
  }

  await browser.close();
  console.log('DONE');
})();
