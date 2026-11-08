
// supabase-client.js — клиент, авторизация, хуки

// ════════════════════════════════════════════════════════════
//  Конфиг — публичный URL + anon key (это НЕ секреты, их и
//  положено публиковать в браузерном коде Supabase).
//  Реальная защита делается через RLS-правила в базе.
// ════════════════════════════════════════════════════════════
const SUPABASE_URL = "https://vgwdudjgvkmlnnfgonbk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnd2R1ZGpndmttbG5uZmdvbmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NjI2NDksImV4cCI6MjA5NDUzODY0OX0.I_ciFmhRcv2RdXZFaedlMki8c96zTvXkUyJxSVACbr4";

let _sbc = null;
try {
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    _sbc = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: "milaria-auth" },
    });
  } else {
    console.warn('[milaria] Supabase SDK not loaded — running in offline-defaults mode.');
  }
} catch (e) {
  console.warn('[milaria] Supabase init failed:', e && e.message, '— offline-defaults mode.');
  _sbc = null;
}

window.__supabase = _sbc;

// ════════════════════════════════════════════════════════════
//  useAuth — следит за состоянием сессии (логин/логаут)
// ════════════════════════════════════════════════════════════
// Clear leftover cache from prior versions (don't mislead admin with stale data)
try {
  Object.keys(localStorage).forEach(k => {
    if (k.startsWith('milaria:cache:')) localStorage.removeItem(k);
  });
  // Старая лишняя копия баннера (~1,5 МБ base64), её больше никто не читает.
  localStorage.removeItem('milaria:milaria:banner');
} catch(e) {}

function useAuth() {
  const [session, setSession] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!_sbc) { setLoading(false); return; }
    let mounted = true;
    _sbc.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    }).catch((e) => { if (mounted) { setLoading(false); console.warn('[milaria] getSession failed:', e?.message); } });
    let subscription = null;
    try {
      const { data } = _sbc.auth.onAuthStateChange((_event, sess) => {
        if (!mounted) return;
        setSession(sess);
      });
      subscription = data?.subscription;
    } catch (e) {}
    return () => { mounted = false; subscription?.unsubscribe?.(); };
  }, []);

  return {
    session,
    loading,
    isAdmin: !!session,
    email: session?.user?.email,
    async signIn(email, password) {
      if (!_sbc) return { ok: false, error: { message: 'Supabase SDK not loaded' } };
      try {
        const { data, error } = await _sbc.auth.signInWithPassword({ email, password });
        return { ok: !error, error };
      } catch (e) {
        return { ok: false, error: { message: e?.message || 'Sign-in failed' } };
      }
    },
    async signOut() {
      if (!_sbc) return;
      try { await _sbc.auth.signOut(); } catch (e) {}
    },
  };
}

// ════════════════════════════════════════════════════════════
//  useResource — универсальный хук для одной таблицы
//
//  Возвращает: { items, loaded, error, add, update, remove, refresh }
//
//  Если supabase не отвечает или таблица пуста, items = defaults
//  (так сайт работает даже при оффлайне).
// ════════════════════════════════════════════════════════════
// ── Request de-duplication ───────────────────────────────────────────────
// All sections render at once (hidden, not unmounted), so without this the same
// table/settings get fetched once per component — wasted requests and egress.
const _tableInflight = new Map();
function _fetchTableOnce(table, orderBy, version) {
  const key = `${table}|${orderBy}|${version}`;
  if (_tableInflight.has(key)) return _tableInflight.get(key);
  const p = _sbc.from(table).select("*").order(orderBy, { ascending: true })
    .then(r => r)
    .catch(e => ({ data: null, error: e }));
  _tableInflight.set(key, p);
  // Let the next mount re-fetch; this only collapses the initial burst.
  p.finally(() => setTimeout(() => _tableInflight.delete(key), 1000));
  return p;
}

