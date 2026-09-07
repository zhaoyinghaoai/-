from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1350
BG = (238, 241, 245)
NAVY = (31, 58, 95)
WHITE = (255, 255, 255)
GRAY = (120, 130, 140)
LINE = (210, 216, 224)
GOLD = (230, 175, 70)

img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

def font(size):
    try:
        return ImageFont.truetype("C:/Windows/Fonts/msyh.ttc", size)
    except Exception:
        return ImageFont.load_default()

# header
d.rectangle([0, 0, W, 180], fill=NAVY)
d.text((60, 50), "Obsidian 知识库搭建", font=font(54), fill=WHITE)
d.text((60, 118), "收费接单 · 按你的习惯定制", font=font(30), fill=(200, 214, 230))

# 首期免费条
d.rectangle([0, 180, W, 258], fill=GOLD)
d.text((60, 198), "首期免费 · 仅限3位 · 10号前报名", font=font(42), fill=NAVY)

plans = [
    ("基础版", "¥149", ["定好结构框架", "你自己的料自己填"], False),
    ("标准版", "¥399", ["框架 + 搬老资料分类", "大多数人选这个", "交完就能用"], True),
    ("旗舰版", "¥799", ["标准版 + 1对1 带教两周", "养成习惯不半途而废"], False),
]
bx, bw, bh, y0, gap = 60, W - 120, 290, 286, 24
for i, (name, price, items, hot) in enumerate(plans):
    y = y0 + i * (bh + gap)
    if hot:
        d.rectangle([bx, y, bx + bw, y + bh], fill=NAVY)
        tc, ic, nc = WHITE, (205, 218, 235), WHITE
    else:
        d.rectangle([bx, y, bx + bw, y + bh], fill=WHITE, outline=LINE, width=2)
        tc, ic, nc = NAVY, GRAY, NAVY
    d.text((bx + 30, y + 26), name, font=font(40), fill=nc)
    if hot:
        d.text((bx + bw - 140, y + 28), "推荐", font=font(30), fill=GOLD)
    d.text((bx + 30, y + 90), price, font=font(64), fill=tc)
    iy = y + 178
    for it in items:
        d.text((bx + 30, iy), "· " + it, font=font(28), fill=ic)
        iy += 42

d.text((60, H - 92), "#个人知识库   先发你自查清单，对得上就带你", font=font(28), fill=NAVY)
d.text((60, H - 48), "示例价 · 以你最终定价为准", font=font(22), fill=GRAY)

out = "E:/北辰/浩总的个人知识库/产出/朋友圈配图/obsidian_service_card_2026-09-07.png"
img.save(out)
print("saved:", out)
