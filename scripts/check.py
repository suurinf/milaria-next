#!/usr/bin/env python3
"""Проверка исходников перед сборкой.

Настоящего парсера JSX нет (npm в этом проекте не используется),
поэтому проверяем баланс скобок. Порядок вырезания важен:
сначала строки и шаблоны — иначе "https://" будет принято за комментарий.

    python scripts/check.py
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

# Настоящий разбор JSX тем же Babel, что и на сервере. Ловит то, что не видит
# подсчёт скобок (например, перенос строки внутри '...'). Нужен npm install.
print('── разбор JSX (Babel) ──')
JS = r"""
const fs = require('fs'), path = require('path');
let babel, preset;
try { babel = require('@babel/core'); preset = require('@babel/preset-react'); }
catch (e) { console.log('SKIP'); process.exit(0); }
let bad = 0;
for (const f of fs.readdirSync(process.argv[1]).filter(f => f.endsWith('.jsx')).sort()) {
  try {
    babel.transformSync(fs.readFileSync(path.join(process.argv[1], f), 'utf8'),
      { presets: [preset], babelrc: false, configFile: false });
    console.log('  \u2713 ' + f);
  } catch (e) { bad++; console.log('  \u2717 ' + f + ': ' + e.message.split('\n')[0]); }
}
process.exit(bad ? 1 : 0);
"""
r = subprocess.run(['node', '-e', JS, SRC], capture_output=True, text=True, cwd=ROOT, encoding='utf-8')
out = (r.stdout or '').rstrip()
if out.strip() == 'SKIP':
    print('  – Babel не установлен (npm install), пропускаю')
else:
    print(out or r.stderr.strip()[:400])
    if r.returncode != 0:
        fail = True

sys.exit(1 if fail else 0)
