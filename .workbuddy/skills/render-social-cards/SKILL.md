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
   - `C:/Users/Administrator/AppData/Local/Google/Chrome/Application/chrome.exe`
   - `C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`
   - `C:/Program Files/Microsoft/Edge/Application/msedge.exe`
3. 如果以上都没有，不要尝试 `npm install puppeteer`（沙箱会阻止 postinstall 的 cmd.exe spawn）。改用其他方案或告知用户手动安装 Chrome。

## 渲染流程

1. 定位 `cards.html` 所在目录
2. 在该目录下创建或更新 `render.js`，使用 `puppeteer-core` 并指定系统 Chrome 的 `executablePath`
3. 运行：
   ```bash
   cd <cards.html 所在目录>
   NODE_PATH="C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules" \
     "C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2/node.exe" render.js
   ```
4. 检查输出 PNG 文件是否存在，尺寸是否正确
5. 用 `present_files` 把 PNG 展示给用户

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
- **viewport 要足够大**：否则大尺寸 poster 会被截断。2100×1440 可以覆盖小红书 1080×1440 和公众号 2100×900。

## 输出命名建议

小红书系列：`xhs-01-cover.png`、`xhs-02-keypoint.png`...
公众号封面：`wechat-21x9-cover.png`、`wechat-1x1-cover.png`

## 文件位置

- 项目级 skill 目录：`E:/北辰/浩总的个人知识库/.workbuddy/skills/render-social-cards/`
- 通用渲染脚本：`scripts/render.js`
