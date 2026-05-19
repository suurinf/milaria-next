const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json({ limit: '50mb' }));

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://vgwdudjgvkmlnnfgonbk.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnd2R1ZGpndmttbG5uZmdvbmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NjI2NDksImV4cCI6MjA5NDUzODY0OX0.I_ciFmhRcv2RdXZFaedlMki8c96zTvXkUyJxSVACbr4';

// Fetch a Supabase table via Node.js https (bypasses client DPI issues)
function fetchTable(table) {
  return new Promise((resolve) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${table}?select=*&order=sort_order.asc`);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve([]); }
      });
    }).on('error', () => resolve([]));
  });
}

function fetchSettings() {
  return new Promise((resolve) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/settings?select=*`);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const rows = JSON.parse(data);
          const map = {};
          if (Array.isArray(rows)) rows.forEach(r => { map[r.key] = r.value; });
          resolve(map);
        } catch { resolve({}); }
      });
    }).on('error', () => resolve({}));
  });
}

// Proxy Supabase REST requests — fixes DPI issue for writes
app.use('/supabase-proxy', async (req, res) => {
  const targetPath = req.path;
  const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  const url = new URL(`${SUPABASE_URL}/rest/v1${targetPath}${query}`);
  const body = (req.method !== 'GET' && req.method !== 'HEAD') ? JSON.stringify(req.body) : null;

  const options = {
    hostname: url.hostname,
    path: url.pathname + url.search,
    method: req.method,
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': req.headers['prefer'] || '',
    },
  };

  const proxyReq = https.request(options, (proxyRes) => {
    res.status(proxyRes.statusCode);
    Object.entries(proxyRes.headers).forEach(([k, v]) => {
      if (!['transfer-encoding'].includes(k)) res.setHeader(k, v);
    });
    proxyRes.pipe(res);
  });
  proxyReq.on('error', () => res.status(502).json({ error: 'proxy error' }));
  if (body) proxyReq.write(body);
  proxyReq.end();
});

// Main route — serve HTML with data pre-injected
app.get('/', async (req, res) => {
  try {
    const [queue, portfolioCategories, portfolioImages, prices, calcOptions, debts, links, settings] =
      await Promise.all([
        fetchTable('queue_items'),
        fetchTable('portfolio_categories'),
        fetchTable('portfolio_images'),
        fetchTable('prices'),
        fetchTable('calc_options'),
        fetchTable('debts'),
        fetchTable('links'),
        fetchSettings(),
      ]);

    const data = { queue, portfolioCategories, portfolioImages, prices, calcOptions, debts, links };
    const snapshot = `<script>window.__INITIAL_DATA__ = ${JSON.stringify(data)};window.__INITIAL_SETTINGS__ = ${JSON.stringify(settings)};</script>`;

    let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
    html = html.replace('</head>', snapshot + '</head>');
    res.send(html);
  } catch (err) {
    console.error('SSR error:', err);
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✓ Milaria running on :${PORT}`));
