'use client';
import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { setSetting } from '@/app/admin/actions';

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

export default function BannerEditor({ initial }: { initial: any }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [cfg, setCfg] = useState({
    banner_month: initial.banner_month || '',
    banner_status: initial.banner_status || 'open',
    banner_video: initial.banner_video || '',
    banner_slots: Array.isArray(initial.banner_slots) ? initial.banner_slots : ['', '', '', ''],
  });

  function save(newCfg: any) {
    setCfg(newCfg);
    startTransition(async () => {
      try { await setSetting('banner', newCfg); router.refresh(); }
      catch (e: any) { alert('Ошибка: ' + e.message); }
    });
  }

  async function uploadToSlot(i: number, file: File) {
    try {
      const dataUrl = await resizeImage(file);
      const slots = [...cfg.banner_slots];
      slots[i] = dataUrl;
      save({ ...cfg, banner_slots: slots });
    } catch (e: any) { alert('Ошибка: ' + e.message); }
  }

  return (
    <section className="page-section">
      <div className="page-head">
        <span className="page-eyebrow">✦ управление</span>
        <h1 className="page-title">Баннер</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 600 }}>
        <label className="login-field">
          <span>Месяц (текст)</span>
          <input value={cfg.banner_month}
            placeholder="оставь пустым для автоматического"
            onChange={e => save({ ...cfg, banner_month: e.target.value })} />
        </label>

        <label className="login-field">
          <span>Статус</span>
          <select value={cfg.banner_status}
            onChange={e => save({ ...cfg, banner_status: e.target.value })}>
            <option value="open">🟢 Открыты</option>
            <option value="closed">🔴 Закрыты</option>
            <option value="waitlist">🟡 Лист ожидания</option>
          </select>
        </label>

        <label className="login-field">
          <span>YouTube видео (URL, опционально)</span>
          <input value={cfg.banner_video}
            placeholder="https://youtube.com/..."
            onChange={e => save({ ...cfg, banner_video: e.target.value })} />
        </label>

        <div>
          <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)', marginBottom: 10 }}>
            4 слота баннера (картинки)
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[0, 1, 2, 3].map(i => (
              <BannerSlot key={i} index={i} src={cfg.banner_slots[i]} cfg={cfg} save={save}
                onUpload={(file) => uploadToSlot(i, file)} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function BannerSlot({ index, src, cfg, save, onUpload }: any) {
  const fileRef = useRef<HTMLInputElement>(null);
  const isYT = src && (src.includes('youtube.com') || src.includes('youtu.be'));
  const ytId = isYT ? src.match(/(?:v=|youtu\.be\/|embed\/)([\w-]+)/)?.[1] : null;
  const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : src;

  return (
    <div style={{
      position: 'relative', aspectRatio: '16/10', borderRadius: 12, overflow: 'hidden',
      background: src ? 'none' : `linear-gradient(135deg, hsl(${30+index*18},50%,30%), hsl(${48+index*18},45%,20%))`,
      border: '1px solid rgba(255,255,255,0.1)',
    }}>
      {thumb && <img src={thumb} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />}
      <div style={{ position: 'absolute', top: 6, left: 6, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
        #{index + 1}
      </div>
      <div style={{ position: 'absolute', bottom: 6, right: 6, display: 'flex', gap: 4 }}>
        <button onClick={() => fileRef.current?.click()} style={{
          background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
          padding: '4px 10px', borderRadius: 16, fontSize: 11, fontFamily: 'var(--font-mono)', cursor: 'pointer',
        }}>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => e.target.files?.[0] && onUpload(e.target.files[0])} />
          📷
        </button>
        {src && <button onClick={() => {
          const slots = [...cfg.banner_slots]; slots[index] = '';
          save({ ...cfg, banner_slots: slots });
        }} style={{
          background: 'rgba(220,50,50,0.4)', border: '1px solid rgba(220,50,50,0.3)', color: '#ff8888',
          padding: '4px 10px', borderRadius: 16, fontSize: 11, cursor: 'pointer',
        }}>×</button>}
      </div>
    </div>
  );
}