// One request for the whole settings table instead of one per key.
let _allSettingsPromise = null;
function _fetchAllSettings() {
  if (_allSettingsPromise) return _allSettingsPromise;
  _allSettingsPromise = _sbc.from('settings').select('key,value')
    .then(({ data, error }) => {
      if (error) return {};
      const map = {};
      (data || []).forEach(r => { if (r && r.key) map[r.key] = r.value; });
      return map;
    })
    .catch(() => ({}));
  setTimeout(() => { _allSettingsPromise = null; }, 1000);
  return _allSettingsPromise;
}

// The server ships a snapshot of the DB inside the HTML, but it names the keys
// differently from the Supabase tables. Without this map the snapshot silently
// missed queue_items / portfolio_categories / calc_options, so those fell back
// to the built-in demo data and flashed it before the real rows arrived.
const SNAPSHOT_KEYS = {
  queue_items: 'queue',
  portfolio_categories: 'portfolioCategories',
  calc_options: 'calcOptions',
  debts: 'debts',
  links: 'links',
};
function _snapshotFor(table) {
  const snap = window.__INITIAL_DATA;
  if (!snap) return null;
  const direct = snap[table];
  if (Array.isArray(direct) && direct.length > 0) return direct;
  const alias = SNAPSHOT_KEYS[table];
  const viaAlias = alias && snap[alias];
  if (Array.isArray(viaAlias) && viaAlias.length > 0) return viaAlias;
  return null;
}

