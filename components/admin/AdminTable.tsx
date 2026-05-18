'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { upsertRow, deleteRow } from '@/app/admin/actions';

export type FieldDef = {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'select' | 'textarea';
  options?: { value: string; label: string }[];
  default?: any;
};

export default function AdminTable({
  table, rows, fields, title, idPrefix,
}: {
  table: string;
  rows: any[];
  fields: FieldDef[];
  title: string;
  idPrefix?: string; // for text-id tables (calc_options)
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<{ row: any | null; isNew: boolean } | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleSave(draft: any) {
    startTransition(async () => {
      try {
        // For text-id tables, generate id on create
        if (idPrefix && (!draft.id || editing?.isNew)) {
          draft.id = idPrefix + '-' + Date.now().toString(36);
        }
        await upsertRow(table, draft);
        setEditing(null);
        router.refresh();
      } catch (e: any) {
        alert('Ошибка: ' + e.message);
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить?')) return;
    startTransition(async () => {
      try {
        await deleteRow(table, id);
        router.refresh();
      } catch (e: any) {
        alert('Ошибка: ' + e.message);
      }
    });
  }

  return (
    <section className="page-section">
      <div className="page-head">
        <span className="page-eyebrow">✦ управление</span>
        <h1 className="page-title">{title}</h1>
      </div>

      <button className="add-btn" onClick={() => setEditing({ row: {}, isNew: true })} disabled={pending}>
        + Добавить
      </button>

      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map(row => (
          <div key={row.id} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: 14,
            background: 'rgba(255,255,255,0.03)', borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
              {fields.slice(0, 4).map(f => (
                <div key={f.key}>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
                    {f.label}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text)', marginTop: 2 }}>
                    {String(row[f.key] ?? '—').slice(0, 50)}
                  </div>
                </div>
              ))}
            </div>
            <button className="admin-btn" onClick={() => setEditing({ row, isNew: false })}>✎</button>
            <button className="admin-btn danger" onClick={() => handleDelete(row.id)}>×</button>
          </div>
        ))}
      </div>

      {editing && (
        <EditModal
          fields={fields}
          values={editing.row}
          isNew={editing.isNew}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          pending={pending}
        />
      )}
    </section>
  );
}

function EditModal({ fields, values, isNew, onClose, onSave, pending }: any) {
  const [draft, setDraft] = useState(() => {
    const init: any = { ...values };
    fields.forEach((f: FieldDef) => {
      if (init[f.key] === undefined) init[f.key] = f.default ?? '';
    });
    return init;
  });

  function update(key: string, val: any) {
    setDraft((d: any) => ({ ...d, [key]: val }));
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg)', borderRadius: 16, padding: 28, maxWidth: 500, width: '100%',
        border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 24, margin: '0 0 18px' }}>
          {isNew ? 'Добавить' : 'Редактировать'}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {fields.map((f: FieldDef) => (
            <label key={f.key} className="login-field">
              <span>{f.label}</span>
              {f.type === 'select' ? (
                <select value={draft[f.key] ?? ''} onChange={e => update(f.key, e.target.value)}>
                  {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea value={draft[f.key] ?? ''} rows={3} onChange={e => update(f.key, e.target.value)} />
              ) : (
                <input type={f.type || 'text'} value={draft[f.key] ?? ''}
                  onChange={e => update(f.key, f.type === 'number' ? (parseInt(e.target.value) || 0) : e.target.value)} />
              )}
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button className="btn" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Отмена</button>
          <button className="btn btn-primary" disabled={pending} onClick={() => onSave(draft)} style={{ flex: 1, justifyContent: 'center' }}>
            {pending ? '...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}
