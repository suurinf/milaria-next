
// queue.jsx — Очередь заказов (в работе + выполнено)

const { useState: qState, useEffect: qEffect, useMemo: qMemo } = React;

// Format deadline range: "12.05 → 12.06.2026" or single date
// Приоритет заказа: высокий → средний → низкий.
// Ранг числом, чтобы сортировать; неуказанный считаем средним.
const PRIORITY_LEVELS = ['high', 'medium', 'low'];
const PRIORITY_META = {
  high:   { ru: 'Высокий', en: 'High',   rank: 3 },
  medium: { ru: 'Средний', en: 'Medium', rank: 2 },
  low:    { ru: 'Низкий',  en: 'Low',    rank: 1 },
};
function PRIORITY_RANK(item) {
  const m = PRIORITY_META[item && item.priority];
  return m ? m.rank : 2;
}
// Ключ даты для сортировки заказов в работе: дедлайн, иначе порядок добавления.
function qDateKey(item) {
  const d = item && (item.deadline_start || item.deadline_end);
  if (d) {
    const t = Date.parse(d);
    if (!isNaN(t)) return t;
  }
  // Без дедлайна — опираемся на sort_order, чтобы порядок был стабильным
  return -(item && item.sort_order != null ? item.sort_order : 9999);
}

// Сколько дней осталось до конца дедлайна.
// null — если дедлайн не указан или дата битая.
function daysLeft(item) {
  const d = item && (item.deadline_end || item.deadline_start);
  if (!d) return null;
  const end = new Date(d);
  if (isNaN(end)) return null;
  // Считаем по календарным дням, а не по часам: иначе «завтра» в 23:00
  // показалось бы как 0 дней.
  const today = new Date();
  end.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.round((end - today) / 86400000);
}

// Подпись «сколько осталось» с учётом русских склонений.
function deadlineLabel(item, lang) {
  const n = daysLeft(item);
  if (n === null) return null;
  const ru = lang === 'ru';
  if (n < 0) {
    const over = Math.abs(n);
    return { text: ru ? `просрочено на ${over} ${plural(over, 'день', 'дня', 'дней')}` : `${over}d overdue`, tone: 'over' };
  }
  if (n === 0) return { text: ru ? 'сегодня дедлайн' : 'due today', tone: 'soon' };
  if (n === 1) return { text: ru ? 'остался 1 день' : '1 day left', tone: 'soon' };
  return {
    text: ru ? `осталось ${n} ${plural(n, 'день', 'дня', 'дней')}` : `${n} days left`,
    tone: n <= 3 ? 'soon' : 'ok',
  };
}

// 1 день / 2 дня / 5 дней — иначе подпись читается коряво.
function plural(n, one, few, many) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}

// Ключ дедлайна для сортировки: чем меньше, тем срочнее.
// Заказы без дедлайна уходят в конец группы, а не наверх.
function deadlineKey(item) {
  const n = daysLeft(item);
  return n === null ? Infinity : n;
}

