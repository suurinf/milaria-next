'use client';
import { useState, useEffect } from 'react';
import { useT, useSite } from '../ClientShell';
import type { PortfolioCategory, PortfolioImage } from '@/lib/types';

function Lightbox({ src, onClose, onPrev, onNext, current, total }: any) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
      if (e.key === 'ArrowRight' && onNext) onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onPrev, onNext]);
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.92)',
      backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out',
    }}>
      <img src={src} onClick={e => e.stopPropagation()} style={{ maxWidth: '92vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }} alt="" />
      {onPrev && <button onClick={e => { e.stopPropagation(); onPrev(); }} style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 48, height: 48, borderRadius: '50%', fontSize: 24, cursor: 'pointer' }}>‹</button>}
      {onNext && <button onClick={e => { e.stopPropagation(); onNext(); }} style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 48, height: 48, borderRadius: '50%', fontSize: 24, cursor: 'pointer' }}>›</button>}
      <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 40, height: 40, borderRadius: '50%', fontSize: 20, cursor: 'pointer' }}>×</button>
      {total > 1 && <span style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.5)', background: 'rgba(0,0,0,0.5)', padding: '6px 16px', borderRadius: 20 }}>{current + 1} / {total}</span>}
    </div>
  );
}

function CategoryGallery({ category, images, onClose }: { category: PortfolioCategory; images: PortfolioImage[]; onClose: () => void }) {
  const t = useT();
  const { lang } = useSite();
  const label = t.portfolio.categories[category.key as keyof typeof t.portfolio.categories] || category.key;
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9990, background: '#0c0a08', overflowY: 'auto' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 3, background: '#0c0a08', padding: '24px 32px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: 42, height: 42, borderRadius: '50%', fontSize: 20, cursor: 'pointer' }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>✦ {lang === 'ru' ? 'портфолио' : 'portfolio'}</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(24px,4vw,36px)', fontWeight: 500, margin: 0, color: '#fff' }}>{label}</h2>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.4)', padding: '6px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20 }}>
            {images.length} {lang === 'ru' ? 'работ' : 'pieces'}
          </span>
        </div>
      </div>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 32px 60px' }}>
        {images.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'rgba(255,255,255,0.3)' }}>
            {lang === 'ru' ? 'Скоро здесь появятся работы.' : 'Coming soon.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {images.map((img, i) => (
              <div key={img.id} onClick={() => setLightboxIdx(i)} style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', aspectRatio: '4/5', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.06)' }}>
                <img src={img.image_data} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" loading="lazy" />
              </div>
            ))}
          </div>
        )}
      </div>
      {lightboxIdx !== null && images[lightboxIdx] && (
        <Lightbox
          src={images[lightboxIdx].image_data}
          current={lightboxIdx} total={images.length}
          onClose={() => setLightboxIdx(null)}
          onPrev={lightboxIdx > 0 ? () => setLightboxIdx(lightboxIdx - 1) : null}
          onNext={lightboxIdx < images.length - 1 ? () => setLightboxIdx(lightboxIdx + 1) : null}
        />
      )}
    </div>
  );
}

export default function PortfolioContent({ categories, images }: { categories: PortfolioCategory[]; images: PortfolioImage[] }) {
  const t = useT();
  const [openCategory, setOpenCategory] = useState<PortfolioCategory | null>(null);
  const models = categories.filter(c => c.kind === 'model');
  const illustrations = categories.filter(c => c.kind === 'illustration');

  function imagesFor(catId: string) {
    return images.filter(i => i.category_id === catId).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }

  function coverFor(catId: string) {
    const imgs = imagesFor(catId);
    return imgs.find(i => i.is_cover) || imgs[0];
  }

  function renderCard(item: PortfolioCategory) {
    const label = t.portfolio.categories[item.key as keyof typeof t.portfolio.categories] || item.key;
    const cover = coverFor(item.id);
    const count = imagesFor(item.id).length;
    return (
      <div key={item.id} className="pf-card" style={{ '--hue': item.hue } as any} onClick={() => setOpenCategory(item)}>
        <div className="pf-card-img">
          {cover ? <img src={cover.image_data} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span className="pf-card-glyph">{label.charAt(0).toUpperCase()}</span>}
        </div>
        <div className="pf-card-info">
          <h3 className="pf-card-title">{label}</h3>
          <span className="pf-card-count">{count} {count === 1 ? 'piece' : 'pieces'}</span>
        </div>
      </div>
    );
  }

  return (
    <main className="shell">
      <section className="page-section">
        <div className="page-head">
          <span className="page-eyebrow">{t.portfolio.tag}</span>
          <h1 className="page-title">{t.portfolio.title}</h1>
        </div>

        <div className="section-label"><span className="dot"></span><span>{t.portfolio.models}</span></div>
        <div className="pf-grid">{models.map(renderCard)}</div>

        <div className="section-label" style={{ marginTop: 40 }}><span className="dot"></span><span>{t.portfolio.illustrations}</span></div>
        <div className="pf-grid">{illustrations.map(renderCard)}</div>
      </section>

      {openCategory && (
        <CategoryGallery category={openCategory} images={imagesFor(openCategory.id)} onClose={() => setOpenCategory(null)} />
      )}
    </main>
  );
}
