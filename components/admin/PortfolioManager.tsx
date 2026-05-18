'use client';
import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { upsertRow, deleteRow } from '@/app/admin/actions';
import type { PortfolioCategory, PortfolioImage } from '@/lib/types';

async function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1200;
        let w = img.width, h = img.height;
        if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
        if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PortfolioManager({
  categories, images,
}: { categories: PortfolioCategory[]; images: PortfolioImage[] }) {
  const router = useRouter();
  const [openCat, setOpenCat] = useState<PortfolioCategory | null>(null);
  const [editing, setEditing] = useState<{ row: any; isNew: boolean } | null>(null);
  const [pending, startTransition] = useTransition();

  async function saveCategory(draft: any) {
    startTransition(async () => {
      try {
        await upsertRow('portfolio_categories', draft);
        setEditing(null);
        router.refresh();
      } catch (e: any) { alert('Ошибка: ' + e.message); }
    });
  }

  async function deleteCategory(id: string) {
    if (!confirm('Удалить категорию и все её картинки?')) return;
    startTransition(async () => {
      try {
        await deleteRow('portfolio_categories', id);
        router.refresh();
      } catch (e: any) { alert('Ошибка: ' + e.message); }
    });
  }

  function imagesFor(catId: string) {
    return images.filter(i => i.category_id === catId).sort((a, b) => a.sort_order - b.sort_order);
  }

  function coverFor(catId: string) {
    const imgs = imagesFor(catId);
    return imgs.find(i => i.is_cover) || imgs[0];
  }

  return (
    <section className="page-section">
      <div className="page-head">
        <span className="page-eyebrow">✦ управление</span>
        <h1 className="page-title">Портфолио</h1>
      </div>

      <button className="add-btn" onClick={() => setEditing({ row: { kind: 'model', hue: 40 }, isNew: true })}>
        + Новая категория
      </button>

      <div className="pf-grid" style={{ marginTop: 20 }}>
        {categories.map(cat => {
          const cover = coverFor(cat.id);
          const count = imagesFor(cat.id).length;
          return (
            <div key={cat.id} className="pf-card" style={{ '--hue': cat.hue, position: 'relative' } as any}
              onClick={() => setOpenCat(cat)}>
              <div className="pf-card-img">
                {cover ? <img src={cover.image_data} alt={cat.key} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span className="pf-card-glyph">{cat.key.charAt(0).toUpperCase()}</span>}
              </div>
              <div className="pf-card-info">
                <h3 className="pf-card-title">{cat.key}</h3>
                <span className="pf-card-count">{count} {cat.kind === 'model' ? 'модель' : 'арт'}</span>
              </div>
              <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6 }}>
                <button className="admin-btn" onClick={e => { e.stopPropagation(); setEditing({ row: cat, isNew: false }); }}>✎</button>
                <button className="admin-btn danger" onClick={e => { e.stopPropagation(); deleteCategory(cat.id); }}>×</button>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <CategoryEditModal
          values={editing.row}
          isNew={editing.isNew}
          onClose={() => setEditing(null)}
          onSave={saveCategory}
          pending={pending}
        />
      )}

      {openCat && (
        <ImageManager
          category={openCat}
          images={imagesFor(openCat.id)}
          onClose={() => setOpenCat(null)}
        />
      )}
    </section>
  );
}

function CategoryEditModal({ values, isNew, onClose, onSave, pending }: any) {
  const [draft, setDraft] = useState({
    key: values.key || '',
    kind: values.kind || 'model',
    hue: values.hue || 40,
    video_url: values.video_url || '',
    sort_order: values.sort_order || 0,
    id: values.id,
  });
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg)', borderRadius: 16, padding: 28, maxWidth: 480, width: '100%', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 24, margin: '0 0 18px' }}>
          {isNew ? 'Новая категория' : 'Редактировать категорию'}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label className="login-field">
            <span>Название (ключ)</span>
            <input value={draft.key} onChange={e => setDraft({ ...draft, key: e.target.value })} />
          </label>
          <label className="login-field">
            <span>Вид</span>
            <select value={draft.kind} onChange={e => setDraft({ ...draft, kind: e.target.value })}>
              <option value="model">Модель</option>
              <option value="illustration">Иллюстрация</option>
            </select>
          </label>
          <label className="login-field">
            <span>Оттенок (0-360)</span>
            <input type="number" min={0} max={360} value={draft.hue} onChange={e => setDraft({ ...draft, hue: parseInt(e.target.value) || 0 })} />
          </label>
          <label className="login-field">
            <span>YouTube URL (опционально)</span>
            <input value={draft.video_url} onChange={e => setDraft({ ...draft, video_url: e.target.value })} />
          </label>
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

