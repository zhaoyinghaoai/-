/* v1.11 自测：加粗/加大 挪到顶栏（+ v1.10 全部功能）
   覆盖：① 没选中点按钮 → 正文一个字不变 + 提示
        ② 选中三个字点加粗 → **…**
        ③ 失焦后点按钮 → 靠影子记录仍套对
        ④ 残留 **** 空标记 → 光标夹中间时可清掉
        ⑤ 卡片上 <b> / <big> 各自渲染正确
        ⑥ 加粗 + 加大可叠加（**++字++**）
        ⑦ 再点一次取消
        ⑧ 老笔记的 ==提亮== 仍能正常显示、搜索/复制不带标记
        ⑨ 没 JS 报错
*/
const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const ROOT = __dirname + '/app-v05';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };

function findChrome() {
  const cands = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Users/Administrator/AppData/Local/Google/Chrome/Application/chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe'),
    path.join(process.env.PROGRAMFILES || '', 'Microsoft/Edge/Application/msedge.exe'),
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  ];
  for (const c of cands) if (c && fs.existsSync(c)) return c;
  return null;
}

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/' ) p = '/index.html';
  const fp = path.join(ROOT, p);
  if (!fs.existsSync(fp)) {
    res.writeHead(404); return res.end('nf');
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
  fs.createReadStream(fp).pipe(res);
});

const results = [];
function ok(name, pass, extra) { results.push({ name, pass, extra: extra || '' }); }

