const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://vgwdudjgvkmlnnfgonbk.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnd2R1ZGpndmttbG5uZmdvbmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NjI2NDksImV4cCI6MjA5NDUzODY0OX0.I_ciFmhRcv2RdXZFaedlMki8c96zTvXkUyJxSVACbr4';
const PORT = process.env.PORT || 3000;
const HTML_PATH = path.join(__dirname, 'index.html');

function supabaseFetch(endpoint) {
  return new Promise((resolve) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${endpoint}`);
    const req = https.get({
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve([]); } });
    });
    req.on('error', () => resolve([]));
    req.setTimeout(5000, () => { req.destroy(); resolve([]); });
  });
}

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff',
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost`);
  const pathname = url.pathname;

  // Serve static files (assets/, etc.)
  if (pathname !== '/') {
    const filePath = path.join(__dirname, pathname);
    const ext = path.extname(filePath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
    // Supabase proxy — fixes DPI issue for writes from Russian users
    if (pathname.startsWith('/api/supabase/')) {
      const target = pathname.replace('/api/supabase/', '') + url.search;
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        const opts = {
          hostname: new URL(SUPABASE_URL).hostname,
          path: '/rest/v1/' + target,
          method: req.method,
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': req.headers['prefer'] || '',
          }
        };
        const pr = https.request(opts, (ps) => {
          res.writeHead(ps.statusCode, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          });
          ps.pipe(res);
        });
        pr.on('error', () => res.writeHead(502) && res.end());
        if (body) pr.write(body);
        pr.end();
      });
      return;
    }
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  // Main page — inject fresh Supabase data
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
    if (Array.isArray(settingsArr)) settingsArr.forEach(r => { settings[r.key] = r.value; });

    const snapshot = `<script>
window.__INITIAL_DATA__ = ${JSON.stringify({ queue, portfolioCategories, portfolioImages, prices, calcOptions, debts, links })};
window.__INITIAL_SETTINGS__ = ${JSON.stringify(settings)};
</script>`;

    let html = fs.readFileSync(HTML_PATH, 'utf-8');
    html = html.replace('</head>', snapshot + '\n</head>');

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    console.error('Error:', err.message);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(fs.readFileSync(HTML_PATH));
  }
});

server.listen(PORT, () => console.log(`✓ Milaria server running on port ${PORT}`));
