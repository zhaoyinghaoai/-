/**
 * 随手库 v1.07 自检：改第一行的字，页面会不会跳到最下面
 * 用法：node _check_scroll.js
 *
 * 模拟浩总的动作：编辑器里有多行文字 → 点回第一行开头 → 敲键盘
 * 看：① 页面滚了多少 ② 光标跑哪去了 ③ 打字过程中滚了几次
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
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  page.on('pageerror', e => console.log('  [JS错误]', e.message));
  await page.goto(URL, { waitUntil: 'networkidle0' });

  // 装一个"滚动次数计数器"，看看打字过程中被滚了多少次
  await page.evaluate(() => {
    window.__scrolls = [];
    const orig = window.scrollBy.bind(window);
    window.scrollBy = function (x, y) { window.__scrolls.push(Math.round(y)); return orig(x, y); };
  });

  // 造一条长笔记：20 行
  const 长文 = Array.from({ length: 20 }, (_, i) => '第' + (i + 1) + '行：这是一段用来撑高度的内容，模拟一条比较长的笔记。').join('\n');
  await page.evaluate((t) => {
    CATS.length = 0; ['写作', '读书', '灵感', '生活', '杂记'].forEach(c => CATS.push(c));
    saveCats();
    items.length = 0;
    items.push({ id: 'z1', category: '灵感', ts: Date.now(), blocks: [{ type: 't', t }], text: t });
    save(); curCat = '灵感'; renderHome();
  }, 长文);

  // 进「灵感」→ 点「改」
  await page.evaluate(() => { pickCat('灵感'); });
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => { editItem('z1'); });
  await new Promise(r => setTimeout(r, 600));

  const 场景 = async (label, fn) => {
    await page.evaluate(() => { window.__scrolls = []; });
    const before = await page.evaluate(() => ({
      scrollY: Math.round(window.scrollY),
      caretY: Math.round(document.activeElement.getBoundingClientRect().top)
    }));
    await fn();
    await new Promise(r => setTimeout(r, 1100));
    const after = await page.evaluate(() => {
      const ta = document.querySelector('#newEditor .blk-t');
      const r = ta.getBoundingClientRect();
      // 真实光标位置：镜像测量（和 App 内部同一套算法）
      const caretLineTop = (function () {
        const cs = getComputedStyle(ta);
        const pos = ta.selectionStart == null ? 0 : ta.selectionStart;
        const m = document.createElement('div');
        m.style.cssText = 'position:absolute;visibility:hidden;left:-9999px;top:0;white-space:pre-wrap;word-wrap:break-word;padding:0;border:0';
        m.style.fontFamily = cs.fontFamily; m.style.fontSize = cs.fontSize;
        m.style.fontWeight = cs.fontWeight; m.style.lineHeight = cs.lineHeight;
        m.style.letterSpacing = cs.letterSpacing;
        m.style.width = Math.max(0, ta.clientWidth - parseFloat(cs.paddingLeft||'0') - parseFloat(cs.paddingRight||'0')) + 'px';
        m.textContent = ta.value.substring(0, pos);
        const s = document.createElement('span'); s.textContent = '\u200b';
        m.appendChild(s); document.body.appendChild(m);
        const y = r.top + s.offsetTop;
        document.body.removeChild(m);
        return y;
      })();
      return {
        光标行Y: Math.round(caretLineTop),
        光标可见: caretLineTop > 0 && caretLineTop < window.innerHeight,
        光标在键盘上方: caretLineTop < window.innerHeight * 0.62,
        scrollY: Math.round(window.scrollY),
        滚动次数: window.__scrolls.length,
        滚动明细: window.__scrolls.join(','),
        输入框_顶: Math.round(r.top),
        输入框_底: Math.round(r.bottom),
        输入框_高: Math.round(r.height),
        视口高: window.innerHeight,
        还在第一行: (function () {
          // 把前 8 个字的高度当第一行，看它是不是可见
          const m = document.createElement('div');
          const cs = getComputedStyle(ta);
          m.style.cssText = 'position:absolute;visibility:hidden;white-space:pre-wrap;width:' + ta.clientWidth + 'px';
          m.style.font = cs.fontSize + '/' + cs.lineHeight + ' ' + cs.fontFamily;
          m.textContent = ta.value.substring(0, 60);
          document.body.appendChild(m);
          const firstLineTop = m.getBoundingClientRect().top;
          document.body.removeChild(m);
          return firstLineTop > 0 && firstLineTop < window.innerHeight * 0.9;
        })()
      };
    });
    console.log('\n【' + label + '】');
    console.log('  滚动前 scrollY=' + before.scrollY + ' → 滚动后 scrollY=' + after.scrollY + '（滚了 ' + (after.scrollY - before.scrollY) + 'px）');
    console.log('  自动滚动触发次数 = ' + after.滚动次数 + '  明细: [' + after.滚动明细 + ']');
    console.log('  输入框 顶=' + after.输入框_顶 + ' 底=' + after.输入框_底 + ' 高=' + after.输入框_高 + '（视口 ' + after.视口高 + '）');
    console.log('  光标行 Y=' + after.光标行Y + ' 可见=' + (after.光标可见 ? '✅' : '❌') + ' 在键盘上方=' + (after.光标在键盘上方 ? '✅' : '❌'));
    console.log('  第一行文字还在视野里 → ' + (after.还在第一行 ? '✅' : '❌'));
    return after;
  };

  // 场景 A：光标移到全文最开头（第一行），然后敲字
  const A = await 场景('A. 点回第一行开头，敲「测试」两字', async () => {
    await page.evaluate(() => { const ta = document.querySelector('#newEditor .blk-t'); ta.focus(); ta.setSelectionRange(0, 0); });
    await new Promise(r => setTimeout(r, 400));
    await page.keyboard.type('测试');
  });

  // 场景 B：连打 20 个字（看会不会累积漂移）
  const B = await 场景('B. 在第一行连打 20 个字', async () => {
    await page.evaluate(() => { const ta = document.querySelector('#newEditor .blk-t'); ta.focus(); ta.setSelectionRange(0, 0); });
    await new Promise(r => setTimeout(r, 400));
    await page.keyboard.type('这是一段连续输入的文字用来测试会不会越跳越远');
  });

  // 场景 C：点侧边空白（textarea 的 padding 区域）
  const C = await 场景('C. 点输入框右侧空白处', async () => {
    const r = await page.evaluate(() => {
      const ta = document.querySelector('#newEditor .blk-t');
      const b = ta.getBoundingClientRect();
      return { x: b.right - 8, y: b.top + 10 };
    });
    await page.mouse.click(r.x, r.y);
  });

  // 场景 D：滚到中间再敲字（确认正常输入时不会乱跳）
  const D = await 场景('D. 先滚到中间，再敲字', async () => {
    await page.evaluate(() => { const ta = document.querySelector('#newEditor .blk-t'); ta.focus(); ta.setSelectionRange(200, 200); });
    await new Promise(r => setTimeout(r, 400));
    await page.keyboard.type('中间插一句');
  });

  console.log('\n===== 结论 =====');
  console.log('A 改第一行后，光标是否可见且在键盘上方 →', (A.光标可见 && A.光标在键盘上方) ? '✅' : '❌');
  console.log('B 连打 20 字后，光标是否可见且在键盘上方 →', (B.光标可见 && B.光标在键盘上方) ? '✅' : '❌');
  console.log('C 点侧边空白后，光标是否可见且在键盘上方 →', (C.光标可见 && C.光标在键盘上方) ? '✅' : '❌');
  console.log('D 中途插字后，光标是否可见且在键盘上方 →', (D.光标可见 && D.光标在键盘上方) ? '✅' : '❌');
  console.log('\n最关键的三个数（自动滚动次数应明显变小）：');
  console.log('  A=' + A.滚动次数 + '  B=' + B.滚动次数 + '  C=' + C.滚动次数 + '  D=' + D.滚动次数);

  await page.screenshot({ path: path.join(OUT, 'chk-滚动-v107.png') });
  await browser.close();
  server.close();
})().catch(e => { console.error('跑挂了：', e); process.exit(1); });
