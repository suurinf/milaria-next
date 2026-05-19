const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const SUPABASE_URL = 'https://vgwdudjgvkmlnnfgonbk.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnd2R1ZGpndmttbG5uZmdvbmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NjI2NDksImV4cCI6MjA5NDUzODY0OX0.I_ciFmhRcv2RdXZFaedlMki8c96zTvXkUyJxSVACbr4';
const PORT = parseInt(process.env.PORT) || 3000;
const HTML_PATH = path.join(__dirname, 'index.html');

// In-memory cache — served immediately, refreshed in background
let cache = { data: null, settings: {}, updatedAt: null };
const logs = [];

function log(type, msg) {
  const entry = { t: new Date().toISOString().slice(11,19), type, msg };
  logs.unshift(entry);
  if (logs.length > 200) logs.pop();
  console.log(`[${entry.t}] ${type}: ${msg}`);
}

function supaFetch(table) {
  return new Promise((resolve) => {
    try {
      const u = new URL(`${SUPABASE_URL}/rest/v1/${table}?select=*&order=sort_order.asc`);
      const req = https.get({
        hostname: u.hostname, path: u.pathname + u.search,
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        timeout: 6000,
      }, (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve([]); } });
      });
      req.on('error', () => resolve([]));
      req.on('timeout', () => { req.destroy(); resolve([]); });
    } catch { resolve([]); }
  });
}

async function refreshCache() {
  try {
    log('CACHE', 'Refreshing from Supabase...');
    const [queue, portfolioCategories, portfolioImages, prices,
           calcOptions, debts, links, settingsArr] = await Promise.all([
      supaFetch('queue_items'),
      supaFetch('portfolio_categories'),
      supaFetch('portfolio_images'),
      supaFetch('prices'),
      supaFetch('calc_options'),
      supaFetch('debts'),
      supaFetch('links'),
      supaFetch('settings'),
    ]);
    const settings = {};
    if (Array.isArray(settingsArr)) settingsArr.forEach(r => { if (r.key) settings[r.key] = r.value; });
    cache = {
      data: { queue, portfolioCategories, portfolioImages, prices, calcOptions, debts, links },
      settings,
      updatedAt: new Date().toISOString(),
    };
    log('CACHE', `OK: q=${queue.length} img=${portfolioImages.length} settings=${Object.keys(settings).length}`);
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

const MIME = {
  '.html':'text/html','.css':'text/css','.js':'application/javascript',
  '.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif',
  '.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2','.woff':'font/woff',
};

const PATCH = `<script>(function(){var S='${SUPABASE_URL}',f=window.fetch.bind(window);window.fetch=function(u,o){return typeof u==='string'&&u.indexOf(S+'/rest/')===0?f(u.replace(S,'/supa'),o):f(u,o);};})();</script>`;

function buildHTML() {
  let html = fs.readFileSync(HTML_PATH, 'utf-8');
  const snap = `<script>window.__INITIAL_DATA__=${JSON.stringify(cache.data||{})};window.__INITIAL_SETTINGS__=${JSON.stringify(cache.settings||{})};</script>`;
  html = html.replace('<head>', '<head>' + PATCH);
  html = html.replace('</head>', snap + '</head>');
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
<p><a href="/debug" style="color:#7cf">Refresh</a></p>
<div>${logs.map(l=>`<div class="row ${l.type}">[${l.t}] <b>${l.type}</b> ${l.msg}</div>`).join('')}</div>
</body></html>`);
  }

  // Supabase proxy
  if (p.startsWith('/supa/rest/')) {
    return proxySupabase(req, res, p.replace('/supa', '') + (u.search || ''));
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
  res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
  res.end(buildHTML());
});

// Start server FIRST, fetch data after
server.listen(PORT, '0.0.0.0', () => {
  log('START', `Server listening on 0.0.0.0:${PORT}`);
  // Fetch data in background — don't block startup
  refreshCache();
  // Refresh cache every 5 minutes
  setInterval(refreshCache, 5 * 60 * 1000);
});

server.on('error', e => { console.error('SERVER ERROR:', e); process.exit(1); });
