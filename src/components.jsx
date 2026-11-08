
// components.jsx — общие компоненты UI

const { useState, useEffect, useRef, useMemo } = React;

// ──────────────── мышка-маскот (placeholder, юзер заменит) ────────────────
function RatLogo({ size = 26 }) {
  // Простая стилизованная мышка/крыса
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* уши */}
      <circle cx="9" cy="10" r="4.5" fill="white" opacity="0.9" />
      <circle cx="23" cy="10" r="4.5" fill="white" opacity="0.9" />
      <circle cx="9" cy="10" r="2.2" fill="#ec6aa7" />
      <circle cx="23" cy="10" r="2.2" fill="#ec6aa7" />
      {/* голова */}
      <ellipse cx="16" cy="18" rx="9" ry="8" fill="white" />
      {/* глазки */}
      <circle cx="12.5" cy="17" r="1.4" fill="#14101a" />
      <circle cx="19.5" cy="17" r="1.4" fill="#14101a" />
      <circle cx="13" cy="16.5" r="0.4" fill="white" />
      <circle cx="20" cy="16.5" r="0.4" fill="white" />
      {/* носик */}
      <ellipse cx="16" cy="21" rx="1.2" ry="0.9" fill="#ec6aa7" />
      {/* усики */}
      <line x1="11" y1="22" x2="7" y2="22.5" stroke="#14101a" strokeWidth="0.5" strokeLinecap="round" />
      <line x1="11" y1="23" x2="7" y2="24" stroke="#14101a" strokeWidth="0.5" strokeLinecap="round" />
      <line x1="21" y1="22" x2="25" y2="22.5" stroke="#14101a" strokeWidth="0.5" strokeLinecap="round" />
      <line x1="21" y1="23" x2="25" y2="24" stroke="#14101a" strokeWidth="0.5" strokeLinecap="round" />
    </svg>);

}

// ──────────────── декоративный фон ────────────────
function BackgroundLayer({ bgImage }) {
  const style = bgImage ? { '--bg-image': `url("${bgImage}")` } : {};
  return (
    <div className="bg-stack" style={style}>
      <div className="bg-art"></div>
      {bgImage && <div className="bg-art-img"></div>}
      <div className="bg-grid"></div>
      <div className="bg-vignette"></div>
      <div className="bg-noise"></div>
    </div>);

}

