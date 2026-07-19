const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const crypto = require('crypto');

const SUPABASE_URL = 'https://vgwdudjgvkmlnnfgonbk.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnd2R1ZGpndmttbG5uZmdvbmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NjI2NDksImV4cCI6MjA5NDUzODY0OX0.I_ciFmhRcv2RdXZFaedlMki8c96zTvXkUyJxSVACbr4';
const PORT = parseInt(process.env.PORT) || 3000;
const HTML_PATH = path.join(__dirname, 'index.html');
const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://milariart.ru';

// In-memory cache — served immediately, refreshed in background
let cache = { data: null, settings: {}, updatedAt: null };
let _ogCache = null; // lazily extracted OG image bytes
const logs = [];

function log(type, msg) {
  const entry = { t: new Date().toISOString().slice(11,19), type, msg };
  logs.unshift(entry);
  if (logs.length > 200) logs.pop();
  console.log(`[${entry.t}] ${type}: ${msg}`);
}

// orderBy=null для таблиц без sort_order (например settings: key/value).
// Раньше сортировка по sort_order добавлялась ко ВСЕМ таблицам, и запрос к
// settings падал с 400 «column settings.sort_order does not exist». Ошибка
// молча превращалась в пустоту — отсюда вечное "settings=0" в логе, мёртвый
// снапшот настроек и незаметно неработающая Метрика.
// Возвращает массив при успехе и null при любой ошибке.
// Это принципиально: раньше сбой отдавал [], и «сеть отвалилась» было не отличить
// от «таблица пустая» — из-за чего упавшее обновление затирало хороший кэш нулями.
function supaFetch(table, orderBy = 'sort_order') {
  return new Promise((resolve) => {
    try {
      const query = orderBy ? `?select=*&order=${orderBy}.asc` : '?select=*';
      const u = new URL(`${SUPABASE_URL}/rest/v1/${table}${query}`);
      const req = https.get({
        hostname: u.hostname, path: u.pathname + u.search,
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        timeout: 20000,
      }, (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(d);
            if (Array.isArray(parsed)) return resolve(parsed);
            // Не массив — значит PostgREST вернул ошибку. Раньше она уходила
            // в тишину; теперь видна в /debug и не притворяется пустой таблицей.
            log('SUPA_ERR', `${table}: ${parsed && (parsed.message || parsed.code) || 'unexpected response'}`);
            resolve(null);
          } catch (e) {
            log('SUPA_ERR', `${table}: невалидный JSON (HTTP ${res.statusCode})`);
            resolve(null);
          }
        });
      });
      req.on('error', (e) => { log('SUPA_ERR', `${table}: ${e.message}`); resolve(null); });
      req.on('timeout', () => { req.destroy(); log('SUPA_ERR', `${table}: таймаут`); resolve(null); });
    } catch (e) { log('SUPA_ERR', `${table}: ${e.message}`); resolve(null); }
  });
}

// Контейнер стартует раньше, чем поднимается его сеть: первый заход в Supabase
// стабильно ловил ECONNRESET по всем таблицам, кэш оставался пустым, а следующая
// попытка была только через 15 минут. Значит после каждого деплоя сайт четверть
// часа жил без снапшота (и без Метрики, которая читается из настроек).
const RETRY_DELAYS = [2000, 5000, 15000, 45000];

