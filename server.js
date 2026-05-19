const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://vgwdudjgvkmlnnfgonbk.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnd2R1ZGpndmttbG5uZmdvbmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NjI2NDksImV4cCI6MjA5NDUzODY0OX0.I_ciFmhRcv2RdXZFaedlMki8c96zTvXkUyJxSVACbr4';
const PORT = process.env.PORT || 3000;
const HTML_PATH = path.join(__dirname, 'index.html');

// In-memory request log for /debug endpoint
const requestLog = [];
function log(type, msg, extra) {
  const entry = { t: new Date().toISOString(), type, msg, extra };
  requestLog.unshift(entry);
  if (requestLog.length > 100) requestLog.pop();
  console.log(`[${entry.t}] ${type}: ${msg}`, extra || '');
}

// Fetch Supabase table server-side
function supabaseFetch(endpoint) {
  return new Promise((resolve) => {
    const urlStr = `${SUPABASE_URL}/rest/v1/${endpoint}`;
    const parsed = new URL(urlStr);
    const req = https.get({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve([]); } });
    });
    req.on('error', (e) => { log('FETCH_ERROR', endpoint, e.message); resolve([]); });
    req.setTimeout(8000, () => { req.destroy(); resolve([]); });
  });
}

// Proxy to Supabase — passes user auth token through, fixes DPI
function proxyToSupabase(req, res, supaPath) {
  let body = '';
  req.on('data', c => body += c);
  req.on('end', () => {
    // FIXED: supaPath already contains full path like /rest/v1/table_name
    const targetUrl = new URL(`${SUPABASE_URL}${supaPath}`);
    log('PROXY', `${req.method} ${supaPath}`, body ? `body: ${body.length} bytes` : '');

    const opts = {
      hostname: targetUrl.hostname,
      path: targetUrl.pathname + targetUrl.search,
      method: req.method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': req.headers['authorization'] || `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': req.headers['prefer'] || '',
        'Accept': req.headers['accept'] || 'application/json',
      }
    };

    const pr = https.request(opts, (ps) => {
      let respBody = '';
      ps.on('data', c => respBody += c);
      ps.on('end', () => {
        log('PROXY_RESP', `${ps.statusCode} ${supaPath}`, respBody.slice(0, 200));
        res.writeHead(ps.statusCode, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, apikey, content-type, prefer, accept',
          'Content-Type': ps.headers['content-type'] || 'application/json',
          ...(ps.headers['content-range'] ? { 'Content-Range': ps.headers['content-range'] } : {}),
        });
        res.end(respBody);
      });
    });
    pr.on('error', (e) => {
      log('PROXY_ERROR', supaPath, e.message);
      res.writeHead(502);
      res.end(JSON.stringify({ error: e.message }));
    });
    if (body) pr.write(body);
    pr.end();
  });
}

const MIME = {
  '.html':'text/html','.css':'text/css','.js':'application/javascript',
  '.json':'application/json','.png':'image/png','.jpg':'image/jpeg',
  '.jpeg':'image/jpeg','.gif':'image/gif','.svg':'image/svg+xml',
  '.ico':'image/x-icon','.woff2':'font/woff2','.woff':'font/woff',
  '.ttf':'font/ttf','.webp':'image/webp',
};

// Proxy patch: redirects Supabase REST calls through /supa/
const PROXY_PATCH = `<script>
(function(){
  var SUPA='${SUPABASE_URL}';
  var orig=window.fetch.bind(window);
  window.fetch=function(url,opts){
    if(typeof url==='string'&&url.indexOf(SUPA+'/rest/')===0){
      var proxied=url.replace(SUPA,'/supa');
      console.log('[proxy] '+url.split('/rest/v1/')[1]?.split('?')[0]+' → server');
      return orig(proxied,opts);
    }
    return orig(url,opts);
  };
  window.__PROXY_ACTIVE=true;
  console.log('[milaria] Server proxy active — all Supabase REST calls routed via server');
})();
</script>`;

const server = http.createServer(async (req, res) => {
  const parsed = new URL(req.url, `http://localhost`);
  const pathname = parsed.pathname;

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, apikey, content-type, prefer, accept',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    });
    res.end();
    return;
  }

  // Debug endpoint: shows last 50 proxy requests
  if (pathname === '/debug') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html><html><head><title>Debug</title>
<style>body{font-family:monospace;background:#111;color:#eee;padding:20px}
.entry{padding:6px 0;border-bottom:1px solid #333}
.PROXY{color:#7cf}.PROXY_RESP{color:#7f7}.PROXY_ERROR{color:#f77}.FETCH_ERROR{color:#f77}
</style></head><body>
<h2>Milaria Server Log (last ${requestLog.length} entries)</h2>
<a href="/debug" style="color:#7cf">Обновить</a>
<div style="margin-top:16px">
${requestLog.map(e => `<div class="entry ${e.type}"><b>${e.t.slice(11,19)}</b> [${e.type}] ${e.msg} ${e.extra ? `<small style="color:#aaa">${e.extra}</small>` : ''}</div>`).join('')}
</div></body></html>`);
    return;
  }

  // Supabase proxy: /supa/rest/v1/... → Supabase
  if (pathname.startsWith('/supa/')) {
    const supaPath = pathname.replace('/supa', '') + (parsed.search || '');
    proxyToSupabase(req, res, supaPath);
    return;
  }

  // Static files
  if (pathname !== '/') {
    const filePath = path.join(__dirname, pathname);
    const ext = path.extname(filePath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
    res.writeHead(404); res.end('Not found');
    return;
  }

  // Main page: inject data + proxy patch
  try {
    log('SSR', 'Fetching all tables...');
    const [queue, portfolioCategories, portfolioImages, prices, calcOptions, debts, links, settingsArr] =
      await Promise.all([
        supabaseFetch('queue_items?select=*&order=sort_order.asc'),
        supabaseFetch('portfolio_categories?select=*&order=sort_order.asc'),
        supabaseFetch('portfolio_images?select=*&order=sort_order.asc'),
        supabaseFetch('prices?select=*&order=sort_order.asc'),
        supabaseFetch('calc_options?select=*&order=sort_order.asc'),
        supabaseFetch('debts?select=*&order=sort_order.asc'),
        supabaseFetch('links?select=*&order=sort_order.asc'),
        supabaseFetch('settings?select=*'),
      ]);

    const settings = {};
    if (Array.isArray(settingsArr)) settingsArr.forEach(r => { if (r.key) settings[r.key] = r.value; });
    log('SSR', 'Done', `q:${queue.length} pf:${portfolioImages.length} s:${Object.keys(settings).length}`);

    const snapshot = `<script>
window.__INITIAL_DATA__=${JSON.stringify({queue,portfolioCategories,portfolioImages,prices,calcOptions,debts,links})};
window.__INITIAL_SETTINGS__=${JSON.stringify(settings)};
</script>`;

    let html = fs.readFileSync(HTML_PATH, 'utf-8');
    html = html.replace('<head>', '<head>' + PROXY_PATCH);
    html = html.replace('</head>', snapshot + '\n</head>');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    log('SSR_ERROR', err.message);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(fs.readFileSync(HTML_PATH));
  }
});

server.listen(PORT, () => log('START', `Milaria server on port ${PORT}`));
