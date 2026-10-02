/**
 * 随手库 v1.04 自检：目录页是否还把不同类笔记混在一起
 * 用法：先起本地服务，再 node _check_v104.js
 */
const puppeteer = require('puppeteer-core');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe';
const OUT = path.join(__dirname, '样品图');
const PORT = 8899;
const URL = 'http://127.0.0.1:' + PORT + '/';
const APP_DIR = path.join(__dirname, 'app-v05');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };

const server = http.createServer((req, res) => {
  let p = req.url.split('?')[0];
  if (p === '/') p = '/index.html';
  const fp = path.join(APP_DIR, decodeURIComponent(p));
  fs.readFile(fp, (e, d) => {
    if (e) { res.writeHead(404); res.end('nope'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
    res.end(d);
  });
});

(async () => {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  await new Promise(r => server.listen(PORT, '127.0.0.1', r));
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH, headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2 });
  page.on('console', m => console.log('  [页面]', m.text()));
  page.on('pageerror', e => console.log('  [JS错误]', e.message));

  await page.goto(URL, { waitUntil: 'networkidle0' });

  // 造数据：两条笔记，分属两个不同类目
  const seeded = await page.evaluate(() => {
    CATS.length = 0; ['读书笔记', '灵感', '写作', '生活', '杂记'].forEach(c => CATS.push(c));
    saveCats();
    items.length = 0;
    items.push({
      id: 'a1', category: '读书笔记', ts: Date.now() - 3600000,
      blocks: [{ type: 't', t: '《学会提问》第18天：论题和结论要分开看。' }],
      text: '《学会提问》第18天：论题和结论要分开看。'
    });
    items.push({
      id: 'a2', category: '灵感', ts: Date.now() - 1800000,
      blocks: [{ type: 't', t: '灵感：给快递点做个小工具，扫码自动发通知。' }],
      text: '灵感：给快递点做个小工具，扫码自动发通知。'
    });
    // 再造一条类目被删掉的孤儿笔记，测兜底
    items.push({
      id: 'a3', category: '被删掉的类目', ts: Date.now() - 600000,
      blocks: [{ type: 't', t: '这条的类目后来被删了，不能让它消失。' }],
      text: '这条的类目后来被删了，不能让它消失。'
    });
    save(); curCat = '全部'; renderHome();
    return { cats: CATS.slice(), n: items.length, pageNum: $('#pageNum').textContent };
  });
  console.log('类目:', seeded.cats.join(' / '), '| 笔记:', seeded.n, '| 顶部:', seeded.pageNum);

  // ① 目录页
  await page.screenshot({ path: path.join(OUT, 'chk-v104-1-目录.png') });
  const rows = await page.$$eval('.tocrow', els => els.map(e => ({
    名: e.querySelector('.tname').textContent,
    副: e.querySelector('.tsub').textContent,
    数: e.querySelector('.tnum').textContent
  })));
  console.log('\n① 目录页每一行：');
  rows.forEach(r => console.log('   ' + r.名 + ' | ' + r.副 + ' | ' + r.数));

  // ② 点「读书笔记」→ 应只看见那一条
  await page.evaluate(() => pickCat('读书笔记'));
  await new Promise(r => setTimeout(r, 250));
  await page.screenshot({ path: path.join(OUT, 'chk-v104-2-读书笔记.png') });
  const inCat = await page.$$eval('#flipwrap .fcard, #flipwrap article', els => els.length);
  const headTxt = await page.$eval('#cathead', e => e.textContent);
  console.log('\n② 点进「读书笔记」：顶部=' + headTxt.replace(/\s+/g, ' ').trim() + ' | 卡片数=' + inCat);

  // ③ 点「灵感」→ 应只看见另一条
  await page.evaluate(() => pickCat('灵感'));
  await new Promise(r => setTimeout(r, 250));
  const inCat2 = await page.$$eval('#flipwrap .fcard, #flipwrap article', els => els.length);
  const head2 = await page.$eval('#cathead', e => e.textContent);
  console.log('③ 点进「灵感」：顶部=' + head2.replace(/\s+/g, ' ').trim() + ' | 卡片数=' + inCat2);

  // ④ 点「未归类」→ 孤儿笔记
  await page.evaluate(() => pickCat('未归类'));
  await new Promise(r => setTimeout(r, 250));
  const inCat3 = await page.$$eval('#flipwrap .fcard, #flipwrap article', els => els.length);
  console.log('④ 点进「未归类」：卡片数=' + inCat3);

  await page.evaluate(() => pickCat('全部'));
  await new Promise(r => setTimeout(r, 250));
  await page.screenshot({ path: path.join(OUT, 'chk-v104-3-回目录.png') });

  await browser.close();
  server.close();
  console.log('\n截图已存到 样品图/');
})().catch(e => { console.error('跑挂了：', e); process.exit(1); });
