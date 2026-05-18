'use client';
import { useState, useMemo } from 'react';
import { useT, useSite } from '../ClientShell';
import type { CalcOption } from '@/lib/types';

const FX_RATE = 95;

export default function CalculatorContent({ options }: { options: CalcOption[] }) {
  const t = useT();
  const { lang, currency } = useSite();
  const [state, setState] = useState<Record<string, { on: boolean; qty: number }>>({});

  const categories = useMemo(() => Array.from(new Set(options.map(o => o.category))), [options]);
  const [activeCat, setActiveCat] = useState(categories[0] || 'vtuber');
  const variants = useMemo(
    () => Array.from(new Set(options.filter(o => o.category === activeCat).map(o => o.variant))),
    [options, activeCat]
  );
  const [activeVar, setActiveVar] = useState(variants[0] || '');

  const currentOpts = options.filter(o => o.category === activeCat && o.variant === activeVar);
  const base = currentOpts.filter(o => o.group_type === 'base');
  const addon = currentOpts.filter(o => o.group_type === 'addon');

  function toggle(id: string) {
    setState(s => ({ ...s, [id]: { on: !s[id]?.on, qty: s[id]?.qty || 1 } }));
  }
  function setQty(id: string, qty: number) {
    setState(s => ({ ...s, [id]: { on: s[id]?.on || false, qty } }));
  }

  // GLOBAL total — across ALL tabs
  const total = useMemo(() => {
    let sum = 0;
    for (const o of options) {
      const s = state[o.id];
      if (s?.on) sum += o.rub * (s.qty || 1);
    }
    return sum;
  }, [options, state]);

  const selectedLines = useMemo(() =>
    options.filter(o => state[o.id]?.on).map(o => ({
      id: o.id,
      label: lang === 'ru' ? o.label_ru : o.label_en,
      qty: state[o.id]?.qty || 1,
      sum: o.rub * (state[o.id]?.qty || 1),
    })),
    [options, state, lang]
  );

  return (
    <main className="shell">
      <section className="page-section">
        <div className="page-head">
          <span className="page-eyebrow">{t.calculator.tag}</span>
          <h1 className="page-title">{t.calculator.title}</h1>
        </div>
        <div className="calc2-layout">
          <div className="calc2-options-wrap">
            <div className="calc2-tabs">
              {categories.map(c => (
                <button key={c} className={`calc2-tab ${activeCat === c ? 'active' : ''}`}
                  onClick={() => { setActiveCat(c); setActiveVar(options.find(o => o.category === c)?.variant || ''); }}>
                  {c}
                </button>
              ))}
            </div>
            <div className="calc2-subtabs">
              {variants.map(v => (
                <button key={v} className={`calc2-subtab ${activeVar === v ? 'active' : ''}`} onClick={() => setActiveVar(v)}>{v}</button>
              ))}
            </div>
            <div className="calc2-options">
              {base.map(o => <Chip key={o.id} o={o} lang={lang} state={state} toggle={toggle} setQty={setQty} />)}
              {addon.length > 0 && (
                <div className="section-label" style={{ marginTop: 16 }}>
                  <span className="dot" /><span>+ {lang === 'ru' ? 'Дополнительно' : 'Add-ons'}</span>
                </div>
              )}
              {addon.map(o => <Chip key={o.id} o={o} lang={lang} state={state} toggle={toggle} setQty={setQty} />)}
            </div>
          </div>
          <aside className="calc2-summary">
            <div className="calc2-summary-eyebrow"><span>{t.calculator.total}</span></div>
            <div className="calc2-summary-total">
              <span>{currency === 'rub' ? `${total.toLocaleString('ru-RU')} ₽` : `$${Math.round(total / FX_RATE)}`}</span>
            </div>
            {selectedLines.length === 0 ? (
              <div className="calc2-summary-empty">{t.calculator.empty}</div>
            ) : (
              <ul className="calc2-summary-list">
                {selectedLines.map(l => (
                  <li key={l.id} className="calc2-summary-line">
                    <span>{l.label}{l.qty > 1 ? ` × ${l.qty}` : ''}</span>
                    <span>{currency === 'rub' ? `${l.sum.toLocaleString('ru-RU')} ₽` : `$${Math.round(l.sum / FX_RATE)}`}</span>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}

function Chip({ o, lang, state, toggle, setQty }: any) {
  const on = state[o.id]?.on;
  const qty = state[o.id]?.qty || 1;
  const label = lang === 'ru' ? o.label_ru : o.label_en;
  return (
    <div className={`calc2-chip ${on ? 'active' : ''}`} onClick={() => toggle(o.id)}>
      <span>{label}</span>
      <span className="calc2-chip-price">{o.rub.toLocaleString('ru-RU')} ₽</span>
      {on && o.has_qty && (
        <div className="calc2-chip-qty" onClick={e => e.stopPropagation()}>
          <button onClick={() => setQty(o.id, Math.max(1, qty - 1))}>−</button>
          <span>×{qty}</span>
          <button onClick={() => setQty(o.id, qty + 1)}>+</button>
        </div>
      )}
    </div>
  );
}