function useResource(table, defaults = [], opts = {}) {
  const orderBy = opts.orderBy || "sort_order";
  // Priority: 1) server snapshot, 2) localStorage cache, 3) defaults
  const [items, setItems] = React.useState(() => {
    // Server snapshot embedded in the HTML — real data on the very first paint
    const snap = _snapshotFor(table);
    if (snap) return snap;
    try {
      const cached = localStorage.getItem('milaria:cache:' + table);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch(e) {}
    return Array.isArray(defaults) ? defaults : [];
  });
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [version, setVersion] = React.useState(0);

  // Auto-cache to localStorage on every state change (skip heavy tables)
  React.useEffect(() => {
    if (opts.noCache) return;
    try { localStorage.setItem('milaria:cache:' + table, JSON.stringify(items)); } catch(e) {}
  }, [items, table]);

  React.useEffect(() => {
    let mounted = true;
    // Several sections mount at once and ask for the same table (links x3, etc.).
    // Share one in-flight request instead of firing a duplicate per component.
    _fetchTableOnce(table, orderBy, version)
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          console.warn(`[${table}] load error:`, error.message);
          setError(error);
          setLoaded(true);
          return;
        }
        if (data) {
          // Always trust fresh server data (even empty) so deleted items disappear
          setItems(data);
          if (!opts.noCache) {
            try { localStorage.setItem('milaria:cache:' + table, JSON.stringify(data)); } catch(e) {}
          }
        }
        setLoaded(true);
      });
    return () => { mounted = false; };
  }, [table, version]);

  // Realtime: live sync between all connected browsers
  React.useEffect(() => {
    if (!_sbc) return;
    let channel = null;
    try {
      channel = _sbc.channel(`rt:${table}:${Math.random().toString(36).slice(2,8)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
          console.log(`[rt:${table}]`, payload.eventType, payload.new?.id || payload.old?.id);
          if (payload.eventType === 'INSERT') {
            setItems(prev => prev.some(x => x.id === payload.new.id) ? prev
              : [...prev, payload.new].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
          } else if (payload.eventType === 'UPDATE') {
            setItems(prev => prev.map(x => x.id === payload.new.id ? payload.new : x));
          } else if (payload.eventType === 'DELETE') {
            setItems(prev => prev.filter(x => x.id !== payload.old.id));
          }
        })
        .subscribe();
    } catch (e) { console.warn(`[rt:${table}] setup failed:`, e?.message); }
    return () => { if (channel) try { _sbc.removeChannel(channel); } catch(e) {} };
  }, [table]);

  async function add(item) {
    const payload = { ...item };
    // Keep id if explicitly provided (text-id tables like calc_options)
    // Only delete if not provided or if it's a temp placeholder
    if (!payload.id || String(payload.id).startsWith('tmp-')) delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;
    if (payload.sort_order == null) {
      payload.sort_order = (items[items.length - 1]?.sort_order || 0) + 1;
    }
    // Optimistic: show item immediately with a temp id
    const tempId = 'tmp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    const optimistic = { ...payload, id: tempId, created_at: new Date().toISOString() };
    setItems((prev) => [...prev, optimistic]);

    if (!_sbc) return optimistic;
    try {
      const { data, error } = await _sbc.from(table).insert([payload]).select().single();
      if (error) {
        console.error(`[${table}] add:`, error.message);
        const hint = error.message.includes('does not exist') || error.code === '42P01'
          ? '\n\nТаблица ' + table + ' не найдена. Запусти SQL-скрипт.'
          : error.message.includes('violates') ? '\n\nПроверь данные — возможно дублирующийся ID.' : '';
        alert('Ошибка добавления [' + table + ']: ' + error.message + hint);
        setItems((prev) => prev.filter((x) => x.id !== tempId));
        return null;
      }
      // Replace temp with real server record
      setItems((prev) => prev.map((x) => x.id === tempId ? data : x));
      return data;
    } catch (e) {
      console.error(`[${table}] add threw:`, e?.message);
      setItems((prev) => prev.filter((x) => x.id !== tempId));
      return null;
    }
  }

  async function update(id, patch) {
    // Optimistic update - save previous state for rollback
    let prevItem = null;
    setItems((prev) => {
      prevItem = prev.find(x => x.id === id);
      return prev.map((x) => x.id === id ? { ...x, ...patch } : x);
    });
    const cleaned = { ...patch };
    delete cleaned.id;
    delete cleaned.created_at;
    delete cleaned.updated_at;
    const { data, error } = await _sbc.from(table).update(cleaned).eq("id", id).select().single();
    if (error) {
      console.error(`[${table}] update:`, error.message);
      // Rollback optimistic change
      if (prevItem) setItems(prev => prev.map(x => x.id === id ? prevItem : x));
      alert('Не удалось сохранить: ' + error.message);
      return null;
    }
    setItems((prev) => prev.map((x) => x.id === id ? data : x));
    return data;
  }

  async function remove(id) {
    const prevItems = items;
    setItems((prev) => prev.filter((x) => x.id !== id));
    if (!_sbc) return true;
    try {
      const { error } = await _sbc.from(table).delete().eq("id", id);
      if (error) {
        console.error(`[${table}] remove:`, error.message);
        setItems(prevItems);
        return false;
      }
      return true;
    } catch (e) { console.error(`[${table}] remove threw:`, e?.message); setItems(prevItems); return false; }
  }

  function refresh() { setVersion((v) => v + 1); }

  return { items, loaded, error, add, update, remove, refresh, setItems };
}

// ════════════════════════════════════════════════════════════
//  Утилиты для опций калькулятора (calc_options — плоская
//  таблица, в UI нужна вложенная структура)
// ════════════════════════════════════════════════════════════
function calcOptionsToTree(rows) {
  const tree = {};
  rows.forEach((r) => {
    if (!tree[r.category]) tree[r.category] = { labelKey: r.category, variants: {} };
    if (!tree[r.category].variants[r.variant]) {
      tree[r.category].variants[r.variant] = { ru: variantLabel(r.variant, "ru"), en: variantLabel(r.variant, "en"), base: [], addon: [] };
    }
    const opt = {
      id: r.id, ru: r.label_ru, en: r.label_en, rub: r.rub, usd: r.usd, qty: r.has_qty,
    };
    tree[r.category].variants[r.variant][r.group_type].push(opt);
  });
  // Sort children by their sort_order — we'll rely on the query order
  return tree;
}
function variantLabel(key, lang) {
  const map = {
    art:     { ru: "Только арт",     en: "Art only" },
    rig:     { ru: "Арт + риг",      en: "Art + Live2D rig" },
    basic:   { ru: "PNG",            en: "PNG" },
    plus:    { ru: "PNG+",           en: "PNG+" },
    default: { ru: "Иллюстрация",    en: "Illustration" },
  };
  return map[key]?.[lang] || key;
}

// ════════════════════════════════════════════════════════════
//  Seed — загрузить дефолтные данные в БД (один раз, после
//  первого логина если таблицы пустые)
// ════════════════════════════════════════════════════════════
// ── Image upload: resize + base64 (stored directly in DB, no Storage needed) ──
// ── useSetting: single key-value config (syncs via Realtime to all users) ──
function useSetting(key, defaultValue) {
  const [value, setValue] = React.useState(() => {
    // localStorage first — it holds the freshest value THIS browser saw/saved
    // (avoids flicker when the server snapshot lags behind a just-made change)
    try {
      const cached = localStorage.getItem('milaria:setting:' + key);
      if (cached !== null) return JSON.parse(cached);
    } catch(e) {}
    if (window.__INITIAL_SETTINGS?.[key] !== undefined) return window.__INITIAL_SETTINGS[key];
    return defaultValue;
  });
  const [loaded, setLoaded] = React.useState(false);

  // Cache settings whenever they change
  React.useEffect(() => {
    try { localStorage.setItem('milaria:setting:' + key, JSON.stringify(value)); } catch(e) {}
  }, [key, value]);

  React.useEffect(() => {
    if (!_sbc) { setLoaded(true); return; }
    let mounted = true;

    // Batched: one request covers every key on the page (was 1 request per key)
    _fetchAllSettings()
      .then((all) => {
        if (!mounted) return;
        const data = (all && all[key] !== undefined) ? { value: all[key] } : null;
        // Only update if the server value actually differs (prevents needless re-render/flicker)
        if (data && data.value !== undefined && data.value !== null) {
          setValue(prev => {
            try { if (JSON.stringify(prev) === JSON.stringify(data.value)) return prev; } catch(e) {}
            return data.value;
          });
        }
        setLoaded(true);
      }).catch(() => setLoaded(true));

    let channel = null;
    try {
      channel = _sbc.channel(`rt:setting:${key}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: `key=eq.${key}` }, (payload) => {
          if (payload.new?.value) setValue(payload.new.value);
        })
        .subscribe();
    } catch(e) {}

    return () => { mounted = false; if (channel) try { _sbc.removeChannel(channel); } catch(e){} };
  }, [key]);

  async function save(newValue) {
    setValue(newValue); // optimistic
    if (!_sbc) return;
    try {
      await _sbc.from('settings').upsert({ key, value: newValue }, { onConflict: 'key' });
    } catch (e) { console.warn('[setting]', key, e?.message); }
  }

  return [value, save, loaded];
}

