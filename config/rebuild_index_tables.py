# -*- coding: utf-8 -*-
"""按知识库实际文件重建 Index.md 的表格节。

用法：
    python config/rebuild_index_tables.py           # 预览（不改文件）
    python config/rebuild_index_tables.py --write   # 写入

为什么需要它：
    2026-09-12 / 09-13 / 09-22 三次出现「Git 自动同步把 知识库/Index.md 整体
    重写成模板版」，导致「## 日记回信」节退化为 _（暂无记录）_，几十行索引
    全部丢失。回信 .md 文件本身完好，所以可以用本脚本按目录实际文件秒级恢复。

当前只重建「日记回信」节（格式固定：日期 | 回信 | 原稿）。
其他节（每日记录 / 人物 / 日记衍生）格式未固化，暂不自动重建。
"""
import argparse
import glob
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, '知识库', 'Index.md')
REP_DIR = os.path.join(ROOT, '知识库', '日记回信')
RAW_DIR = os.path.join(ROOT, '原始材料', '日记')


def diary_dates():
    files = glob.glob(os.path.join(REP_DIR, '*-回信.md'))
    return sorted(os.path.basename(f)[:-6] for f in files)   # 去掉 "-回信.md"


def build_block(dates):
    lines = ['## 日记回信', '', '| 日期 | 回信 | 原稿 |', '|------|------|------|']
    for d in dates:
        miss = '' if os.path.exists(os.path.join(RAW_DIR, d + '.md')) else ' ⚠️缺原稿'
        lines.append('| %s | [[日记回信/%s-回信]] | 原始材料/日记/%s%s |' % (d, d, d, miss))
    return '\n'.join(lines) + '\n'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--write', action='store_true', help='真正写回 Index.md')
    args = ap.parse_args()

    if not os.path.exists(INDEX):
        print('找不到 %s' % INDEX)
        return 1

    dates = diary_dates()
    if not dates:
        print('知识库/日记回信/ 下没有回信文件，中止')
        return 1

    text = open(INDEX, encoding='utf-8').read()
    if '## 日记回信' not in text:
        print('Index.md 里找不到「## 日记回信」节，请人工检查')
        return 1

    # 匹配该节下的旧内容：要么是「_（暂无记录）_」占位，要么是已有表格行
    pat = re.compile(r'## 日记回信\n\n(?:_.+?_\n|(?:\|.*\n)+)')
    if not pat.search(text):
        print('匹配不到该节旧内容（可能是格式变了），请人工检查')
        return 1

    new_text = pat.sub(build_block(dates), text, count=1)
    missing = [d for d in dates if not os.path.exists(os.path.join(RAW_DIR, d + '.md'))]

    print('回信文件 %d 个：%s ~ %s' % (len(dates), dates[0], dates[-1]))
    if missing:
        print('⚠️ 缺原稿的日期：%s' % '、'.join(missing))
    if new_text == text:
        print('内容无变化，无需写入')
        return 0
    if args.write:
        open(INDEX, 'w', encoding='utf-8').write(new_text)
        print('已写入 %s' % INDEX)
    else:
        print('（预览模式，确认无误后加 --write 写入）')
    return 0


if __name__ == '__main__':
    sys.exit(main())