// ──────────────── верхняя навигация ────────────────
function TopNav({ tabs, active, onChange, lang, onLangToggle, admin, onAdminToggle, t }) {
  return (
    <header className="topnav">
      <div className="topnav-inner">
        <a className="brand" href="#" onClick={(e) => {e.preventDefault();onChange(tabs[0].id);}}>
          <span className="brand-signature">milaria</span>
        </a>

        <nav className="nav-tabs">
          {tabs.map((tab) =>
          <button
            key={tab.id}
            className={`nav-tab ${active === tab.id ? 'active' : ''}`}
            onClick={() => onChange(tab.id)}>
            {tab.label}</button>
          )}
        </nav>

        <div className="nav-right">
          <button
            className={`icon-btn ${admin ? 'active' : ''}`}
            onClick={onAdminToggle}
            title={admin ? t.common.adminOn : t.common.adminOff}>
            
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>
          <button className="icon-btn lang-btn" onClick={onLangToggle}>
            {t.common.langSwitch}
          </button>
        </div>
      </div>

      {/* mobile tabs */}
      <div className="nav-tabs-mobile">
        {tabs.map((tab) =>
        <button
          key={tab.id}
          className={`nav-tab ${active === tab.id ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}>
          {tab.label}</button>
        )}
      </div>
    </header>);

}

// ──────────────── заголовок страницы ────────────────
function PageHead({ eyebrow, title, subtitle, children }) {
  // The eyebrow arrives as one string ("✦ Портфолио ✦") and lands in a flex
  // container as a single anonymous item, so a narrow screen breaks it at a
  // space and strands the ✦ on its own line. Non-breaking spaces glue each star
  // to the word beside it; the title itself may still wrap between words.
  const eb = typeof eyebrow === 'string'
    ? eyebrow.replace(/^(\S)\s+/, '$1\u00A0').replace(/\s+(\S)$/, '\u00A0$1')
    : eyebrow;
  return (
    <div className="page-head">
      {eb && <div className="page-eyebrow">{eb}</div>}
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
      {children}
    </div>);

}

// ════════════════════════════════════════════════════════════════════
//  Редактор (админка): общие детали интерфейса
//  Всё, что видит админ, собирается из этих кусков — окна, поля,
//  переключатели, загрузка файлов, подтверждения. Так редактор во всех
//  разделах выглядит одинаково и в цветах сайта.
// ════════════════════════════════════════════════════════════════════

const ED_ICON_PATHS = {
  edit:    <><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></>,
  trash:   <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></>,
  plus:    <><path d="M12 5v14M5 12h14" /></>,
  close:   <><path d="M18 6 6 18M6 6l12 12" /></>,
  check:   <><path d="M20 6 9 17l-5-5" /></>,
  upload:  <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m17 8-5-5-5 5" /><path d="M12 3v12" /></>,
  image:   <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></>,
  video:   <><rect x="2" y="5" width="15" height="14" rx="2" /><path d="m17 10 5-3v10l-5-3" /></>,
  link:    <><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></>,
  grip:    <><circle cx="9" cy="6" r="1.2" /><circle cx="15" cy="6" r="1.2" /><circle cx="9" cy="12" r="1.2" /><circle cx="15" cy="12" r="1.2" /><circle cx="9" cy="18" r="1.2" /><circle cx="15" cy="18" r="1.2" /></>,
  target:  <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><path d="M12 1v4M12 19v4M1 12h4M19 12h4" /></>,
  star:    <><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1Z" /></>,
  download:<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5" /><path d="M12 15V3" /></>,
  chart:   <><path d="M3 3v18h18" /><path d="M7 15l4-4 3 3 5-6" /></>,
  refresh: <><path d="M21 12a9 9 0 1 1-2.6-6.4" /><path d="M21 3v6h-6" /></>,
  logout:  <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></>,
  sparkle: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" /></>,
  clock:   <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  layers:  <><path d="m12 2 10 5-10 5L2 7Z" /><path d="m2 17 10 5 10-5M2 12l10 5 10-5" /></>,
  center:  <><path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" /><circle cx="12" cy="12" r="2" /></>,
  sort:    <><path d="M7 4v16M3 16l4 4 4-4" /><path d="M17 20V4M13 8l4-4 4 4" /></>,
};

function EdIcon({ name, size = 16, className }) {
  return (
    <svg className={`ed-ico ${className || ''}`} width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      {ED_ICON_PATHS[name] || null}
    </svg>
  );
}

// ── Окно редактора ──
// Шапка (надзаголовок + заголовок), прокручиваемое тело и закреплённый низ
// с кнопками. Esc закрывает только самое верхнее окно.
const _edStack = [];
function useEdTopmost(active, onClose) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!active) return;
    const id = Math.random().toString(36).slice(2);
    _edStack.push(id);
    const onKey = (e) => {
      if (e.key === 'Escape' && _edStack[_edStack.length - 1] === id) {
        e.stopPropagation();
        closeRef.current && closeRef.current();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      const i = _edStack.indexOf(id);
      if (i >= 0) _edStack.splice(i, 1);
    };
  }, [active]);
}

function EditorModal({ open = true, onClose, eyebrow, title, subtitle, children, footer, size = 'md', className }) {
  useEdTopmost(open, onClose);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);
  if (!open) return null;
  return ReactDOM.createPortal(
    <div className="ed-modal-bg" onMouseDown={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}>
      <div className={`ed-modal ed-modal--${size} ${className || ''}`} role="dialog" aria-modal="true">
        <header className="ed-modal-head">
          <div className="ed-modal-titles">
            {eyebrow && <div className="ed-eyebrow">✦ {eyebrow}</div>}
            {title && <h2 className="ed-title">{title}</h2>}
            {subtitle && <p className="ed-subtitle">{subtitle}</p>}
          </div>
          {onClose && (
            <button type="button" className="ed-icon-btn" onClick={onClose} aria-label="Закрыть" title="Закрыть (Esc)">
              <EdIcon name="close" size={18} />
            </button>
          )}
        </header>
        <div className="ed-modal-body">{children}</div>
        {footer && <footer className="ed-modal-foot">{footer}</footer>}
      </div>
    </div>,
    document.body
  );
}

// ── Поля формы ──
// Простое поле (input/textarea/select) оборачиваем в <label>, чтобы клик по
// подписи ставил курсор. Сложные (переключатели, картинки) — в <div>: иначе
// клик по подписи «нажимает» первую кнопку внутри.
function EdField({ label, hint, half, children, plain, className }) {
  const Tag = plain ? 'div' : 'label';
  return (
    <Tag className={`ed-field ${half ? 'ed-field--half' : ''} ${className || ''}`}>
      {label && <span className="ed-label">{label}</span>}
      {children}
      {hint && <span className="ed-hint">{hint}</span>}
    </Tag>
  );
}

function EdSection({ title, hint, children, aside }) {
  return (
    <section className="ed-section">
      {(title || aside) && (
        <div className="ed-section-head">
          {title && <h3 className="ed-section-title">{title}</h3>}
          {aside}
        </div>
      )}
      {hint && <p className="ed-section-hint">{hint}</p>}
      {children}
    </section>
  );
}

// Переключатель на несколько вариантов вместо выпадающего списка.
function EdSegment({ value, options, onChange, size }) {
  return (
    <div className={`ed-seg ${size === 'sm' ? 'ed-seg--sm' : ''}`} role="radiogroup">
      {options.map(o => (
        <button key={String(o.value)} type="button" role="radio"
          aria-checked={String(value) === String(o.value)}
          className={String(value) === String(o.value) ? 'on' : ''}
          onClick={() => onChange(o.value)}>
          {o.dot && <span className="ed-seg-dot" style={{ background: o.dot }} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Поле «перетащи файл сюда или нажми». Отдаёт массив File.
function EdDropzone({ onFiles, accept = 'image/*', multiple, busy, label, hint, compact, className, style }) {
  const [over, setOver] = useState(false);
  const inputRef = useRef(null);
  function pick(list) {
    const files = Array.from(list || []);
    if (files.length) onFiles(multiple ? files : [files[0]]);
  }
  return (
    <div className={`ed-drop ${over ? 'over' : ''} ${busy ? 'busy' : ''} ${compact ? 'ed-drop--compact' : ''} ${className || ''}`}
      style={style}
      role="button" tabIndex={0}
      onClick={(e) => { e.stopPropagation(); if (!busy) inputRef.current?.click(); }}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !busy) { e.preventDefault(); inputRef.current?.click(); } }}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (!over) setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setOver(false); if (!busy) pick(e.dataTransfer.files); }}>
      <input ref={inputRef} type="file" accept={accept} multiple={multiple} style={{ display: 'none' }}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => { pick(e.target.files); e.target.value = ''; }} />
      {busy ? <span className="ed-spinner" /> : <EdIcon name="upload" size={compact ? 16 : 22} />}
      <span className="ed-drop-text">
        <span className="ed-drop-label">{busy ? 'Загружаю…' : (label || 'Перетащи файл сюда или нажми')}</span>
        {hint && !busy && <span className="ed-drop-hint">{hint}</span>}
      </span>
    </div>
  );
}

// Кнопки «изменить / удалить» на карточках. Удаление всегда переспрашивает.
function ItemTools({ onEdit, onDelete, deleteText, extra, className, style, size = 'md' }) {
  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };
  const ico = size === 'sm' ? 12 : 14;
  return (
    <div className={`ed-tools ed-tools--${size} ${className || ''}`} style={style}
      onClick={stop} onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
      {extra}
      {onEdit && (
        <button type="button" className="ed-tool" title="Изменить" aria-label="Изменить"
          onClick={(e) => { stop(e); onEdit(); }}>
          <EdIcon name="edit" size={ico} />
        </button>
      )}
      {onDelete && (
        <button type="button" className="ed-tool ed-tool--danger" title="Удалить" aria-label="Удалить"
          onClick={async (e) => {
            stop(e);
            if (await askConfirm(deleteText || 'Удалить этот элемент?', { danger: true, okText: 'Удалить' })) onDelete();
          }}>
          <EdIcon name="trash" size={ico} />
        </button>
      )}
    </div>
  );
}

// Ручка для перетаскивания карточек.
function DragHandle({ style }) {
  return <span className="drag-handle" style={style} title="Перетащи, чтобы поменять порядок"><EdIcon name="grip" size={14} /></span>;
}

// ── Окна подтверждения и ввода — вместо системных confirm()/prompt()/alert() ──
let _edDialogPush = null;
function EdDialogHost() {
  const [queue, setQueue] = useState([]);
  const [text, setText] = useState('');
  useEffect(() => {
    _edDialogPush = (d) => setQueue(q => [...q, d]);
    return () => { _edDialogPush = null; };
  }, []);
  const top = queue[0];
  useEffect(() => { if (top) setText(top.initial || ''); }, [top]);
  if (!top) return null;
  const finish = (v) => { top.resolve(v); setQueue(q => q.slice(1)); };
  const cancelValue = top.kind === 'text' ? null : false;
  const ok = () => finish(top.kind === 'text' ? text : true);
  const eyebrow = top.eyebrow || (top.kind === 'text' ? 'ввод' : top.kind === 'notice' ? 'готово' : top.danger ? 'подтверждение' : 'вопрос');
  return (
    <EditorModal open={true} size="sm" className="ed-dialog" onClose={() => finish(cancelValue)}
      eyebrow={eyebrow} title={top.title}
      footer={top.kind === 'notice'
        ? <button type="button" className="ed-btn ed-btn--primary" autoFocus onClick={ok}>{top.okText || 'Понятно'}</button>
        : <>
            <button type="button" className="ed-btn ed-btn--ghost" onClick={() => finish(cancelValue)}>{top.cancelText || 'Отмена'}</button>
            <button type="button" className={`ed-btn ${top.danger ? 'ed-btn--danger' : 'ed-btn--primary'}`}
              autoFocus={top.kind !== 'text'} onClick={ok}>{top.okText || 'OK'}</button>
          </>}>
      {top.message && <p className="ed-dialog-msg">{top.message}</p>}
      {top.kind === 'text' && (
        <input className="ed-input" autoFocus value={text} placeholder={top.placeholder || ''}
          inputMode={top.inputMode}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') ok(); }} />
      )}
    </EditorModal>
  );
}

function askConfirm(message, opts = {}) {
  if (!_edDialogPush) return Promise.resolve(window.confirm(message));
  return new Promise(resolve => _edDialogPush({
    kind: 'confirm', ...opts, title: opts.title || message, message: opts.title ? message : null, resolve,
  }));
}
function askText(title, opts = {}) {
  if (!_edDialogPush) return Promise.resolve(window.prompt(title, opts.initial || ''));
  return new Promise(resolve => _edDialogPush({ kind: 'text', ...opts, title, resolve }));
}
function edNotice(title, message, opts = {}) {
  if (!_edDialogPush) { window.alert(message ? title + '\n\n' + message : title); return Promise.resolve(true); }
  return new Promise(resolve => _edDialogPush({ kind: 'notice', ...opts, title, message, resolve }));
}

// Превью медиа по ссылке: картинка, видео или обложка YouTube.
function edMediaKind(src) {
  const s = String(src || '').toLowerCase();
  if (s.includes('youtube.com') || s.includes('youtu.be')) return 'youtube';
  if (/\.(mp4|webm|mov|m4v)(\?|$)/.test(s)) return 'video';
  if (/\.gif(\?|$)/.test(s)) return 'gif';
  return 'image';
}
function edYtThumb(src) {
  const id = (String(src).match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]+)/) || [])[1];
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : '';
}
function EdThumb({ src, className, style, focal }) {
  const kind = edMediaKind(src);
  if (!src) return <div className={`ed-thumb ed-thumb--empty ${className || ''}`} style={style}><EdIcon name="image" size={20} /></div>;
  if (kind === 'video') {
    return (
      <div className={`ed-thumb ${className || ''}`} style={style}>
        <video src={src} muted playsInline preload="metadata" />
        <span className="ed-thumb-badge"><EdIcon name="video" size={11} /> видео</span>
      </div>
    );
  }
  const img = kind === 'youtube' ? edYtThumb(src) : src;
  return (
    <div className={`ed-thumb ${className || ''}`} style={style}>
      <img src={img} alt="" loading="lazy" style={focal ? { objectPosition: focal } : undefined}
        onError={(e) => { e.currentTarget.style.opacity = 0; }} />
      {kind === 'youtube' && <span className="ed-thumb-badge">YouTube</span>}
      {kind === 'gif' && <span className="ed-thumb-badge">GIF</span>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Редактор превью — отдельное окно «какую часть картинки показывать»
//  Картинка показана целиком, сверху рамка той формы, в какую её обрежет
//  карточка. Рамку двигают мышкой/пальцем или стрелками; справа живой
//  предпросмотр в настоящих пропорциях (на компьютере и на телефоне).
//  Значение — как у CSS background-position: «x% y%».
// ════════════════════════════════════════════════════════════════════
function edParseFocal(f) {
  if (!f || f === 'center') return { x: 50, y: 50 };
  const p = String(f).replace(/%/g, '').trim().split(/\s+/);
  const x = parseFloat(p[0]), y = parseFloat(p[1]);
  return { x: isNaN(x) ? 50 : x, y: isNaN(y) ? 50 : y };
}
const edClamp = (v) => Math.max(0, Math.min(100, v));

// Какую долю картинки видно в карточке с пропорцией ratio (ширина/высота),
// если картинка растянута «cover». Возвращает доли 0..1.
function edCropBox(imgRatio, ratio) {
  if (!imgRatio || !ratio) return { w: 1, h: 1 };
  if (imgRatio > ratio) return { w: ratio / imgRatio, h: 1 };
  return { w: 1, h: imgRatio / ratio };
}

// Измерить настоящую карточку на странице; если её не видно — запасное значение.
function edMeasureRatio(selector, fallback) {
  try {
    const el = document.querySelector(selector);
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.width > 20 && r.height > 20) return r.width / r.height;
    }
  } catch (e) {}
  return fallback;
}

const ED_PRESETS = [
  [0, 0], [50, 0], [100, 0],
  [0, 50], [50, 50], [100, 50],
  [0, 100], [50, 100], [100, 100],
];

function PreviewEditor({ src, focal, shapes, title, subtitle, onSave, onClose }) {
  const [pos, setPos] = useState(() => edParseFocal(focal));
  const [imgRatio, setImgRatio] = useState(null);
  const [active, setActive] = useState(0);
  const stageRef = useRef(null);
  const dragRef = useRef(null);

  const shape = shapes[active] || shapes[0];
  const box = edCropBox(imgRatio, shape.ratio);
  const frame = {
    left: (1 - box.w) * pos.x,
    top: (1 - box.h) * pos.y,
    width: box.w * 100,
    height: box.h * 100,
  };
  const value = `${Math.round(pos.x)}% ${Math.round(pos.y)}%`;
  const changed = value !== `${Math.round(edParseFocal(focal).x)}% ${Math.round(edParseFocal(focal).y)}%`;

  // Точка под пальцем — центр рамки. Переводим в background-position.
  function posFromPointer(e, grab) {
    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = (e.clientX - r.left) / r.width - (grab ? grab.dx : 0);
    const cy = (e.clientY - r.top) / r.height - (grab ? grab.dy : 0);
    setPos(p => ({
      x: box.w < 1 ? edClamp(((cx - box.w / 2) / (1 - box.w)) * 100) : p.x,
      y: box.h < 1 ? edClamp(((cy - box.h / 2) / (1 - box.h)) * 100) : p.y,
    }));
  }

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    const el = stageRef.current;
    if (!el) return;
    e.preventDefault();
    el.setPointerCapture?.(e.pointerId);
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    // Схватили внутри рамки — тянем её за это место; снаружи — рамка прыгает сюда.
    const fx = frame.left / 100, fy = frame.top / 100;
    const inside = px >= fx && px <= fx + box.w && py >= fy && py <= fy + box.h;
    const grab = inside ? { dx: px - (fx + box.w / 2), dy: py - (fy + box.h / 2) } : null;
    dragRef.current = { grab };
    posFromPointer(e, grab);
  }
  function onPointerMove(e) {
    if (!dragRef.current) return;
    posFromPointer(e, dragRef.current.grab);
  }
  function onPointerUp() { dragRef.current = null; }

  function onKey(e) {
    const step = e.shiftKey ? 5 : 1;
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    setPos(p => ({ x: edClamp(p.x + m[0]), y: edClamp(p.y + m[1]) }));
  }

  const lockedX = imgRatio && box.w >= 0.999;
  const lockedY = imgRatio && box.h >= 0.999;

  return (
    <EditorModal onClose={onClose} size="xl" className="ed-pv"
      eyebrow="превью" title={title || 'Что показывать в карточке'}
      subtitle={subtitle || 'Перетащи рамку или нажми туда, что должно быть в центре. Стрелки на клавиатуре — точная подстройка (с Shift — шагом крупнее).'}
      footer={<>
        <span className="ed-foot-hint">{lockedX && lockedY ? 'Картинка помещается целиком — двигать нечего' : `Сдвиг: ${value}`}</span>
        <button type="button" className="ed-btn ed-btn--ghost" onClick={onClose}>Отмена</button>
        <button type="button" className="ed-btn ed-btn--primary" onClick={() => { onSave(value); onClose(); }} disabled={!changed}>
          <EdIcon name="check" size={15} /> Сохранить
        </button>
      </>}>
      <div className="ed-pv-layout">
        <div className="ed-pv-main">
          {shapes.length > 1 && (
            <div className="ed-pv-shape">
              <span className="ed-label">Рамка по форме</span>
              <EdSegment size="sm" value={active} onChange={setActive}
                options={shapes.map((s, i) => ({ value: i, label: s.label }))} />
            </div>
          )}
          <div className="ed-pv-stage-wrap">
            <div ref={stageRef} className="ed-pv-stage" tabIndex={0} onKeyDown={onKey}
              onPointerDown={onPointerDown} onPointerMove={onPointerMove}
              onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
              <img src={src} alt="" draggable={false}
                onLoad={e => { const n = e.currentTarget; if (n.naturalWidth && n.naturalHeight) setImgRatio(n.naturalWidth / n.naturalHeight); }} />
              {imgRatio && (
                <div className="ed-pv-frame" style={{ left: frame.left + '%', top: frame.top + '%', width: frame.width + '%', height: frame.height + '%' }}>
                  <span className="ed-pv-grid" />
                  <span className="ed-pv-frame-label">{shape.label}</span>
                </div>
              )}
              {!imgRatio && <span className="ed-spinner" style={{ position: 'absolute', left: '50%', top: '50%' }} />}
            </div>
          </div>
        </div>

        <aside className="ed-pv-side">
          <div className="ed-section-title" style={{ marginBottom: 10 }}>Как увидят зрители</div>
          <div className="ed-pv-previews">
            {shapes.map((s, i) => (
              <button key={i} type="button" className={`ed-pv-preview ${i === active ? 'on' : ''}`} onClick={() => setActive(i)}>
                <span className="ed-pv-preview-box"
                  style={{
                    aspectRatio: String(s.ratio),
                    width: s.ratio >= 1 ? '100%' : Math.round(s.ratio * 100 * 1.15) + '%',
                    backgroundImage: `url("${src}")`, backgroundPosition: value,
                  }} />
                <span className="ed-pv-preview-label">{s.label}</span>
              </button>
            ))}
          </div>

          <div className="ed-section-title" style={{ margin: '18px 0 10px' }}>Быстро</div>
          <div className="ed-pv-presets" role="group" aria-label="Быстрый выбор">
            {ED_PRESETS.map(([x, y]) => (
              <button key={x + '-' + y} type="button"
                className={Math.round(pos.x) === x && Math.round(pos.y) === y ? 'on' : ''}
                title={`${x}% ${y}%`}
                onClick={() => setPos(p => ({ x: lockedX ? p.x : x, y: lockedY ? p.y : y }))}>
                <span />
              </button>
            ))}
          </div>
          <button type="button" className="ed-btn ed-btn--ghost ed-btn--sm" style={{ marginTop: 12, width: '100%' }}
            onClick={() => setPos({ x: 50, y: 50 })}>
            <EdIcon name="center" size={13} /> По центру
          </button>
        </aside>
      </div>
    </EditorModal>
  );
}

// ──────────────── inline-редактируемое поле ────────────────
// В режиме редактора текст подсвечивается при наведении; клик — поле ввода.
// Enter — сохранить, Esc — отменить.
function Editable({ value, onSave, admin, multiline, className, placeholder }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef(null);

  useEffect(() => {setDraft(value);}, [value]);
  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      ref.current.select?.();
    }
  }, [editing]);

  if (!admin) return <span className={className}>{value || placeholder}</span>;

  if (editing) {
    return (
      <input
        ref={ref}
        className={`inline-input ${className || ''}`}
        value={draft}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {setEditing(false);if (draft !== value) onSave(draft);}}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {setEditing(false);if (draft !== value) onSave(draft);}
          if (e.key === 'Escape') {setEditing(false);setDraft(value);}
        }} />);
  }
  return (
    <span
      className={`${className || ''} ed-inline`}
      title="Нажми, чтобы изменить"
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); setEditing(true); }}>
      {value || placeholder || '—'}</span>);
}

// ──────────────── editable number ────────────────
function EditableNumber({ value, onSave, admin, className, suffix }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const ref = useRef(null);
  useEffect(() => {setDraft(String(value));}, [value]);
  useEffect(() => {if (editing) { ref.current?.focus(); ref.current?.select?.(); }}, [editing]);

  if (!admin) return <span className={className}>{value}{suffix}</span>;
  if (editing) {
    return (
      <input
        ref={ref}
        type="number"
        className={`inline-input inline-input--num ${className || ''}`}
        value={draft}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {setEditing(false);const n = parseInt(draft, 10) || 0;if (n !== value) onSave(n);}}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {setEditing(false);const n = parseInt(draft, 10) || 0;if (n !== value) onSave(n);}
          if (e.key === 'Escape') {setEditing(false);setDraft(String(value));}
        }} />);
  }
  return (
    <span
      className={`${className || ''} ed-inline`}
      title="Нажми, чтобы изменить"
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); setEditing(true); }}>
      {value}{suffix}</span>);
}

// ──────────────── модалка ────────────────
function Modal({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {if (e.key === 'Escape') onClose();};
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return ReactDOM.createPortal(
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        {children}
      </div>
    </div>,
    document.body
  );
}

// ──────────────── footer ornament ────────────────
function FootOrnament({ lang = 'ru', onGoTos }) {
  // Год берём текущий, чтобы не пришлось править вручную каждый январь.
  const year = new Date().getFullYear();
  const ru = lang === 'ru';
  return (
    <footer className="site-foot">
      <div className="foot-ornament">✦ ✦ ✦</div>
      <div className="foot-legal">
        <span className="foot-copy">© {year} Milaria</span>
        <span className="foot-sep">·</span>
        <span>{ru
          ? 'Все работы созданы автором. Использование без разрешения запрещено.'
          : 'All artwork by the author. Use without permission is prohibited.'}</span>
      </div>
      {onGoTos && (
        <button className="foot-link" onClick={onGoTos}>
          {ru ? 'Условия предоставления услуг' : 'Terms of Service'}
        </button>
      )}
    </footer>
  );
}

// ──────────────── login modal ────────────────
function LoginModal({ open, onClose, auth, lang }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const ru = lang === 'ru';

  async function submit(e) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const { ok, error } = await auth.signIn(email, password);
    setBusy(false);
    if (ok) {
      setEmail(""); setPassword("");
      onClose();
    } else {
      setErr(error?.message || "Login failed");
    }
  }

  if (!open) return null;
  return (
    <EditorModal open={true} onClose={onClose} size="sm"
      eyebrow={ru ? 'админ' : 'admin'}
      title={ru ? 'Вход в редактор' : 'Sign in to edit'}
      subtitle={ru
        ? 'Зрители видят сайт без входа. Редактировать может только админ.'
        : 'Viewers can read without login. Editing is admin-only.'}
      footer={
        <button type="submit" form="ed-login-form" className="ed-btn ed-btn--primary ed-btn--wide" disabled={busy}>
          {busy ? <span className="ed-spinner" /> : null}
          {busy ? (ru ? 'Входим…' : 'Signing in…') : (ru ? 'Войти' : 'Sign in')}
        </button>
      }>
      <form id="ed-login-form" onSubmit={submit} className="ed-form">
        <EdField label="Email">
          <input className="ed-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus autoComplete="username" />
        </EdField>
        <EdField label={ru ? 'Пароль' : 'Password'}>
          <input className="ed-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </EdField>
        {err && <div className="ed-alert ed-alert--error">{err}</div>}
      </form>
    </EditorModal>
  );
}


// ──────────────── image uploader ────────────────
// Картинки кладём в Storage, в базу идёт только ссылка. Раньше здесь был
// base64 прямо в базе — так баннер раздул каждую страницу на 1,5 МБ.
// icon — для значка сайта: ужимаем до 64 px.
function ImageUploader({ onUpload, label, multiple, icon }) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  async function handleFiles(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setBusy(true);
    const urls = [];
    for (const file of files) {
      const up = icon ? await window.uploadIconToStorage(file) : await window.uploadToStorage(file);
      if (up && up.url) urls.push(up.url);
    }
    setBusy(false);
    if (urls.length > 0) onUpload(multiple ? urls : urls[0]);
    if (inputRef.current) inputRef.current.value = '';
  }

  // Подписи вида «📷 Загрузить файл» остались от старой версии — эмодзи меняем на иконку.
  const text = String(label || '').replace(/📷/g, '').trim();
  return (
    <button type="button" className={`ed-btn ed-btn--sm ${text ? '' : 'ed-btn--icon'}`}
      title={text || 'Загрузить картинку'}
      onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }} disabled={busy}>
      <input ref={inputRef} type="file" accept="image/*" multiple={multiple}
        style={{ display: 'none' }} onClick={(e) => e.stopPropagation()} onChange={handleFiles} />
      {busy ? <span className="ed-spinner" /> : <EdIcon name="upload" size={14} />}
      {text && <span>{text}</span>}
    </button>
  );
}

// ─── Drag-to-reorder hook ───
function useDragReorder(items, resource) {
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);

  function getHandlers(item) {
    return {
      draggable: true,
      onDragStart: (e) => {
        setDragId(item.id);
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', item.id); } catch (err) {}
      },
      onDragOver: (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (overId !== item.id) setOverId(item.id); },
      onDragLeave: () => { if (overId === item.id) setOverId(null); },
      onDrop: (e) => {
        e.preventDefault();
        const fromId = dragId;
        setDragId(null); setOverId(null);
        if (fromId == null || fromId === item.id) return;
        const ordered = [...items];
        const from = ordered.findIndex(i => i.id === fromId);
        const to = ordered.findIndex(i => i.id === item.id);
        if (from < 0 || to < 0) return;
        const [moved] = ordered.splice(from, 1);
        ordered.splice(to, 0, moved);
        // Optimistic local update + persist sort_order
        if (resource.setItems) {
          resource.setItems(prev => {
            const map = {};
            ordered.forEach((it, idx) => { map[it.id] = idx; });
            return [...prev].sort((a, b) => (map[a.id] ?? 0) - (map[b.id] ?? 0));
          });
        }
        ordered.forEach((it, idx) => {
          if (it.sort_order !== idx) resource.update(it.id, { sort_order: idx });
        });
      },
      onDragEnd: () => { setDragId(null); setOverId(null); },
      className: `${dragId === item.id ? 'dragging' : ''} ${overId === item.id && dragId !== item.id ? 'drag-over' : ''}`,
    };
  }
  return { getHandlers, dragId, overId };
}

// ──────────────── universal edit/add modal ────────────────
// Одна форма на все разделы. Описание полей приходит из раздела:
//   { key, label, type: text|number|date|select|image|textarea, default,
//     required, min, max, options, placeholder,
//     half — поле в полстроки, hint — подсказка под полем,
//     group — подзаголовок перед полем }
// Список из нескольких коротких вариантов показывается переключателем,
// число с границами — ползунком, картинка — превью с загрузкой.
function edUseSegment(f) {
  const opts = f.options || [];
  if (f.segment === false) return false;
  if (f.segment === true) return true;
  const total = opts.reduce((s, o) => s + String(o.label).length, 0);
  return opts.length <= 5 && total <= 46;
}

function EdImageInput({ value, onChange }) {
  const [busy, setBusy] = useState(false);
  async function upload(files) {
    setBusy(true);
    const up = await window.uploadToStorage(files[0]);
    setBusy(false);
    if (up && up.url) onChange(up.url);
  }
  const name = value ? String(value).split('/').pop().split('?')[0] : '';
  return (
    <div className="ed-image-input">
      {value ? (
        <div className="ed-image-card">
          <EdThumb src={value} className="ed-image-card-thumb" />
          <div className="ed-image-card-meta">
            <span className="ed-mono ed-ellipsis" title={value}>{name.length > 60 ? 'картинка' : name}</span>
            <div className="ed-row">
              <EdDropzone compact onFiles={upload} busy={busy} label="Заменить" />
              <button type="button" className="ed-btn ed-btn--ghost ed-btn--sm" onClick={() => onChange('')}>
                <EdIcon name="close" size={13} /> Убрать
              </button>
            </div>
          </div>
        </div>
      ) : (
        <EdDropzone onFiles={upload} busy={busy} hint="JPG, PNG, WEBP или GIF" />
      )}
      <div className="ed-input-wrap">
        <EdIcon name="link" size={14} />
        <input className="ed-input ed-input--icon" type="text" value={value || ''}
          placeholder="…или вставь ссылку на картинку"
          onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

function EdFormControl({ f, value, onChange }) {
  const label = <>{f.label}{f.required && <span className="ed-req" title="Обязательное поле">*</span>}</>;

  if (f.type === 'select') {
    const opts = f.options || [];
    if (edUseSegment(f)) {
      return (
        <EdField plain label={label} hint={f.hint} half={f.half}>
          <EdSegment value={value ?? ''} options={opts} onChange={onChange} />
        </EdField>
      );
    }
    return (
      <EdField label={label} hint={f.hint} half={f.half}>
        <select className="ed-input ed-select" value={value ?? ''} onChange={e => onChange(e.target.value)}>
          {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </EdField>
    );
  }

  if (f.type === 'image') {
    return (
      <EdField plain label={label} hint={f.hint} half={f.half}>
        <EdImageInput value={value} onChange={onChange} />
      </EdField>
    );
  }

  if (f.type === 'textarea') {
    return (
      <EdField label={label} hint={f.hint} half={f.half}>
        <textarea className="ed-input ed-textarea" value={value || ''} rows={f.rows || 3}
          placeholder={f.placeholder || ''} onChange={e => onChange(e.target.value)} />
      </EdField>
    );
  }

  // Число с границами (прогресс 0–100, оттенок 0–360) — ползунок + поле.
  if (f.type === 'number' && f.min != null && f.max != null && f.max <= 360) {
    const n = Number(value) || 0;
    const pct = Math.max(0, Math.min(100, ((n - f.min) / (f.max - f.min)) * 100));
    const isHue = f.key === 'hue';
    return (
      <EdField plain label={label} hint={f.hint} half={f.half}>
        <div className="ed-range">
          <input type="range" min={f.min} max={f.max} step={f.step || 1} value={n}
            className={isHue ? 'ed-range-hue' : ''}
            style={{ '--p': pct + '%' }}
            onChange={e => onChange(parseInt(e.target.value) || 0)} />
          <div className="ed-range-num">
            {isHue && <span className="ed-swatch" style={{ background: `hsl(${n} 55% 50%)` }} />}
            <input type="number" className="ed-input ed-input--num" min={f.min} max={f.max} value={value ?? ''}
              onChange={e => onChange(parseInt(e.target.value) || 0)} />
            {f.max === 100 && !isHue && <span className="ed-unit">%</span>}
          </div>
        </div>
      </EdField>
    );
  }

  return (
    <EdField label={label} hint={f.hint} half={f.half}>
      <input
        className="ed-input"
        type={f.type || 'text'}
        value={value ?? ''}
        min={f.min}
        max={f.max}
        required={f.required}
        placeholder={f.placeholder || ''}
        onChange={e => onChange(f.type === 'number' ? (parseInt(e.target.value) || 0) : e.target.value)}
      />
    </EdField>
  );
}

function EditItemModal({ open, onClose, onSave, fields, values, title, lang }) {
  const [draft, setDraft] = useState({});
  const ru = lang !== 'en';

  useEffect(() => {
    if (open) {
      const init = {};
      fields.forEach(f => {
        init[f.key] = values ? (values[f.key] ?? f.default ?? '') : (f.default ?? '');
      });
      setDraft(init);
    }
  }, [open]);

  const missing = fields.filter(f => f.required && !String(draft[f.key] ?? '').trim());

  function handleSave() {
    if (missing.length) return;
    onSave({ ...draft });
    onClose();
  }

  if (!open) return null;

  return (
    <EditorModal open={true} onClose={onClose}
      eyebrow={values ? (ru ? 'редактирование' : 'edit') : (ru ? 'новая запись' : 'new')}
      title={title}
      footer={<>
        <span className="ed-foot-hint">{ru ? 'Ctrl + Enter — сохранить' : 'Ctrl + Enter to save'}</span>
        <button type="button" className="ed-btn ed-btn--ghost" onClick={onClose}>{ru ? 'Отмена' : 'Cancel'}</button>
        <button type="button" className="ed-btn ed-btn--primary" onClick={handleSave} disabled={missing.length > 0}
          title={missing.length ? (ru ? 'Заполни поля со звёздочкой' : 'Fill in required fields') : ''}>
          <EdIcon name="check" size={15} />
          {values ? (ru ? 'Сохранить' : 'Save') : (ru ? 'Добавить' : 'Add')}
        </button>
      </>}>
      <div className="ed-form"
        onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleSave(); } }}>
        {fields.map(f => (
          <React.Fragment key={f.key}>
            {f.group && <div className="ed-form-group">{f.group}</div>}
            <EdFormControl f={f} value={draft[f.key]}
              onChange={v => setDraft(prev => ({ ...prev, [f.key]: v }))} />
          </React.Fragment>
        ))}
      </div>
    </EditorModal>
  );
}

Object.assign(window, {
  RatLogo, BackgroundLayer, TopNav, PageHead,
  Editable, EditableNumber, Modal, FootOrnament, LoginModal, EditItemModal, ImageUploader, useDragReorder,
  EdIcon, EditorModal, EdField, EdSection, EdSegment, EdDropzone, ItemTools, DragHandle, EdThumb,
  EdDialogHost, askConfirm, askText, edNotice, edMediaKind,
  PreviewEditor, edMeasureRatio,
});
  