// ── Supabase Storage upload (proper: file + CDN, not base64) ──
const STORAGE_BUCKET = 'portfolio';

// What kind of media is this file? GIF/video must NOT go through canvas.
function fileKind(file) {
  const type = (file.type || '').toLowerCase();
  const ext = ((file.name || '').toLowerCase().match(/\.(\w+)$/) || [])[1] || '';
  if (type === 'image/gif' || ext === 'gif') return 'gif';
  if (type.indexOf('video/') === 0 || ['mp4','webm','mov','m4v'].indexOf(ext) !== -1) return 'video';
  return 'image';
}

// Can this browser ENCODE webp? Checked once and reused.
// toBlob() silently falls back to png for unsupported types instead of failing,
// so a data-url probe is the only reliable way to ask.
let _webpOK = null;
function canEncodeWebp() {
  if (_webpOK !== null) return _webpOK;
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    _webpOK = c.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  } catch (e) { _webpOK = false; }
  return _webpOK;
}

// Resize a File/Blob and encode it. WebP where supported (same quality at
// roughly half the bytes), JPEG otherwise. Portfolio images are the product
// here, so this is the one place worth not cutting corners.
// Resolves { blob, mime, ext } — or null if the picture could not be read.
function resizeToBlob(file, maxW, quality) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const webp = canEncodeWebp();
        const mime = webp ? 'image/webp' : 'image/jpeg';
        canvas.toBlob(
          b => resolve(b ? {
            blob: b, mime, ext: webp ? 'webp' : 'jpg',
            // Держим холст под рукой: если bucket не примет webp, перекодируем
            // в jpeg без повторного чтения и масштабирования файла.
            jpegFallback: webp
              ? () => new Promise(r => canvas.toBlob(
                  j => r(j ? { blob: j, mime: 'image/jpeg', ext: 'jpg' } : null),
                  'image/jpeg', quality))
              : null,
          } : null),
          mime, quality
        );
      };
      img.onerror = () => resolve(null);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

