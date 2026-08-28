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
