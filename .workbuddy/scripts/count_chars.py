# -*- coding: utf-8 -*-
"""统计稿件正文字数（去 markdown 标记、去空白后数字符）。
用法: python count_chars.py <稿件.md> [more.md ...]
说明: 只统计 frontmatter 之后的正文；去掉 #、*、>、`、- 等标记符号与所有空白字符。
"""
import re
import sys
import pathlib

def count(path: str) -> None:
    p = pathlib.Path(path)
    text = p.read_text(encoding="utf-8")
    # 去掉 frontmatter
    body = re.sub(r"^---\n.*?\n---\n", "", text, count=1, flags=re.S)
    # 去掉 markdown 标记
    plain = re.sub(r"[#*>`\-\[\]\(\)]", "", body)
    # 去掉所有空白
    plain = re.sub(r"\s", "", plain)
    # 分节统计
    sections = re.findall(r"^#{2,3}\s*(.+)$", body, flags=re.M)
    print(f"{p.name}")
    print(f"  正文字数: {len(plain)}")
    print(f"  分节数: {len(sections)}")
    for i, s in enumerate(sections, 1):
        print(f"    {i}. {s}")
    print(f"  破折号数量: {body.count('——')}")
    print(f"  作者自称'浩总': {body.count('浩总')}")
    print()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法: python count_chars.py <稿件.md> ...")
        sys.exit(1)
    for f in sys.argv[1:]:
        count(f)