function storagePublicUrl(path) {
  const { data } = _sbc.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  // Rewrite to proxied path so it loads through our server (DPI-safe)
  return data.publicUrl.replace(SUPABASE_URL, '/supa');
}

// Returns { url, thumb } of proxied public URLs, or null on failure
// Понятный текст вместо догадки. Раньше на ЛЮБУЮ ошибку показывалось
// "проверь что создан bucket" — что уводило не туда, если bucket на месте,
// а причина в правах или формате файла.
function storageErrorText(err) {
  const msg = String((err && (err.message || err.error)) || err || '');
  const low = msg.toLowerCase();
  if (low.includes('mime') || low.includes('not supported') || low.includes('invalid_mime')) {
    return 'Хранилище не принимает этот формат файла.\n\n' +
           'Supabase → Storage → bucket "portfolio" → Settings → Allowed MIME types:\n' +
           'оставь поле пустым (тогда разрешено всё) или добавь image/webp.\n\n' +
           'Ответ сервера: ' + msg;
  }
  if (low.includes('row-level security') || low.includes('policy') || low.includes('unauthorized') || low.includes('403')) {
    return 'Нет прав на запись в хранилище.\n\n' +
           'Похоже, ты вышел из админки — перезайди.\n' +
           'Если не поможет: Supabase → Storage → Policies, у bucket "portfolio"\n' +
           'операции INSERT/UPDATE/DELETE должны быть разрешены роли authenticated.\n\n' +
           'Ответ сервера: ' + msg;
  }
  if (low.includes('exceeded') || low.includes('too large') || low.includes('413')) {
    return 'Файл больше лимита bucket.\n\nОтвет сервера: ' + msg;
  }
  if (low.includes('duplicate') || low.includes('already exists')) {
    return 'Файл с таким именем уже есть. Попробуй ещё раз.\n\nОтвет сервера: ' + msg;
  }
  return 'Не удалось загрузить в хранилище.\n\nОтвет сервера: ' + msg;
}

// Кладём файл в Storage. Если bucket не принимает webp — молча перекодируем
// в jpeg и пробуем снова, чтобы настройка bucket не блокировала работу.
async function putToStorage(path, item) {
  let res = await _sbc.storage.from(STORAGE_BUCKET)
    .upload(path, item.blob, { contentType: item.mime, upsert: false });
  if (!res.error) return { path, error: null };

  const msg = String(res.error.message || '').toLowerCase();
  const mimeRejected = msg.includes('mime') || msg.includes('not supported');
  if (mimeRejected && item.mime === 'image/webp' && item.jpegFallback) {
    const jpeg = await item.jpegFallback();
    if (jpeg) {
      const altPath = path.replace(/\.webp$/, '.jpg');
      console.warn('[storage] bucket отверг webp — перекодирую в jpeg');
      const retry = await _sbc.storage.from(STORAGE_BUCKET)
        .upload(altPath, jpeg.blob, { contentType: jpeg.mime, upsert: false });
      if (!retry.error) return { path: altPath, error: null };
      return { path: altPath, error: retry.error };
    }
  }
  return { path, error: res.error };
}

