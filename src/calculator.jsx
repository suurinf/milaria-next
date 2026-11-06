
// calculator.jsx — Калькулятор v3 (с подвкладками art/rig и PNG+)

const { useState: calcState, useEffect: calcEffect, useMemo: calcMemo } = React;

function CalcChip({ row, lang, state, onToggle, onQty }) {
  const on = state[row.id]?.on || false;
  const qty = state[row.id]?.qty || 1;
  const label = lang === 'ru' ? row.ru : row.en;
  const showQty = row.qty && on;

  return (
    <div
      className={`calc2-chip ${on ? 'on' : 'off'}`}
      onClick={(e) => {
        if (e.target.closest('.calc2-chip-qty')) return;
        onToggle(row.id);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(row.id); } }}
    >
      <span className="calc2-chip-check">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </span>
      <span className="calc2-chip-label">{label}</span>
      <span className="calc2-chip-price">
        {on
          ? (lang === 'en' ? `$${((row.usd || 0) * qty).toLocaleString('en-US')}` : `${(row.rub * qty).toLocaleString('ru-RU')} ₽`)
          : (lang === 'en' ? `from $${(row.usd || 0).toLocaleString('en-US')}` : `от ${row.rub.toLocaleString('ru-RU')} ₽`)
        }
      </span>
      {showQty && (
        <div className="calc2-chip-qty" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => {
            if (qty <= 1) { onToggle(row.id); }
            else { onQty(row.id, qty - 1); }
          }}>−</button>
          <span>×{qty}</span>
          <button type="button" onClick={() => onQty(row.id, qty + 1)}>+</button>
        </div>
      )}
      {row._admin && (
        <div className="calc2-chip-admin" onClick={(e) => e.stopPropagation()} style={{ display:'flex', gap:3, marginLeft:4 }}>
          <button className="admin-btn" style={{width:20,height:20,fontSize:10}} onClick={() => row._onEdit(row)}>✎</button>
          <button className="admin-btn danger" style={{width:20,height:20,fontSize:10}} onClick={() => row._onDelete(row.id)}>×</button>
        </div>
      )}
    </div>
  );
}

