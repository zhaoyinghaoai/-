---
name: render-social-cards
description: 把 guizang-social-card 风格的 HTML 社card源文件渲染成 PNG 图片。用于已用 ink-classic（暖纸色+深墨）等主题排好版、只需批量出图的场景。触发词：渲染社card、生成卡片图、把 cards.html 导出图片、出 PNG。
agent_created: true
---

# Render Social Cards

## 用途

把用 HTML/CSS 排好的社card批量渲染成 PNG。尤其适合 guizang-social-card 风格的卡片：ink-classic 主题（暖纸色 #f3f0e8 + 深墨 #0a0a0b）、Editorial Magazine 排版、小红书 3:4 与公众号 21:9/1:1 尺寸。

## 何时使用

- 浩总已经给了公众号文章/读书感悟内容，并明确要求"做卡片"、"做社card"、"生成图片"
- 当前目录下已有 `cards.html`（或类似 HTML 源文件），里面包含若干 `.poster` 元素
- 需要一次性输出多张 PNG，常见数量 6-9 张（小红书系列 + 公众号封面）

## 环境前提

1. 项目级 `puppeteer-core` 已安装在 Node workspace：
   - 路径：`C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules/puppeteer-core`
   - 已验证版本：25.6.0
2. 系统已安装 Chrome/Edge。优先查找：
   - `C:/Users/Administrator/AppData/Local/Google/Chrome/Application/chrome.exe` ✅ 实测可用（2026-09-12 一次渲出 8 张）
   - `C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`
   - `C:/Program Files/Microsoft/Edge/Application/msedge.exe`
3. 如果以上都没有，不要尝试 `npm install puppeteer`（沙箱会阻止 postinstall 的 cmd.exe spawn）。改用其他方案或告知用户手动安装 Chrome。

### ⚠️ 两个必踩的坑（每次都要先处理）

**坑 1：Bash 的 PATH 常年损坏**（报 `dirname: command not found` / `ls: command not found` / `cd: null directory`）。
→ 任何 bash 命令前先补 PATH：
```bash
export PATH="/c/Users/Administrator/.workbuddy/binaries/PortableGit/versions/1.2.0/usr/bin:/c/Users/Administrator/.workbuddy/binaries/PortableGit/versions/1.2.0/bin:/c/Windows/System32:/c/Windows:$PATH"
```

**坑 2：node 版本目录名会变**（历次见过 `22.22.2` → `22.22.2-2` → `22.22.2-3`，硬编码必失效）。
→ 先跑 `ls /c/Users/Administrator/.workbuddy/binaries/node/versions/` 取实际目录名，再拼路径。**不要照抄下面示例里的版本号。**

**坑 3：PowerShell 的 stdout 有时捕获为空**（`Test-Path` / `Get-ChildItem` 都没输出）。
→ 别用它做诊断；一切检查走 bash。

## 渲染流程

1. 定位 `cards.html` 所在目录
2. 在该目录下创建或更新 `render.js`，使用 `puppeteer-core` 并指定系统 Chrome 的 `executablePath`
3. 运行（**先补 PATH、先确认 node 版本目录名**，见上方"两个必踩的坑"）：
   ```bash
   export PATH="/c/Users/Administrator/.workbuddy/binaries/PortableGit/versions/1.2.0/usr/bin:/c/Windows/System32:/c/Windows:$PATH"
   ls /c/Users/Administrator/.workbuddy/binaries/node/versions/     # ← 取实际目录名，别照抄
   cd <cards.html 所在目录>
   NODE_PATH="C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules" \
     "C:/Users/Administrator/.workbuddy/binaries/node/versions/<实际版本目录>/node.exe" render.js
   ```
4. 检查输出文件是否存在、尺寸是否正确（**实际产物是 JPG quality 92，不是 PNG**）
5. 校验用 PIL —— ⚠️ 基础解释器 `versions/*/python.exe` **没有 PIL**，必须用 venv：
   `C:/Users/Administrator/.workbuddy/binaries/python/envs/default/Scripts/python.exe`
6. 用 `present_files` 把图片展示给用户

## 关键代码

`scripts/render.js` 提供通用模板：

- 启动 puppeteer-core 连接系统 Chrome
- viewport 设为 2100×1440，足以覆盖常见 poster 尺寸
- 打开 `file:///` 本地 HTML 路径
- 等待 `document.fonts.ready` + 3 秒，确保字体与布局稳定
- 对每个 `.poster` 截图，命名规则自由定义

如需自定义：
- 修改 `htmlFileName` 指向其他 HTML 文件
- 修改 `outputNames` 数组匹配卡片数量
- 修改 `CHROME_PATH` 为实际 Chrome/Edge 路径

## 常见坑

