const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME = 'C:/Users/Administrator/AppData/Local/Google/Chrome/Application/chrome.exe';
const dir = 'E:/北辰/浩总的个人知识库/产出/读书内容/配图/他每次都说自己没得选社card';
const htmlPath = 'file:///' + dir + '/cards.html';

const outputNames = [
  'xhs-01-cover.jpg',
  'xhs-02-first.jpg',
  'xhs-03-second.jpg',
  'xhs-04-onepass.jpg',
  'xhs-05-court.jpg',
  'xhs-06-ledger.jpg',
  'wechat-21x9-cover.jpg',
  'wechat-1x1-cover.jpg'
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 2400, height: 1600, deviceScaleFactor: 1 });
  await page.goto(htmlPath, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 3000));

  const posters = await page.$$('section.poster');
  console.log('找到 poster 数量:', posters.length);

  for (let i = 0; i < posters.length; i++) {
    const out = path.join(dir, outputNames[i]);
    await posters[i].screenshot({ path: out, type: 'jpeg', quality: 92 });
    console.log('已截图 ->', outputNames[i]);
  }

  await browser.close();
  console.log('全部完成');
})();
