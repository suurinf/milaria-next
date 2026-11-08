
// app.jsx — Главное приложение milaria (с Supabase auth)

const { useState: appState, useEffect: appEffect } = React;

const FONT_PAIRS = {
  cormorant: { display: "'Cormorant Garamond', Georgia, serif",   body: "'IBM Plex Sans', system-ui, sans-serif",  label: "Cormorant + Plex" },
  garamond:  { display: "'EB Garamond', Georgia, serif",          body: "'IBM Plex Sans', system-ui, sans-serif",  label: "Garamond + Plex" },
  playfair:  { display: "'Playfair Display', Georgia, serif",     body: "'DM Sans', system-ui, sans-serif",        label: "Playfair + DM" },
  instrument:{ display: "'Instrument Serif', Georgia, serif",     body: "'Manrope', system-ui, sans-serif",        label: "Instrument + Manrope" },
  unbounded: { display: "'Unbounded', system-ui, sans-serif",     body: "'Inter Tight', system-ui, sans-serif",    label: "Unbounded + Tight" },
};

const ACCENT_PALETTES = {
  amber:   { accent: "#e8a93b", deep: "#b8741f", soft: "#f5d4a3" },
  sunset:  { accent: "#e88a3a", deep: "#a85518", soft: "#f5c6a3" },
  peach:   { accent: "#e8b89c", deep: "#b87a5a", soft: "#f5e0d2" },
  pink:    { accent: "#ec6aa7", deep: "#9a3d68", soft: "#ffd1e6" },
  rose:    { accent: "#d97585", deep: "#9a4654", soft: "#f0c8cf" },
  honey:   { accent: "#d4b94a", deep: "#9a832a", soft: "#f0e3a0" },
};

// Оформление сайта. Раньше правилось панелью Tweaks из редактора-прототипа,
// на живом сайте она не открывалась — оставили только сами значения.
const TWEAK_DEFAULTS = {
  "fontPair": "cormorant",
  "accent": "amber",
  "radius": 14,
  "barStyle": "classic",
  "layout": "list"
};

async function connection_check() {
  if (!window.__supabase) return { ok: false, msg: 'SDK не загружен' };
  try {
    const t0 = Date.now();
    const { data, error } = await window.__supabase.from('queue_items').select('id').limit(1);
    const ms = Date.now() - t0;
    if (error) return { ok: false, msg: 'DB error: ' + error.message };
    // Try a write to test RLS
    const { data: { user } } = await window.__supabase.auth.getUser();
    if (!user) return { ok: 'read', msg: `Чтение OK (${ms}ms), но не залогинен — запись недоступна` };
    return { ok: true, msg: `Полный доступ OK (${ms}ms)` };
  } catch (e) {
    return { ok: false, msg: 'Network error: ' + (e?.message || 'unknown') };
  }
}

// ── Favicon manager: applies custom favicon + admin control ──
function SiteFavicon({ admin }) {
  const [favicon, saveFavicon] = useSetting('site_favicon', '');
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!favicon) return;
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = favicon;
  }, [favicon]);

  if (!admin) return null;

  async function upload(files) {
    setBusy(true);
    const up = await window.uploadIconToStorage(files[0]);
    setBusy(false);
    if (up && up.url) setInput(up.url);
  }

  return (
    <>
      <button className="ed-btn ed-btn--ghost" onClick={() => { setInput(favicon || ''); setOpen(true); }}
        title="Значок сайта во вкладке браузера">
        {favicon ? <img src={favicon} alt="" style={{ width: 14, height: 14, borderRadius: 3, objectFit: 'cover' }} /> : <EdIcon name="image" size={14} />}
        <span>Значок</span>
      </button>
      {open && (
        <EditorModal onClose={() => setOpen(false)} size="sm"
          eyebrow="настройки сайта" title="Значок сайта"
          subtitle="Картинка во вкладке браузера и в закладках. Лучше квадратная — при загрузке она ужимается до 64 px."
          footer={<>
            {favicon && (
              <button className="ed-btn ed-btn--ghost" style={{ marginRight: 'auto' }}
                onClick={() => { saveFavicon(''); setInput(''); setOpen(false); }}>Сбросить</button>
            )}
            <button className="ed-btn ed-btn--ghost" onClick={() => setOpen(false)}>Отмена</button>
            <button className="ed-btn ed-btn--primary" onClick={() => { saveFavicon(input); setOpen(false); }}>
              <EdIcon name="check" size={15} /> Сохранить
            </button>
          </>}>
          <div className="ed-stack">
            <div>
              <div className="ed-tab-preview">
                {input ? <img src={input} alt="" /> : <EdIcon name="image" size={16} />}
                <span>Milaria — VTuber-художник</span>
              </div>
              <div className="ed-tab-strip" />
            </div>
            <EdDropzone onFiles={upload} busy={busy} label="Загрузить картинку" hint="PNG, JPG, SVG или ICO" />
            <div className="ed-input-wrap">
              <EdIcon name="link" size={14} />
              <input className="ed-input ed-input--icon" value={input} onChange={e => setInput(e.target.value)}
                placeholder="…или вставь ссылку на значок" />
            </div>
          </div>
        </EditorModal>
      )}
    </>
  );
}