- **不要用 `require('puppeteer')`**，项目里没有安装完整 puppeteer。必须用 `puppeteer-core`。
- **不要 `npm install puppeteer`**：postinstall 需要 spawn cmd.exe，沙箱环境会报 ENOENT。
- **不要依赖 @puppeteer/browsers**：本项目已验证的版本 API 与文档不一致，下载 Chrome 会 404 或报 `downloadUrls[browser] is not a function`。
- **截图前必须等字体加载完成**：否则会出现文字排版错位或空白。用 `document.fonts.ready` + 额外延时。
- **viewport 要足够大**：否则大尺寸 poster 会被截断。**用 2400×1600**（2100 会切到 21:9 封面右边缘），deviceScaleFactor 1。

## 🔴 排版避让铁律（2026-09-17 谷燕山篇立案，三轮回工换来的）

**意象组（`<g>` 那坨 SVG）与文字块抢位置，是这一套卡最常翻车的地方。** 三条判据：

1. **意象组统一包一层 `transform` 控制位置与缩放**，别一张张调坐标：
   `transform="translate(540,1330) scale(1.18) translate(-540,-1180)"`
   —— 意思是"以 (540,1180) 为锚点放大 1.18 倍，再整体下移 150"。**文字块长的卡（引文多、有小标题）必须压到 1330 这一档**；文字块短的可以回 1180。**先渲染再看，别一次定死。**
2. **xhs（竖版）＝ 文字在上、意象在下**。意象顶端不得高于最末一行正文。判据：把图放大看，最后一行字下面必须留出至少一行白。
3. **21:9 是横向空间，具象意象放中间必被标题横穿**（三轮回工的教训）。**正解＝"左文右图"分栏**：左边标题区，右边只放**一个字的水印（放大到 800+）+ 几何图形**，不放具象插画。同理 **1:1 用"文字在上、图形在下"**。

**通用自检**：渲染完必须**逐张打开看**，不能只看尺寸和四角像素。九张里常有三四张需要返工。

## 🔴 意象可辨识铁律（2026-09-18 胡玉音篇立案，两轮回工换来的）

**这一套卡的意象是"低透明度线稿"，画错了不会报错，只会让人看不出来是什么。** 判据：

1. **别用几何近似画具象物**。反例：用「两个叠起来的椭圆」画石磨 → 渲出来像两个盘子；用「矩形 + 4 条竖线」画手 → 像窗框。**正解是把物体的特征笔画出来**：
   - 手 = 掌（圆角矩形）+ **4 根独立的圆头指条**（宽 31、间距 15，能看出缝）+ 拇指条（`transform="rotate(-24 ...)"`）
   - 石磨/磨把子认不出来 → **换成"被捏细的木把子 + 握着的手"**：上下两条边在中段收窄成细腰（`M 250 1136 L 520 1146 L 800 1136 L 800 1164 L 520 1154 L 250 1164 Z`），手画成圆角方块 + 3 条指节线。**比画整台石磨好十倍**。
   - 人 = 头圆 + 梯形身子（不是「圆 + 一根竖线」，那像图钉）
   - 猪 = 身体椭圆 + 头圆 + 耳朵折线 + 3 条腿 + 尾巴小弧
2. **意象的尺度要够**：内容坐标里最小物体不要小于 60×60，否则缩到 1080 宽后看不清。
3. **21:9 右侧的 meta 小字（第X天／年份）容易被水印大字压住**。排布时保证：水印字右边缘 + 60px 之内不放文字。做法：水印 `x` 往左挪（本次用 `x=1400 font-size=580`），meta 贴最右。
4. **删掉"装饰性噪点"**：随手加的短横/虚线（比如给石磨加纹理）会渲成地上的碎屑，宁可不加。

## 输出命名建议

小红书系列：`xhs-01-cover.jpg`、`xhs-02-keypoint.jpg`...
公众号封面：`wechat-21x9-cover.jpg`、`wechat-1x1-cover.jpg`

## 打包

**不要用 PowerShell `Compress-Archive`**（`-Force` 重打包实测不刷新，zip 里还是旧图）。
**用项目里现成的脚本，别每次重写**：
```bash
export PATH="/c/Users/Administrator/.workbuddy/binaries/PortableGit/versions/1.2.0/usr/bin:/c/Windows/System32:/c/Windows:$PATH"
"C:/Users/Administrator/.workbuddy/binaries/python/envs/default/Scripts/python.exe" \
  "E:/北辰/浩总的个人知识库/.workbuddy/scripts/pack_cards.py" \
  "E:/北辰/浩总的个人知识库/产出/读书内容/配图/<卡片目录>" \
  "公众号封面_第N天_<短标题>_21x9.jpg"
```
它做两件事：①把 `wechat-21x9-cover.jpg` 另存到 `配图/` 下当公众号封面（文件名第二个参数）②把目录里所有 jpg + `朋友圈文案3条.md` 打成 `<目录名>.zip`（先删旧包）。

## 文件位置

- 项目级 skill 目录：`E:/北辰/浩总的个人知识库/.workbuddy/skills/render-social-cards/`
- 通用渲染脚本：`scripts/render.js`
