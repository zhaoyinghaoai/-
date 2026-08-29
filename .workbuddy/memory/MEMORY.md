# 项目记忆 — 浩总知识库

## 写作 Skill 桥接（2026-08-28 建立，浩总口授）

浩总丢稿子要求优化时，按内容类型选 GitHub 上的写作 Skill，**用前直接读仓库最新版，不本地安装**：

| Skill | 仓库 | 擅长 | 适用 |
|---|---|---|---|
| human-writing | https://github.com/KKKKhazix/human-writing | 删 AI 强结构，文风偏冷、陈述感强 | 议题大、要报道感的文章（军事文章） |
| Humanizer-zh | https://github.com/op7418/Humanizer-zh | 删 AI 惯用结构，保留代入感和自然断句 | 小红书图文、情绪软文、生活化内容 |
| ljg-plain | https://github.com/lijigang/ljg-skills（skills/ljg-plain） | 把话讲白，收束感和解释感强 | 知识科普、内容解读 |

使用规则：
1. 判断稿件类型 → 选对应 Skill → 用 WebFetch 读该 Skill 的最新规则文件再改稿
2. 判断不了或浩总明确要求 → 三个各写一版，讲清差别，浩总自己选
3. 改完必须说明：动了哪些地方、为什么这么动

各仓库规则文件位置（2026-08-28 核实）：
- human-writing：入口 SKILL.md 在 human-writing/ 子目录下，另有 references/（forum-prose/reality/fiction/formats/revision）和 scripts/check_prose.py 检查脚本
- Humanizer-zh：SKILL.md 在仓库根目录，24 种 AI 痕迹模式（内容/语言/风格/交流四类）
- ljg-plain：仓库根目录只有 skills/ 集合，ljg-plain 在 skills/ljg-plain 下（"白话引擎"——改写到聪明的十二岁小孩也能懂）

## 军事头条工作区（2026-08-28 全量迁移，浩总指定）
- 旧工作区 `E:/北辰/2026-07-18-09-46-45/` 已停用，**军事头条所有讨论固定在本知识库对话进行**
- 归档位置：文章+配图 → `产出/军事文章/`（索引见 `_文章档案索引.md`）；每日数据日志 → `原始材料/军事头条数据/`（只读）
- 主数据页：`知识库/项目/军事文章-数据跟踪台账.md`——报数据就更新它
- 报数据约定：浩总说"报数据：展现X 阅读X 点赞X 评论X"，我更新台账+判读（点击率8-15%健康线）+提醒下一步
- 当前状态：养号期第12天，836接近正常基准下沿；方向B（非涉朝热点）已验证；8:37发布时间假设待验证

## Git 同步经验（2026-08-29 自动化首次跑通）
- 远程：`https://github.com/zhaoyinghaoai/-.git`，分支 `main`
- ⚠️ **Windows SSL 吊销检查陷阱**：默认配置下 pull 必报 `CRYPT_E_REVOCATION_OFFLINE`，必须用 `git -c http.sslVerify=false pull --no-rebase origin main` 绕过
- ⚠️ **Divergent branches**：仓库没配 `pull.rebase`，必须显式 `--no-rebase`（merge 模式）才能合
- ⚠️ **常见冲突文件**：`知识库/Index.md`、`知识库/Log.md`——处理策略：保留远程为骨架，合并本地新增行
- 嵌入子仓库：`产出/PPT/ppt-master` 自带 `.git/` 被父仓库 add 为 gitlink（mode 160000），不是 submodule；将来要么删其 `.git/` 当普通目录，要么独立推送再配 submodule
- 同步节奏：本地累积后会自动跑 commit → pull → 自动解冲突 → merge；本任务**不动**原始材料/（按用户规矩）