async function uploadToStorage(file) {
  try {
    const kind = fileKind(file);

    // GIF / video: upload the ORIGINAL bytes.
    // Canvas would flatten a GIF to its first frame and cannot read video at all.
    if (kind === 'gif' || kind === 'video') {
      if (file.size > 45 * 1024 * 1024) {
        alert('Файл слишком большой (' + Math.round(file.size / 1048576) + ' МБ). Максимум ~45 МБ.');
        return null;
      }
      const ext = kind === 'gif'
        ? 'gif'
        : (((file.name || '').toLowerCase().match(/\.(\w+)$/) || [])[1] || 'mp4');
      const base = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const path = `full/${base}.${ext}`;
      const contentType = kind === 'gif' ? 'image/gif' : (file.type || 'video/mp4');
      const up = await _sbc.storage.from(STORAGE_BUCKET).upload(path, file, { contentType, upsert: false });
      if (up.error) {
        console.error('[storage] upload failed', up.error);
        // Показываем НАСТОЯЩИЙ ответ сервера, а не догадку: раньше здесь висело
        // "проверь bucket", хотя bucket очевидно на месте.
        alert(storageErrorText(up.error) +
          '\n\nРазмер файла: ' + Math.round(file.size / 1048576 * 10) / 10 + ' МБ');
        return null;
      }
      const url = storagePublicUrl(path);
      return { url, thumb: url }; // animated GIF stays animated everywhere
    }

    const full = await resizeToBlob(file, 1600, 0.85);   // full view
    const thumb = await resizeToBlob(file, 500, 0.78);    // grid thumbnail
    if (!full) { alert('Не удалось обработать картинку'); return null; }
    const base = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const fullPath = `full/${base}.${full.ext}`;
    const thumbPath = thumb ? `thumb/${base}.${thumb.ext}` : null;

    const up1 = await putToStorage(fullPath, full);
    if (up1.error) {
      console.error('[storage] full upload failed', up1.error);
      alert(storageErrorText(up1.error));
      return null;
    }
    const finalFullPath = up1.path;
    let thumbUrl = null;
    if (thumb) {
      const up2 = await putToStorage(thumbPath, thumb);
      if (!up2.error) thumbUrl = storagePublicUrl(up2.path);
      else console.warn('[storage] thumb upload failed', up2.error);
    }
    const url = storagePublicUrl(finalFullPath);
    return { url, thumb: thumbUrl || url };
  } catch (e) {
    console.error('[storage] error', e);
    return null;
  }
}

// ── Значок сайта: маленький PNG вместо полноразмерной картинки ──
// Раньше значок лежал в базе картинкой 889×1200 (165 КБ) и сервер вставлял его
// в КАЖДУЮ страницу. Браузеру хватает 64 px (вкладка рисует 16–32).
function _imageToBlob(src, max, mime, quality) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * k));
      const h = Math.max(1, Math.round(img.height * k));
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      c.toBlob(b => resolve(b), mime, quality);
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function _fileToDataUrl(file) {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = (e) => resolve(e.target.result);
    r.onerror = () => resolve(null);
    r.readAsDataURL(file);
  });
}

