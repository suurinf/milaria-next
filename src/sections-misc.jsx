
// sections-misc.jsx — Прайс, Долги, Ссылки

const { useState: miscState, useEffect: miscEffect } = React;

// ──────── Prices ────────
// Hue map for category-related hover images (per price key prefix)
const PRICE_HUE = {
  Portrait: 320, 'Half body': 280, 'Full body': 220, Chibi: 40, Smiles: 50,
  Icons: 30, Panels: 10, Allert: 10, 'Chibi PNG': 60, 'Half body PNG': 200,
  'Full body PNG': 240, 'VTuber model': 320, 'Chibi model v.1': 35,
  'Chibi model v.2': 50, Background: 200, 'Reference sheet': 20,
};
function priceHue(key) {
  for (const k in PRICE_HUE) if (key.startsWith(k)) return PRICE_HUE[k];
  return 40;
}
function priceTag(key) {
  if (/PNG/i.test(key)) return 'PNG';
  if (/VTuber/i.test(key)) return 'Live2D';
  if (/Chibi/i.test(key)) return 'Chibi';
  if (/Reference/i.test(key)) return 'Ref';
  if (/Background/i.test(key)) return 'BG';
  if (/Live2D/i.test(key)) return 'Live2D';
  return 'Art';
}

function DebtCountdown({ admin, lang }) {
  const [cfg, saveCfg] = useSetting('debt_deadline', {});
  const [now, setNow] = React.useState(Date.now());
  const [editing, setEditing] = React.useState(false);

  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const target = cfg.date ? new Date(cfg.date).getTime() : null;
  const label = cfg.label || (lang === 'ru' ? 'До дедлайна' : 'Until deadline');

  if (!target && !admin) return null;

  let days = 0, hours = 0, mins = 0, secs = 0, passed = false;
  if (target) {
    let diff = Math.max(0, target - now);
    passed = target - now <= 0;
    days = Math.floor(diff / 86400000);
    hours = Math.floor((diff % 86400000) / 3600000);
    mins = Math.floor((diff % 3600000) / 60000);
    secs = Math.floor((diff % 60000) / 1000);
  }

  return (
    <div className="debt-countdown">
      <div className="debt-countdown-head">
        <span className="debt-countdown-label">⏳ {label}</span>
        {admin && (
          <button className="admin-btn" style={{ fontSize: 11 }} onClick={() => setEditing(e => !e)}>
            {editing ? '✓' : '✎'}
          </button>
        )}
      </div>

      {target && !passed && (
        <div className="debt-countdown-grid">
          <div className="cd-unit"><span className="cd-num">{days}</span><span className="cd-lbl">{lang === 'ru' ? 'дней' : 'days'}</span></div>
          <div className="cd-sep">:</div>
          <div className="cd-unit"><span className="cd-num">{String(hours).padStart(2, '0')}</span><span className="cd-lbl">{lang === 'ru' ? 'часов' : 'hours'}</span></div>
          <div className="cd-sep">:</div>
          <div className="cd-unit"><span className="cd-num">{String(mins).padStart(2, '0')}</span><span className="cd-lbl">{lang === 'ru' ? 'минут' : 'mins'}</span></div>
          <div className="cd-sep">:</div>
          <div className="cd-unit"><span className="cd-num">{String(secs).padStart(2, '0')}</span><span className="cd-lbl">{lang === 'ru' ? 'секунд' : 'secs'}</span></div>
        </div>
      )}
      {target && passed && (
        <div className="debt-countdown-done">{lang === 'ru' ? '⏰ Время вышло!' : '⏰ Time is up!'}</div>
      )}
      {!target && admin && (
        <div className="debt-countdown-empty">{lang === 'ru' ? 'Дата не задана' : 'No date set'}</div>
      )}

      {admin && editing && (
        <div className="debt-countdown-edit">
          <label className="login-field">
            <span>{lang === 'ru' ? 'Название' : 'Label'}</span>
            <input value={cfg.label || ''} placeholder={lang === 'ru' ? 'До дедлайна' : 'Until deadline'}
              onChange={e => saveCfg({ ...cfg, label: e.target.value })} />
          </label>
          <label className="login-field">
            <span>{lang === 'ru' ? 'Дата и время' : 'Date & time'}</span>
            <input type="datetime-local" value={cfg.date || ''}
              onChange={e => saveCfg({ ...cfg, date: e.target.value })} />
          </label>
        </div>
      )}
    </div>
  );
}

