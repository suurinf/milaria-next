const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://vgwdudjgvkmlnnfgonbk.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnd2R1ZGpndmttbG5uZmdvbmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NjI2NDksImV4cCI6MjA5NDUzODY0OX0.I_ciFmhRcv2RdXZFaedlMki8c96zTvXkUyJxSVACbr4';
const PORT = process.env.PORT || 3000;
const HTML_PATH = path.join(__dirname, 'index.html');

// Fetch Supabase table server-side (no DPI issues)
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
    req.on('error', () => resolve([]));
    req.setTimeout(8000, () => { req.destroy(); resolve([]); });
  });
}

// Proxy Supabase REST call — passes user auth token through
// This routes ALL Supabase writes via the server, bypassing Russian ISP DPI
function proxyToSupabase(req, res, supaPath) {
  let body = '';
  req.on('data', c => body += c);
  req.on('end', () => {
    const targetUrl = new URL(`${SUPABASE_URL}/rest/v1${supaPath}`);
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
      const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, apikey, content-type, prefer, accept',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Content-Type': ps.headers['content-type'] || 'application/json',
      };
      if (ps.headers['content-range']) headers['Content-Range'] = ps.headers['content-range'];
      res.writeHead(ps.statusCode, headers);
      ps.pipe(res);
    });
    pr.on('error', (e) => { res.writeHead(502); res.end(JSON.stringify({ error: e.message })); });
    if (body) pr.write(body);
    pr.end();
  });
}

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.ttf': 'font/ttf', '.webp': 'image/webp',
};

// Patch script injected before </head>
// Routes ALL Supabase REST calls through our proxy → bypasses DPI
const PROXY_PATCH = `<script>
(function(){
  var SUPA='${SUPABASE_URL}';
  var orig=window.fetch.bind(window);
  window.fetch=function(url,opts){
    if(typeof url==='string'&&url.indexOf(SUPA+'/rest/')===0){
      url=url.replace(SUPA+'/rest/','/supa/rest/');
    }
    return orig(url,opts);
  };
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

  // Supabase proxy route: /supa/rest/v1/... → Supabase
  if (pathname.startsWith('/supa/')) {
    const supaPath = pathname.replace('/supa', '') + (parsed.search || '');
    proxyToSupabase(req, res, supaPath);
    return;
  }

  // Static files (assets/hero-art.jpg, etc.)
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

  // Main page: inject fresh data from Supabase + proxy patch
  try {
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

    const snapshot = `<script>
window.__INITIAL_DATA__ = ${JSON.stringify({ queue, portfolioCategories, portfolioImages, prices, calcOptions, debts, links })};
window.__INITIAL_SETTINGS__ = ${JSON.stringify(settings)};
</script>`;

    let html = fs.readFileSync(HTML_PATH, 'utf-8');
    // Inject proxy patch first (before any scripts), then data snapshot
    html = html.replace('<head>', '<head>' + PROXY_PATCH);
    html = html.replace('</head>', snapshot + '\n</head>');

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    console.error('SSR error:', err.message);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(fs.readFileSync(HTML_PATH));
  }
});

server.listen(PORT, () => console.log(`✓ Milaria server on port ${PORT}`));
