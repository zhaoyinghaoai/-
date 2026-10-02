/**
 * 随手库 v1.06 自检：在某个类目里点 ＋ 写的东西，到底存到哪个类目？
 * 用法：node _check_cat.js
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
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH, headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2 });
  page.on('pageerror', e => console.log('  [JS错误]', e.message));
  await page.goto(URL, { waitUntil: 'networkidle0' });

  await page.evaluate(() => {
    CATS.length = 0; ['写作', '读书', '灵感', '生活', '杂记'].forEach(c => CATS.push(c));
    saveCats();
    items.length = 0;
    items.push({ id: 's1', category: '灵感', ts: Date.now() - 3600000, blocks: [{ type: 't', t: '原先灵感里就有的一条' }], text: 'x' });
    save(); curCat = '全部'; renderHome();
  });

  const 状态 = async (label) => {
    const s = await page.evaluate(() => ({
      当前类目: curCat,
      待存类目: newCat,
      标题: ($('#newTitle') || {}).textContent || '(不在新建页)',
      高亮的归类钮: (document.querySelector('.cpill.on') || {}).textContent || '(无)',
      顶部提示: ($('#pageNum') || {}).textContent || '',
      条目: items.map(i => i.category + ':' + (i.blocks[0] ? i.blocks[0].t : '')).join(' | ')
    }));
    console.log('\n【' + label + '】');
    Object.entries(s).forEach(([k, v]) => console.log('  ' + k + ' = ' + v));
    return s;
  };

  // ① 浩总的路：进「灵感」章节，点底部 ＋
  await page.evaluate(() => pickCat('灵感'));
  await new Promise(r => setTimeout(r, 200));
  await page.evaluate(() => openNew());
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(OUT, 'chk-类目-1-从灵感新建.png') });
  const geo = await page.evaluate(() => {
    const cp = document.querySelector('#catpick').getBoundingClientRect();
    const nv = document.querySelector('#new .nav').getBoundingClientRect();
    return { 归类行_顶: Math.round(cp.top), 归类行_底: Math.round(cp.bottom), 归类行_高: Math.round(cp.height), 标题栏_底: Math.round(nv.bottom), 滚动位置: Math.round(window.scrollY), 在标题栏下面被盖住: cp.top < nv.bottom };
  });
  console.log('\n【归类行位置】'); Object.entries(geo).forEach(([k, v]) => console.log('  ' + k + ' = ' + v));
  const a = await 状态('① 在「灵感」里点 ＋');

  // ② 直接写内容、保存（不手动点归类）
  await page.type('#newEditor textarea', '在灵感里写的东西，不点归类直接存');
  await page.evaluate(() => saveNote());
  await new Promise(r => setTimeout(r, 300));
  const b = await 状态('② 不点归类直接保存');

  // ③ 从目录页点 ＋（应沿用上次的「灵感」）
  await page.evaluate(() => goTOC());
  await new Promise(r => setTimeout(r, 200));
  await page.evaluate(() => openNew());
  await new Promise(r => setTimeout(r, 300));
  const c = await 状态('③ 回到目录页再点 ＋');

  // ④ 编辑时换类目：把那条灵感改成「读书」
  await page.evaluate(() => { editItem('s1'); });
  await new Promise(r => setTimeout(r, 300));
  const d = await 状态('④ 编辑「灵感」那条（归类应默认＝灵感）');
  await page.evaluate(() => setNewCat('读书'));
  await page.evaluate(() => saveNote());
  await new Promise(r => setTimeout(r, 300));
  const e = await 状态('⑤ 编辑里换成「读书」后保存');

  console.log('\n===== 结论 =====');
  console.log('① 新建时默认类目是否＝当前章节灵感 →', a.待存类目 === '灵感' ? '✅' : '❌ 得到 ' + a.待存类目);
  console.log('② 不点归类直接存，是否进了灵感     →', b.条目.includes('灵感:在灵感里写的东西') ? '✅' : '❌');
  console.log('③ 目录页新建是否沿用上次的灵感     →', c.待存类目 === '灵感' ? '✅' : '❌ 得到 ' + c.待存类目);
  console.log('④ 编辑时归类是否默认＝自己的类目   →', d.待存类目 === '灵感' ? '✅' : '❌ 得到 ' + d.待存类目);
  console.log('⑤ 编辑里换类目是否真的生效         →', e.条目.includes('读书:原先灵感里就有的一条') ? '✅' : '❌');

  await browser.close();
  server.close();
})().catch(e => { console.error('跑挂了：', e); process.exit(1); });