function DebtsSection({ t, admin, lang }) {
  const debtDefaults = React.useMemo(() => DEFAULT_DEBTS.map((d, i) => ({ ...d, stream_date: d.stream, sort_order: i })), []);
  const debtsRes = useResource('debts', debtDefaults);
  const debts = debtsRes.items.map(d => ({ ...d, stream: d.stream_date || d.stream }));

  function cycleStatus(id) {
    const d = debts.find(x => x.id === id);
    if (!d) return;
    const order = ['open', 'waiting', 'inProgress', 'done'];
    const next = order[(order.indexOf(d.status) + 1) % order.length];
    const progress = next === 'done' ? 100 : (next === 'open' || next === 'waiting' ? 0 : (d.progress || 50));
    debtsRes.update(id, { status: next, progress });
  }
  function updateDebt(id, patch) {
    const dbPatch = { ...patch };
    if ('stream' in dbPatch) { dbPatch.stream_date = dbPatch.stream; delete dbPatch.stream; }
    debtsRes.update(id, dbPatch);
  }
  function deleteDebt(id) { debtsRes.remove(id); }
  const [debtModal, setDebtModal] = miscState(null); // null | {item, isNew}

  const debtFields = React.useMemo(() => [
    { key: 'title', label: lang === 'ru' ? 'Название' : 'Title', type: 'text', required: true, default: '' },
    { key: 'stream_date', label: lang === 'ru' ? 'Дата стрима' : 'Stream date', type: 'date', default: new Date().toISOString().slice(0, 10) },
    { key: 'reason', label: lang === 'ru' ? 'Причина' : 'Reason', type: 'text', default: '' },
    { key: 'status', label: lang === 'ru' ? 'Статус' : 'Status', type: 'select', default: 'open', options: [
      { value: 'open', label: t.debts.status.open },
      { value: 'waiting', label: lang === 'ru' ? 'Ожидание' : 'Waiting' },
      { value: 'inProgress', label: t.debts.status.inProgress },
      { value: 'done', label: t.debts.status.done },
    ]},
    { key: 'progress', label: lang === 'ru' ? 'Прогресс (%)' : 'Progress (%)', type: 'number', min: 0, max: 100, default: 0 },
    { key: 'section', label: lang === 'ru' ? 'Раздел' : 'Section', type: 'select', default: 'drawing', options: [
      { value: 'drawing', label: lang === 'ru' ? 'Долги по рисованию' : 'Drawing debts' },
      { value: 'games', label: lang === 'ru' ? 'Долги по играм' : 'Game debts' },
      { value: 'watching', label: lang === 'ru' ? 'Долги по просмотру' : 'Watching debts' },
      { value: 'vip', label: 'VIP' },
    ]},
  ], [t, lang]);

  function addDebt() {
    setDebtModal({ item: null, isNew: true });
  }
  function editDebt(item) {
    setDebtModal({ item: { ...item, stream_date: item.stream_date || item.stream }, isNew: false });
  }
  function handleSaveDebt(draft) {
    if (debtModal.isNew) {
      debtsRes.add({
        title: draft.title,
        stream_date: draft.stream_date,
        reason: draft.reason,
        status: draft.status || 'open',
        section: draft.section || 'drawing',
        progress: draft.status === 'done' ? 100 : (draft.progress || 0),
      });
    } else {
      const patch = { ...draft };
      if ('stream' in patch) { patch.stream_date = patch.stream; delete patch.stream; }
      debtsRes.update(debtModal.item.id, patch);
    }
  }

  const DEBT_SECTIONS = [
    { key: 'drawing', label: lang === 'ru' ? 'Долги по рисованию' : 'Drawing debts' },
    { key: 'games', label: lang === 'ru' ? 'Долги по играм' : 'Game debts' },
    { key: 'watching', label: lang === 'ru' ? 'Долги по просмотру' : 'Watching debts' },
    { key: 'vip', label: 'VIP' },
  ];
  const byOrder = (a, b) => (a.sort_order || 0) - (b.sort_order || 0);
  const drawingItems  = debts.filter(d => (d.section || 'drawing') === 'drawing').sort(byOrder);
  const gamesItems    = debts.filter(d => d.section === 'games').sort(byOrder);
  const watchingItems = debts.filter(d => d.section === 'watching').sort(byOrder);
  const vipItems      = debts.filter(d => d.section === 'vip').sort(byOrder);
  const dragDrawing  = useDragReorder(drawingItems, debtsRes);
  const dragGames    = useDragReorder(gamesItems, debtsRes);
  const dragWatching = useDragReorder(watchingItems, debtsRes);
  const dragVip      = useDragReorder(vipItems, debtsRes);
  const sectionData = {
    drawing:  { items: drawingItems,  drag: dragDrawing },
    games:    { items: gamesItems,    drag: dragGames },
    watching: { items: watchingItems, drag: dragWatching },
    vip:      { items: vipItems,      drag: dragVip },
  };

  function renderDebtRow(d, drag) {
    const pct = d.progress ?? (d.status === 'done' ? 100 : d.status === 'inProgress' ? 50 : 0);
    const statusLabel = d.status === 'waiting' ? (lang === 'ru' ? 'Ожидание' : 'Waiting') : t.debts.status[d.status];
    const dh = admin ? drag.getHandlers(d) : {};
    return (
      <div key={d.id} className={`debt-row ${d.status} ${dh.className || ''}`}
        draggable={dh.draggable}
        onDragStart={dh.onDragStart} onDragOver={dh.onDragOver}
        onDragLeave={dh.onDragLeave} onDrop={dh.onDrop} onDragEnd={dh.onDragEnd}>
        {admin && <span className="drag-handle" title="Перетащить">⠿</span>}
        <div className="debt-icon">
          {d.status === 'done' ? '✓' : d.status === 'inProgress' ? '◐' : d.status === 'waiting' ? '⏳' : '○'}
        </div>
        <div className="debt-info">
          <span className="debt-title">
            <Editable value={d.title} onSave={(v) => updateDebt(d.id, { title: v })} admin={admin} />
          </span>
          <span className="debt-meta">
            {t.debts.streamFrom} {d.stream} · {t.debts.reason}: {d.reason}
          </span>
          <div className="debt-bar">
            <span style={{ width: `${pct}%` }}></span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <span className="debt-pct">
            <EditableNumber value={pct} onSave={(v) => updateDebt(d.id, { progress: Math.max(0, Math.min(100, v)) })} admin={admin} suffix="%" />
          </span>
          <span className="debt-status" onClick={() => admin && cycleStatus(d.id)} style={{ cursor: admin ? 'pointer' : 'default' }}>
            {statusLabel}
          </span>
        </div>
        {admin && (
          <div className="admin-actions" style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
            <button className="admin-btn" onClick={() => editDebt(d)} title="Edit">✎</button>
            <button className="admin-btn danger" onClick={() => deleteDebt(d.id)}>×</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="page anim-in">
      <PageHead
        eyebrow={`✦ ${t.debts.title} ✦`}
        title={t.debts.title}
        subtitle={t.debts.subtitle}
      />

      <DebtCountdown admin={admin} lang={lang} />

      {debts.length === 0 ? (
        <div className="empty">{t.debts.empty}</div>
      ) : (
        DEBT_SECTIONS.map(sec => {
          const { items, drag } = sectionData[sec.key];
          if (items.length === 0 && !admin) return null;
          return (
            <div key={sec.key} className="debt-section">
              <div className="debt-section-head">
                <span className="debt-section-line"></span>
                <h3 className="debt-section-title">{sec.label}</h3>
                <span className="debt-section-line"></span>
              </div>
              {items.length === 0 ? (
                <div className="empty" style={{ padding: '16px', fontSize: 13, opacity: 0.6 }}>{t.debts.empty}</div>
              ) : (
                <div className="debt-list">
                  {items.map(d => renderDebtRow(d, drag))}
                </div>
              )}
            </div>
          );
        })
      )}

      {admin && (
        <button className="add-btn" onClick={addDebt}>+ {lang === 'ru' ? 'Добавить долг' : 'Add debt'}</button>
      )}

      {admin && (
        <EditItemModal
          open={!!debtModal}
          onClose={() => setDebtModal(null)}
          onSave={handleSaveDebt}
          fields={debtFields}
          values={debtModal?.item}
          title={debtModal?.isNew ? (lang === 'ru' ? 'Новый долг' : 'New debt') : (lang === 'ru' ? 'Редактировать' : 'Edit')}
          lang={lang === 'ru' ? 'ru' : 'en'}
        />
      )}
    </section>
  );
}

// ──────── Links ────────
const LINK_ICONS = {
  Twitch:    { glyph: 'T', bg: 'linear-gradient(135deg, #9146FF, #6629c9)' },
  YouTube:   { glyph: 'Y', bg: 'linear-gradient(135deg, #ff4d4d, #c1272d)' },
  'Twitter / X': { glyph: 'X', bg: 'linear-gradient(135deg, #1c1c1c, #444)' },
  Bluesky:   { glyph: 'B', bg: 'linear-gradient(135deg, #5dade2, #2980b9)' },
  Instagram: { glyph: 'I', bg: 'linear-gradient(135deg, #f58529, #dd2a7b, #8134af)' },
  Telegram:  { glyph: 'T', bg: 'linear-gradient(135deg, #29b6f6, #0277bd)' },
  Discord:   { glyph: 'D', bg: 'linear-gradient(135deg, #5865F2, #3b45c5)' },
  Boosty:    { glyph: 'B', bg: 'linear-gradient(135deg, #ff7e2e, #d95a14)' },
  'Ko-fi':   { glyph: 'K', bg: 'linear-gradient(135deg, #ff5e5b, #c5403f)' },
  Email:     { glyph: '@', bg: 'linear-gradient(135deg, var(--accent), var(--accent-deep))' },
};

function LinksSection({ t, admin }) {
  const linkDefaults = React.useMemo(() => DEFAULT_LINKS.map((l, i) => ({ ...l, sort_order: i })), []);
  const linksRes = useResource('links', linkDefaults);
  const links = linksRes.items;

  function updateLink(id, patch) { linksRes.update(id, patch); }
  function deleteLink(id) { linksRes.remove(id); }
  const [linkModal, setLinkModal] = miscState(null);

  const linkFields = React.useMemo(() => [
    { key: 'label', label: t.links.title === 'Ссылки' ? 'Название' : 'Label', type: 'text', required: true, default: '' },
    { key: 'handle', label: 'Handle / @', type: 'text', default: '' },
    { key: 'url', label: 'URL', type: 'text', required: true, default: 'https://', placeholder: 'https://...' },
    { key: 'kind', label: t.links.title === 'Ссылки' ? 'Тип' : 'Kind', type: 'select', default: 'social', options: [
      { value: 'social', label: 'Social' },
      { value: 'stream', label: 'Stream' },
      { value: 'video', label: 'Video' },
      { value: 'chat', label: 'Chat' },
      { value: 'support', label: 'Support' },
      { value: 'mail', label: 'Email' },
    ]},
  ], [t]);

  function addLink() {
    setLinkModal({ item: null, isNew: true });
  }
  function editLink(item) {
    setLinkModal({ item, isNew: false });
  }
  function handleSaveLink(draft) {
    if (linkModal.isNew) {
      linksRes.add({ label: draft.label, handle: draft.handle, url: draft.url, kind: draft.kind || 'social' });
    } else {
      linksRes.update(linkModal.item.id, draft);
    }
  }

  return (
    <section className="page">
      <PageHead
        eyebrow={`✦ ${t.links.title} ✦`}
        title={t.links.title}
        subtitle={t.links.subtitle}
      />

      <div className="links-grid">
        {links.map((l) => {
          const icon = LINK_ICONS[l.label] || { glyph: l.label[0], bg: 'linear-gradient(135deg, var(--accent), var(--accent-deep))' };
          return (
            <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className="link-card"
               onClick={(e) => admin && e.preventDefault()}>
              <div className="link-icon" style={{ background: icon.bg }}>{icon.glyph}</div>
              <div className="link-info">
                <span className="link-label">
                  <Editable value={l.label} onSave={(v) => updateLink(l.id, { label: v })} admin={admin} />
                </span>
                <span className="link-handle">
                  <Editable value={l.handle} onSave={(v) => updateLink(l.id, { handle: v })} admin={admin} />
                </span>
              </div>
              {admin && (
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="admin-btn" onClick={(e) => { e.preventDefault(); editLink(l); }} title="Edit">✎</button>
                  <button className="admin-btn danger" onClick={(e) => { e.preventDefault(); deleteLink(l.id); }}>×</button>
                </div>
              )}
            </a>
          );
        })}
      </div>

      {admin && (
        <button className="add-btn" onClick={addLink}>+ {t.links.title === 'Ссылки' ? 'Добавить ссылку' : 'Add link'}</button>
      )}

      {admin && (
        <EditItemModal
          open={!!linkModal}
          onClose={() => setLinkModal(null)}
          onSave={handleSaveLink}
          fields={linkFields}
          values={linkModal?.item}
          title={linkModal?.isNew ? (t.links.title === 'Ссылки' ? 'Новая ссылка' : 'New link') : (t.links.title === 'Ссылки' ? 'Редактировать' : 'Edit')}
          lang={t.links.title === 'Ссылки' ? 'ru' : 'en'}
        />
      )}
    </section>
  );
}


// ──────── T.O.S. — Условия предоставления услуг ────────
const TOS_DATA = [
  {
    icon: '✦',
    title: { ru: 'Общие положения', en: 'General' },
    items: [
      { ru: 'Правила могут изменяться в любое время без предварительного уведомления, но это не касается заказов, которые были в работе до изменения правил.', en: 'Rules may change at any time without prior notice, but this does not affect orders already in progress before the change.' },
      { ru: 'Прошу заранее ознакомиться с моим портфолио для понимания специфики моего стиля и уровня навыков.', en: 'Please review my portfolio in advance to understand my style and skill level.' },
      { ru: 'Для связи на главной указана вся моя контактная информация.', en: 'All my contact information is listed on the home page.' },
    ],
  },
  {
    icon: '✎',
    title: { ru: 'Что я рисую', en: 'What I draw' },
    compact: true,
    items: [
      { ru: 'OC (ориг. персонажи)', en: 'OC (original characters)', tone: 'good' },
      { ru: 'Vtuber', en: 'Vtuber', tone: 'good' },
      { ru: 'Маскоты', en: 'Mascots', tone: 'good' },
      { ru: 'Девушек', en: 'Girls', tone: 'good' },
      { ru: 'Парней', en: 'Guys', tone: 'good' },
      { ru: 'Людей', en: 'People', tone: 'good' },
      { ru: 'Furry', en: 'Furry', tone: 'bad' },
      { ru: 'NSFW, 18+', en: 'NSFW, 18+', tone: 'bad' },
      { ru: 'Меха', en: 'Mecha', tone: 'bad' },
      { ru: 'Политика', en: 'Politics', tone: 'bad' },
      { ru: 'Жестокий контент', en: 'Violent content', tone: 'bad' },
    ],
  },
  {
    icon: '₽',
    title: { ru: 'Оплата, коммерция и конфиденциальность', en: 'Payment, commerce & confidentiality' },
    items: [
      { ru: 'Оплата принимается через: Boosty, Hipolink, OzonBank, СБП. Стоимость уже с учётом комиссии площадок.', en: 'Payment via: Boosty, Hipolink, OzonBank, SBP. Price already includes platform fees.' },
      { ru: 'В стоимость моделей (отрисовка и риг) уже входит: 3 эмоции (сердечки, злость, смущение), повороты XYZ, базовое отслеживание (без VBridger), дыхание.', en: 'Model price (art + rig) includes: 3 emotions (hearts, anger, embarrassment), XYZ rotations, basic tracking (no VBridger), breathing.' },
      { ru: 'Предоплата 50%/100% — на ваш выбор. При отрисовке: 50% до утверждённого скетча, остаток — перед передачей файлов. Отрисовки в PNG, модель в PSD. При риге: 50% до окончания, остаток — перед передачей файлов.', en: 'Prepayment 50%/100% — your choice. Art: 50% before approved sketch, rest before file delivery. Art in PNG, model in PSD. Rig: 50% before completion, rest before delivery.' },
      { ru: 'Срочность +50%.', en: 'Rush +50%.', highlight: true },
      { ru: 'Коммерция на отрисованные работы +50%. Модель уже включает коммерческое использование.', en: 'Commercial use on artwork +50%. Models already include commercial use.', highlight: true },
      { ru: 'Конфиденциальность +50% от стоимости работы, которую вы хотите скрыть. Оговариваются сроки, до которых заказ нельзя показывать: работа делается вне стримов, процесс и результат не публикуются в соцсетях оговорённое время.', en: 'Confidentiality +50% of the work you wish to keep private. Terms are agreed for how long the order stays hidden: work done off-stream, process and result not posted for the agreed period.', highlight: true },
    ],
  },
  {
    icon: '✎',
    title: { ru: 'Правки в работе', en: 'Revisions' },
    items: [
      { ru: 'Отрисовка: 3 бесплатные правки до утверждённого скетча, далее платные — 60₽ за правку.', en: 'Art: 3 free revisions before approved sketch, then paid — 60₽ each.' },
      { ru: 'Риг: 15 бесплатных правок на протяжении работы, далее платные — 250₽ за правку.', en: 'Rig: 15 free revisions during the work, then paid — 250₽ each.' },
      { ru: 'Правки засчитываются, если нужно что-то подправить (перерисовать деталь, заригать иначе). Не засчитываются, если ошибка моя (не отрисовала деталь, не учла ТЗ, ошибка в риге).', en: 'Revisions count when you want changes (redraw a detail, rig differently). They do not count if the mistake is mine (missed detail, missed brief, rig error).' },
      { ru: 'Для моделей: если ваш ригер просит правки — они бесплатные.', en: 'For models: if your rigger requests changes — they are free.' },
      { ru: 'Править мои работы запрещается — вручную или через ИИ. Касается заметных изменений; нарезка/вырезка для анимации допустима.', en: 'Editing my works is prohibited — manually or via AI. Applies to noticeable changes; cropping/cutting for animation is fine.' },
    ],
  },
  {
    icon: '◷',
    title: { ru: 'Дедлайны и контакты', en: 'Deadlines & contacts' },
    items: [
      { ru: 'Сроки: чиби / скетч / арт — 1 месяц; отрисовка модели — 2 месяца; риг модели — 3 месяца. Работа может быть готова раньше — срок взят с запасом на форс-мажоры.', en: 'Timeframes: chibi / sketch / art — 1 month; model art — 2 months; model rig — 3 months. May be done earlier — buffer included for emergencies.' },
      { ru: 'Я приступаю на следующий день после оплаты, дедлайн считается с начала работы. При большой очереди предупреждаю заранее.', en: 'I start the day after payment; deadline counts from the start. If the queue is long, I warn you in advance.' },
      { ru: 'Дедлайны могут сдвинуться из-за: задержки оплаты, отсутствия связи, количества правок, высокой детализации персонажа (предупрежу заранее).', en: 'Deadlines may shift due to: payment delays, no contact, number of revisions, high character detail (I will warn you).' },
      { ru: 'Контакты: вы обязаны указывать моё авторство.', en: 'Contacts: you must credit my authorship.' },
      { ru: 'Если аккаунт утерян: заранее дайте доп. контакт; при потере — свяжитесь со мной на любой удобной площадке.', en: 'If your account is lost: provide a backup contact in advance; if lost — reach me on any platform.' },
    ],
  },
  {
    icon: '✕',
    title: { ru: 'ИИ и чужой стиль', en: 'AI & other styles' },
    items: [
      { ru: 'Я не использую ИИ в работах (только как референс, не более).', en: 'I do not use AI in my work (only as reference, nothing more).' },
      { ru: 'Я не рисую в стиле других художников, но не препятствую использованию их работ в качестве референса.', en: 'I do not draw in other artists\u2019 styles, but I don\u2019t mind them being used as reference.' },
    ],
  },
  {
    icon: '◆',
    title: { ru: 'Процесс, безопасность, возврат', en: 'Process, safety, refund' },
    items: [
      { ru: 'Я показываю все этапы: скетч → правки + лайн + покрас + рендер (арт/модель). При риге показываю каждую анимацию части тела (может начаться не сразу из-за подготовки модели). Вопросы по процессу — всегда отвечу.', en: 'I show all stages: sketch \u2192 revisions + lineart + color + render (art/model). For rig, I show each body-part animation (may start later due to prep). Always happy to answer process questions.' },
      { ru: 'Безопасность: при необходимости составим договор (нужны паспортные данные и электронная подпись).', en: 'Safety: we can make a contract if needed (requires passport data and e-signature).' },
      { ru: 'Возврат средств — если оплата произведена, но работа не выполнена в оговорённом объёме. Если работа выполнена, я вправе отклонить запрос на возврат.', en: 'Refund — if paid but work not done as agreed. If work is done, I may decline the refund request.' },
    ],
  },
];

function TosSection({ t, lang }) {
  return (
    <section className="page anim-in">
      <PageHead
        eyebrow={`\u2726 ${lang === 'ru' ? 'Условия предоставления услуг' : 'Terms of Service'} \u2726`}
        subtitle={lang === 'ru' ? 'Политика принятия и ведения заказа' : 'Order acceptance & workflow policy'}
      />
      <div className="tos-wrap">
        {TOS_DATA.map((sec, i) => (
          <div key={i} className="tos-card" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="tos-card-head">
              <span className="tos-icon">{sec.icon}</span>
              <h3 className="tos-card-title">{sec.title[lang] || sec.title.ru}</h3>
              <span className="tos-num">{String(i + 1).padStart(2, '0')}</span>
            </div>
            {sec.compact ? (
              <div className="tos-compact">
                <div className="tos-compact-col tos-compact-good">
                  <div className="tos-compact-head">{lang === 'ru' ? '✓ Рисую' : '✓ I draw'}</div>
                  {sec.items.filter(it => it.tone === 'good').map((it, j) => (
                    <span key={j} className="tos-chip tos-chip-good">{it[lang] || it.ru}</span>
                  ))}
                </div>
                <div className="tos-compact-col tos-compact-bad">
                  <div className="tos-compact-head">{lang === 'ru' ? '✕ Не рисую' : "✕ I don't draw"}</div>
                  {sec.items.filter(it => it.tone === 'bad').map((it, j) => (
                    <span key={j} className="tos-chip tos-chip-bad">{it[lang] || it.ru}</span>
                  ))}
                </div>
              </div>
            ) : (
              <ul className="tos-list">
                {sec.items.map((it, j) => (
                  <li key={j} className={`tos-item ${it.highlight ? 'tos-highlight' : ''} ${it.tone ? 'tos-tone-' + it.tone : ''}`}>
                    {it.highlight && <span className="tos-badge">+50%</span>}
                    {it.tone === 'good' && <span className="tos-mark tos-mark-good">✓</span>}
                    {it.tone === 'bad' && <span className="tos-mark tos-mark-bad">✕</span>}
                    <span>{it[lang] || it.ru}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
        <div className="tos-footer">
          {lang === 'ru'
            ? 'Оформляя заказ, вы соглашаетесь с условиями выше.'
            : 'By placing an order, you agree to the terms above.'}
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { DebtsSection, LinksSection, TosSection });

  