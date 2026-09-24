# DVIDS 军事配图作业手册

> 从 DVIDS（美国国防视觉信息分发服务）找军事配图的完整操作手册。
> **规则层**（该不该用、判据红线）在 `.workbuddy/memory/MEMORY.md` 的「配图」一节；本手册只管**怎么找、怎么下**。
> 最后更新：2026-09-17

---

## 一、为什么用 DVIDS

图源优先级：**DVIDS（可代下载·公版）** → 头条免费图库 → 提醒浩总自己搜。

- DVIDS 是美国国防部官方影像库，**美国政府作品 = 公版**，可商用，无水印风险
- ❌ 淘汰：游戏 CG、AI 生成图、带水印图、标题截图、会场照（主办方 logo 大字 + 一堆后脑勺）

---

## 二、图片直链格式

```
照片：https://d1ldvf68ux039x.cloudfront.net/thumbs/photos/{YYMM}/{ID}/2000w_q95.jpg
视频帧：https://d1ldvf68ux039x.cloudfront.net/thumbs/frames/video/{YYMM}/{ID}/DOD_xxx.0000001/2000w_q95.jpg
```

- ✅ **2000w / 1000w 可用**；❌ **original 一律 404**
- ⚠️ 视频帧常带 **AFN PACIFIC** 水印 → 按"图上不能有文字"淘汰，优先找静照

### 🔴 {YYMM} 是「发布日期」，不是拍摄日期

2026-09-17 踩坑记录：ID 9799102 拍摄 06-30、发布 07-08 → 目录是 `2607`。
先试 `2606`、`2608` 都拿 404，浪费整轮尝试才反应过来。

**✅ 正解：不要猜。** 抓 `/image/{id}/{slug}` 页面 HTML，grep `cloudfront.net/thumbs/photos/`，一步拿到 `{YYMM}/{ID}` 真实路径。

```bash
curl -s -L --insecure -A "<完整浏览器UA>" "https://www.dvidshub.net/image/{ID}/{slug}" \
  | grep -o 'cloudfront.net/thumbs/photos/[^"]*' | head -5
```

---

## 三、搜索页行不通（重要）

- ❌ `/search?q=xxx` → 返回 202 空页或反爬挑战页；api → 403
- ✅ **改抓这几类页面，再从 HTML 里 grep 图片 ID**：
  - `/unit/{unit-slug}` —— 部队页
  - `/feature/{slug}` —— 专题页（**精选图质量最高**）
  - `/news/{id}` —— 新闻页
  - `/video/{id}/{slug}` —— 视频页（帧走 frames 路径）
- 抓取需要：`-L --insecure` + **完整浏览器 UA**（否则反爬）
- ⚠️ **`/image/{id}` 页面任何 ID 都返回 200**，不具区分度，**不能用来探测 ID 是否存在**

---

## 四、筛图技巧（省时间的关键）

1. **slug 关键词可直接反推内容，不用下载就能筛。**
   `/image/{id}/{slug}` 里的 slug 是内容描述，例如：
   - `afrl-demonstrates-modular-multimode-propulsion-system-sustained-space-maneuver`
   - `golden-dome-deputy-discusses-missile-defense`
   - `ndia-swf-usspacecom-leaders-emphasize-allied-and-commercial-integration...`

   **先读 slug 再决定下不下**，能省掉大量"下载 → 看图 → 淘汰"的循环。

2. **先在 WebSearch 里搜 `dvidshub.net <关键词>`**，能直接命中 `/image/{id}/{slug}` 和 `/feature/{slug}` 的页面标题与简介（简介含拍摄日期、地点、供稿单位），比瞎试 slug 快得多。

3. **下载前先抓页面拿直链**，别猜 `{YYMM}`。

