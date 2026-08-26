/**
 * 渲染脚本：把 cards.html 的 8 张 .poster 渲染成 JPG
 * 环境：puppeteer-core 25.6.0 + 系统 Chrome
 */
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const htmlFileName = 'cards.html';
const CHROME_PATH = 'C:\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe';
const outputNames = [
  'xhs-01-cover',
  'xhs-02-leave-a-little',
  'xhs-03-words-full',
  'xhs-04-everyone-errs',
  'xhs-05-keep-a-door',
  'xhs-06-closing-interact',
  'wechat-21x9-cover',
  'wechat-1x1-cover'
];

(async () => {
  const dir = __dirname;
  const htmlPath = path.join(dir, htmlFileName);

  if (!fs.existsSync(htmlPath)) {
    console.error('HTML file not found:', htmlPath);
    process.exit(1);
  }
  if (!fs.existsSync(CHROME_PATH)) {
    console.error('Chrome not found at:', CHROME_PATH);
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 2100, height: 1440, deviceScaleFactor: 1 });

  await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 3000));

  const posters = await page.$$('.poster');
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
})().catch(e => {
  console.error('RENDER_ERROR:', e.message);
  console.error(e.stack);
  process.exit(1);
});
