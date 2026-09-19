# -*- coding: utf-8 -*-
"""稿件 md → 纯文本版（浩总要的是"能直接长按复制的版本"）。

用法:
    python to_plain.py <稿件.md>            # 输出同目录 ..._纯文本.txt
    python to_plain.py <稿件.md> <输出.txt>

转换规则（对齐 2026-09-17 起沿用的格式，别改）:
    - 删掉 frontmatter（--- 包起来那一段）
    - 行首 #{1,6} 去掉（`## 一、xxx` → `一、xxx`；`#芙蓉镇 …` → `芙蓉镇 …`）
    - 行首 `> ` 去掉（引文保留文字）
    - 行内 `**` 去掉（加粗去掉）
    - `---` 分隔线**保留**（原样）
    - 其余一字不动，空行原样保留
"""
import pathlib
import re
import sys


def to_plain(md: str) -> str:
    md = md.replace("\r\n", "\n")
    # 1) 去 frontmatter
    md = re.sub(r"^---\n.*?\n---\n+", "", md, count=1, flags=re.S)
    out = []
    for line in md.split("\n"):
        s = re.sub(r"^#{1,6}\s?", "", line)      # 标题井号
        s = re.sub(r"^>\s?", "", s)              # 引用符
        s = s.replace("**", "")                  # 加粗
        out.append(s)
    return "\n".join(out).strip() + "\n"


def main() -> None:
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    src = pathlib.Path(sys.argv[1])
    dst = (pathlib.Path(sys.argv[2]) if len(sys.argv) > 2
           else src.with_name(src.stem + "_纯文本.txt"))
    txt = to_plain(src.read_text(encoding="utf-8"))
    dst.write_text(txt, encoding="utf-8")
    body = re.sub(r"\s", "", txt)
    print(f"{dst.name} ｜ 纯文本 {len(body)} 字")


if __name__ == "__main__":
    main()
