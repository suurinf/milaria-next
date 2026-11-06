
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

// ──────────────── inline-редактируемое поле ────────────────
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
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {setEditing(false);if (draft !== value) onSave(draft);}}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {setEditing(false);if (draft !== value) onSave(draft);}
          if (e.key === 'Escape') {setEditing(false);setDraft(value);}
        }} />);


  }
  return (
    <span
      className={className}
      onClick={() => setEditing(true)}
      style={{ cursor: 'text', outline: '1px dashed rgba(236,106,167,.25)', outlineOffset: '2px', borderRadius: 4 }}>
      {value || placeholder || '—'}</span>);

}

// ──────────────── editable number ────────────────
function EditableNumber({ value, onSave, admin, className, suffix }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const ref = useRef(null);
  useEffect(() => {setDraft(String(value));}, [value]);
  useEffect(() => {if (editing) ref.current?.focus();}, [editing]);

  if (!admin) return <span className={className}>{value}{suffix}</span>;
  if (editing) {
    return (
      <input
        ref={ref}
        type="number"
        className={`inline-input ${className || ''}`}
        value={draft}
        style={{ width: 80, display: 'inline-block' }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {setEditing(false);const n = parseInt(draft, 10) || 0;if (n !== value) onSave(n);}}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {setEditing(false);const n = parseInt(draft, 10) || 0;if (n !== value) onSave(n);}
          if (e.key === 'Escape') {setEditing(false);setDraft(String(value));}
        }} />);


  }
  return (
    <span
      className={className}
      onClick={() => setEditing(true)}
      style={{ cursor: 'text', outline: '1px dashed rgba(236,106,167,.25)', outlineOffset: '2px', borderRadius: 4 }}>
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
    <Modal open={true} onClose={onClose}>
      <div style={{ paddingRight: 40, maxWidth: 420 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.04em', color: 'var(--accent)', marginBottom: 8 }}>
          ✦ {lang === 'ru' ? 'админ' : 'admin'}
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 38, margin: '0 0 24px', fontWeight: 500 }}>
          {lang === 'ru' ? 'Вход в редактор' : 'Sign in to edit'}
        </h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label className="login-field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </label>
          <label className="login-field">
            <span>{lang === 'ru' ? 'Пароль' : 'Password'}</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {err && <div className="login-err">{err}</div>}
          <button type="submit" className="btn btn-primary" disabled={busy} style={{ marginTop: 6, justifyContent: 'center' }}>
            {busy ? (lang === 'ru' ? 'Входим…' : 'Signing in…') : (lang === 'ru' ? 'Войти' : 'Sign in')}
          </button>
        </form>
        <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 18, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
          {lang === 'ru'
            ? 'Зрители могут читать сайт без логина. Редактирование — только для админа.'
            : 'Viewers can read without login. Editing is admin-only.'}
        </p>
      </div>
    </Modal>
  );
}


// ──────────────── image uploader ────────────────
function ImageUploader({ onUpload, label, multiple }) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  async function handleFiles(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setBusy(true);
    const urls = [];
    for (const file of files) {
      const url = await window.uploadImage(file);
      if (url) urls.push(url);
    }
    setBusy(false);
    if (urls.length > 0) onUpload(multiple ? urls : urls[0]);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <button className="upload-btn" onClick={() => inputRef.current?.click()} disabled={busy}>
      <input ref={inputRef} type="file" accept="image/*" multiple={multiple}
        style={{ display: 'none' }} onChange={handleFiles} />
      {busy ? '⏳…' : (label || '📷')}
    </button>
  );
}

// ──────────────── universal edit/add modal ────────────────
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

function EditItemModal({ open, onClose, onSave, fields, values, title, lang }) {
  const [draft, setDraft] = useState({});

  useEffect(() => {
    if (open) {
      const init = {};
      fields.forEach(f => {
        init[f.key] = values ? (values[f.key] ?? f.default ?? '') : (f.default ?? '');
      });
      setDraft(init);
    }
  }, [open]);

  function handleSave() {
    onSave({ ...draft });
    onClose();
  }

  if (!open) return null;

  return (
    <Modal open={true} onClose={onClose}>
      <div style={{ maxWidth: 480, minWidth: 320 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.04em', color: 'var(--accent)', marginBottom: 8 }}>
          ✦ {values ? (lang === 'ru' ? 'редактировать' : 'edit') : (lang === 'ru' ? 'добавить' : 'add')}
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 32, margin: '0 0 20px', fontWeight: 500 }}>
          {title}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {fields.map(f => (
            <label key={f.key} className="login-field">
              <span>{f.label}</span>
              {f.type === 'select' ? (
                <select
                  value={draft[f.key] || ''}
                  onChange={e => setDraft(prev => ({...prev, [f.key]: e.target.value}))}
                  style={{ padding: '10px 14px', borderRadius: 'var(--r)', background: 'rgba(40,34,28,0.98)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: 14 }}>
                  {f.options.map(o => <option key={o.value} value={o.value} style={{ background: '#23201b', color: '#f0e9df' }}>{o.label}</option>)}
                </select>
              ) : f.type === 'image' ? (
                <div>
                  {draft[f.key] && (
                    <div style={{ marginBottom: 8, position: 'relative', display: 'inline-block' }}>
                      <img src={draft[f.key]} style={{ maxWidth: 120, maxHeight: 90, borderRadius: 8, objectFit: 'cover' }} alt="" />
                      <button className="admin-btn danger" style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, fontSize: 12 }}
                        onClick={() => setDraft(prev => ({ ...prev, [f.key]: '' }))}>×</button>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input type="text" value={draft[f.key] || ''} placeholder="URL картинки..."
                      onChange={e => setDraft(prev => ({ ...prev, [f.key]: e.target.value }))}
                      style={{ flex: 1 }} />
                    <ImageUploader label="📷" onUpload={url => setDraft(prev => ({ ...prev, [f.key]: url }))} />
                  </div>
                </div>
              ) : f.type === 'textarea' ? (
                <textarea
                  value={draft[f.key] || ''}
                  rows={3}
                  onChange={e => setDraft(prev => ({...prev, [f.key]: e.target.value}))}
                  style={{ padding: '10px 14px', borderRadius: 'var(--r)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: 14, resize: 'vertical' }}
                />
              ) : (
                <input
                  type={f.type || 'text'}
                  value={draft[f.key] ?? ''}
                  min={f.min}
                  max={f.max}
                  required={f.required}
                  placeholder={f.placeholder || ''}
                  onChange={e => {
                    const val = f.type === 'number' ? (parseInt(e.target.value) || 0) : e.target.value;
                    setDraft(prev => ({...prev, [f.key]: val}));
                  }}
                />
              )}
            </label>
          ))}
          <button className="btn btn-primary" onClick={handleSave} style={{ marginTop: 8, justifyContent: 'center' }}>
            {values
              ? (lang === 'ru' ? 'Сохранить' : 'Save')
              : (lang === 'ru' ? 'Добавить' : 'Add')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

Object.assign(window, {
  RatLogo, BackgroundLayer, TopNav, PageHead,
  Editable, EditableNumber, Modal, FootOrnament, LoginModal, EditItemModal, ImageUploader, useDragReorder,
});
  