function fmtDeadline(start, end) {
  const fmt = (d) => {
    if (!d) return '';
    const date = new Date(d);
    if (isNaN(date)) return d;
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  if (start && end) return `${fmt(start)} → ${fmt(end)}`;
  if (end) return `→ ${fmt(end)}`;
  if (start) return `${fmt(start)} →`;
  return '';
}

// ───── one row (list layout) ─────
function QueueRow({ item, idx, t, lang, admin, onUpdate, onDelete, onEdit, barStyle, dragHandlers }) {
  // Secret items: show masked for regular users
  if (item.tag === 'secret' && !admin) {
    return <SecretRow idx={idx} t={t} item={item} />;
  }
  if (item.tag === 'secret' && admin) {
    return <SecretRow idx={idx} t={t} admin={true} onDelete={() => onDelete(item.id)} onEdit={onEdit} item={item} dragHandlers={dragHandlers} />;
  }
  const dh = dragHandlers || {};
  return (
    <div className={`q-row ${dh.className || ''}`}
      draggable={dh.draggable}
      onDragStart={dh.onDragStart} onDragOver={dh.onDragOver}
      onDragLeave={dh.onDragLeave} onDrop={dh.onDrop} onDragEnd={dh.onDragEnd}>
      {admin && <span className="drag-handle" title="Перетащить">⠿</span>}
      <div className="q-row-fill" data-style={barStyle} style={{ '--p': `${item.progress}%` }}></div>
      {item.tag && <span className={`q-tag ${item.tag}`}>{t.queue[item.tag]}</span>}
      {/* Приоритет показываем точкой у номера: высокий — красная, низкий — приглушённая */}
      {item.priority && item.priority !== 'medium' && (
        <span className={`q-priority ${item.priority}`}
          title={(lang === 'ru' ? 'Приоритет: ' : 'Priority: ') +
            (lang === 'ru' ? PRIORITY_META[item.priority].ru : PRIORITY_META[item.priority].en)}></span>
      )}
      <div className="q-num">{idx + 1}</div>
      <div className="q-title">
        <Editable
          value={item.title}
          onSave={(v) => onUpdate({ ...item, title: v })}
          admin={admin}
        />
        {(item.deadline_start || item.deadline_end) && (
          <div className="q-deadline">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {fmtDeadline(item.deadline_start, item.deadline_end)}
            {(() => {
              // Подпись «сколько осталось» — только у активных заказов.
              const dl = deadlineLabel(item, lang);
              return dl ? <span className={`q-days ${dl.tone}`}>{dl.text}</span> : null;
            })()}
          </div>
        )}
      </div>
      <div className="q-meta">
        <span className="q-progress-val">
          <EditableNumber
            value={item.progress}
            onSave={(v) => onUpdate({ ...item, progress: Math.max(0, Math.min(100, v)) })}
            admin={admin}
            suffix="%"
          />
        </span>
        <span className="q-progress-label">{t.queue.progress}</span>
      </div>
      {admin && (
        <div className="admin-actions" style={{ position: 'absolute', bottom: 4, right: 8 }}>
          <button className="admin-btn" onClick={() => onEdit && onEdit(item)} title="Edit">✎</button>
          <button className="admin-btn danger" onClick={() => onDelete(item.id)}>×</button>
        </div>
      )}
    </div>
  );
}

// ───── secret row (special) ─────
function SecretRow({ idx, t, admin, onDelete, onEdit, item, dragHandlers }) {
  const dh = dragHandlers || {};
  return (
    <div className={`q-row secret-row ${admin ? 'secret-admin' : ''} ${dh.className || ''}`}
      draggable={dh.draggable}
      onDragStart={dh.onDragStart} onDragOver={dh.onDragOver}
      onDragLeave={dh.onDragLeave} onDrop={dh.onDrop} onDragEnd={dh.onDragEnd}>
      {admin && <span className="drag-handle" title="Перетащить">⠿</span>}
      <div className="q-row-fill" style={{ '--p': item ? `${item.progress || 0}%` : '100%', background: 'rgba(212, 168, 90, 0.06)' }}></div>
      <div className="q-num">{idx + 1}</div>

      {/* Public view — always visible */}
      <div className="secret-public">
        <div className="q-title">— {t.queue.secret} —</div>
        <div className="q-meta">
          <span className="q-progress-val" style={{ color: 'var(--secret)' }}>?</span>
          <span className="q-progress-label">{t.queue.progress}</span>
        </div>
      </div>

      {/* Admin hover overlay — only rendered for admin, shown on hover */}
      {admin && item && (
        <div className="secret-reveal">
          <div className="q-title" style={{ color: 'var(--accent)' }}>{item.title || '—'}</div>
          <div className="q-meta">
            <span className="q-progress-val">{item.progress || 0}%</span>
            <span className="q-progress-label">{t.queue.progress}</span>
          </div>
          {item.status && <span className="q-tag" style={{ fontSize: 10 }}>{item.status}</span>}
        </div>
      )}

      {admin && item && (
        <div className="admin-actions" style={{ position: 'absolute', bottom: 4, right: 8, zIndex: 5 }}>
          {onEdit && <button className="admin-btn" onClick={() => onEdit(item)}>✎</button>}
          <button className="admin-btn danger" onClick={() => onDelete(item.id)}>×</button>
        </div>
      )}
    </div>
  );
}

// ───── completed row (list) ─────
function DoneRow({ item, idx, t, admin, onDelete, onEdit, dragHandlers }) {
  if (item.tag === 'secret') return <SecretRow idx={idx} t={t} admin={admin} onDelete={onDelete} onEdit={onEdit} item={item} dragHandlers={dragHandlers} />;
  const dh = dragHandlers || {};
  return (
    <div className={`q-row done ${item.image ? 'has-image' : ''} ${dh.className || ''}`}
      style={item.image ? { '--card-img': `url("${item.image}")` } : {}}
      draggable={dh.draggable}
      onDragStart={dh.onDragStart} onDragOver={dh.onDragOver}
      onDragLeave={dh.onDragLeave} onDrop={dh.onDrop} onDragEnd={dh.onDragEnd}>
      {admin && <span className="drag-handle" title="Перетащить">⠿</span>}
      <div className="q-row-fill"></div>
      {item.tag && <span className={`q-tag ${item.tag}`}>{t.queue[item.tag]}</span>}
      <div className="q-num">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto' }}>
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <div className="q-title">
        {item.title}
        {(item.deadline_start || item.deadline_end) && (
          <div className="q-deadline">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {fmtDeadline(item.deadline_start, item.deadline_end)}
          </div>
        )}
        {item.date && <div className="q-date">{t.queue.done}: {item.date}</div>}
      </div>
      <div className="q-meta">
        <span className="q-progress-val">100%</span>
        <span className="q-progress-label">{t.queue.ready}</span>
      </div>
      {admin && (
        <div className="admin-actions" style={{ position: 'absolute', bottom: 4, right: 8 }}>
          {onEdit && <button className="admin-btn" onClick={() => onEdit(item)}>✎</button>}
          <button className="admin-btn danger" onClick={() => onDelete(item.id)}>×</button>
        </div>
      )}
    </div>
  );
}

// ───── card layout ─────
function QueueCard({ item, idx, t, lang }) {
  const dl = deadlineLabel(item, lang);
  return (
    <div className="q-card">
      {item.tag && <span className={`q-tag ${item.tag}`}>{t.queue[item.tag]}</span>}
      <div className="q-card-head">
        <span className="q-card-num">{String(idx + 1).padStart(2, '0')}</span>
        {item.priority && item.priority !== 'medium' && (
          <span className={`q-priority-tag ${item.priority}`}>
            {lang === 'ru' ? PRIORITY_META[item.priority].ru : PRIORITY_META[item.priority].en}
          </span>
        )}
      </div>
      <div className="q-card-title">{item.title}</div>
      {(item.deadline_start || item.deadline_end) && (
        <div className="q-card-deadline">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span>{fmtDeadline(item.deadline_start, item.deadline_end)}</span>
          {dl && <span className={`q-days ${dl.tone}`}>{dl.text}</span>}
        </div>
      )}
      <div className="q-card-bar">
        <span style={{ width: `${item.progress}%` }}></span>
      </div>
      <div className="q-card-foot">
        <span>{t.queue.progress}</span>
        <span style={{ color: 'var(--accent)' }}>{item.progress}%</span>
      </div>
    </div>
  );
}

// ───── timeline layout ─────
function QueueTimeItem({ item, idx, t, done, lang }) {
  const dl = done ? null : deadlineLabel(item, lang);
  return (
    <div className={`q-time-item ${done ? 'done' : ''}`}>
      <div>
        <div className="q-time-num">№ {String(idx + 1).padStart(2, '0')}{item.date ? ` · ${item.date}` : ''}</div>
        <div className="q-time-title">{item.title}</div>
        {!done && (item.deadline_start || item.deadline_end) && (
          <div className="q-card-deadline">
            <span>{fmtDeadline(item.deadline_start, item.deadline_end)}</span>
            {dl && <span className={`q-days ${dl.tone}`}>{dl.text}</span>}
            {item.priority && item.priority !== 'medium' && (
              <span className={`q-priority-tag ${item.priority}`}>
                {lang === 'ru' ? PRIORITY_META[item.priority].ru : PRIORITY_META[item.priority].en}
              </span>
            )}
          </div>
        )}
        {!done && (
          <div className="q-time-bar">
            <span style={{ width: `${item.progress}%` }}></span>
          </div>
        )}
      </div>
      <div className="q-time-pct">{done ? '✓' : `${item.progress}%`}</div>
    </div>
  );
}

// ───── main section ─────
function QueueSection({ t, lang, admin, layout, barStyle }) {
  // Defaults blend in-progress and completed into one array with `kind`
  const queueDefaults = React.useMemo(() => [
    ...DEFAULT_QUEUE_IN_PROGRESS.map((q, i) => ({ ...q, kind: 'in_progress', sort_order: i })),
    ...DEFAULT_QUEUE_COMPLETED.map((q, i) => ({ ...q, kind: 'completed', completed_date: q.date === '—' ? null : q.date, sort_order: 100 + i })),
  ], []);
  const queue = useResource('queue_items', queueDefaults);
  const dragInProgress = useDragReorder(
    (queue.items || []).filter(i => i.kind === 'in_progress'),
    queue
  );
  const dragCompleted = useDragReorder(
    (queue.items || []).filter(i => i.kind === 'completed'),
    queue
  );
  const inProgress = React.useMemo(() => queue.items.filter(x => x.kind === 'in_progress'), [queue.items]);
  const completed = React.useMemo(
    () => queue.items.filter(x => x.kind === 'completed').map(x => ({ ...x, date: x.completed_date || '—' })),
    [queue.items]
  );

  const [query, setQuery] = qState('');
  const [filter, setFilter] = qState('all');
  const [sort, setSort]   = qState('progress');

  // Animate progress on mount: start from 0
  const [animated, setAnimated] = qState(false);
  qEffect(() => {
    const id = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const filteredInProgress = qMemo(() => {
    let arr = [...inProgress];
    if (query) arr = arr.filter(x => x.title.toLowerCase().includes(query.toLowerCase()));
    if (filter !== 'all') arr = arr.filter(x => x.tag === filter);
    if (sort === 'progress') arr.sort((a, b) => b.progress - a.progress);
    // Раньше «сначала новые» и «сначала старые» здесь не обрабатывались вовсе,
    // поэтому обе кнопки показывали один и тот же исходный порядок.
    // У заказов в работе нет даты завершения — ориентируемся на дедлайн,
    // а при его отсутствии на порядок добавления (sort_order).
    else if (sort === 'new') arr.sort((a, b) => qDateKey(b) - qDateKey(a));
    else if (sort === 'old') arr.sort((a, b) => qDateKey(a) - qDateKey(b));
    else if (sort === 'priority') arr.sort((a, b) => {
      // Сначала группируем по приоритету, а внутри группы наверх поднимаем
      // тех, у кого дедлайн ближе — иначе срочное терялось бы в середине.
      const p = PRIORITY_RANK(b) - PRIORITY_RANK(a);
      return p !== 0 ? p : deadlineKey(a) - deadlineKey(b);
    });
    return arr;
  }, [inProgress, query, filter, sort]);

  const filteredCompleted = qMemo(() => {
    let arr = [...completed];
    if (query) arr = arr.filter(x => x.title.toLowerCase().includes(query.toLowerCase()));
    if (filter !== 'all') arr = arr.filter(x => x.tag === filter);
    if (sort === 'new') arr.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    else if (sort === 'old') arr.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    else if (sort === 'priority') arr.sort((a, b) => {
      // Сначала группируем по приоритету, а внутри группы наверх поднимаем
      // тех, у кого дедлайн ближе — иначе срочное терялось бы в середине.
      const p = PRIORITY_RANK(b) - PRIORITY_RANK(a);
      return p !== 0 ? p : deadlineKey(a) - deadlineKey(b);
    });
    return arr;
  }, [completed, query, filter, sort]);

  function updateInProgress(updated) {
    queue.update(updated.id, { title: updated.title, progress: updated.progress, tag: updated.tag });
  }
  function deleteInProgress(id) {
    queue.remove(id);
  }
  const [editModal, setEditModal] = qState(null);

  const queueFields = qMemo(() => [
    { key: 'title', label: lang === 'ru' ? 'Название' : 'Title', type: 'text', required: true, default: '' },
    { key: 'progress', label: lang === 'ru' ? 'Прогресс (%)' : 'Progress (%)', type: 'number', min: 0, max: 100, default: 0 },
    { key: 'deadline_start', label: lang === 'ru' ? 'Дедлайн: начало' : 'Deadline: start', type: 'date', default: '' },
    { key: 'deadline_end', label: lang === 'ru' ? 'Дедлайн: конец' : 'Deadline: end', type: 'date', default: '' },
    { key: 'image', label: lang === 'ru' ? 'Картинка (для выполненных)' : 'Image (for completed)', type: 'image', default: '' },
    { key: 'tag', label: lang === 'ru' ? 'Тип' : 'Type', type: 'select', default: '', options: [
      { value: '', label: lang === 'ru' ? '— нет —' : '— none —' },
      { value: 'paid', label: lang === 'ru' ? 'Оплачено' : 'Paid' },
      { value: 'prepaid', label: lang === 'ru' ? 'Предоплата' : 'Prepaid' },
      { value: 'free', label: lang === 'ru' ? 'Бесплатно' : 'Free' },
      { value: 'secret', label: lang === 'ru' ? 'Секрет' : 'Secret' },
    ]},
    { key: 'kind', label: lang === 'ru' ? 'Статус' : 'Status', type: 'select', default: 'in_progress', options: [
      { value: 'in_progress', label: lang === 'ru' ? 'В работе' : 'In progress' },
      { value: 'completed', label: lang === 'ru' ? 'Готово' : 'Completed' },
    ]},
    { key: 'priority', label: lang === 'ru' ? 'Приоритет' : 'Priority', type: 'select', default: 'medium',
      options: PRIORITY_LEVELS.map(p => ({
        value: p, label: lang === 'ru' ? PRIORITY_META[p].ru : PRIORITY_META[p].en,
      })) },
  ], [lang]);

  function addInProgress() { setEditModal({ item: null, isNew: true }); }
  function editQueueItem(item) { setEditModal({ item, isNew: false }); }
  function handleSaveQueue(draft) {
    if (editModal.isNew) {
      queue.add({
        kind: draft.kind || 'in_progress',
        title: draft.title || 'New order',
        progress: draft.progress || 0,
        tag: draft.tag || null,
        deadline_start: draft.deadline_start || null,
        deadline_end: draft.deadline_end || null,
        image: draft.image || null,
          priority: draft.priority || 'medium',
        completed_date: draft.kind === 'completed' ? new Date().toISOString().slice(0, 10) : null,
      });
    } else {
      queue.update(editModal.item.id, {
        title: draft.title, progress: draft.progress,
        tag: draft.tag || null, kind: draft.kind,
        deadline_start: draft.deadline_start || null,
        deadline_end: draft.deadline_end || null,
        image: draft.image || null,
          priority: draft.priority || 'medium',
        completed_date: draft.kind === 'completed'
          ? (editModal.item.completed_date || new Date().toISOString().slice(0, 10))
          : null,
      });
    }
  }
  function deleteCompleted(id) {
    queue.remove(id);
  }

  // Pick layout
  function renderInProgress() {
    if (filteredInProgress.length === 0 && !admin) {
      return <div className="empty">{t.queue.empty}</div>;
    }
    if (layout === 'cards') {
      return (
        <div className="q-cards">
          {filteredInProgress.map((item, idx) => (
            <QueueCard key={item.id} item={animated ? item : { ...item, progress: 0 }} idx={idx} t={t} lang={lang} />
          ))}
        </div>
      );
    }
    if (layout === 'timeline') {
      return (
        <div className="q-timeline">
          {filteredInProgress.map((item, idx) => (
            <QueueTimeItem key={item.id} item={animated ? item : { ...item, progress: 0 }} idx={idx} t={t} lang={lang} />
          ))}
        </div>
      );
    }
    // list (default)
    return (
      <div className="q-list">
        {filteredInProgress.map((item, idx) => (
          <QueueRow
            lang={lang}
            key={item.id}
            item={animated ? item : { ...item, progress: 0 }}
            idx={idx}
            t={t}
            admin={admin}
            onUpdate={updateInProgress}
            onDelete={deleteInProgress}
            onEdit={editQueueItem}
            barStyle={barStyle}
            dragHandlers={admin ? dragInProgress.getHandlers(item) : null}
          />
        ))}
      </div>
    );
  }

  return (
    <section className="page anim-in">
      <PageHead
        eyebrow={`✦ ${t.queue.title} ✦`}
        title={t.queue.title}
        subtitle={t.queue.subtitle}
      />

      <div className="toolbar">
        <div className="search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder={t.queue.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="seg">
          {['all', 'paid', 'free'].map(f => (
            <button key={f} className={`seg-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {t.queue.filter[f]}
            </button>
          ))}
        </div>
        <div className="seg">
          {['progress', 'priority', 'new', 'old'].map(s => (
            <button key={s} className={`seg-btn ${sort === s ? 'active' : ''}`} onClick={() => setSort(s)}>
              {t.queue.sort[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="section-label">
        <span className="dot"></span>
        <span>{t.queue.inProgress}</span>
        <span style={{ color: 'var(--accent)' }}>{filteredInProgress.length}</span>
      </div>

      {renderInProgress()}

      {admin && (
        <button className="add-btn" onClick={addInProgress}>+ {t.queue.addNew}</button>
      )}

      {admin && editModal && (
        <EditItemModal
          open={true}
          onClose={() => setEditModal(null)}
          onSave={handleSaveQueue}
          fields={queueFields}
          values={editModal.item}
          title={editModal.isNew ? (lang === 'ru' ? 'Новый заказ' : 'New order') : (lang === 'ru' ? 'Редактировать' : 'Edit')}
          lang={lang}
        />
      )}

      <div className="section-label done" style={{ marginTop: 56 }}>
        <span className="dot"></span>
        <span>{t.queue.completed}</span>
        <span style={{ color: 'var(--ok)' }}>{filteredCompleted.length}</span>
      </div>

      {layout === 'cards' || layout === 'timeline' ? (
        <div className="q-timeline">
          {filteredCompleted.map((item, idx) => (
            <QueueTimeItem key={item.id} item={item} idx={idx} t={t} lang={lang} done />
          ))}
        </div>
      ) : (
        <div className="q-list">
          {filteredCompleted.map((item, idx) => (
            <DoneRow
              key={item.id}
              item={item}
              idx={idx}
              t={t}
              admin={admin}
              onDelete={deleteCompleted}
              onEdit={editQueueItem}
              dragHandlers={admin ? dragCompleted.getHandlers(item) : null}
            />
          ))}
        </div>
      )}
    </section>
  );
}

Object.assign(window, { QueueSection });

  