4. **🔴 日本军舰题材：先放大查桅杆挂旗（9-23 立案，红线级）**

   日本海上自衛隊军舰出访/参演时会挂**旭日旗**（白底红日＋放射线）。这在中文舆论场是敏感符号，**绝对不能进配图**。

   9-23 实测：日美同盟题材抓了 `6403078`（Shiranui 与 Shiloh 并排）和 `6403278`（日舰编队）两张，**构图、主体、清晰度全部合格**，但裁桅杆放大 3 倍后确认——**两艘日舰挂的都是旭日旗**，全部淘汰。

   **必做检查步骤**（日舰类图一律走一遍）：
   ```python
   from PIL import Image
   im = Image.open(f); w, h = im.size
   c = im.crop((int(w*0.45), int(h*0.08), int(w*0.90), int(h*0.55)))
   c.resize((c.width*3, c.height*3)).save('_检查过程/flag.png')
   ```

   **替代方向**：日美同盟题材优先用**士兵/装备同框**（无旗、无文字），如 `9942480`（东方之盾 26，美日士兵训练场握手，可用）。

5. **🔴 基地/驻军题材：先查「标牌文字」（9-24 立案）**

   美军基地题材的图，**最容易踩的坑不是国旗也不是人脸，是标牌文字**——基地车辆、仪式背板、机身上到处是字。

   9-24 实测：驻日美军篇抓 6 张，毙 5 张，**其中 3 张的致命伤全是文字**：
   - `9438578`／`9438585`——机场管理皮卡，车身上贴着 **"Airfield Management / 飛行場の管理"** 大牌子
   - `9934065`——多国演习闭幕式，背景是**整块文字背板**（"PACIFIC PARTNERSHIP 2026 CLOSING CEREMONY"）

   **高危点清单**：基地车辆职能标牌 / 仪式背板与横幅 / 机身侧面军种与国名字样 / 车牌 / 基地界牌。

   **检查法**：下完后先放大**机身侧面**和**车辆侧面**区域：
   ```python
   from PIL import Image
   im = Image.open(f); w, h = im.size
   c = im.crop((int(w*0.50), int(h*0.28), int(w*0.80), int(h*0.60)))
   c.resize((c.width*3, c.height*3)).save('_检查过程/check_body.png')
   ```

   **✅ 反常识的可用方向**：**夜间／低光的装备作业照**。光线暗反而躲掉了文字——如 `9438590`（嘉手纳 C-130 夜间滑行，灯光打亮机身，文字全部不可读），画面张力还比白天强。

   **❌ 同题材的直接死路**：仪式合影（必有背板文字＋一排人脸）、乐队演出（人脸密集）、纪念活动。

---

## 五、slug 库（按题材记）

### ✅ 可用

| 题材 | slug |
|---|---|
| 陆军日本 | `USARJ` |
| 演习 | `feature/orientshield`、`feature/valiantshield` |
| 太空 | `USSPACECOM`（太空司令部）、`SSC`（太空系统司令部）、`MDA`（导弹防御局）、`S4S`、`AFRL`（空军研究实验室）、`feature/X37BOTV` |
| 中东海上 | `CENTCOM`（能开，但页面内容偏埃及航展 / Eager Lion 演习） |
| 欧洲/北约东翼 | `USAFE`（驻欧美国空军，**页面图偏 9-11 纪念/开放日/命名仪式等仪式类**）、`VCorps`（第五军，驻波兰主力，有实兵演习图） |

### ❌ 全 404

- 太空：`USSF`、`space-force`、`Vandenberg`、`SpOC`（`MDA` 以外的太空单位多半没有独立页）
- 中东海上：`NAVCENT`、`FIFTHFLT`、`CTF-55`、`CTF-153`、`feature/red-sea`、`feature/hormuz`、`feature/maritime`
- 欧洲：`US-Army-Europe`、`USAREUR-AF`、`US-Navy-Europe`

---

## 六、按题材找图的入口关键词

### 美军海上画面（9-17 发现）

**CENTCOM 公共事务从 2026-06 起在主动发布中东海上军力照**（航母编队、单舰航行，如 `US Navy Warships and Aircraft Transit Arabian Sea`）。这类图比翻老图库有效得多。

