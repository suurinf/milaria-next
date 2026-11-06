#!/usr/bin/env python3
"""Собирает index.html из исходников в src/.

Основа — текущий index.html, поэтому правки в HTML-оболочке
(мета-теги, домен, canonical, OG) переживают пересборку.

    python3 scripts/build.py
"""
import re
import os
import sys
import hashlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML = os.path.join(ROOT, 'index.html')
SRC = os.path.join(ROOT, 'src')

# ВАЖНО: порядок babel-блоков. Перепутать = сломать приложение молча.
BABEL_ORDER = ['tweaks-panel', 'components', 'home', 'queue',
               'portfolio', 'calculator', 'sections-misc', 'app']
PLAIN_ORDER = ['data.js', 'supabase-client.js']

html = open(HTML, encoding='utf-8').read()
before = hashlib.sha1(html.encode()).hexdigest()[:8]

# ── CSS: заменяем самый большой <style> ──
styles = list(re.finditer(r'<style>(.*?)</style>', html, re.DOTALL))
big = max(styles, key=lambda m: len(m.group(1)))
css = open(os.path.join(SRC, 'style.css'), encoding='utf-8').read()
html = html[:big.start(1)] + css + html[big.end(1):]

# ── babel-блоки по порядку ──
out, pos, idx = [], 0, 0
for m in re.finditer(r'(<script type="text/babel"[^>]*>)(.*?)(</script>)', html, re.DOTALL):
    if idx >= len(BABEL_ORDER):
        break
    code = open(os.path.join(SRC, f'{BABEL_ORDER[idx]}.jsx'), encoding='utf-8').read()
    out.append(html[pos:m.start(2)])
    out.append(code)
    pos = m.end(2)
    idx += 1
out.append(html[pos:])
html = ''.join(out)

if idx != len(BABEL_ORDER):
    sys.exit(f'Заменено только {idx} из {len(BABEL_ORDER)} babel-блоков — сборка прервана')

# ── обычные скрипты: два самых больших инлайновых, в порядке появления ──
plain = [m for m in re.finditer(r'<script>(.*?)</script>', html, re.DOTALL)
         if len(m.group(1)) > 3000]
if len(plain) < 2:
    sys.exit('Не нашёл места для data.js / supabase-client.js')
targets = sorted(plain, key=lambda m: len(m.group(1)), reverse=True)[:2]
targets.sort(key=lambda m: m.start())
# правим с конца, чтобы не сбить смещения
for m, name in reversed(list(zip(targets, PLAIN_ORDER))):
    code = open(os.path.join(SRC, name), encoding='utf-8').read()
    html = html[:m.start(1)] + code + html[m.end(1):]

open(HTML, 'w', encoding='utf-8').write(html)
after = hashlib.sha1(html.encode()).hexdigest()[:8]

print(f'  Собрано: {len(html):,} символов ({len(html)//1024} KB)')
print(f'  Отпечаток: {before} → {after}')
if before == after:
    print('  (не изменилось)')
print('  Сверь этот отпечаток на /debug после деплоя.')
