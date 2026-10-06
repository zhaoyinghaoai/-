# -*- coding: utf-8 -*-
"""
生成「财经公式复习提醒」日历文件（.ics）
节奏：学完某公式后的第 1 / 3 / 7 / 21 天各出一次默推题。
事件只做「提醒」——到点响铃，浩总切回对话框说一句「出道题」。
出题本身仍然只在那一个对话框里发生（自动化会开新会话，已废弃）。
"""
import os

OUT = r"E:\北辰\浩总的个人知识库\产出\学习\财经复习提醒_1-3-7-21.ics"

# (日期, 到点清单, 备注)
EVENTS = [
    ("20261006", "期望值 第7天 ／ 72法则 第7天 ／ NPV 第1天 ／ 夏普 第3天(顺延) ／ DCF 第1天(顺延)",
     "五项撞车，只出一道。按「距上次复习最久」优先：先期望值或 72 法则。72法则这道必须带观察项：考纯整数的「次数→倍数」（比如 72÷8=9年 → 63÷9=7次 → 2^7=128倍）。"),
    ("20261007", "DCF 第3天", "DCF 刚学完第二天，出三笔现金流的估价题，换新数字。"),
    ("20261008", "复利公式 第7天 ／ 折现 第7天 ／ NPV 第3天",
     "三项撞车，只出一道。复利和折现是同一个式子的两个方向（FV=PV(1+r)^n ↔ PV=FV/(1+r)^n）。"),
    ("20261009", "夏普比率 第7天", "老坑：夏普高≠收益高（比的是性价比，不是收益）。"),
    ("20261011", "DCF 第7天", "DCF 第二次回炉，验收「各自折、折完再加」有没有留住。"),
    ("20261012", "NPV 第7天", "NPV 第二次回炉。重点验收：折完的现值会不会又被折一遍（等式两边都得是今天的钱）。"),
    ("20261019", "凯利公式 第21天", "凯利最后一次回炉。老卡点照旧先考：赔率＝净赚不是拿回。"),
    ("20261020", "期望值 第21天 ／ 72法则 第21天",
     "两项撞车，只出一道。"),
    ("20261022", "复利公式 第21天 ／ 折现 第21天",
     "两项撞车，只出一道。"),
    ("20261023", "夏普比率 第21天", "夏普最后一次回炉。"),
    ("20261025", "DCF 第21天", "DCF 最后一次回炉。"),
    ("20261026", "NPV 第21天", "NPV 最后一次回炉，财经公式全部收官。"),
]

# 下午 14:00 (CST = UTC+8) → 06:00 UTC
START_UTC = "060000"
END_UTC = "061500"

lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Haozong Knowledge Base//Finance Review 1-3-7-21//CN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:财经公式复习提醒（1-3-7-21）",
    "X-WR-TIMEZONE:Asia/Shanghai",
]

for d, items, note in EVENTS:
    summary = "财经复习 · 出道题"
    desc = "今天到点：" + items + "\\n\\n" + note + "\\n\\n动作：切回那个对话框，说一句「出道题」。"
    lines += [
        "BEGIN:VEVENT",
        "UID:finance-review-%s@haozong.kb" % d,
        "DTSTAMP:20261004T070000Z",
        "DTSTART:%sT%sZ" % (d, START_UTC),
        "DTEND:%sT%sZ" % (d, END_UTC),
        "SUMMARY:%s（%s）" % (summary, items.replace(" ／ ", "＋")),
        "DESCRIPTION:%s" % desc,
        "TRANSP:TRANSPARENT",
        "BEGIN:VALARM",
        "TRIGGER:PT0M",
        "ACTION:DISPLAY",
        "DESCRIPTION:财经复习 · 出道题",
        "END:VALARM",
        "END:VEVENT",
    ]

lines.append("END:VCALENDAR")

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8", newline="") as f:
    f.write("\r\n".join(lines) + "\r\n")

print("已写出：", OUT)
print("事件数：", len(EVENTS))
