# Milaria — портфолио сайт

Next.js 14 + Supabase + SSR. Работает в России через российские хостинги.

## Что это даёт

- **Мгновенная загрузка** для новых посетителей (SSR — сервер отдаёт HTML с данными)
- **Live-обновления** через Supabase Realtime
- **Без localStorage-костылей** — единый источник правды
- **Работает в РФ** через российские хостинги (Amvera, Beget, Timeweb)

---

## Деплой на Amvera (главный вариант, работает в РФ)

**Стоимость:** 170-300 ₽/мес. Стартовый бонус 111 ₽ при регистрации.

### 1. Подготовка репозитория

1. Создай репозиторий на GitHub
2. Залей все файлы этого проекта
3. В проекте уже есть `amvera.yml` — Amvera увидит и настроит окружение автоматически

### 2. Регистрация на Amvera

1. Зайди на https://amvera.ru
2. Зарегистрируйся
3. На баланс положат 111 ₽ для теста

### 3. Создание проекта

1. **Создать проект** → **Приложение**
2. Имя: `milaria` (любое)
3. **Тариф:** Стартовый (1 vCPU / 1 GB RAM) — 170 ₽/мес
4. **Тип:** Node.js
5. **Метод загрузки:** через Git

### 4. Загрузка кода

**Вариант А — через GitHub:**
1. В настройках проекта подключи GitHub репозиторий
2. Amvera будет автоматически деплоить при каждом `git push`

**Вариант Б — через Amvera Git:**
```bash
git init
git add .
git commit -m "init"
git remote add amvera https://git.amvera.ru/<твой-логин>/milaria.git
git push amvera master
```

### 5. Переменные окружения

В настройках проекта добавь:

| Имя | Значение |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://vgwdudjgvkmlnnfgonbk.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | твой anon ключ |

### 6. Деплой

Сборка займёт ~3-5 минут. Сайт будет доступен по `https://your-name.amvera.io`.

### 7. Свой домен (опционально)

Добавь домен в настройках → пропиши DNS у регистратора → ждёшь 5-30 минут → SSL автоматический.

---

## Альтернативы если Amvera не подойдёт

### Beget Cloud
https://beget.com/ru/services/cloud → **Облачные приложения → Node.js** → подключи репо.

### VPS (любой российский провайдер)
Beget/Timeweb/FirstVDS/AdminVPS от 200-400 ₽/мес. Деплой руками:

```bash
sudo apt install -y nodejs npm nginx
git clone <репо>
cd milaria-next
npm install && npm run build
npm install -g pm2
pm2 start npm --name milaria -- start
# nginx настроить как прокси на localhost:3000
```

### Yandex Cloud
Тоже работает в РФ, есть free tier для статики. Для SSR нужен Compute Cloud (платный).

---

## Локальный запуск

```bash
npm install
cp .env.example .env.local
# вписать ключи в .env.local
npm run dev
```

Открой http://localhost:3000

## Структура

- `app/` — страницы (App Router)
- `app/admin/` — защищённая админка
- `components/` — React компоненты
- `lib/supabase/` — Supabase клиенты (server + browser)
- `middleware.ts` — обновляет auth cookies

## Troubleshooting

**Не открывается после деплоя:** проверь Environment Variables — самая частая ошибка.

**Картинки не грузятся:** через сервер должно работать. Если нет — URL через imgur.

**Realtime не работает:** запусти `enable-realtime.sql` в Supabase.