async function refreshCache(attempt = 0) {
  try {
    log('CACHE', attempt ? `Повтор ${attempt}/${RETRY_DELAYS.length}...` : 'Refreshing from Supabase...');
    // NOTE: portfolio_images NOT fetched here — it's heavy base64/URLs and the client
    // loads it directly. Covers live on portfolio_categories.cover_data (light).
    const [queue, portfolioCategories, prices,
           calcOptions, debts, links, settingsArr] = await Promise.all([
      supaFetch('queue_items'),
      supaFetch('portfolio_categories'),
      supaFetch('prices'),
      supaFetch('calc_options'),
      supaFetch('debts'),
      supaFetch('links'),
      supaFetch('settings', null), // нет колонки sort_order
    ]);

    const got = [queue, portfolioCategories, prices, calcOptions, debts, links, settingsArr];
    const failed = got.filter(r => r === null).length;

    // Всё упало — почти наверняка сеть. Кэш не трогаем (пустой снапшот хуже
    // отсутствия обновления) и пробуем ещё раз с нарастающей паузой.
    if (failed === got.length) {
      log('CACHE_ERR', `Supabase недоступен, все ${failed} таблиц. Кэш оставлен как был.`);
      if (attempt < RETRY_DELAYS.length) {
        setTimeout(() => refreshCache(attempt + 1), RETRY_DELAYS[attempt]);
      } else {
        log('CACHE_ERR', 'Попытки исчерпаны — ждём планового обновления через 15 мин.');
      }
      return;
    }

    // Частичный успех: свежее берём, за упавшие таблицы держимся за прошлое
    // значение, чтобы один сбойный запрос не обнулил рабочий раздел.
    const prev = cache.data || {};
    const data = {
      queue:               queue               ?? prev.queue               ?? [],
      portfolioCategories: portfolioCategories ?? prev.portfolioCategories ?? [],
      prices:              prices              ?? prev.prices              ?? [],
      calcOptions:         calcOptions         ?? prev.calcOptions         ?? [],
      debts:               debts               ?? prev.debts               ?? [],
      links:               links               ?? prev.links               ?? [],
    };

    let settings = cache.settings || {};
    if (settingsArr) {
      settings = {};
      settingsArr.forEach(r => { if (r && r.key) settings[r.key] = r.value; });
    }

    cache = { data, settings, updatedAt: new Date().toISOString() };
    log('CACHE', `OK: q=${data.queue.length} cats=${data.portfolioCategories.length} settings=${Object.keys(settings).length}`
      + (failed ? ` (не ответили: ${failed}, взяты прошлые значения)` : ''));

    // Часть таблиц не ответила — дотянемся позже, не дожидаясь 15 минут.
    if (failed && attempt < RETRY_DELAYS.length) {
      setTimeout(() => refreshCache(attempt + 1), RETRY_DELAYS[attempt]);
    }
  } catch (e) {
    log('CACHE_ERR', e.message);
  }
}

