#!/usr/bin/env python3
"""Проверка исходников перед сборкой.

Настоящего парсера JSX нет (npm в этом проекте не используется),
поэтому проверяем баланс скобок. Порядок вырезания важен:
сначала строки и шаблоны — иначе "https://" будет принято за комментарий.

    python3 scripts/check.py
"""
import re
import os
import glob
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')


def balance(src):
    s = re.sub(r'`(?:\\.|[^`\\])*`', '``', src)          # шаблонные строки
    s = re.sub(r"'(?:\\.|[^'\\\n])*'", "''", s)          # одинарные
    s = re.sub(r'"(?:\\.|[^"\\\n])*"', '""', s)          # двойные
    s = re.sub(r'/\*.*?\*/', '', s, flags=re.DOTALL)     # блочные комментарии
    s = re.sub(r'//[^\n]*', '', s)                       # строчные
    return {p: s.count(p[0]) - s.count(p[1]) for p in ('{}', '()', '[]')}


fail = False

print('── баланс скобок ──')
for path in sorted(glob.glob(os.path.join(SRC, '*.js*'))):
    b = balance(open(path, encoding='utf-8').read())
    ok = all(v == 0 for v in b.values())
    if not ok:
        fail = True
    print(f'  {"✓" if ok else "✗"} {os.path.basename(path):<22}'
          + ('' if ok else f'  {b}'))

print('── синтаксис обычного JS ──')
for name in ['data.js', 'supabase-client.js']:
    path = os.path.join(SRC, name)
    if not os.path.exists(path):
        continue
    r = subprocess.run(['node', '--check', path], capture_output=True, text=True)
    if r.returncode != 0:
        fail = True
        print(f'  ✗ {name}\n{r.stderr.strip()[:400]}')
    else:
        print(f'  ✓ {name}')

srv = os.path.join(ROOT, 'server.js')
if os.path.exists(srv):
    r = subprocess.run(['node', '--check', srv], capture_output=True, text=True)
    if r.returncode != 0:
        fail = True
        print(f'  ✗ server.js\n{r.stderr.strip()[:400]}')
    else:
        print('  ✓ server.js')

# Юникод-экранирование, случайно попавшее в JSX-разметку как текст
print('── \\uXXXX в разметке ──')
found = False
for path in glob.glob(os.path.join(SRC, '*.jsx')):
    src = open(path, encoding='utf-8').read()
    # текстовое содержимое между тегами: внутри нет кавычек, значит это не JS-строка,
    # и \uXXXX там останется буквальным текстом, а не превратится в символ
    for m in re.finditer(r'>[^<>"\'`{}]*\\u[0-9a-fA-F]{4}[^<>"\'`{}]*<', src):
        found = True
        fail = True
        frag = m.group(0)[:60] + ('…' if len(m.group(0)) > 60 else '')
        print(f'  ✗ {os.path.basename(path)}: {frag!r} — писать символ напрямую')
if not found:
    print('  ✓ чисто')

sys.exit(1 if fail else 0)