function ImageManager({ category, images, onClose }: { category: PortfolioCategory; images: PortfolioImage[]; onClose: () => void }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [pending, startTransition] = useTransition();

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    for (let i = 0; i < files.length; i++) {
      try {
        const dataUrl = await resizeImage(files[i]);
        await upsertRow('portfolio_images', {
          category_id: category.id,
          image_data: dataUrl,
          is_cover: images.length === 0 && i === 0,
          sort_order: images.length + i,
        });
      } catch (err: any) {
        alert('Ошибка загрузки: ' + err.message);
        break;
      }
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
    router.refresh();
  }

  async function addUrl() {
    if (!urlInput.trim()) return;
    setUploading(true);
    try {
      await upsertRow('portfolio_images', {
        category_id: category.id,
        image_data: urlInput.trim(),
        is_cover: images.length === 0,
        sort_order: images.length,
      });
      setUrlInput('');
      router.refresh();
    } catch (e: any) { alert('Ошибка: ' + e.message); }
    setUploading(false);
  }

  async function setCover(imgId: string) {
    startTransition(async () => {
      for (const img of images) {
        if (img.id === imgId && !img.is_cover) await upsertRow('portfolio_images', { ...img, is_cover: true });
        if (img.id !== imgId && img.is_cover) await upsertRow('portfolio_images', { ...img, is_cover: false });
      }
      router.refresh();
    });
  }

  async function delImage(imgId: string) {
    if (!confirm('Удалить картинку?')) return;
    startTransition(async () => {
      await deleteRow('portfolio_images', imgId);
      router.refresh();
    });
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9990, background: '#0c0a08', overflowY: 'auto' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 3, background: '#0c0a08', padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: 42, height: 42, borderRadius: '50%', fontSize: 20, cursor: 'pointer' }}>←</button>
          <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(20px,3vw,28px)', fontWeight: 500, margin: 0, color: '#fff', flex: 1 }}>{category.key}</h2>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.4)', padding: '6px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 20 }}>{images.length} работ</span>
          <input type="text" placeholder="Вставь URL" value={urlInput} onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addUrl(); }}
            style={{ padding: '9px 14px', borderRadius: 22, fontSize: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', minWidth: 200 }} />
          <button onClick={addUrl} disabled={!urlInput.trim() || uploading} style={{ background: 'var(--accent)', border: 'none', color: '#fff', padding: '10px 18px', borderRadius: 22, fontSize: 12, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>+ URL</button>
          <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px 18px', borderRadius: 22, fontSize: 12, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>
            <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFiles} />
            {uploading ? '⏳' : '📷'} Файл
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 32px 60px' }}>
        {images.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'rgba(255,255,255,0.3)' }}>
            Пока пусто. Загрузи картинки через URL или с компьютера.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {images.map(img => (
              <div key={img.id} style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', aspectRatio: '4/5', border: img.is_cover ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.06)' }}>
                <img src={img.image_data} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" loading="lazy" />
                {img.is_cover && (
                  <span style={{ position: 'absolute', top: 10, left: 10, fontSize: 10, padding: '3px 10px', borderRadius: 8, background: 'var(--accent)', color: '#fff', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>обложка</span>
                )}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10, background: 'linear-gradient(transparent, rgba(0,0,0,0.85))', display: 'flex', gap: 6, justifyContent: 'center' }}>
                  <button onClick={() => setCover(img.id)} disabled={pending} style={{ background: img.is_cover ? 'var(--accent)' : 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '6px 14px', borderRadius: 20, fontSize: 11, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>★ {img.is_cover ? 'Обложка' : 'В обложку'}</button>
                  <button onClick={() => delImage(img.id)} disabled={pending} style={{ background: 'rgba(220,50,50,0.3)', border: '1px solid rgba(220,50,50,0.3)', color: '#ff8888', padding: '6px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
