# -*- coding: utf-8 -*-
"""知识库 Index 体检（只读，不改任何文件）。

用法：
    python config/check_index.py

查三件事：
    1. 每个「知识主题/<主题>/」目录下的页面，有没有在 Index.md 里出现（漏列＝孤儿页）
    2. 概览表的计数有没有跟实际文件数对上
    3. 主题详情行写的页面名，有没有对应的文件（写了但文件不在＝死行）

为什么需要它（2026-10-04）：
    建完「频率错觉」那张卡之后顺手比了一下，发现「个人成长」目录里有 69 个 .md，
    Index 只列了 66 行——漏掉的三页里有两页（可携带手艺 / 故事化思考）是在
    回信沉淀里被反复引用的重要页。
    教训：**Index 的计数是"列了几行"，不是"有多少页"**，人眼数不过来，脚本可以。
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, '知识库', 'Index.md')
THEME_DIR = os.path.join(ROOT, '知识库', '知识主题')


def read_index():
    with io.open(INDEX, encoding='utf-8') as f:
        return f.read()


def listed_pages(text):
    """Index 里出现过的所有 [[页面名]]（去掉 #锚点 和 |别名）。"""
    names = set()
    for raw in re.findall(r'\[\[([^\]]+)\]\]', text):
        names.add(raw.split('|')[0].split('#')[0].strip())
    return names


def count_column(text):
    """读概览表 `| 主题 | 状态 | 数字 |` —— 返回 {主题: 计数}。"""
    out = {}
    for line in text.split('\n'):
        m = re.match(r'^\|\s*([^|]+?)\s*\|\s*[^|]*\|\s*(\d+)\s*\|', line)
        if m:
            out[m.group(1).strip()] = int(m.group(2))
    return out


def main():
    text = read_index()
    listed = listed_pages(text)
    counts = count_column(text)
    bad = 0

    print('知识库 Index 体检（只读）')
    print('=' * 46)

    if not os.path.isdir(THEME_DIR):
        print('找不到目录：%s' % THEME_DIR)
        return 1

    for theme in sorted(os.listdir(THEME_DIR)):
        d = os.path.join(THEME_DIR, theme)
        if not os.path.isdir(d):
            continue
        files = sorted(f[:-3] for f in os.listdir(d) if f.endswith('.md'))
        miss = [n for n in files if n not in listed]
        # 概览表里写了计数、但跟实际文件数不一致
        declared = counts.get(theme)

        flags = []
        if miss:
            flags.append('漏列 %d 页' % len(miss))
        if declared is not None and declared != len(files):
            flags.append('计数 %s ≠ 实际 %d' % (declared, len(files)))

        if not flags:
            print('✅ %-8s %3d 页' % (theme, len(files)))
            continue

        bad += 1
        print('⚠️  %-8s %3d 页  —— %s' % (theme, len(files), '；'.join(flags)))
        for n in miss:
            print('      · 漏列：%s' % n)
        if declared is not None and declared != len(files):
            print('      · 概览表 ｜ %s ｜ = %d，应改为 %d' % (theme, declared, len(files)))

    print('-' * 46)
    if bad == 0:
        print('全部对齐 ✅')
    else:
        print('有 %d 个主题需要处理（补详情行 + 改计数）' % bad)
    print('提示：补完重跑本脚本，再跑 rebuild_index_tables.py --write 重建回信表。')
    return 0


if __name__ == '__main__':
    sys.exit(main())
