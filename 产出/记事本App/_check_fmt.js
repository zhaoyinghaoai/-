/**
 * 随手库 v1.08 自检：加粗 / 提亮
 * 用法：node _check_fmt.js
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

let pass = 0, fail = 0;
const 检查 = (label, ok, extra) => {
  console.log('  ' + (ok ? '✅' : '❌') + ' ' + label + (extra ? '  → ' + extra : ''));
  ok ? pass++ : fail++;
};

(async () => {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const URL = 'http://127.0.0.1:' + server.address().port + '/';
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH, headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  page.on('pageerror', e => console.log('  [JS错误]', e.message));
  await page.goto(URL, { waitUntil: 'networkidle0' });

  await page.evaluate(() => {
    CATS.length = 0; ['写作', '读书', '灵感', '生活', '杂记'].forEach(c => CATS.push(c));
    saveCats(); items.length = 0; save(); curCat = '全部'; renderHome();
  });

  console.log('\n【1. 标记 → 显示】卡片上是否正确渲染');
  const 显示 = await page.evaluate(() => {
    const r = {};
    r.粗 = renderRich('这句**很关键**别忘');
    r.亮 = renderRich('重点看==这一段==就行');
    r.两个一起 = renderRich('==整段提亮==，其中**两个字**加粗');
    r.没标记 = renderRich('普通文字不带标记');
    r.不配对 = renderRich('一个**孤零零的星号');
    r.转义 = renderRich('<img src=x onerror=alert(1)>**加粗**');
    r.空 = renderRich('');
    r.空值 = renderRich(null);
    return r;
  });
  检查('加粗渲染出 <b>', 显示.粗.includes('<b>很关键</b>'), 显示.粗);
  检查('提亮渲染出 <mark>', 显示.亮.includes('<mark>这一段</mark>'), 显示.亮);
  检查('两种混用都对', 显示.两个一起.includes('<mark>整段提亮</mark>') && 显示.两个一起.includes('<b>两个字</b>'), 显示.两个一起);
  检查('没标记的原样输出', 显示.没标记 === '普通文字不带标记', 显示.没标记);
  检查('不配对的星号不吞字', 显示.不配对 === '一个**孤零零的星号', 显示.不配对);
  console.log('    （XSS 防护）' + 显示.转义);
  检查('HTML 被转义（防注入）', 显示.转义.includes('&lt;img') && !显示.转义.includes('<img'), '');
  检查('空文字不报错', 显示.空 === '' && 显示.空值 === '');

  console.log('\n【2. 去掉标记】搜索 / 复制用的纯文字');
  const 纯 = await page.evaluate(() => ({
    加粗: stripMD('这句**很关键**别忘'),
    提亮: stripMD('重点看==这一段==就行'),
    混用: stripMD('==整段==里**加粗**的部分'),
    嵌套安全: stripMD('**==两个都套==**')
  }));
  检查('加粗标记被去掉', 纯.加粗 === '这句很关键别忘', 纯.加粗);
  检查('提亮标记被去掉', 纯.提亮 === '重点看这一段就行', 纯.提亮);
  检查('混用都被去掉', 纯.混用 === '整段里加粗的部分', 纯.混用);
  检查('嵌套不会漏标记', !纯.嵌套安全.includes('*') && !纯.嵌套安全.includes('='), 纯.嵌套安全);

  console.log('\n【3. 按钮真的能用】选中文字 → 点按钮');
  await page.evaluate(() => { openNew(); });
  await new Promise(r => setTimeout(r, 500));
  await page.evaluate(() => {
    const ta = document.querySelector('#newEditor .blk-t');
    ta.value = '第一句普通，第二句要加粗，第三句要提亮。';
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    // 按词组实际长度选中
    const w = '第二句要加粗';
    const i = ta.value.indexOf(w);
    ta.setSelectionRange(i, i + w.length);
    ta.dispatchEvent(new Event('focusin', { bubbles: true }));
    lastEditEl = ta;
  });
  await page.evaluate(() => applyFmt('**'));
  await new Promise(r => setTimeout(r, 250));
  const 加粗后 = await page.evaluate(() => {
    const ta = document.querySelector('#newEditor .blk-t');
    return { 值: ta.value, 选中: ta.value.substring(ta.selectionStart, ta.selectionEnd) };
  });
  检查('点加粗：标记套上了', 加粗后.值.includes('**第二句要加粗**'), 加粗后.值);
  检查('加粗后仍选中那几个字（方便再点一次取消）', 加粗后.选中 === '第二句要加粗', '选中=' + 加粗后.选中);

  await page.evaluate(() => applyFmt('**'));
  await new Promise(r => setTimeout(r, 250));
  const 取消后 = await page.evaluate(() => document.querySelector('#newEditor .blk-t').value);
  检查('再点一次：加粗取消掉', !取消后.includes('**'), 取消后);

  await page.evaluate(() => {
    const ta = document.querySelector('#newEditor .blk-t');
    const w = '第三句要提亮';
    const i = ta.value.indexOf(w);
    ta.setSelectionRange(i, i + w.length); lastEditEl = ta;
  });
  await page.evaluate(() => applyFmt('=='));
  await new Promise(r => setTimeout(r, 250));
  const 提亮后 = await page.evaluate(() => document.querySelector('#newEditor .blk-t').value);
  检查('点提亮：标记套上了', 提亮后.includes('==第三句要提亮=='), 提亮后);

  console.log('\n【4. 存下来 → 卡片上真的变粗变亮】');
  await page.evaluate(() => saveNote());
  await new Promise(r => setTimeout(r, 400));
  const 卡片 = await page.evaluate(() => {
    // 回到目录 → 进类目 → 看卡片渲染
    goTOC();
    const it = items[items.length - 1];
    return { 存的原文: it.blocks[0].t, 卡片HTML: blocksHTML(it), 搜索用的纯文本: textOf(it) };
  });
  检查('存的是带标记的原文', 卡片.存的原文.includes('==第三句要提亮=='), 卡片.存的原文);
  检查('卡片渲染出 <mark>', 卡片.卡片HTML.includes('<mark>第三句要提亮</mark>'), '');
  检查('卡片里没有裸露的 == 符号', !卡片.卡片HTML.includes('=='), '');
  检查('搜索用的纯文本不带标记', !卡片.搜索用的纯文本.includes('==') && !卡片.搜索用的纯文本.includes('**'), 卡片.搜索用的纯文本);

  console.log('\n【5. 搜索】带标记的文字还能被搜到');
  const 搜到 = await page.evaluate(() => {
    const it = items[items.length - 1];
    const q = '第三句要提亮';
    return { 能搜到: textOf(it).includes(q), 查标记: textOf(it).includes('==') };
  });
  检查('搜得到带样式的字', 搜到.能搜到);
  检查('搜不到标记符号本身', !搜到.查标记);

  console.log('\n【6. 老笔记不受影响】没有标记的照旧');
  const 老 = await page.evaluate(() => renderRich('以前记的普通笔记，一个字都没变。'));
  检查('老笔记原样显示', 老 === '以前记的普通笔记，一个字都没变。', 老);

  // 拍照：编辑态（重新进编辑页，别被"存完回目录"打断）
  await page.evaluate(() => { const it = items[items.length - 1]; editItem(it.id); });
  await new Promise(r => setTimeout(r, 600));
  await page.evaluate(() => {
    const ta = document.querySelector('#newEditor .blk-t');
    ta.value = '今天想明白一件事：==做减法比加东西难==。\n\n所以先说清楚**要解决的那个问题**，再谈别的。';
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    lastEditEl = ta;
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(OUT, 'chk-样式-1-编辑态.png') });

  // 卡片态：直接存，回目录再进类目
  await page.evaluate(() => { saveNote(); });
  await new Promise(r => setTimeout(r, 600));
  await page.evaluate(() => { const it = items[items.length - 1]; pickCat(it.category); });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(OUT, 'chk-样式-2-卡片态.png') });

  console.log('\n===== 结果：' + pass + ' 项通过，' + fail + ' 项失败 =====');
  await browser.close();
  server.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('跑挂了：', e); process.exit(1); });
