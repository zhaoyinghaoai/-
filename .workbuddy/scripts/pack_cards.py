# -*- coding: utf-8 -*-
"""社card 收尾打包：另存公众号 21:9 封面 + 打 zip。

用法:
    python pack_cards.py <卡片目录> [封面文件名]

例:
    python pack_cards.py "E:/.../配图/她算的是手社card" "公众号封面_第31天_她算的是手_21x9.jpg"

行为:
    1. 把 <卡片目录>/wechat-21x9-cover.jpg 复制到其父目录（配图/），
       文件名为第 2 个参数；省略则默认用 <卡片目录名>_21x9.jpg
    2. 把目录里所有 .jpg + 朋友圈文案3条.md 打包成 <卡片目录名>.zip
       （先 os.remove 旧包，避免 Compress-Archive 那样的"不刷新"问题）

为什么不用 PowerShell Compress-Archive: 实测 -Force 重打包不刷新，zip 里还是旧图。
"""
import os
import shutil
import sys
import zipfile

EXCLUDE = {"cards.html", "render.js", "render_1x1.js"}
ALWAYS = ["朋友圈文案3条.md"]


def main() -> None:
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    src = os.path.abspath(sys.argv[1])
    if not os.path.isdir(src):
        print("目录不存在:", src)
        sys.exit(1)
    folder_name = os.path.basename(src)
    parent = os.path.dirname(src)

    # 1) 另存封面
    wide = os.path.join(src, "wechat-21x9-cover.jpg")
    if os.path.exists(wide):
        cover_name = sys.argv[2] if len(sys.argv) > 2 else folder_name + "_21x9.jpg"
        dst = os.path.join(parent, cover_name)
        shutil.copyfile(wide, dst)
        print("cover ->", dst)
    else:
        print("!! 没找到 wechat-21x9-cover.jpg，跳过封面另存")

    # 2) 打 zip
    zip_path = os.path.join(src, folder_name + ".zip")
    if os.path.exists(zip_path):
        os.remove(zip_path)

    items = []
    for n in sorted(os.listdir(src)):
        p = os.path.join(src, n)
        if not os.path.isfile(p):
            continue
        if n.endswith(".zip") or n in EXCLUDE:
            continue
        if n.endswith(".jpg") or n in ALWAYS:
            items.append(n)

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        for n in items:
            z.write(os.path.join(src, n), n)
            print("  +", n, os.path.getsize(os.path.join(src, n)))
    print("zip ->", zip_path, os.path.getsize(zip_path), "bytes")


if __name__ == "__main__":
    main()