function _storageName(folder, ext) {
  return `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

// Принимает файл или адрес картинки (в т.ч. data:). Возвращает { url } или null.
async function uploadIconToStorage(fileOrSrc, opts) {
  const quiet = opts && opts.quiet;
  try {
    const src = typeof fileOrSrc === 'string' ? fileOrSrc : await _fileToDataUrl(fileOrSrc);
    const png = src && await _imageToBlob(src, 64, 'image/png');
    if (!png) { if (!quiet) alert('Не удалось обработать картинку'); return null; }
    let path = _storageName('site', 'png');
    let up = await _sbc.storage.from(STORAGE_BUCKET).upload(path, png, { contentType: 'image/png', upsert: false });
    // Bucket может не принимать png — тогда jpeg, значку это не страшно.
    if (up.error && /mime|not supported/i.test(String(up.error.message || ''))) {
      const jpg = await _imageToBlob(src, 64, 'image/jpeg', 0.9);
      if (jpg) {
        path = _storageName('site', 'jpg');
        up = await _sbc.storage.from(STORAGE_BUCKET).upload(path, jpg, { contentType: 'image/jpeg', upsert: false });
      }
    }
    if (up.error) {
      console.error('[storage] icon upload failed', up.error);
      if (!quiet) alert(storageErrorText(up.error));
      return null;
    }
    return { url: storagePublicUrl(path) };
  } catch (e) {
    console.error('[storage] icon error', e);
    return null;
  }
}

// ── Перенос картинок, которые раньше сохранялись прямо в базу (data:...) ──
// Баннер и значок жили в таблице settings строками base64 (~1,5 МБ) и уходили
// каждому посетителю внутри страницы. Переносим их в Storage, в базе остаются
// короткие ссылки. Слот, который не удалось загрузить, остаётся как был.
function _isInlineImage(s) { return typeof s === 'string' && s.indexOf('data:image/') === 0; }

async function _readImageSettings() {
  const { data, error } = await _sbc.from('settings').select('key,value').in('key', ['banner', 'site_favicon']);
  if (error) throw new Error(error.message);
  const map = {};
  (data || []).forEach(r => { if (r && r.key) map[r.key] = r.value; });
  return map;
}

async function inlineImagesInfo() {
  if (!_sbc) return { count: 0, kb: 0 };
  const map = await _readImageSettings();
  const slots = (map.banner && Array.isArray(map.banner.banner_slots)) ? map.banner.banner_slots : [];
  const inline = slots.filter(_isInlineImage);
  if (_isInlineImage(map.site_favicon)) inline.push(map.site_favicon);
  return { count: inline.length, kb: Math.round(inline.reduce((s, x) => s + x.length, 0) / 1024) };
}

async function migrateInlineImages() {
  if (!_sbc) throw new Error('Supabase не загружен');
  const map = await _readImageSettings();
  const report = { moved: 0, failed: 0, errors: [] };

  const banner = map.banner;
  if (banner && Array.isArray(banner.banner_slots) && banner.banner_slots.some(_isInlineImage)) {
    const slots = banner.banner_slots.slice();
    let changed = false;
    for (let i = 0; i < slots.length; i++) {
      if (!_isInlineImage(slots[i])) continue;
      try {
        const blob = await (await fetch(slots[i])).blob();
        const type = blob.type || 'image/jpeg';
        const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : type === 'image/gif' ? 'gif' : 'jpg';
        const path = _storageName('banner', ext);
        const up = await _sbc.storage.from(STORAGE_BUCKET).upload(path, blob, { contentType: type, upsert: false });
        if (up.error) throw up.error;
        slots[i] = storagePublicUrl(path);
        changed = true;
        report.moved++;
      } catch (e) {
        report.failed++;
        report.errors.push(`баннер #${i + 1}: ${(e && e.message) || e}`);
      }
    }
    if (changed) {
      const { error } = await _sbc.from('settings')
        .upsert({ key: 'banner', value: Object.assign({}, banner, { banner_slots: slots }) }, { onConflict: 'key' });
      if (error) throw new Error('баннер не сохранён: ' + error.message);
    }
  }

  if (_isInlineImage(map.site_favicon)) {
    const up = await uploadIconToStorage(map.site_favicon, { quiet: true });
    if (up) {
      const { error } = await _sbc.from('settings')
        .upsert({ key: 'site_favicon', value: up.url }, { onConflict: 'key' });
      if (error) throw new Error('значок не сохранён: ' + error.message);
      report.moved++;
    } else {
      report.failed++;
      report.errors.push('значок: не удалось загрузить');
    }
  }
  return report;
}

Object.assign(window, { _sbc, useAuth, useResource, calcOptionsToTree, uploadToStorage,
  uploadIconToStorage, inlineImagesInfo, migrateInlineImages });

  