```
dvidshub.net image CENTCOM Arabian Sea warships
```

⚠️ 注意是"阿拉伯海"不是"曼德海峡"，同战区不同点，逻辑上够用。

### 军事铁路/补给线画面（9-17 发现）

美军往东翼运装备**主要走铁路**，`railhead`（铁路终端装卸）题材图源充足，天然贴合"补给线/军援通道"类选题。

```
dvidshub.net railhead operations train loading military Europe
```

另：`Grafenwoehr`（德国格拉芬沃尔）铁路终端修缮项目 = "欧洲把铁路当战备资产加固"的现成佐证图。

### ⚠️ 太空题材的坑（9-16）

太空军相关单位页面的图**绝大多数是会议照、纪念仪式、切蛋糕、人事合影**，或"技术测试暗照"（画面极暗看不清主体）。

**能用的只有三类**：
1. **火箭发射**（`USSF-xx` 任务）
2. **装备正面特写**（如 X-37B 着陆照）
3. `feature/` 专题页精选图

**封面优先去搜 `USSF-` 发射任务和 `feature/` 专题。**

---

## 六·五、🔴 图片源白名单（9-20 实测）——决定了哪些题材根本下不了图

**9-20 逐域名实测（`curl -o /dev/null -w "%{http_code}"`）：**

| 域名 | 结果 |
|---|---|
| `dvidshub.net` | **200 ✅** |
| `images.unsplash.com` | **200 ✅** |
| `upload.wikimedia.org`／`commons.wikimedia.org`／`en.wikipedia.org` | ❌ 000 |
| `officialgazette.gov.ph`／`senate.gov.ph`／`pco.gov.ph`（菲律宾官方源） | ❌ 000 |
| `images.pexels.com`／`api.pexels.com`／`cdn.pixabay.com` | ❌ 000 |

### 结论：我这边只下得了两类图

1. **美军题材**（DVIDS）→ 装备、演习、舰艇、发射
2. **通用素材**（Unsplash）→ 风景、城市、抽象

### 🔴 由此得出一条硬规矩

**非军事题材（他国政局、司法、议会、历史人物）我基本下不了图。** 原因：
- DVIDS 是美军图库 → 菲律宾政局只能搜到**美菲联合演习照** → **跑题**（9-20 实测三轮，全是 Balikatan／Salaknib，一张都不能用）
- Wikimedia（公版老照片的宝库）不通 → **历史人物旧照（如老马科斯）拿不到**
- 各国政府官网不通 → **官方新闻照拿不到**

### 所以分工是

| 题材 | 谁找图 |
|---|---|
| 军事／装备／演习 | **我**（DVIDS） |
| 政局／人物／议会／历史 | **浩总**（头条免费图库，更快且有版权保障） |

**要早判断、早分工，别在发布前十分钟才发现下不了图。**

---

## 七、已下载素材索引
| 篇目 | 目录 | 封面来源 |
|---|---|---|
| 菲律宾莎拉名单篇（9-20） | — | 封面浩总自查（莎拉讲话照）；**正文图 2/3 未解决** |
| 胡塞通行证篇（9-17） | `产出/军事文章/配图_胡塞通行证篇_20260917/` | DVIDS 9799102 航母编队扇形展开（阿拉伯海） |
| 波兰边境无人机篇（9-17） | `产出/军事文章/配图_波兰边境无人机篇_20260917/` | DVIDS 9583648 军列装载悍马向纵深延伸 |
| 外层空间武器化篇（9-16） | `产出/军事文章/配图_外层空间武器化篇_20260916/` | DVIDS 9272016 X-37B 夜间发射（USSF-36） |
| 国防部助长日本军事野心篇（9-15） | `产出/军事文章/配图_国防部助长日本军事野心篇_20260915/` | DVIDS HIMARS 发射车（双车） |
