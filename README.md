# Бэкапы базы milariart.ru

Эта ветка — только для ежедневных бэкапов Supabase (`backups/*.json`).
Их пишет GitHub Action `Backup Supabase` из ветки `main` (`.github/workflows/backup.yml`).

Бэкапы вынесены из `main`, чтобы ежедневный коммит не пересобирал сайт на Amvera:
Amvera пересобирает сайт только по изменениям в `main`.

Восстановить таблицу — взять нужный `backups/<таблица>.json` из истории этой ветки.
