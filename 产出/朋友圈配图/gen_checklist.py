from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1480
BG = (238, 241, 245)
NAVY = (31, 58, 95)
WHITE = (255, 255, 255)
GRAY = (120, 130, 140)
LINE = (210, 216, 224)
LIGHT = (200, 214, 230)

img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

def font(size):
    try:
        return ImageFont.truetype("C:/Windows/Fonts/msyh.ttc", size)
    except Exception:
        return ImageFont.load_default()

# header
d.rectangle([0, 0, W, 170], fill=NAVY)
d.text((60, 46), "个人知识库搭建 · 自查清单", font=font(52), fill=WHITE)
d.text((60, 116), "首期免费 · 仅3位 · 10号前报名", font=font(30), fill=LIGHT)

# 说明
d.text((60, 198), "回我下面几个，看看适不适合带你：", font=font(32), fill=NAVY)

qs = [
    ("1. 资料都散在哪些地方？", "□微信收藏 □备忘录 □文件夹", "□网盘 □笔记App □纸质"),
    ("2. 存了再没打开过的，攒了多少？（随便估）", "", ""),
    ("3. 想用知识库解决啥？", "□写东西找素材 □读书笔记", "□工作归档 □副业素材 □学习"),
    ("4. 手机多还是电脑多？装过 Obsidian 没？", "", ""),
    ("5. 每周能匀多少时间打理？（半小时也行）", "", ""),
    ("6. 最头疼的一个资料乱象是啥？写一句", "", ""),
]

y0, bh, gap = 270, 150, 20
for i, (q, l1, l2) in enumerate(qs):
    y = y0 + i * (bh + gap)
    d.rectangle([40, y, W - 40, y + bh], fill=WHITE, outline=LINE, width=2)
    d.text((60, y + 16), q, font=font(30), fill=NAVY)
    if l1:
        d.text((60, y + 68), l1, font=font(26), fill=GRAY)
    if l2:
        d.text((60, y + 106), l2, font=font(26), fill=GRAY)

d.text((60, H - 112), "回完我帮你判断：对得上就带你，", font=font(30), fill=NAVY)
d.text((60, H - 68), "对不上也给你指条自己弄的路。", font=font(30), fill=NAVY)

out = "E:/北辰/浩总的个人知识库/产出/朋友圈配图/obsidian自查清单_2026-09-07.png"
img.save(out)
print("saved:", out)