// ── Перенос баннера и значка из базы в хранилище ──
// Показывается админу, только пока в базе есть картинки base64.
// После переноса пропадает сама.
function InlineImagesMigrator() {
  const [info, setInfo] = React.useState(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    window.inlineImagesInfo?.().then(r => { if (alive) setInfo(r); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  if (!info || !info.count) return null;

  async function run() {
    if (!(await askConfirm('Баннер и значок останутся теми же, но сайт станет легче для каждого посетителя.\nЕсли хочешь подстраховаться — сначала нажми «Бэкап».',
      { title: `Перенести ${info.count} картинок (${info.kb} КБ) в хранилище?`, okText: 'Перенести' }))) return;
    setBusy(true);
    try {
      const r = await window.migrateInlineImages();
      try {
        ['banner', 'site_favicon'].forEach(k => localStorage.removeItem('milaria:setting:' + k));
        localStorage.removeItem('milaria:milaria:banner');
      } catch (e) {}
      await edNotice(r.failed ? `Перенесено: ${r.moved}, не получилось: ${r.failed}` : `Перенесено картинок: ${r.moved}`,
        r.failed ? `${r.errors.join('\n')}\n\nНеперенесённые остались как были.` : 'Страница перезагрузится.');
      location.reload();
    } catch (e) {
      await edNotice('Не получилось', (e && e.message || e) + '\n\nНичего не сломано, картинки остались в базе.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className="ed-btn ed-btn--accent" onClick={run} disabled={busy}
      title="Баннер и значок лежат в базе и утяжеляют каждую страницу">
      {busy ? <span className="ed-spinner" /> : <EdIcon name="upload" size={14} />}
      <span>{busy ? 'Переношу…' : `Картинки в хранилище (${info.kb} КБ)`}</span>
    </button>
  );
}

function App() {
  const [lang, setLang] = appState(() => loadLS('lang', 'ru'));
  // ── URL routing ──
  const PATH_TO_TAB = { '/': 'home', '/queue': 'queue', '/portfolio': 'portfolio',
    '/calculator': 'calculator', '/debts': 'debts', '/tos': 'tos' };
  const TAB_TO_PATH = { home: '/', queue: '/queue', portfolio: '/portfolio',
    calculator: '/calculator', debts: '/debts', tos: '/tos' };
  function pathToTab(p) {
    const clean = (p || '/').replace(/\/+$/, '') || '/';
    return PATH_TO_TAB[clean] || 'home';
  }

  const [tab, setTabRaw] = appState(() => {
    if (typeof window !== 'undefined' && window.location) return pathToTab(window.location.pathname);
    return loadLS('tab', 'home');
  });

  // Sections are only hidden, never unmounted, so the page keeps whatever scroll
  // offset the previous tab had — you'd tap "Долги" from halfway down Portfolio
  // and land in the middle of the price list. Remember a position per tab:
  // return to a tab you were reading and you're back where you left off; open a
  // fresh one and you start at the top.
  const scrollByTab = React.useRef({});
  const skipRestore = React.useRef(true);

  function setTab(newTab) {
    if (newTab === tab) return;
    scrollByTab.current[tab] = window.scrollY || 0; // remember where we stood
    skipRestore.current = false;
    setTabRaw(newTab);
    const path = TAB_TO_PATH[newTab] || '/';
    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      try { window.history.pushState({ tab: newTab }, '', path); } catch(e) {}
    }
  }

  // Restore before paint so there is no visible jump.
  React.useLayoutEffect(() => {
    // Don't fight the browser's own restoration on first load / refresh.
    if (skipRestore.current) { skipRestore.current = false; return; }
    const y = scrollByTab.current[tab];
    window.scrollTo({ top: typeof y === 'number' ? y : 0, behavior: 'auto' });
  }, [tab]);

  // Sync state when user uses browser back/forward
  appEffect(() => {
    const handler = () => {
      scrollByTab.current[tab] = window.scrollY || 0;
      skipRestore.current = false;
      setTabRaw(pathToTab(window.location.pathname));
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [tab]);

  // Per-route <title> + <html lang> — real routes deserve real titles (SEO + browser tabs)
  appEffect(() => {
    const site = 'Milaria';
    const titles = {
      ru: { home: 'VTuber-художник: модели, риг, арт', queue: 'Очередь заказов',
            portfolio: 'Портфолио работ', calculator: 'Калькулятор стоимости',
            debts: 'Twitch долги', tos: 'Условия предоставления услуг' },
      en: { home: 'VTuber artist: models, rigging, art', queue: 'Order queue',
            portfolio: 'Portfolio', calculator: 'Price calculator',
            debts: 'Twitch debts', tos: 'Terms of Service' },
    };
    const label = (titles[lang] || titles.ru)[tab] || site;
    document.title = tab === 'home' ? `${site} — ${label}` : `${label} | ${site}`;
    document.documentElement.lang = lang;

    // SPA не перезагружает страницу, поэтому просмотры разделов надо отправлять
    // руками — иначе в статистике будет виден только вход на сайт.
    if (window.ym && window.__YM_ID) {
      try {
        window.ym(window.__YM_ID, 'hit', window.location.pathname, { title: document.title });
      } catch (e) {}
    }
  }, [tab, lang]);
  const t = TWEAK_DEFAULTS;
  const auth = useAuth();
  const [loginOpen, setLoginOpen] = appState(false);
  const admin = auth.isAdmin;

  appEffect(() => saveLS('lang', lang), [lang]);

  appEffect(() => {
    const root = document.documentElement;
    const pair = FONT_PAIRS[t.fontPair] || FONT_PAIRS.cormorant;
    const pal = ACCENT_PALETTES[t.accent] || ACCENT_PALETTES.amber;
    root.style.setProperty('--font-display', pair.display);
    root.style.setProperty('--font-body', pair.body);
    root.style.setProperty('--accent', pal.accent);
    root.style.setProperty('--accent-deep', pal.deep);
    root.style.setProperty('--accent-soft', pal.soft);
    root.style.setProperty('--radius-card', t.radius + 'px');
  }, [t]);

  const i18n = I18N[lang];

  const tabs = [
    { id: 'home',       label: i18n.nav.home },
    { id: 'queue',      label: i18n.nav.queue },
    { id: 'portfolio',  label: i18n.nav.portfolio },
    { id: 'calculator', label: i18n.nav.calculator },
    { id: 'debts',      label: i18n.nav.debts },
    { id: 'tos',        label: i18n.nav.tos },
  ];

  // Mount a section on first visit, then keep it mounted (hidden) so its state
  // survives tab switches. Mounting all 7 upfront made every section fetch its
  // data and run its timers on page load — even the ones nobody opened.
  const mountedTabs = React.useRef(new Set());
  mountedTabs.current.add(tab);

  const sections = [
    { id: 'home',       el: <HomeSection t={i18n} lang={lang} admin={admin} onGoTo={setTab} /> },
    { id: 'queue',      el: <QueueSection t={i18n} lang={lang} admin={admin} layout={t.layout} barStyle={t.barStyle} /> },
    { id: 'portfolio',  el: <PortfolioSection t={i18n} lang={lang} admin={admin} /> },
    { id: 'calculator', el: <CalculatorSection t={i18n} lang={lang} admin={admin} /> },
    { id: 'debts',      el: <DebtsSection t={i18n} admin={admin} lang={lang} /> },
    { id: 'tos',        el: <TosSection t={i18n} lang={lang} /> },
  ];

  const isHome = tab === 'home';

  // Ручной бэкап — на случай "сейчас полезу в SQL, страшно".
  // Автоматический идёт раз в сутки через GitHub Action, это дополнение к нему.
  const [backupBusy, setBackupBusy] = appState(false);
  async function downloadBackup() {
    if (backupBusy) return;
    setBackupBusy(true);
    const TABLES = ['queue_items', 'portfolio_categories', 'portfolio_images',
                    'prices', 'calc_options', 'debts', 'links', 'settings'];
    try {
      const dump = { takenAt: new Date().toISOString(), tables: {} };
      const failed = [];
      for (const t of TABLES) {
        const { data, error } = await window.__supabase.from(t).select('*');
        if (error) { failed.push(t); continue; }
        dump.tables[t] = data || [];
      }
      if (Object.keys(dump.tables).length === 0) {
        edNotice('Бэкап не получился', 'Не удалось выгрузить ни одной таблицы. Проверь связь с Supabase.');
        return;
      }
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `milaria-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      const rows = Object.values(dump.tables).reduce((s, r) => s + r.length, 0);
      edNotice(failed.length ? `Выгружено ${rows} строк, но не всё` : 'Бэкап скачан',
        failed.length ? `Не удалось: ${failed.join(', ')}` : `${rows} строк из ${TABLES.length} таблиц — файл ${a.download}`);
    } catch (e) {
      edNotice('Бэкап не удался', String(e && e.message));
    } finally {
      setBackupBusy(false);
    }
  }

  // Номер счётчика Метрики. Сам счётчик вставляет сервер (до отрисовки),
  // здесь только поле, куда его вписать.
  const [metrikaId, saveMetrikaId] = useSetting('metrika_id', '');
  async function setupMetrika() {
    const cur = String(metrikaId || '');
    const v = await askText('Яндекс.Метрика', {
      eyebrow: 'аналитика',
      message: 'Номер счётчика — только цифры. Взять тут: metrika.yandex.ru → счётчик → Настройка → Номер.\nОставь поле пустым, чтобы отключить аналитику.',
      initial: cur, placeholder: 'например, 12345678', inputMode: 'numeric', okText: 'Сохранить',
    });
    if (v === null) return;
    const clean = v.replace(/\D/g, '');
    saveMetrikaId(clean);
    edNotice(clean ? `Счётчик ${clean} сохранён` : 'Аналитика отключена',
      clean ? 'Появится на сайте в течение минуты.' : '');
  }


  function handleAdminToggle() {
    if (admin) {
      // already logged in — offer logout
      askConfirm(lang === 'ru' ? 'Выйти из режима редактирования?' : 'Sign out of edit mode?',
        { okText: lang === 'ru' ? 'Выйти' : 'Sign out' }).then(ok => { if (ok) auth.signOut(); });
    } else {
      setLoginOpen(true);
    }
  }

  return (
    <>
      <BackgroundLayer bgImage={null} />
      <div className="app">
        <TopNav
          tabs={tabs}
          active={tab}
          onChange={setTab}
          lang={lang}
          onLangToggle={() => setLang(lang === 'ru' ? 'en' : 'ru')}
          admin={admin}
          onAdminToggle={handleAdminToggle}
          t={i18n}
        />

        {admin && (
          <div className="ed-bar">
            <span className="ed-bar-pill">{i18n.common.adminOn}</span>
            <span className="ed-bar-info">
              <span className="ed-bar-email">{auth.email}</span>
              <span className="ed-bar-hint">
                {lang === 'ru' ? 'Текст и числа с пунктирной рамкой меняются по клику' : 'Click dashed text or numbers to edit'}
              </span>
            </span>
            <span className="ed-bar-actions">
              <InlineImagesMigrator />
              <SiteFavicon admin={admin} />
              <button className="ed-btn ed-btn--ghost" onClick={downloadBackup} disabled={backupBusy}
                title="Скачать все данные из Supabase одним JSON">
                {backupBusy ? <span className="ed-spinner" /> : <EdIcon name="download" size={14} />}
                <span>Бэкап</span>
              </button>
              <button className="ed-btn ed-btn--ghost" onClick={setupMetrika}
                title="Номер счётчика Яндекс.Метрики">
                <EdIcon name="chart" size={14} />
                <span>{metrikaId ? 'Метрика ' + metrikaId : 'Аналитика'}</span>
              </button>
              <button className="ed-btn ed-btn--ghost" onClick={async () => {
                if (await askConfirm('Обновить данные с сервера?', {
                  message: 'Сбросит то, что браузер запомнил у себя, и перезагрузит страницу. Ничего на сайте не удалится.',
                  okText: 'Обновить',
                })) {
                  try {
                    Object.keys(localStorage).forEach(k => {
                      if (k.startsWith('milaria:cache:') || k.startsWith('milaria:setting:')) localStorage.removeItem(k);
                    });
                  } catch(e) {}
                  location.reload();
                }
              }} title="Синхронизировать с сервером">
                <EdIcon name="refresh" size={14} />
                <span>Обновить</span>
              </button>
              <span className="ed-bar-sep" />
              <button className="ed-btn ed-btn--ghost" onClick={() => auth.signOut()} title={lang === 'ru' ? 'Выйти из редактора' : 'Sign out'}>
                <EdIcon name="logout" size={14} />
                <span>{lang === 'ru' ? 'Выйти' : 'Sign out'}</span>
              </button>
            </span>
          </div>
        )}

        {isHome ?
          <main>
            {sections.filter(s => mountedTabs.current.has(s.id)).map(s => (
              <div key={s.id} style={{ display: tab === s.id ? 'block' : 'none' }}>{s.el}</div>
            ))}
            <FootOrnament lang={lang} onGoTos={() => setTab('tos')} />
          </main> :
          <main className="shell">
            {sections.filter(s => mountedTabs.current.has(s.id)).map(s => (
              <div key={s.id} style={{ display: tab === s.id ? 'block' : 'none' }}>{s.el}</div>
            ))}
            <FootOrnament lang={lang} onGoTos={() => setTab('tos')} />
          </main>
        }
      </div>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} auth={auth} lang={lang} />
      <EdDialogHost />

    </>
  );
}

// ── Error boundary ──────────────────────────────────────────────────────
// Without this ANY render error blanks the whole site. Content here is
// admin-editable, so one malformed value must not take the page down.
class AppErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('[app crashed]', error, info); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, background: '#0c0a08', color: '#f0e9df', textAlign: 'center',
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
      }}>
        <div style={{ maxWidth: 460 }}>
          <div style={{ fontSize: 42, marginBottom: 12 }}>✦</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic',
                       fontSize: 28, margin: '0 0 10px' }}>Что-то сломалось</h1>
          <p style={{ color: 'rgba(240,233,223,0.65)', fontSize: 14, lineHeight: 1.6, margin: '0 0 20px' }}>
            Страница не смогла отрисоваться. Обычно помогает перезагрузка —
            если нет, сбрось локальные данные кнопкой ниже.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => window.location.reload()} style={{
              padding: '10px 20px', borderRadius: 22, cursor: 'pointer',
              background: '#e8a93b', color: '#1a1410', border: 0, fontWeight: 600 }}>
              Перезагрузить
            </button>
            <button onClick={() => {
              try {
                Object.keys(localStorage).forEach(k => { if (k.startsWith('milaria:')) localStorage.removeItem(k); });
              } catch (e) {}
              window.location.href = '/';
            }} style={{
              padding: '10px 20px', borderRadius: 22, cursor: 'pointer',
              background: 'transparent', color: '#f0e9df',
              border: '1px solid rgba(255,255,255,0.2)' }}>
              Сбросить и на главную
            </button>
          </div>
          <details style={{ marginTop: 22, textAlign: 'left' }}>
            <summary style={{ cursor: 'pointer', fontSize: 12, color: 'rgba(240,233,223,0.4)' }}>Подробности</summary>
            <pre style={{ fontSize: 11, color: 'rgba(240,233,223,0.5)', whiteSpace: 'pre-wrap',
                          marginTop: 8, maxHeight: 160, overflow: 'auto' }}>
              {String(this.state.error && (this.state.error.stack || this.state.error.message))}
            </pre>
          </details>
        </div>
      </div>
    );
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <AppErrorBoundary><App /></AppErrorBoundary>
);

  