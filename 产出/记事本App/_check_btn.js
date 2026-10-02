/**
 * 随手库：章节列表最后一张卡的「改 / 复制」按钮为什么看不见？
 * 用法：node _check_btn.js
 */
const puppeteer = require('puppeteer-core');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe';
const OUT = path.join(__dirname, '样品图');
const APP_DIR = path.join(__dirname, 'app-v05');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };

const server = http.createServer((req, res) => {
  let p = req.url.split('?')[0];
  if (p === '/') p = '/index.html';
  fs.readFile(path.join(APP_DIR, decodeURIComponent(p)), (e, d) => {
    if (e) { res.writeHead(404); res.end('nope'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
    res.end(d);
  });
});

(async () => {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const URL = 'http://127.0.0.1:' + server.address().port + '/';
  console.log('本地预览：', URL);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH, headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2 });
  page.on('pageerror', e => console.log('  [JS错误]', e.message));
  await page.goto(URL, { waitUntil: 'networkidle0' });

  await page.evaluate(() => {
    CATS.length = 0; ['读书笔记', '灵感', '写作', '生活', '杂记'].forEach(c => CATS.push(c));
    saveCats();
    items.length = 0;
    for (let i = 1; i <= 8; i++) {
      items.push({
        id: 'b' + i, category: '读书笔记', ts: Date.now() - i * 3600000,
        blocks: [{ type: 't', t: '第' + i + '条笔记：这是一段用来撑高度的正文，看看最后一张卡下面的按钮还在不在。再补一句让它长一点，再多补一句，凑够三行左右，模拟真实的长笔记效果。' }],
        text: '第' + i + '条'
      });
    }
    save(); curCat = '全部'; renderHome(); pickCat('读书笔记');
  });
  await new Promise(r => setTimeout(r, 400));

  const before = await page.evaluate(() => {
    const cards = document.querySelectorAll('#flipwrap .flipcard');
    const last = cards[cards.length - 1];
    const acts = last.querySelector('.fc-actions');
    const tb = document.querySelector('.tabbar');
    const r = acts.getBoundingClientRect(), t = tb.getBoundingClientRect();
    return {
      卡片数: cards.length,
      每卡按钮数: [...cards].map(c => c.querySelectorAll('.fc-actions button').length).join(','),
      最后卡按钮_顶: Math.round(r.top), 最后卡按钮_底: Math.round(r.bottom),
      底栏_顶: Math.round(t.top), 视口高: window.innerHeight,
      被底栏遮住: r.bottom > t.top,
      页面高: document.documentElement.scrollHeight,
      body类: document.body.className
    };
  });
  console.log('【滚动到顶时】'); Object.entries(before).forEach(([k, v]) => console.log('  ' + k + ': ' + v));

  // 滚到底
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(OUT, 'chk-按钮-滚到底.png') });

  const after = await page.evaluate(() => {
    const cards = document.querySelectorAll('#flipwrap .flipcard');
    const last = cards[cards.length - 1];
    const acts = last.querySelector('.fc-actions');
    const tb = document.querySelector('.tabbar');
    const r = acts.getBoundingClientRect(), t = tb.getBoundingClientRect();
    // 命中的是不是按钮本身
    const cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2;
    const hit = document.elementFromPoint(cx, cy);
    return {
      最后卡按钮_顶: Math.round(r.top), 最后卡按钮_底: Math.round(r.bottom),
      底栏_顶: Math.round(t.top), 视口高: window.innerHeight,
      被底栏遮住: r.bottom > t.top,
      中心点命中的元素: hit ? (hit.tagName + '.' + (hit.className || '')) : 'null',
      还能再滚: Math.round(document.documentElement.scrollHeight - window.scrollY - window.innerHeight),
      home的paddingBottom: getComputedStyle(document.querySelector('#home')).paddingBottom,
      home的左padding: getComputedStyle(document.querySelector('#home')).paddingLeft,
      home类名: document.querySelector('#home').className,
      env是否被支持: CSS.supports('padding-bottom', 'calc(86px + env(safe-area-inset-bottom, 0px))'),
      tocwrap的padding: getComputedStyle(document.querySelector('#tocwrap')).padding,
      flipwrap的paddingBottom: getComputedStyle(document.querySelector('#flipwrap')).paddingBottom,
      底栏高: Math.round(document.querySelector('.tabbar').getBoundingClientRect().height),
      媒体查询命中: matchMedia('(max-width:500px)').matches
    };
  });
  console.log('\n【滚到底后】'); Object.entries(after).forEach(([k, v]) => console.log('  ' + k + ': ' + v));

  await browser.close();
  server.close();
})().catch(e => { console.error('跑挂了：', e); process.exit(1); });