// Proxy Supabase REST — bypasses Russian DPI for writes
function proxySupabase(req, res, supaPath) {
  let body = '';
  req.on('data', c => body += c);
  req.on('end', () => {
    try {
      const target = new URL(SUPABASE_URL + supaPath);
      log('PROXY', `${req.method} ${supaPath.split('?')[0]}`);
      const pr = https.request({
        hostname: target.hostname, path: target.pathname + target.search,
        method: req.method,
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: req.headers['authorization'] || `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: req.headers['prefer'] || '',
          Accept: req.headers['accept'] || 'application/json',
        },
      }, (ps) => {
        let rb = '';
        ps.on('data', c => rb += c);
        ps.on('end', () => {
          log('PROXY', `→ ${ps.statusCode} ${supaPath.split('?')[0]}`);
          // Trigger cache refresh after writes
          if (['POST','PATCH','PUT','DELETE'].includes(req.method)) {
            setTimeout(refreshCache, 500);
          }
          res.writeHead(ps.statusCode, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization,apikey,content-type,prefer,accept',
            'Content-Type': ps.headers['content-type'] || 'application/json',
            ...(ps.headers['content-range'] ? { 'Content-Range': ps.headers['content-range'] } : {}),
          });
          res.end(rb);
        });
      });
      pr.on('error', e => { log('PROXY_ERR', e.message); res.writeHead(502); res.end('{}'); });
      if (body) pr.write(body);
      pr.end();
    } catch (e) { log('PROXY_ERR', e.message); res.writeHead(500); res.end('{}'); }
  });
}

// Binary-safe proxy for Supabase Storage (file uploads + image reads)
// Файлы (картинки, гифки, видео) гоняем ПОТОКОМ, не собирая целиком в памяти.
// Раньше и загрузка, и отдача делали Buffer.concat — то есть 40-мегабайтное
// видео целиком лежало в оперативке контейнера, дважды. На маленьком тарифе
// это упирается в память и рвёт соединение на больших файлах.
function proxyStorage(req, res, supaPath) {
  try {
    const target = new URL(SUPABASE_URL + supaPath);
    log('STORAGE', `${req.method} ${supaPath.split('?')[0]}`);

    const headers = {
      apikey: SUPABASE_KEY,
      Authorization: req.headers['authorization'] || `Bearer ${SUPABASE_KEY}`,
    };
    if (req.headers['content-type'])   headers['Content-Type'] = req.headers['content-type'];
    if (req.headers['content-length']) headers['Content-Length'] = req.headers['content-length'];
    // supabase-js шлёт x-upsert; без него перезапись файла не работает
    if (req.headers['x-upsert'])       headers['x-upsert'] = req.headers['x-upsert'];
    // Диапазоны нужны, чтобы телефон мог перематывать видео, не качая его целиком
    if (req.headers['range'])          headers['Range'] = req.headers['range'];

    const pr = https.request({
      hostname: target.hostname,
      path: target.pathname + target.search,
      method: req.method,
      headers,
    }, (ps) => {
      log('STORAGE', `→ ${ps.statusCode} ${supaPath.split('?')[0]}`);
      if (['POST', 'PUT', 'DELETE'].includes(req.method)) setTimeout(refreshCache, 500);

      const isMedia = req.method === 'GET' && (ps.statusCode === 200 || ps.statusCode === 206);
      const out = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization,apikey,content-type,x-upsert,cache-control',
        'Content-Type': ps.headers['content-type'] || 'application/octet-stream',
      };
      // Пробрасываем заголовки, без которых видео не перематывается на телефоне
      ['content-length', 'content-range', 'accept-ranges', 'etag'].forEach(h => {
        if (ps.headers[h]) out[h === 'etag' ? 'ETag' : h] = ps.headers[h];
      });
      if (isMedia) out['Cache-Control'] = 'public, max-age=31536000, immutable';

      res.writeHead(ps.statusCode, out);
      ps.pipe(res);                       // отдаём по мере поступления
      ps.on('error', () => res.destroy());
    });

    pr.on('error', e => {
      log('STORAGE_ERR', e.message);
      if (!res.headersSent) { res.writeHead(502); res.end(''); }
    });

    req.pipe(pr);                          // принимаем по мере поступления
    req.on('error', () => pr.destroy());
  } catch (e) {
    log('STORAGE_ERR', e.message);
    if (!res.headersSent) { res.writeHead(500); res.end(''); }
  }
}

const MIME = {
  '.html':'text/html','.css':'text/css','.js':'application/javascript',
  '.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif',
  '.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2','.woff':'font/woff',
};

const PATCH = `<script>(function(){var S='${SUPABASE_URL}',f=window.fetch.bind(window);window.fetch=function(u,o){if(typeof u==='string'&&(u.indexOf(S+'/rest/')===0||u.indexOf(S+'/storage/')===0))return f(u.replace(S,'/supa'),o);return f(u,o);};})();</script>`;

// JSON for inlining inside <script>. JSON.stringify does NOT escape "</script>",
// so any DB text containing it would close the tag early and inject raw HTML (XSS).
// Escaping "<" makes that impossible while staying valid JSON/JS.
function safeJson(obj) {
  return JSON.stringify(obj === undefined ? null : obj)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

// ── JSX precompile ──────────────────────────────────────────────────────
// The page ships JSX and lets @babel/standalone (~2.9 MB) compile it in the
// browser on every single load, before the first pixel. Doing it once here at
// startup removes that download AND the compile pass.
//
// Deliberately fail-safe: if @babel/core is missing or anything throws, we
// return the untouched HTML and the browser keeps compiling as before. The
// worst case is exactly today's behaviour, never a broken page.
const BABEL_CDN_RE = /<script src="https:\/\/unpkg\.com\/@babel\/standalone[^>]*><\/script>/g;
const BABEL_BLOCK_RE = /<script[^>]*type="text\/babel"[^>]*>([\s\S]*?)<\/script>/g;

function precompileJSX(html) {
  let babel, presetReact;
  try {
    babel = require('@babel/core');
    presetReact = require('@babel/preset-react');
  } catch (e) {
    log('JSX', 'babel not installed — browser will compile (slow path)');
    return html;
  }
  try {
    let compiled = 0;
    const out = html.replace(BABEL_BLOCK_RE, (_m, code) => {
      const res = babel.transformSync(code, {
        // Only the JSX transform. Modern browsers run the rest natively, so we
        // avoid bloating output with ES5 polyfills.
        presets: [[presetReact, { runtime: 'classic' }]],
        babelrc: false, configFile: false, sourceMaps: false, compact: false,
      });
      if (!res || typeof res.code !== 'string') throw new Error('empty transform result');
      compiled++;
      return '<script>' + res.code + '</script>';
    });
    if (compiled === 0) { log('JSX', 'no babel blocks found — left as is'); return html; }
    // Only drop the CDN once every block compiled successfully.
    const final = out.replace(BABEL_CDN_RE, '');
    log('JSX', `precompiled ${compiled} blocks — babel-standalone dropped`);
    return final;
  } catch (e) {
    log('JSX_ERR', 'precompile failed, falling back to browser: ' + e.message);
    return html;
  }
}

// index.html was read from disk on every request (537 KB each time). Read and
// precompile once, reuse afterwards.
let _baseHtml = null;
function getBaseHTML() {
  if (_baseHtml === null) _baseHtml = precompileJSX(fs.readFileSync(HTML_PATH, 'utf-8'));
  return _baseHtml;
}

// The HTML was sent with no cache headers at all. With neither Cache-Control
// nor ETag nor Last-Modified, browsers fall back to heuristic caching and decide
// the lifetime themselves — phones especially hold on to it. A fresh deploy then
// stays invisible on mobile, where there is no "hard reload" to reach for.
//
// "no-cache" does NOT mean "don't store": it means store, but always revalidate
// with the server first. Paired with an ETag, unchanged pages cost a tiny 304
// and changed pages arrive immediately.
// A short fingerprint of the deployed index.html. Lets you confirm at a glance
// whether a new build actually reached the server, instead of guessing.
function buildFingerprint() {
  try {
    const st = fs.statSync(HTML_PATH);
    const raw = fs.readFileSync(HTML_PATH);
    const hash = crypto.createHash('sha1').update(raw).digest('hex').slice(0, 8);
    return `${hash} · ${Math.round(st.size / 1024)} KB · ${st.mtime.toISOString().slice(0, 16).replace('T', ' ')}`;
  } catch (e) { return 'unavailable'; }
}

function sendHTML(req, res, html, extraHeaders) {
  const etag = '"' + crypto.createHash('sha1').update(html).digest('base64').slice(0, 27) + '"';
  const headers = Object.assign({
    'Content-Type': 'text/html;charset=utf-8',
    'Cache-Control': 'no-cache, must-revalidate',
    'ETag': etag,
  }, extraHeaders || {});
  if (req.headers['if-none-match'] === etag) {
    res.writeHead(304, { 'Cache-Control': headers['Cache-Control'], 'ETag': etag });
    return res.end();
  }
  res.writeHead(200, headers);
  res.end(html);
}

function buildHTML() {
  let html = getBaseHTML();
  // Exclude heavy base64 portfolio_images from inline snapshot (keeps HTML small & fast).
  // Carousel uses cover_data stored on categories; full images load lazily client-side.
  const lightData = Object.assign({}, cache.data || {});
  delete lightData.portfolioImages;
  const dataStr = safeJson(lightData);
  const settingsStr = safeJson(cache.settings || {});
  const snap = `<script>window.__INITIAL_DATA=${dataStr};window.__INITIAL_DATA__=${dataStr};window.__INITIAL_SETTINGS=${settingsStr};window.__INITIAL_SETTINGS__=${settingsStr};</script>`;
  // NOTE: replacements are passed as functions on purpose — a plain string would let
  // "$&", "$'" or "$`" inside the data expand into page fragments and corrupt the HTML.
  html = html.replace('<head>', () => '<head>' + PATCH);
  // Яндекс.Метрика — только если в настройках задан номер счётчика.
  // Вставляем на сервере, а не из React: счётчик должен сработать до отрисовки
  // приложения, иначе часть визитов (и все быстрые уходы) не попадёт в статистику.
  // Ничего не задано — ни одного лишнего байта не уедет.
  const ymId = String((cache.settings && cache.settings.metrika_id) || '').replace(/\D/g, '');
  if (ymId) {
    const ym = `<script>(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};`
      + `m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}`
      + `k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})`
      + `(window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym');`
      + `ym(${ymId},'init',{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});`
      + `window.__YM_ID=${ymId};</script>`
      + `<noscript><div><img src="https://mc.yandex.ru/watch/${ymId}" style="position:absolute;left:-9999px" alt="" /></div></noscript>`;
    html = html.replace('</head>', () => ym + '</head>');
  }

  // Server-side favicon injection — works in ALL browsers (Edge, incognito) on first load
  const favicon = cache.settings && cache.settings.site_favicon;
  if (favicon && typeof favicon === 'string') {
    const safeHref = favicon.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    const faviconTag = `<link rel="icon" href="${safeHref}">`;
    // Remove any existing icon link, then add ours
    html = html.replace(/<link[^>]*rel=["'][^"']*icon[^"']*["'][^>]*>/gi, '');
    html = html.replace('</head>', () => faviconTag + snap + '</head>');
  } else {
    html = html.replace('</head>', () => snap + '</head>');
  }
  return html;
}

const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost');
  const p = u.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization,apikey,content-type,prefer,accept',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    });
    return res.end();
  }

  // Debug page
  if (p === '/debug') {
    res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
    return res.end(`<!DOCTYPE html><html><head><title>Debug</title>
<meta charset="utf-8"><style>
body{background:#111;color:#ddd;font-family:monospace;padding:20px;font-size:13px}
.CACHE{color:#7cf}.CACHE_ERR{color:#f77}.PROXY{color:#7f7}.PROXY_ERR{color:#f77}
.START{color:#ff9}.row{padding:4px 0;border-bottom:1px solid #222}
</style></head><body>
<h2 style="color:#e8a93b">Milaria Debug</h2>
<p>Cache: ${cache.updatedAt ? 'OK @ ' + cache.updatedAt.slice(11,19) : 'NOT LOADED'} | Port: ${PORT}</p>
<p style="color:#e8a93b">Сборка: <b>${buildFingerprint()}</b></p>
<p style="color:#888">JSX: ${_baseHtml && _baseHtml.indexOf('text/babel') === -1 ? 'скомпилирован на сервере ✓' : 'компилируется в браузере (медленно)'}</p>
<p><a href="/debug" style="color:#7cf">Refresh</a></p>
<div>${logs.map(l=>`<div class="row ${l.type}">[${l.t}] <b>${l.type}</b> ${l.msg}</div>`).join('')}</div>
</body></html>`);
  }

  // Supabase proxy
  if (p.startsWith('/supa/rest/')) {
    return proxySupabase(req, res, p.replace('/supa', '') + (u.search || ''));
  }
  if (p.startsWith('/supa/storage/')) {
    return proxyStorage(req, res, p.replace('/supa', '') + (u.search || ''));
  }

  // SPA routes — serve the same HTML for app paths (URL routing inside React)
  const SPA_PATHS = ['/', '/queue', '/portfolio', '/calculator', '/debts', '/tos'];

  // og-image.jpg — social preview. Extracted from the hero picture already
  // embedded in index.html, so no extra asset needs to live in the repo.
  if (p === '/og-image.jpg') {
    try {
      if (!_ogCache) {
        const html = fs.readFileSync(HTML_PATH, 'utf-8');
        const m = html.match(/data:image\/jpe?g;base64,([A-Za-z0-9+/=]{500,})/);
        _ogCache = m ? Buffer.from(m[1], 'base64') : null;
      }
      if (_ogCache) {
        res.writeHead(200, {
          'Content-Type': 'image/jpeg',
          'Content-Length': _ogCache.length,
          'Cache-Control': 'public, max-age=86400',
        });
        return res.end(_ogCache);
      }
    } catch (e) { log('OG_ERR', e.message); }
    res.writeHead(404); return res.end('Not found');
  }

  // robots.txt — let crawlers in, point them at the sitemap
  if (p === '/robots.txt') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end(
      'User-agent: *\n' +
      'Allow: /\n' +
      'Disallow: /supa/\n' +
      'Disallow: /debug\n\n' +
      `Sitemap: ${SITE_ORIGIN}/sitemap.xml\n`
    );
  }

  // sitemap.xml — one entry per real route
  if (p === '/sitemap.xml') {
    const today = new Date().toISOString().slice(0, 10);
    const urls = SPA_PATHS.map(route => {
      const loc = SITE_ORIGIN + (route === '/' ? '/' : route);
      const priority = route === '/' ? '1.0' : '0.8';
      return `  <url><loc>${loc}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${priority}</priority></url>`;
    }).join('\n');
    res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
    return res.end(
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + '\n</urlset>\n'
    );
  }
  if (SPA_PATHS.includes(p) || SPA_PATHS.includes(p.replace(/\/+$/, ''))) {
    return sendHTML(req, res, buildHTML());
  }

  // Static files
  if (p !== '/') {
    const fp = path.join(__dirname, p);
    const ext = path.extname(fp);
    if (fs.existsSync(fp) && fs.statSync(fp).isFile()) {
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      return fs.createReadStream(fp).pipe(res);
    }
    res.writeHead(404); return res.end('Not found');
  }

  // Main page — serve immediately from cache (no waiting!)
  sendHTML(req, res, buildHTML());
});

// Start server FIRST, fetch data after
server.listen(PORT, '0.0.0.0', () => {
  log('START', `Server listening on 0.0.0.0:${PORT}`);
  // Fetch data in background — don't block startup
  refreshCache();
  // Refresh cache every 5 minutes
  setInterval(refreshCache, 15 * 60 * 1000);
});

server.on('error', e => { console.error('SERVER ERROR:', e); process.exit(1); });
