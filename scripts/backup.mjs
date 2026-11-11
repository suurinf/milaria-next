#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
//  Выгрузка всех таблиц Supabase в JSON.
//
//  Зачем: на бесплатном тарифе Supabase нет автоматических бэкапов. Весь сайт —
//  портфолио, очередь, прайс, T.O.S. — живёт только там. Одна ошибка в SQL или
//  инцидент у провайдера, и восстанавливать нечего.
//
//  Файлы кладутся в backups/ и коммитятся в репозиторий: бесплатно, лежит вне
//  Supabase, и вся история версий доступна через git.
//
//  Запуск вручную:  node scripts/backup.mjs
//  Автоматически:   .github/workflows/backup.yml (раз в сутки)
// ─────────────────────────────────────────────────────────────────────────────

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'backups');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://vgwdudjgvkmlnnfgonbk.supabase.co';

const TABLES = [
  'queue_items',
  'portfolio_categories',
  'portfolio_images',
  'prices',
  'calc_options',
  'debts',
  'links',
  'settings',
];

// Ключ берём из переменной окружения, иначе — прямо из index.html.
// Он и так публичный (лежит в отдаваемой странице), так что это не утечка,
// зато не нужно ничего настраивать руками.
async function getKey() {
  if (process.env.SUPABASE_ANON_KEY) return process.env.SUPABASE_ANON_KEY;
  const html = await readFile(join(ROOT, 'index.html'), 'utf-8');
  const m = html.match(/['"](eyJ[A-Za-z0-9_\-.]{40,})['"]/);
  if (!m) throw new Error('Не нашёл anon-ключ: задай SUPABASE_ANON_KEY');
  return m[1];
}

async function fetchTable(table, key) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=*`;
  const res = await fetch(url, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`${table}: HTTP ${res.status} ${await res.text()}`);
  return res.json();
}

// Стабильный порядок ключей и строк — иначе git видел бы "изменения"
// там, где Supabase просто вернул те же данные в другом порядке.
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])]));
  }
  return value;
}

async function main() {
  const key = await getKey();
  await mkdir(OUT_DIR, { recursive: true });

  const summary = [];
  let failed = 0;

  for (const table of TABLES) {
    try {
      const rows = await fetchTable(table, key);
      const sorted = [...rows].sort((a, b) =>
        String(a.id ?? a.key ?? '').localeCompare(String(b.id ?? b.key ?? '')));
      await writeFile(
        join(OUT_DIR, `${table}.json`),
        JSON.stringify(stable(sorted), null, 2) + '\n',
        'utf-8'
      );
      summary.push({ table, rows: rows.length });
      console.log(`  ✓ ${table.padEnd(22)} ${String(rows.length).padStart(4)} строк`);
    } catch (e) {
      failed++;
      console.error(`  ✗ ${table.padEnd(22)} ${e.message}`);
    }
  }

  // Если всё до одной таблицы упало — это не «пустой бэкап», это сбой.
  // Ненулевой код не даст workflow закоммитить пустышку поверх нормальных данных.
  if (failed === TABLES.length) {
    console.error('\nВсе таблицы недоступны — бэкап не сохранён.');
    process.exit(1);
  }

  await writeFile(
    join(OUT_DIR, '_manifest.json'),
    JSON.stringify({
      takenAt: new Date().toISOString(),
      source: SUPABASE_URL,
      tables: summary,
      note: 'Файлы в Supabase Storage (сами картинки) сюда не входят — здесь только база.',
    }, null, 2) + '\n',
    'utf-8'
  );

  const total = summary.reduce((s, x) => s + x.rows, 0);
  console.log(`\nГотово: ${summary.length}/${TABLES.length} таблиц, ${total} строк → backups/`);
  if (failed) process.exit(0); // частичный успех — сохраняем что есть
}

main().catch(e => { console.error('Бэкап упал:', e.message); process.exit(1); });
