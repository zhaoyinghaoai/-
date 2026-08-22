/**
 * 通用社card渲染脚本
 * 用法：把此文件放到 cards.html 同目录，按实际情况改 htmlFileName / outputNames / CHROME_PATH
 */
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

// ============ 按需修改 ============
const htmlFileName = 'cards.html';
const outputNames = [
  'xhs-01-cover',
  'xhs-02-keypoint',
  'xhs-03-keypoint',
  'xhs-04-keypoint',
  'xhs-05-keypoint',
  'xhs-06-closing',
  'wechat-21x9-cover',
  'wechat-1x1-cover'
];
const CHROME_PATH = 'C:\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe';
// ==================================

(async () => {
  const dir = __dirname;
  const htmlPath = path.join(dir, htmlFileName);

  if (!fs.existsSync(htmlPath)) {
    console.error('HTML file not found:', htmlPath);
    process.exit(1);
  }

  if (!fs.existsSync(CHROME_PATH)) {
    console.error('Chrome not found at:', CHROME_PATH);
    console.error('Please update CHROME_PATH to your Chrome/Edge executable.');
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
    const out = path.join(dir, outputNames[i] + '.png');
    await posters[i].screenshot({ path: out });
    console.log('rendered:', outputNames[i]);
  }

  await browser.close();
  console.log('DONE:', Math.min(posters.length, outputNames.length), 'cards rendered');
})().catch(e => {
  console.error('RENDER_ERROR:', e.message);
  console.error(e.stack);
  process.exit(1);
});
