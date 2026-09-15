/**
 * 随手库 · 样品图拍摄脚本 v2（按真实 DOM 结构）
 * 存储键：suishouku_v09
 * 用法：node _shoot_demo.js
 */
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe';
const APP_HTML = path.join(__dirname, 'app-v05', 'index.html');
const OUT_DIR = path.join(__dirname, '样品图');
const V = '3'; // deviceScaleFactor

const DEMO = [
  { id: 'd1', text: '响尾蛇导弹靠追热源飞。像快递点的取暖器，谁热它往谁那儿去。', time: Date.now() - 1800000, cat: '写作' },
  { id: 'd2', text: '「腹中贮书一万卷，不肯低头在草莽。」——李颀', time: Date.now() - 5400000, cat: '读书' },
  { id: 'd3', text: '秦癫子：会散了，他们被忘在墙角。手续完备，把大家放回来了。', time: Date.now() - 90000000, cat: '读书' },
];

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH, headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: Number(V) });
  const url = 'file:///' + APP_HTML.replace(/\\/g, '/');

  // 先灌数据
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.evaluate((demo) => {
    localStorage.setItem('suishouku_v09', JSON.stringify({ items: demo, cats: ['写作', '读书', '灵感', '生活', '杂记'] }));
  }, DEMO);
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  const shot = async (name) => {
    await new Promise(r => setTimeout(r, 700));
    await page.screenshot({ path: path.join(OUT_DIR, name + '.png') });
    console.log('已拍:', name);
  };

  // ① 首页
  await shot('1_首页');

  // ② 记录页（点底部中间的 + ）
  await page.evaluate(() => {
    const fab = document.querySelector('.fab') ||
      [...document.querySelectorAll('button,div')].find(el => (el.textContent || '').trim() === '+');
    fab && fab.click();
  });
  await new Promise(r => setTimeout(r, 800));
  // 如果有输入框，填一句示例
  await page.evaluate(() => {
    const ta = document.querySelector('textarea,input[type="text"]');
    if (ta) { ta.value = '响尾蛇导弹靠追热源飞，像快递点的取暖器。'; ta.dispatchEvent(new Event('input', { bubbles: true })); }
  });
  await shot('2_记录');

  // ③ 搜索页
  await page.evaluate(() => {
    const s = [...document.querySelectorAll('button,div')].find(el => (el.textContent || '').trim() === '搜索');
    s && s.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.evaluate(() => {
    const ta = document.querySelector('input,textarea');
    if (ta) { ta.value = '导弹'; ta.dispatchEvent(new Event('input', { bubbles: true })); }
  });
  await shot('3_搜索');

  // ④ 详情页（回首页点第一张卡）
  await page.evaluate(() => {
    const h = [...document.querySelectorAll('button,div')].find(el => (el.textContent || '').trim() === '笔记');
    h && h.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.evaluate(() => {
    const card = document.querySelector('.fc-copy') && document.querySelector('.fc-copy').closest('div');
    card && card.click();
  });
  await shot('4_详情');

  await browser.close();
  console.log('DONE ->', OUT_DIR);
})().catch(e => { console.error('SHOOT_ERROR:', e.message); process.exit(1); });
