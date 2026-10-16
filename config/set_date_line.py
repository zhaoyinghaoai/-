#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Index 日期线写入工具（2026-10-15 建）

病根：同一天多会话并行时，日期线容易被"新增"而不是"替换"，
      导致 Index 里出现两行 `_最后更新`（10-15 已踩过一次）。

用法：
    1. 把要追加的内容写进 config/_newdate.txt（纯文本，不要带 `）_`）
    2. 运行：python config/set_date_line.py

行为：
    - 找到所有以 `_最后更新` 开头的行
    - 只保留最后一行作为基底，其余（重复的旧日期线）删除
    - 在基底末尾的 `）_` 之前，追加 _newdate.txt 的内容
    - 写回 Index.md，并删除临时文件

规矩：日期线**只有一行**；完整历史记录在 Log.md，不会因为这里的替换而丢失。
"""

import io
import os
import sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(BASE, '知识库', 'Index.md')
TMP = os.path.join(BASE, 'config', '_newdate.txt')
PREFIX = '_最后更新'
TAIL = '）_'


def main():
    if not os.path.exists(TMP):
        sys.exit('[x] 找不到 %s —— 先把要追加的内容写进这个文件' % TMP)
    if not os.path.exists(INDEX):
        sys.exit('[x] 找不到 %s' % INDEX)

    add = io.open(TMP, encoding='utf-8').read().strip()
    if not add:
        sys.exit('[x] %s 是空的' % TMP)

    lines = io.open(INDEX, encoding='utf-8').read().split('\n')
    idx = [i for i, l in enumerate(lines) if l.startswith(PREFIX)]
    if not idx:
        sys.exit('[x] Index 里没有以「%s」开头的行' % PREFIX)

    if len(idx) > 1:
        print('[!] 发现 %d 行日期线（第 %s 行）—— 只保留最后一行，其余删除'
              % (len(idx), '、'.join(str(i + 1) for i in idx)))

    base = lines[idx[-1]]
    if base.endswith(TAIL):
        new = base[:-len(TAIL)] + add + TAIL
    else:
        print('[!] 最后一行不是以「%s」结尾，改为直接追加' % TAIL)
        new = base + add

    out = []
    for i, l in enumerate(lines):
        if i in idx:
            if i == idx[-1]:
                out.append(new)
            # 其余重复行直接丢掉
        else:
            out.append(l)

    io.open(INDEX, 'w', encoding='utf-8').write('\n'.join(out))
    os.remove(TMP)

    total = sum(1 for l in out if l.startswith(PREFIX))
    date = new[len(PREFIX) + 1:len(PREFIX) + 11]
    print('[ok] 日期线 %d 行 -> %d 行 | 日期 %s | 长度 %d 字符'
          % (len(idx), total, date, len(new)))
    print('[ok] 临时文件已删除')


if __name__ == '__main__':
    main()
