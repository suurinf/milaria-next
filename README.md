# Milaria — сайт-портфолио (milariart.ru)

Сайт VTuber-художницы Милы: главная, очередь заказов, портфолио,
калькулятор, Twitch-долги, T.O.S. Админка встроена в сам сайт.

- Страница — один файл `index.html`, его отдаёт `server.js` (Node без зависимостей
  во время работы). Исходники лежат в `src/`.
- Данные и файлы — Supabase. Браузер ходит к нему через прокси `/supa/*`.
- Хостинг — Amvera: push в `main` на GitHub автоматически пересобирает сайт.

## Правка

```bash
python scripts/build.py   # собрать index.html из src/
python scripts/check.py   # проверить скобки в JSX
node server.js            # локально на http://localhost:3000
```

Подробности, грабли и правила — в [CLAUDE.md](CLAUDE.md).
