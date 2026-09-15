import os, glob, shutil, zipfile
from PIL import Image

base = r"E:\北辰\浩总的个人知识库\产出\读书内容\配图"
d = os.path.join(base, "会散了他们被忘在墙角社card")
zip_path = os.path.join(base, "会散了他们被忘在墙角社card.zip")

expect = {'xhs': (1080, 1440), 'wechat-21x9': (2100, 900), 'wechat-1x1': (1080, 1080)}
ok = True
for f in sorted(glob.glob(os.path.join(d, "*.jpg"))):
    name = os.path.basename(f)
    im = Image.open(f).convert("RGB")
    w, h = im.size
    exp = next((v for k, v in expect.items() if name.startswith(k)), None)
    px = [im.getpixel((5, 5)), im.getpixel((w - 6, 5)), im.getpixel((5, h - 6)), im.getpixel((w - 6, h - 6))]
    dark = [p for p in px if sum(p) < 400]
    good = (exp == (w, h)) and not dark
    if not good:
        ok = False
    print(f"[{'OK' if good else '!!'}] {name}  {w}x{h}  exp={exp}  corners={px[0]}")
print("\n总判定:", "全部通过" if ok else "有问题，需复查")

src = os.path.join(d, "wechat-21x9-cover.jpg")
dst = os.path.join(base, "公众号封面_第27天_会散了他们被忘在墙角_21x9.jpg")
shutil.copy2(src, dst)
print("\ncover copied:", os.path.basename(dst))