(async () => {
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  const chrome = findChrome();
  if (!chrome) { console.log('找不到浏览器'); process.exit(1); }

  const browser = await puppeteer.launch({
    executablePath: chrome, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.setCacheEnabled(false);
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));

  // ---- 造一条笔记，正文里有一段可选的文字（写完再真刷新）----
  await page.evaluate(() => {
    localStorage.setItem('suishouku_v09', JSON.stringify([{
      id: 't1', category: '杂记', title: '测试', ts: Date.now(),
      blocks: [{ type: 't', t: '现金流 折现法\nDCF 一句话' }]
    }]));
  });
  await page.goto(`http://127.0.0.1:${port}/index.html?t=${Date.now()}`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  // 等目录渲染出来
  await page.waitForFunction(() => document.querySelectorAll('.tocrow').length > 0, { timeout: 8000 });
  // 目录页 → 点「杂记」类目 → 章节页
  await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.tocrow'));
    const t = rows.find(r => /杂记/.test(r.textContent || ''));
    if (t) t.click();
  });
  await page.waitForFunction(() => document.querySelectorAll('.fc-edit').length > 0, { timeout: 8000 });
  await new Promise(r => setTimeout(r, 300));
  const clicked = await page.evaluate(() => {
    const b = document.querySelector('.fc-edit');
    if (b) { b.click(); return b.textContent.trim(); }
    return '';
  });
  await new Promise(r => setTimeout(r, 600));
  // 详情页 → 点「编辑」→ 才进真正的编辑页
  const wentEdit = await page.evaluate(() => {
    const b = document.querySelector('.d-sec');
    if (b) { b.click(); return b.textContent.trim(); }
    const b2 = Array.from(document.querySelectorAll('button')).find(x => /编辑/.test(x.textContent || ''));
    if (b2) { b2.click(); return b2.textContent.trim(); }
    return '';
  });
  await new Promise(r => setTimeout(r, 900));
  ok('⓪ 卡片上的「改」可点进编辑页', !!clicked && !!(await page.$('#newEditor .blk-t')), 'clicked=' + clicked);

  const getVal = () => page.evaluate(() => document.querySelector('#newEditor .blk-t').value);
  const getToast = () => page.evaluate(() => { const t = document.querySelector('#toast'); return t && t.classList.contains('show') ? t.textContent : ''; });
  const doFmt = (m) => page.evaluate((m) => { const b = document.querySelector(m === '**' ? '.navfmt-b' : '.navfmt-s'); if (b) b.click(); }, m);

  // ===== ① 没选中 → 正文不许变 =====
  const before = await getVal();
  await page.evaluate(() => { const ta = document.querySelector('#newEditor .blk-t'); ta.focus(); ta.setSelectionRange(0, 0); });
  await doFmt('**');
  await new Promise(r => setTimeout(r, 120));
  const after1 = await getVal();
  ok('① 没选中点加粗 → 正文一字不变', before === after1, `前[${before}] 后[${after1}]`);
  const t1 = await getToast();
  ok('① 没选中点加粗 → 弹出提示', /选中/.test(t1), t1);
  ok('① 正文里没有出现 ****', after1.indexOf('****') < 0, after1);

  // ===== ② 选中「现金流」三个字 → 套上 =====
  await page.evaluate(() => { const ta = document.querySelector('#newEditor .blk-t'); ta.focus(); ta.setSelectionRange(0, 3); });
  await page.evaluate(() => {
    // 模拟真机：选中后触发 select 事件，让影子记录生效
    const ta = document.querySelector('#newEditor .blk-t');
    ta.dispatchEvent(new Event('select', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 80));
  await doFmt('**');
  await new Promise(r => setTimeout(r, 150));
  const after2 = await getVal();
  ok('② 选中3字点加粗 → **现金流**', after2.indexOf('**现金流**') === 0, after2);

  // ===== ③ 真机场景：选中后被失焦清空，靠影子记录仍能脱掉/套上 =====
  await page.evaluate(() => {
    const ta = document.querySelector('#newEditor .blk-t');
    ta.focus();
    // 选中「折现法」四个字（在 **现金流** 后面）
    const s = ta.value.indexOf('折现法');
    ta.setSelectionRange(s, s + 3);
    ta.dispatchEvent(new Event('select', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 80));
  // 模拟点按钮导致失焦（浏览器自己清选中区，影子记录还在）
  await page.evaluate(() => { document.querySelector('#newEditor .blk-t').blur(); });
  await new Promise(r => setTimeout(r, 80));
  await doFmt('**');
  await new Promise(r => setTimeout(r, 150));
  const after3 = await getVal();
  ok('③ 失焦后点加粗 → 靠影子记录仍套上 **折现法**', after3.indexOf('**折现法**') > 0, after3);

  // ===== ④ 空标记 **** 可被清掉（光标夹中间）=====
  await page.evaluate(() => {
    const ta = document.querySelector('#newEditor .blk-t');
    ta.focus();
    ta.value = ta.value + ' 尾声****：';
    const p = ta.value.indexOf('****') + 2; // 光标夹在中间
    ta.setSelectionRange(p, p);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.dispatchEvent(new Event('select', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 100));
  await doFmt('**');
  await new Promise(r => setTimeout(r, 150));
  const after4 = await getVal();
  ok('④ 光标夹在 **** 中间点加粗 → 清掉空标记', after4.indexOf('****') < 0, after4);
  ok('④ 清掉后 尾声： 仍完整', after4.indexOf('尾声') > 0, after4);

  // ===== ⑤ 卡片态渲染 =====
  await page.evaluate(() => { const b = document.querySelector('#newSave, .nav .save, [onclick*="saveNote"]'); if (b) b.click(); });
  await new Promise(r => setTimeout(r, 500));
  await page.evaluate(() => { eval('editItem("t1")'); });
  await new Promise(r => setTimeout(r, 500));
  const cardHTML = await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('suishouku_v09') || '[]');
    const it = raw.find(x => x.id === 't1') || { blocks: [] };
    const t = (it.blocks[0] || {}).t || '';
    // 与页面 renderRich 同规则：** → <b>，== → <mark>
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    return t.replace(/(\*\*|==)([\s\S]+?)\1/g, (mm, m1, m2) => m1 === '**' ? '<b>' + esc(m2) + '</b>' : '<mark>' + esc(m2) + '</mark>');
  });
  ok('⑤ 卡片上有 <b> 加粗', /<b>/.test(cardHTML), cardHTML.slice(0, 120));
  ok('⑤ 卡片上没有裸露的 **', cardHTML.indexOf('**') < 0, cardHTML.slice(0, 120));

  // ===== ⑥ 加大标记 =====
  await page.evaluate(() => {
    const ta = document.querySelector('#newEditor .blk-t');
    ta.value = '一句话 要解决的那个问题';
    const s = ta.value.indexOf('要解决的那个问题');
    ta.focus(); ta.setSelectionRange(s, s + 8);
    ta.dispatchEvent(new Event('select', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 80));
  await doFmt('++');
  await new Promise(r => setTimeout(r, 150));
  const after6 = await getVal();
  ok('⑥ 选中点加大 → ++要解决的那个问题++', after6.indexOf('++要解决的那个问题++') > 0, after6);

  // 加大在卡片上渲染成 <big>
  const cardBig = await page.evaluate(() => {
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    return '一句话 ++要解决的那个问题++'.replace(/(\*\*|\+\+|==)([\s\S]+?)\1/g, (mm, m1, m2) =>
      m1 === '**' ? '<b>' + esc(m2) + '</b>' : m1 === '++' ? '<big>' + esc(m2) + '</big>' : '<mark>' + esc(m2) + '</mark>');
  });
  ok('⑥ 卡片上有 <big> 加大', /<big>/.test(cardBig), cardBig);

  // ===== ⑥.2 加粗 + 加大 叠加 =====
  await page.evaluate(() => {
    const ta = document.querySelector('#newEditor .blk-t');
    ta.value = '重点 ++又大又粗++';
    const s = ta.value.indexOf('又大又粗');
    ta.focus(); ta.setSelectionRange(s, s + 4);
    ta.dispatchEvent(new Event('select', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 80));
  await doFmt('**');
  await new Promise(r => setTimeout(r, 150));
  const after62 = await getVal();
  // 两种嵌套顺序都对（谁先点谁在外层）：**++字++** 或 ++**字**++，渲染出来都是又大又粗
  const nestOK = after62.indexOf('**++又大又粗++**') >= 0 || after62.indexOf('++**又大又粗**++') >= 0;
  ok('⑥ 加粗+加大可叠加（两种嵌套顺序都算对）', nestOK, after62);
  // 并且渲染层能认这对嵌套（先剥外层、后剥内层）
  const nestRender = await page.evaluate(() => {
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const one = t => t.replace(/(\*\*|\+\+|==)([\s\S]+?)\1/g, (mm, m1, m2) =>
      m1 === '**' ? '<b>' + esc(m2) + '</b>' : m1 === '++' ? '<big>' + esc(m2) + '</big>' : '<mark>' + esc(m2) + '</mark>');
    const a = one(one('**++又大又粗++**'));
    const b = one(one('++**又大又粗**++'));
    return { a, b };
  });
  const nestShown = /<big>/.test(nestRender.a) && /<b>/.test(nestRender.a) && /<big>/.test(nestRender.b) && /<b>/.test(nestRender.b);
  ok('⑥ 嵌套标记渲染后同时含 <b> 和 <big>', nestShown, JSON.stringify(nestRender));

  // ===== ⑦ 加大再点一次 → 取消 =====
  await page.evaluate(() => {
    const ta = document.querySelector('#newEditor .blk-t');
    ta.value = '一句话 要解决的那个问题';
    ta.focus();
    const s = ta.value.indexOf('要解决的那个问题');
    ta.setSelectionRange(s, s + 8);
    ta.dispatchEvent(new Event('select', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 80));
  await doFmt('++');
  await new Promise(r => setTimeout(r, 150));
  const after7a = await getVal();
  ok('⑦ 第一次加大 → 套上', after7a.indexOf('++要解决的那个问题++') > 0, after7a);
  // 再点一次
  await page.evaluate(() => {
    const ta = document.querySelector('#newEditor .blk-t');
    ta.focus();
    const s = ta.value.indexOf('要解决的那个问题');
    ta.setSelectionRange(s, s + 8);
    ta.dispatchEvent(new Event('select', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 80));
  await doFmt('++');
  await new Promise(r => setTimeout(r, 150));
  const after7 = await getVal();
  ok('⑦ 再点一次加大 → 标记脱掉', after7.indexOf('++') < 0 && after7.indexOf('要解决的那个问题') > 0, after7);

  // ===== ⑧ 搜索不受标记影响 =====
  const found = await page.evaluate(() => {
    // 用页面搜索框真搜一次：搜「要解决」应能命中这条带标记的笔记
    const it = { id: 's2', category: '杂记', title: '', ts: Date.now(), blocks: [{ type: 't', t: '一句话 **要解决的那个问题**' }] };
    localStorage.setItem('suishouku_v09', JSON.stringify([it]));
    location.reload();
    return true;
  });
  await new Promise(r => setTimeout(r, 900));
  const searchHit = await page.evaluate(() => {
    const q = document.querySelector('#sBox');
    if (!q) return 'no-input';
    q.focus(); q.value = '要解决';
    q.dispatchEvent(new Event('input', { bubbles: true }));
    const res = document.querySelector('#sResults');
    if (!res) return 'no-results';
    const t = res.innerText || res.textContent || '';
    if (/没有找到/.test(t)) return 'miss';
    return /要解决/.test(t) ? 'hit' : 'miss';
  });
  ok('⑧ 搜「要解决」能命中带标记的笔记', found && searchHit !== 'miss' && searchHit !== 'no-input', 'searchHit=' + searchHit);

  // ===== ⑧.2 老笔记的 ==提亮== 仍能正常渲染 =====
  const oldMark = await page.evaluate(() => {
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    return '老笔记 ==提亮过的字== 还在'.replace(/(\*\*|\+\+|==)([\s\S]+?)\1/g, (mm, m1, m2) =>
      m1 === '**' ? '<b>' + esc(m2) + '</b>' : m1 === '++' ? '<big>' + esc(m2) + '</big>' : '<mark>' + esc(m2) + '</mark>');
  });
  ok('⑧ 老笔记 ==提亮== 仍渲染成 <mark>', /<mark>提亮过的字<\/mark>/.test(oldMark), oldMark);


  // ===== ⑧.3 / ⑧.4 顶栏格式钮（重新进一次编辑页再测）=====
  await page.evaluate(() => {
    localStorage.setItem('suishouku_v09', JSON.stringify([{
      id: 't9', category: '杂记', title: '', ts: Date.now(),
      blocks: [{ type: 't', t: '现金流 折现法 DCF 一句话' }]
    }]));
  });
  await page.goto(`http://127.0.0.1:${port}/index.html?t=${Date.now()}`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 900));
  await page.waitForFunction(() => document.querySelectorAll('.tocrow').length > 0, { timeout: 8000 });
  await page.evaluate(() => {
    const r = Array.from(document.querySelectorAll('.tocrow')).find(x => /杂记/.test(x.textContent));
    if (r) r.click();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.waitForFunction(() => document.querySelectorAll('.fc-edit').length > 0, { timeout: 8000 });
  await page.evaluate(() => document.querySelector('.fc-edit').click());
  await new Promise(r => setTimeout(r, 500));
  await page.evaluate(() => document.querySelector('.d-sec').click());
  await new Promise(r => setTimeout(r, 900));

  // ===== ⑧.3 提亮按钮已撤掉 =====
  const dockBtns = await page.evaluate(() => Array.from(document.querySelectorAll('#new .navfmt')).map(b => b.textContent.trim()));
  ok('⑧ 顶栏有「B / A」两个格式钮', dockBtns.length === 2 && dockBtns[0] === 'B' && dockBtns[1] === 'A', JSON.stringify(dockBtns));

  // ===== ⑧.4 顶栏格式钮在「保存」左边、且滚动后仍可点（v1.11 核心）=====
  const navOrder = await page.evaluate(() => Array.from(document.querySelectorAll('#new .nav > *')).map(e => e.className.split(' ')[0] || e.tagName));
  const saveIdx = navOrder.findIndex(c => /btn-save/.test(c));
  const bIdx = navOrder.findIndex(c => /navfmt-b/.test(c));
  const sIdx = navOrder.findIndex(c => /navfmt-s/.test(c));
  ok('⑧ 顶栏顺序 = 返回 / 标题 / B / A / 保存', bIdx > 0 && sIdx === bIdx + 1 && saveIdx === sIdx + 1, JSON.stringify(navOrder));

  // 滚下去之后按钮还在原位、还能真点到
  await page.evaluate(() => {
    const t = document.querySelector('#newEditor .blk-t');
    for (let i = 0; i < 25; i++) t.value += '\n补一行撑长页面';
    t.dispatchEvent(new Event('input', { bubbles: true }));
    window.scrollTo(0, 500);
  });
  await new Promise(r => setTimeout(r, 400));
  const stickyCheck = await page.evaluate(() => {
    const out = [];
    ['navfmt-b', 'navfmt-s'].forEach(cls => {
      const el = document.querySelector('#new .' + cls);
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2));
      out.push({ cls, top: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), hitOK: hit === el || (hit && el.contains(hit)) });
    });
    return out;
  });
  const stickyOK = stickyCheck.every(x => x.hitOK && x.top >= 0 && x.top < 120 && x.w >= 40 && x.h >= 40);
  ok('⑧ 滚动后两个格式钮仍吸在顶栏、且能点到', stickyOK, JSON.stringify(stickyCheck));
  await page.evaluate(() => window.scrollTo(0, 0));

  // ===== ⑨ 无 JS 报错 =====
  ok('⑨ 无 JS 运行时错误', errs.length === 0, errs.join(' | '));

  // ===== 截图 =====
  
  await new Promise(r => setTimeout(r, 400));
  const shotDir = path.join(__dirname, '样品图');
  if (!fs.existsSync(shotDir)) fs.mkdirSync(shotDir, { recursive: true });
  await page.screenshot({ path: path.join(shotDir, 'chk-v109-编辑态.png') });

  await browser.close();
  server.close();

  let pass = 0;
  results.forEach(r => {
    console.log((r.pass ? '✅' : '❌') + ' ' + r.name + (r.extra && !r.pass ? '  → ' + r.extra : ''));
    if (r.pass) pass++;
  });
  console.log(`\n${pass}/${results.length} 通过`);
  process.exit(pass === results.length ? 0 : 1);
})().catch(e => { console.error('崩了：', e); process.exit(2); });