function CalculatorSection({ t, lang, admin }) {
  // Load options from Supabase; fall back to DEFAULT_CALC only BEFORE first load
  const calcRes = useResource('calc_options', [], { orderBy: 'sort_order' });
  const calcData = React.useMemo(() => {
    if (calcRes.items && calcRes.items.length > 0) {
      const tree = calcOptionsToTree(calcRes.items);
      // Force PNG variant order: PNG before PNG+
      if (tree.png && tree.png.variants && tree.png.variants.basic && tree.png.variants.plus) {
        const { basic, plus, ...rest } = tree.png.variants;
        tree.png.variants = { basic, plus, ...rest };
      }
      return tree;
    }
    // Before first load — show defaults so page isn't blank.
    // After load with empty data — respect it (user deleted everything).
    if (!calcRes.loaded) return DEFAULT_CALC;
    return {};
  }, [calcRes.items, calcRes.loaded]);
  const [activeTab, setActiveTab] = calcState('vtuber');
  const [activeVariant, setActiveVariant] = calcState({ vtuber: 'art', chibi: 'art', png: 'basic', illust: 'default' });
  const [contactOpen, setContactOpen] = calcState(false);
  const [calcEdit, setCalcEdit] = calcState(null);
  const [rushOrder, setRushOrder] = calcState(false);
  const [convWork, setConvWork] = calcState(false);


  const [state, setState] = calcState(() => loadLS('calc:state:v2', {
    'v-a-concept': { on: true, qty: 1 },
    'v-a-hair':    { on: true, qty: 1 },
    'v-a-costume': { on: true, qty: 1 },
  }));

  calcEffect(() => saveLS('calc:state:v2', state), [state]);

  function toggle(id) {
    setState({ ...state, [id]: { ...(state[id] || { qty: 1 }), on: !state[id]?.on } });
  }
  function clearAll() {
    // Выключаем все выбранные разом — быстрее, чем снимать по одной
    const next = {};
    Object.keys(state).forEach(id => { next[id] = { ...state[id], on: false }; });
    setState(next);
  }
  function setQty(id, qty) {
    setState({ ...state, [id]: { ...(state[id] || { on: true }), qty } });
  }

  const [sectionOrder, saveSectionOrder] = useSetting('calc_section_order', []);
  const rawTabKeys = Object.keys(calcData);
  // Order tabs by saved section order; unknown ones go to the end
  const tabKeys = [...rawTabKeys].sort((a, b) => {
    const ia = sectionOrder.indexOf(a), ib = sectionOrder.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
  const [dragSec, setDragSec] = calcState(null);

  async function deleteSection(key) {
    if (!confirm(`Удалить раздел «${t.calculator.cats[key] || key}» со всеми опциями?`)) return;
    const toDelete = (calcRes.items || []).filter(i => i.category === key);
    for (const row of toDelete) { await calcRes.remove(row.id); }
    saveSectionOrder(sectionOrder.filter(k => k !== key));
    if (activeTab === key) {
      const rest = tabKeys.filter(k => k !== key);
      if (rest.length) setActiveTab(rest[0]);
    }
  }

  function moveSectionTo(fromKey, toKey) {
    if (fromKey === toKey) return;
    const order = tabKeys.slice();
    const from = order.indexOf(fromKey), to = order.indexOf(toKey);
    if (from < 0 || to < 0) return;
    order.splice(to, 0, order.splice(from, 1)[0]);
    saveSectionOrder(order);
  }

  async function addSubsection() {
    const name = prompt(lang === 'ru' ? 'Название подраздела:' : 'Subsection name:');
    if (!name || !name.trim()) return;
    const key = name.trim();
    if (cat.variants[key]) { alert('Такой подраздел уже есть'); return; }
    const id = 'sub-' + Date.now().toString(36);
    await calcRes.add({
      id, category: activeTab, variant: key, group_type: 'base',
      label_ru: lang === 'ru' ? 'Новая опция' : 'New option',
      label_en: 'New option', rub: 0, usd: 0, has_qty: false, sort_order: 0,
    });
    setTimeout(() => setActiveVariant(prev => ({ ...prev, [activeTab]: key })), 300);
  }

  async function deleteSubsection(key) {
    if (!confirm(lang === 'ru' ? `Удалить подраздел «${key}» со всеми опциями?` : `Delete subsection "${key}"?`)) return;
    const toDelete = (calcRes.items || []).filter(i => i.category === activeTab && i.variant === key);
    for (const row of toDelete) { await calcRes.remove(row.id); }
  }

  async function addSection() {
    const name = prompt(lang === 'ru' ? 'Название нового раздела:' : 'New section name:');
    if (!name || !name.trim()) return;
    const key = name.trim();
    if (calcData[key]) { alert('Такой раздел уже есть'); return; }
    // Create the section with a starter option so it appears as a tab
    const id = 'sec-' + Date.now().toString(36);
    await calcRes.add({
      id, category: key, variant: 'default', group_type: 'base',
      label_ru: lang === 'ru' ? 'Новая опция' : 'New option',
      label_en: 'New option', rub: 0, has_qty: false, sort_order: 0,
    });
    setTimeout(() => setActiveTab(key), 300);
  }

  // Snap activeTab to a valid one if current was deleted
  React.useEffect(() => {
    if (tabKeys.length && !calcData[activeTab]) setActiveTab(tabKeys[0]);
  }, [calcData]);

  const cat = calcData[activeTab] || calcData[tabKeys[0]] || { variants: {} };
  const variantKey = activeVariant[activeTab] || Object.keys(cat.variants)[0] || 'default';
  const variant = (cat.variants[variantKey]) || { base: [], addon: [] };

  const calcOptionFields = calcMemo(() => [
    { key: 'label_ru', label: 'Название (RU)', type: 'text', required: true, default: '' },
    { key: 'label_en', label: 'Label (EN)', type: 'text', default: '' },
    { key: 'rub', label: 'Цена ₽ (рус. версия)', type: 'number', min: 0, default: 0 },
    { key: 'usd', label: 'Цена $ (англ. версия)', type: 'number', min: 0, default: 0 },
    { key: 'has_qty', label: lang === 'ru' ? 'Есть количество?' : 'Has quantity?', type: 'select', default: 'false', options: [
      { value: 'false', label: lang === 'ru' ? 'Нет' : 'No' },
      { value: 'true', label: lang === 'ru' ? 'Да' : 'Yes' },
    ]},
    { key: 'group_type', label: lang === 'ru' ? 'Группа' : 'Group', type: 'select', default: 'base', options: [
      { value: 'base', label: lang === 'ru' ? 'Базовая' : 'Base' },
      { value: 'addon', label: lang === 'ru' ? 'Доп. опция' : 'Addon' },
    ]},
    { key: 'category', label: lang === 'ru' ? 'Раздел' : 'Section', type: 'select', default: activeTab,
      options: tabKeys.map(k => ({ value: k, label: t.calculator.cats[k] || k })) },
    { key: 'variant', label: lang === 'ru' ? 'Подраздел' : 'Subsection', type: 'select', default: variantKey, options: [
      { value: 'default', label: lang === 'ru' ? 'Основной' : 'Main' },
      { value: 'basic', label: 'PNG' },
      { value: 'plus', label: 'PNG+' },
      { value: 'art', label: lang === 'ru' ? 'Только арт' : 'Art only' },
      { value: 'rig', label: lang === 'ru' ? 'Арт + риг' : 'Art + rig' },
    ]},
  ], [lang, activeTab, variantKey, tabKeys.join(',')]);

  function handleSaveCalcOption(draft) {
    const payload = {
      ...draft,
      has_qty: draft.has_qty === 'true' || draft.has_qty === true,
      rub: parseInt(draft.rub) || 0,
      usd: parseInt(draft.usd) || 0,
    };
    const savedTab = activeTab;
    const savedVariant = { ...activeVariant };
    if (calcEdit.isNew) {
      // calc_options uses text id, not UUID — must generate one
      const prefix = (payload.category || 'x').charAt(0) + '-' + (payload.group_type || 'a').charAt(0);
      payload.id = prefix + '-' + Date.now().toString(36);
      calcRes.add(payload);
    } else {
      calcRes.update(calcEdit.item.id, payload);
    }
    // Restore tab position after re-render
    setTimeout(() => {
      setActiveTab(savedTab);
      setActiveVariant(savedVariant);
    }, 50);
  }

  // Price for the active language (no auto-conversion; RU=₽, EN=$)
  const PRICE = (row) => lang === 'en' ? (row.usd || 0) : (row.rub || 0);
  const fmtMoney = (n) => lang === 'en' ? `$${Math.round(n).toLocaleString('en-US')}` : `${Math.round(n).toLocaleString('ru-RU')} ₽`;

  // Current variant total
  const { total: variantTotal, lines } = calcMemo(() => {
    const all = [...variant.base, ...(variant.addon || [])];
    let total = 0;
    const lines = [];
    all.forEach((row) => {
      const s = state[row.id];
      if (s?.on) {
        const sum = PRICE(row) * (s.qty || 1);
        total += sum;
        lines.push({ id: row.id, label: lang === 'ru' ? row.ru : row.en, qty: s.qty || 1, sum, row });
      }
    });
    return { total, lines };
  }, [variant, state, lang]);

  // Global total across ALL categories and variants
  const { globalTotal, globalLines } = calcMemo(() => {
    let gt = 0;
    const gl = [];
    Object.values(calcData).forEach(cat => {
      Object.values(cat.variants).forEach(v => {
        [...v.base, ...(v.addon || [])].forEach(row => {
          const s = state[row.id];
          if (s?.on) {
            const sum = PRICE(row) * (s.qty || 1);
            gt += sum;
            gl.push({ id: row.id, label: lang === 'ru' ? row.ru : row.en, qty: s.qty || 1, sum });
          }
        });
      });
    });
    return { globalTotal: gt, globalLines: gl };
  }, [calcData, state, lang]);

  // Apply percentage modifiers: each multiplies the RUNNING total (sequential)
  const baseTotal = globalTotal;
  let total = baseTotal;
  if (rushOrder) total = Math.round(total * 1.5);
  if (convWork) total = Math.round(total * 1.5);

  const totalFmt = fmtMoney(total);

  // Sort variants in defined display order: plus before basic, art before rig
  const VARIANT_ORDER = { basic: 0, plus: 1, art: 0, rig: 1, default: 0 };
  const variantEntries = Object.entries(cat.variants)
    .sort((a, b) => (VARIANT_ORDER[a[0]] ?? 99) - (VARIANT_ORDER[b[0]] ?? 99));
  const showSubtabs = variantEntries.length > 1;

  return (
    <section className="page anim-in">
      <PageHead
        eyebrow={`✦ ${t.calculator.title} ✦`}
        title={t.calculator.title}
        subtitle={t.calculator.subtitle}
      />

      <div className="calc2-tabs">
        {tabKeys.map((key) => (
          <div key={key} className={`calc2-tab-wrap ${dragSec === key ? 'dragging' : ''}`}
            draggable={admin}
            onDragStart={admin ? () => setDragSec(key) : undefined}
            onDragOver={admin ? (e) => e.preventDefault() : undefined}
            onDrop={admin ? (e) => { e.preventDefault(); if (dragSec) moveSectionTo(dragSec, key); setDragSec(null); } : undefined}
            onDragEnd={admin ? () => setDragSec(null) : undefined}>
            <button
              className={`calc2-tab ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              {admin && <span className="calc2-tab-grip" title="Перетащить">⠿</span>}
              {t.calculator.cats[key] || key}
            </button>
            {admin && (
              <button className="calc2-tab-del" title="Удалить раздел"
                onClick={(e) => { e.stopPropagation(); deleteSection(key); }}>×</button>
            )}
          </div>
        ))}
        {admin && (
          <button className="calc2-tab" onClick={addSection}
            style={{ borderStyle: 'dashed', opacity: 0.8 }}
            title="Добавить новый раздел">
            + {lang === 'ru' ? 'Раздел' : 'Section'}
          </button>
        )}
      </div>

      {tabKeys.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 14 }}>
          {lang === 'ru' ? 'Опции калькулятора пусты.' : 'Calculator options are empty.'}
          {admin && (
            <div style={{ marginTop: 16 }}>
              <button className="add-btn" onClick={() => setCalcEdit({ item: { category: 'vtuber', variant: 'art', group_type: 'base' }, isNew: true })}>
                {lang === 'ru' ? '+ Добавить первую опцию' : '+ Add first option'}
              </button>
            </div>
          )}
        </div>
      )}

      {(showSubtabs || admin) && tabKeys.length > 0 && (
        <div className="calc2-subtabs">
          {variantEntries.map(([key, v]) => (
            <span key={key} className="calc2-subtab-wrap">
              <button
                className={`calc2-subtab ${variantKey === key ? 'active' : ''}`}
                onClick={() => setActiveVariant({ ...activeVariant, [activeTab]: key })}
              >{lang === 'ru' ? v.ru : v.en}</button>
              {admin && variantEntries.length > 1 && (
                <button className="calc2-subtab-del" title="Удалить подраздел"
                  onClick={() => deleteSubsection(key)}>×</button>
              )}
            </span>
          ))}
          {admin && (
            <button className="calc2-subtab" style={{ borderStyle: 'dashed', opacity: 0.8 }}
              onClick={addSubsection} title="Добавить подраздел">
              + {lang === 'ru' ? 'Подраздел' : 'Subsection'}
            </button>
          )}
        </div>
      )}

      <div className="calc2">
        <div className="calc2-options stagger-children" key={activeTab + variantKey}>
          <div className="calc2-group-label">{t.calculator.groupBase}</div>
          {variant.base.map((row) => (
            <CalcChip key={row.id} row={{...row, _admin: admin, _onEdit: (r) => setCalcEdit({ item: calcRes.items.find(x => x.id === r.id) || r, isNew: false }), _onDelete: (id) => calcRes.remove(id)}} lang={lang} state={state} onToggle={toggle} onQty={setQty} />
          ))}
          {variant.addon && variant.addon.length > 0 && (
            <>
              <div className="calc2-group-label">{t.calculator.groupAddon}</div>
              {variant.addon.map((row) => (
                <CalcChip key={row.id} row={{...row, _admin: admin, _onEdit: (r) => setCalcEdit({ item: calcRes.items.find(x => x.id === r.id) || r, isNew: false }), _onDelete: (id) => calcRes.remove(id)}} lang={lang} state={state} onToggle={toggle} onQty={setQty} />
              ))}
            </>
          )}
          {admin && (
            <div style={{ marginTop: 14 }}>
              <button className="add-btn" onClick={() => setCalcEdit({ item: { category: activeTab, variant: variantKey, group_type: 'addon' }, isNew: true })}>
                + {lang === 'ru' ? 'Добавить опцию' : 'Add option'}
              </button>
            </div>
          )}
        </div>

        {admin && calcEdit && (
          <EditItemModal
            open={true}
            onClose={() => setCalcEdit(null)}
            onSave={handleSaveCalcOption}
            fields={calcOptionFields}
            values={calcEdit.item}
            title={calcEdit.isNew ? (lang === 'ru' ? 'Новая опция' : 'New option') : (lang === 'ru' ? 'Редактировать' : 'Edit')}
            lang={lang}
          />
        )}

        <aside className="calc2-summary">
          <div className="calc2-summary-eyebrow">{t.calculator.result}</div>
          <div className="calc2-summary-val">{totalFmt}</div>
          <div className="calc2-summary-alt">{total > 0 ? '' : (lang === 'ru' ? 'ничего не выбрано' : 'nothing selected')}</div>

          {/* Modifier toggles */}
          <div className="calc2-modifiers">
            <button
              className={`calc2-modifier-btn ${rushOrder ? 'active' : ''}`}
              onClick={() => setRushOrder(r => !r)}>
              <span className="calc2-mod-icon">{rushOrder ? '⚡' : '○'}</span>
              <span className="calc2-mod-label">{lang === 'ru' ? 'Срочный заказ' : 'Rush order'}</span>
              <span className="calc2-mod-pct">+50%</span>
            </button>
            <button
              className={`calc2-modifier-btn ${convWork ? 'active' : ''}`}
              onClick={() => setConvWork(r => !r)}>
              <span className="calc2-mod-icon">{convWork ? '🎪' : '○'}</span>
              <span className="calc2-mod-label">{lang === 'ru' ? 'Конфиденциальная работа' : 'Confidential work'}</span>
              <span className="calc2-mod-pct">+50%</span>
            </button>
            {(rushOrder || convWork) && baseTotal > 0 && (
              <div className="calc2-modifier-breakdown">
                <span>{lang === 'ru' ? 'База:' : 'Base:'}</span>
                <span>{fmtMoney(baseTotal)}</span>
                {rushOrder && (
                  <>
                    <span>{lang === 'ru' ? 'Срочность +50%:' : 'Rush +50%:'}</span>
                    <span>{fmtMoney(baseTotal*0.5)}</span>
                  </>
                )}
                {convWork && (
                  <>
                    <span>{lang === 'ru' ? 'Конфиденц. +50%:' : 'Confidential +50%:'}</span>
                    <span>{fmtMoney((rushOrder ? baseTotal*1.5 : baseTotal)*0.5)}</span>
                  </>
                )}
                <span style={{ borderTop: '1px solid rgba(232,169,59,0.3)', paddingTop: 4, marginTop: 4, fontWeight: 'bold' }}>
                  {lang === 'ru' ? 'Итого:' : 'Total:'}
                </span>
                <span style={{ borderTop: '1px solid rgba(232,169,59,0.3)', paddingTop: 4, marginTop: 4, fontWeight: 'bold', color: 'var(--accent)' }}>
                  {fmtMoney(total)}
                </span>
              </div>
            )}
          </div>

          {globalLines.length > 0 && (
            <button className="calc2-summary-clear" onClick={clearAll}>
              {lang === 'ru' ? 'Очистить всё' : 'Clear all'}
            </button>
          )}
          <ul className="calc2-summary-list">
            {globalLines.length === 0 && (
              <li className="calc2-summary-empty">
                {lang === 'ru' ? 'Ничего не выбрано' : 'Nothing selected'}
              </li>
            )}
            {globalLines.map((line) => (
              <li key={line.id} className="calc2-summary-line">
                <span className="calc2-summary-line-label">{line.label}{line.qty > 1 ? ` × ${line.qty}` : ''}</span>
                <span className="calc2-summary-line-price">{fmtMoney(line.sum, lang)}</span>
                {/* Крестик убирает функцию прямо отсюда — не нужно искать её в калькуляторе */}
                <button className="calc2-summary-remove" onClick={() => toggle(line.id)}
                  title={lang === 'ru' ? 'Убрать' : 'Remove'}
                  aria-label={lang === 'ru' ? 'Убрать' : 'Remove'}>×</button>
              </li>
            ))}
          </ul>

          {total > 0 && (
            <>
              <button className="btn btn-primary calc2-contact-btn" onClick={() => setContactOpen(true)}>
                {lang === 'ru' ? 'Связаться для заказа' : 'Contact to order'}
              </button>
              <div className="calc2-payment-note">
                {lang === 'ru' ? 'Оплата: ' : 'Payment: '}
                <span>Swift</span> · <span>OzonBank</span> · <span>Boosty</span><sup>*</sup> · <span>Hipolink</span><sup>*</sup>
                <em>{lang === 'ru' ? '* комиссия платформы' : '* platform fee'}</em>
              </div>
            </>
          )}

          <div className="calc2-summary-note">{t.calculator.note}</div>
        </aside>
      </div>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} lang={lang} admin={admin} />
    </section>
  );
}

// ─── Contact modal ───
function ContactModal({ open, onClose, lang, admin }) {
  // ALL hooks must be before any conditional return
  const linksRes = useResource('links', DEFAULT_LINKS);
  const [editing, setEditing] = React.useState(false);
  const [editDraft, setEditDraft] = React.useState(null);

  if (!open) return null;

  // Filter for socials where you can write a DM + email
  const dmKinds = ['social', 'chat', 'mail'];
  const contactable = linksRes.items.filter(l => dmKinds.includes(l.kind));
  const finalLinks = contactable.map(l => l.kind === 'mail'
    ? { ...l, handle: 'milariayt@gmail.com', url: 'mailto:milariayt@gmail.com' }
    : l
  );
  if (!finalLinks.find(l => l.kind === 'mail')) {
    finalLinks.push({ id: 'email-default', label: 'Email', handle: 'milariayt@gmail.com', url: 'mailto:milariayt@gmail.com', kind: 'mail' });
  }

  function copy(text) {
    try { navigator.clipboard.writeText(text); } catch (e) {}
  }

  function startEdit(l) {
    setEditDraft({ ...l });
    setEditing(true);
  }
  function saveEdit() {
    if (!editDraft) return;
    if (editDraft._isNew) {
      linksRes.add({ label: editDraft.label, handle: editDraft.handle, url: editDraft.url, kind: editDraft.kind || 'social', sort_order: 99 });
    } else {
      linksRes.update(editDraft.id, { label: editDraft.label, handle: editDraft.handle, url: editDraft.url, kind: editDraft.kind });
    }
    setEditing(false);
    setEditDraft(null);
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ paddingRight: 40 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.04em', color: 'var(--accent)', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>✦ {lang === 'ru' ? 'связаться' : 'contact'}</span>
          {admin && (
            <button className="admin-btn" style={{ fontSize: 11 }}
              onClick={() => setEditing(e => !e)}>
              {editing ? '✓ Готово' : '✎ Редактировать'}
            </button>
          )}
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 38, margin: '0 0 12px', fontWeight: 500 }}>
          {lang === 'ru' ? 'Куда написать?' : 'Where to message?'}
        </h2>
        <p style={{ color: 'var(--text-muted)', margin: '0 0 28px', fontSize: 14, maxWidth: 540 }}>
          {lang === 'ru'
            ? 'Напиши мне в любую из соцсетей или на почту — обсудим детали заказа.'
            : "Reach out via any social or email — we'll discuss the details."
          }
        </p>

        {/* Admin editor */}
        {admin && editing && (
          <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {linksRes.items.map(l => (
              <div key={l.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ flex: 1, fontSize: 13 }}>{l.label}</span>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', flex: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.handle || l.url}</span>
                <button className="admin-btn" style={{ fontSize: 10, padding: '4px 8px' }} onClick={() => startEdit(l)}>✎</button>
                <button className="admin-btn danger" style={{ fontSize: 10, padding: '4px 8px' }} onClick={() => linksRes.remove(l.id)}>×</button>
              </div>
            ))}
            <button className="btn" style={{ fontSize: 12, padding: '8px 14px', justifyContent: 'center' }}
              onClick={() => startEdit({ _isNew: true, label: '', handle: '', url: '', kind: 'social' })}>
              + {lang === 'ru' ? 'Добавить' : 'Add'}
            </button>
          </div>
        )}

        {/* Edit form */}
        {admin && editDraft && (
          <div style={{ marginBottom: 20, padding: 16, borderRadius: 12, border: '1px solid var(--accent)', background: 'rgba(232,169,59,0.06)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)' }}>
              {editDraft._isNew ? (lang === 'ru' ? 'Новый контакт' : 'New contact') : (lang === 'ru' ? 'Редактировать' : 'Edit')}
            </div>
            {[
              { key: 'label', placeholder: 'Telegram, Twitter...' },
              { key: 'handle', placeholder: '@username' },
              { key: 'url', placeholder: 'https://...' },
            ].map(f => (
              <input key={f.key} value={editDraft[f.key] || ''} placeholder={f.placeholder}
                onChange={e => setEditDraft(d => ({ ...d, [f.key]: e.target.value }))}
                style={{ padding: '8px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 12, width: '100%' }} />
            ))}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }} onClick={saveEdit}>
                {lang === 'ru' ? 'Сохранить' : 'Save'}
              </button>
              <button className="btn" style={{ fontSize: 12, padding: '8px 14px' }} onClick={() => setEditDraft(null)}>
                {lang === 'ru' ? 'Отмена' : 'Cancel'}
              </button>
            </div>
          </div>
        )}

        <div className="contact-grid">
          {finalLinks.map((l) => (
            <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className="contact-card">
              <div className="contact-card-label">{l.label}</div>
              <div className="contact-card-handle">{l.handle}</div>
              <button
                className="contact-card-copy"
                onClick={(e) => { e.preventDefault(); copy(l.handle); }}
                title={lang === 'ru' ? 'скопировать' : 'copy'}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </a>
          ))}
        </div>
      </div>
    </Modal>
  );
}

Object.assign(window, { CalculatorSection });

  