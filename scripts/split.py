#!/usr/bin/env python3
"""Одноразовый разбор index.html на исходники в src/.

Запустить ОДИН раз при переезде, потом закоммитить src/ в git.
Дальше правим только src/ и собираем через build.py.

    python3 scripts/split.py
"""
import re
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML = os.path.join(ROOT, 'index.html')
SRC = os.path.join(ROOT, 'src')

# Порядок критичен — он же зашит в build.py
BABEL_ORDER = ['tweaks-panel', 'components', 'home', 'queue',
               'portfolio', 'calculator', 'sections-misc', 'app']
PLAIN_ORDER = ['data.js', 'supabase-client.js']

if not os.path.exists(HTML):
    sys.exit(f'Не найден {HTML}')

html = open(HTML, encoding='utf-8').read()
os.makedirs(SRC, exist_ok=True)

# ── CSS: самый большой <style> ──
styles = re.findall(r'<style>(.*?)</style>', html, re.DOTALL)
if not styles:
    sys.exit('Не найден <style> — структура index.html изменилась')
css = max(styles, key=len)
open(os.path.join(SRC, 'style.css'), 'w', encoding='utf-8').write(css)
print(f'  style.css           {len(css):>8,} символов')

# ── babel-блоки (атрибуты могут быть любые, напр. data-presets="react") ──
babel = re.findall(r'<script type="text/babel"[^>]*>(.*?)</script>', html, re.DOTALL)
if len(babel) != len(BABEL_ORDER):
    sys.exit(f'Ожидалось {len(BABEL_ORDER)} babel-блоков, найдено {len(babel)}. '
             'Проверь структуру index.html, прежде чем продолжать.')
for name, code in zip(BABEL_ORDER, babel):
    open(os.path.join(SRC, f'{name}.jsx'), 'w', encoding='utf-8').write(code)
    print(f'  {name + ".jsx":<20}{len(code):>8,} символов')

# ── обычные скрипты: берём два самых больших инлайновых ──
plain = re.findall(r'<script>(.*?)</script>', html, re.DOTALL)
big = sorted([p for p in plain if len(p) > 3000], key=len, reverse=True)[:2]
if len(big) < 2:
    sys.exit('Не нашёл data.js и supabase-client.js среди обычных <script>')
# восстанавливаем исходный порядок появления в файле
big.sort(key=lambda p: html.index(p))
for name, code in zip(PLAIN_ORDER, big):
    open(os.path.join(SRC, name), 'w', encoding='utf-8').write(code)
    print(f'  {name:<20}{len(code):>8,} символов')

print('\n✓ Исходники в src/. Проверь, что сборка воспроизводит файл:')
print('    python3 scripts/build.py && git diff --stat index.html')
print('  Пустой diff = разбор корректный.')
