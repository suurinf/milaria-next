
const { useState: pfState, useEffect: pfEffect, useRef: pfRef, useMemo: pfMemo } = React;

// ══════════════════════════════════════════════════════════
//  Portfolio — folders of artwork with media manager
// ══════════════════════════════════════════════════════════

// ── Resolve any media URL to something displayable as a cover ──
// YouTube link -> its thumbnail; video file -> the file (first frame); otherwise the image itself.
function pfResolveCover(url) {
  if (!url) return { type: 'none' };
  const clean = String(url).split('?')[0].toLowerCase();
  if (String(url).includes('youtube.com') || String(url).includes('youtu.be')) {
    const id = (String(url).match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]+)/) || [])[1];
    return id
      ? { type: 'youtube', thumb: `https://img.youtube.com/vi/${id}/hqdefault.jpg` }
      : { type: 'none' };
  }
  if (/\.(mp4|webm|mov|m4v)$/.test(clean)) return { type: 'video', src: String(url) };
  return { type: 'image', thumb: String(url) };
}

// ── Loading placeholder ──
// portfolio_images are deliberately kept out of the server snapshot (too heavy),
// so they always arrive over the network. Until then the grid used to render the
// "Скоро здесь появятся работы" empty-state — telling visitors the gallery was
// empty when it was merely still loading.
function GallerySkeleton({ count = 8 }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
      gap: 16,
    }} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton skeleton-tile"
          style={{ aspectRatio: '1 / 1', borderRadius: 'var(--radius-card, 14px)', animationDelay: `${i * 60}ms` }} />
      ))}
    </div>
  );
}

// ── Fullscreen lightbox for a single image ──
function Lightbox({ src, onClose, onPrev, onNext, current, total }) {
  pfEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
      if (e.key === 'ArrowRight' && onNext) onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const media = pfResolveCover(src);
  const isYT = media.type === 'youtube';
  const isVid = media.type === 'video';
  const ytId = isYT ? (String(src).match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]+)/) || [])[1] : null;

  return ReactDOM.createPortal(
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'zoom-out',
    }}>
      {isYT && ytId ? (
        <iframe onClick={e => e.stopPropagation()}
          width="900" height="506"
          src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
          title="video" frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ maxWidth: '92vw', maxHeight: '85vh', aspectRatio: '16/9', borderRadius: 8, cursor: 'default', boxShadow: '0 20px 80px rgba(0,0,0,0.6)' }}
        />
      ) : isVid ? (
        <video src={src} onClick={e => e.stopPropagation()} controls autoPlay loop playsInline style={{
          maxWidth: '92vw', maxHeight: '90vh', objectFit: 'contain',
          borderRadius: 8, cursor: 'default',
          boxShadow: '0 20px 80px rgba(0,0,0,0.6)',
        }} />
      ) : (
        <img src={src} onClick={e => e.stopPropagation()} style={{
          maxWidth: '92vw', maxHeight: '90vh', objectFit: 'contain',
          borderRadius: 8, cursor: 'default',
          boxShadow: '0 20px 80px rgba(0,0,0,0.6)',
        }} alt="" />
      )}

      {onPrev && <button onClick={e => { e.stopPropagation(); onPrev(); }} style={{
        position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)',
        background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
        width: 48, height: 48, borderRadius: '50%', fontSize: 24, cursor: 'pointer',
      }}>‹</button>}

      {onNext && <button onClick={e => { e.stopPropagation(); onNext(); }} style={{
        position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
        background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
        width: 48, height: 48, borderRadius: '50%', fontSize: 24, cursor: 'pointer',
      }}>›</button>}

      <button onClick={onClose} style={{
        position: 'absolute', top: 20, right: 20,
        background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
        width: 40, height: 40, borderRadius: '50%', fontSize: 20, cursor: 'pointer',
      }}>×</button>

      {total > 1 && <span style={{
        position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.5)',
        background: 'rgba(0,0,0,0.5)', padding: '6px 16px', borderRadius: 20,
      }}>{current + 1} / {total}</span>}
    </div>,
    document.body
  );
}

// ── Category gallery (folder view — works for both public and admin) ──
function CategoryGallery({ category, images, imagesRes, t, lang, admin, onClose }) {
  const label = t.portfolio.categories[category.key] || category.key;
  const [sortMode, setSortMode] = pfState('new');
  const catImages = pfMemo(() => {
    const list = images.filter(img => img.category_id === category.id)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    return sortMode === 'old' ? [...list].reverse() : list;
  }, [images, category.id, sortMode]);
  const [lightboxIdx, setLightboxIdx] = pfState(null);
  const [uploading, setUploading] = pfState(false);
  const [urlInput, setUrlInput] = pfState('');
  const fileRef = pfRef(null);
  const dragImgs = useDragReorder(catImages, imagesRes);

  function isYouTube(url) {
    return typeof url === 'string' && (url.includes('youtube.com') || url.includes('youtu.be'));
  }
  function ytId(url) { return (String(url).match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]+)/) || [])[1]; }
  function ytThumb(url) { const id = ytId(url); return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null; }
  function minSort() {
    const all = images.filter(img => img.category_id === category.id);
    return all.length ? Math.min(...all.map(i => i.sort_order || 0)) : 0;
  }

  async function addUrl() {
    if (!urlInput.trim()) return;
    if (String(category.id).startsWith('def-')) {
      edNotice('Категория ещё загружается', 'Подожди пару секунд и попробуй снова.');
      return;
    }
    setUploading(true);
    const result = await imagesRes.add({
      category_id: category.id,
      image_data: urlInput.trim(),
      is_cover: catImages.length === 0,
      sort_order: minSort() - 1,
    });
    setUploading(false);
    if (result) setUrlInput('');
    else edNotice('Не удалось добавить', 'Проверь ссылку.');
  }

  async function migrateToStorage() {
    const base64imgs = catImages.filter(i => typeof i.image_data === 'string' && i.image_data.startsWith('data:'));
    if (!base64imgs.length) { edNotice('Нет старых картинок для переноса'); return; }
    if (!(await askConfirm('Это займёт несколько секунд.', { title: `Перенести ${base64imgs.length} картинок в быстрое хранилище?`, okText: 'Перенести' }))) return;
    setUploading(true);
    let done = 0, failed = 0;
    for (const img of base64imgs) {
      try {
        const blob = await (await fetch(img.image_data)).blob();
        const file = new File([blob], 'img.jpg', { type: blob.type || 'image/jpeg' });
        const up = await window.uploadToStorage(file);
        if (up) { await imagesRes.update(img.id, { image_data: up.url, thumb_data: up.thumb }); done++; }
        else failed++;
      } catch (e) { failed++; }
    }
    setUploading(false);
    edNotice('Готово', `Перенесено: ${done}${failed ? ', ошибок: ' + failed : ''}`);
  }

  function handleUpload(e) {
    const files = Array.from(e.target.files || []);
    if (fileRef.current) fileRef.current.value = '';
    return uploadFiles(files);
  }
  async function uploadFiles(files) {
    if (!files.length) return;
    // Sanity check: category must be a real Supabase row (UUID)
    if (String(category.id).startsWith('def-')) {
      edNotice('Категория ещё загружается', 'Дождись загрузки данных с сервера (несколько секунд) и попробуй снова.');
      return;
    }
    setUploading(true);
    let base = minSort();
    const empty = catImages.length === 0;
    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx];
      const up = await window.uploadToStorage(file);
      if (!up) break;
      const result = await imagesRes.add({
        category_id: category.id,
        image_data: up.url,
        thumb_data: up.thumb,
        is_cover: empty && idx === 0,
        sort_order: base - 1 - idx,
      });
      if (!result) {
        edNotice('Не удалось записать в базу', 'Картинка загружена в хранилище, но в карточку не добавилась.');
        break;
      }
    }
    setUploading(false);
  }

  function setCover(imgId) {
    catImages.forEach(img => {
      if (img.id === imgId && !img.is_cover) imagesRes.update(img.id, { is_cover: true });
      if (img.id !== imgId && img.is_cover) imagesRes.update(img.id, { is_cover: false });
    });
  }

  function deleteImage(imgId) {
    const img = catImages.find(i => i.id === imgId);
    imagesRes.remove(imgId);
    if (img?.is_cover && catImages.length > 1) {
      const next = catImages.find(i => i.id !== imgId);
      if (next) imagesRes.update(next.id, { is_cover: true });
    }
  }

  return ReactDOM.createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9990,
      background: '#0c0a08',
      overflowY: 'auto',
    }}>
      {/* ── Top bar ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 3,
        background: 'linear-gradient(180deg, #0c0a08 60%, transparent)',
        padding: '24px 32px 40px',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff', width: 42, height: 42, borderRadius: '50%', fontSize: 20,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background .15s',
          }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
             onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}>
            ←
          </button>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em',
              color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 4,
            }}>✦ {lang === 'ru' ? 'портфолио' : 'portfolio'}</div>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontStyle: 'italic',
              fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 500, margin: 0, color: '#fff',
            }}>{label}</h2>
          </div>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.4)',
            padding: '6px 14px', background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20,
          }}>
            {catImages.length} {lang === 'ru' ? 'работ' : 'pieces'}
          </span>
          {catImages.length > 1 && (
            <button onClick={() => setSortMode(m => m === 'new' ? 'old' : 'new')} style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.6)',
              padding: '6px 14px', background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}>
              {sortMode === 'new' ? (lang === 'ru' ? '↓ новые' : '↓ newest') : (lang === 'ru' ? '↑ старые' : '↑ oldest')}
            </button>
          )}
        </div>
        {admin && (
          <div className="pf-admin-toolbar">
            <span className="ed-bar-pill">{lang === 'ru' ? 'редактор галереи' : 'gallery editor'}</span>
            <div className="ed-input-wrap" style={{ flex: 1, minWidth: 220 }}>
              <EdIcon name="link" size={14} />
              <input className="ed-input ed-input--icon"
                placeholder={lang === 'ru' ? 'Ссылка на картинку или YouTube' : 'Image or YouTube URL'}
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addUrl(); }} />
            </div>
            <button className="ed-btn" onClick={addUrl} disabled={uploading || !urlInput.trim()}>
              <EdIcon name="plus" size={14} /> {lang === 'ru' ? 'По ссылке' : 'Add URL'}
            </button>
            <button className="ed-btn ed-btn--primary" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <span className="ed-spinner" /> : <EdIcon name="upload" size={14} />}
              {lang === 'ru' ? 'Загрузить файлы' : 'Upload files'}
            </button>
            <input ref={fileRef} type="file" accept="image/*,.gif,video/mp4,video/webm" multiple style={{ display: 'none' }} onChange={handleUpload} />
            {catImages.some(i => typeof i.image_data === 'string' && i.image_data.startsWith('data:')) && (
              <button className="ed-btn ed-btn--accent" onClick={migrateToStorage} disabled={uploading}
                title="Перенести старые картинки в быстрое хранилище">
                <EdIcon name="sparkle" size={14} /> {lang === 'ru' ? 'Ускорить' : 'Speed up'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Image grid ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 32px 60px' }}>
        {!imagesRes.loaded && catImages.length === 0 ? (
          <GallerySkeleton />
        ) : catImages.length === 0 && admin ? (
          <EdDropzone className="pf-drop-empty" multiple busy={uploading}
            accept="image/*,.gif,video/mp4,video/webm"
            onFiles={uploadFiles}
            label={lang === 'ru' ? 'Карточка пока пустая — добавь первые работы' : 'Empty — add the first works'}
            hint={lang === 'ru' ? 'Перетащи файлы сюда или нажми. Первая станет обложкой.' : 'Drop files or click. The first becomes the cover.'} />
        ) : catImages.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 20px',
            color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-body)', fontSize: 15,
          }}>
            {admin
              ? (lang === 'ru' ? 'Пока пусто. Нажми «Загрузить» чтобы добавить арты.' : 'Empty. Click Upload to add artwork.')
              : (lang === 'ru' ? 'Скоро здесь появятся работы.' : 'Coming soon.')}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
          }}>
            {catImages.map((img, i) => {
              const isCover = img.is_cover;
              const media = pfResolveCover(img.image_data);
              const isYT = media.type === 'youtube';
              const isVid = media.type === 'video';
              // thumb_data is the light 500px copy; for GIFs it equals the original so it stays animated
              const thumb = isYT ? media.thumb : (img.thumb_data || img.image_data);
              const dh = admin ? dragImgs.getHandlers(img) : {};
              return (
                <div key={img.id} className={dh.className || ''} style={{
                  position: 'relative', borderRadius: 14, overflow: 'hidden',
                  aspectRatio: '4/5', cursor: 'pointer',
                  border: isCover ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.06)',
                  transition: 'transform .2s, box-shadow .2s',
                }}
                  draggable={dh.draggable}
                  onDragStart={dh.onDragStart} onDragOver={dh.onDragOver}
                  onDragLeave={dh.onDragLeave} onDrop={dh.onDrop} onDragEnd={dh.onDragEnd}
                  onClick={() => setLightboxIdx(i)}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                >
                  <div className="pf-gal-imgwrap">
                    {isVid ? (
                      <video className="pf-gal-photo" src={img.image_data} muted playsInline preload="metadata"
                        style={{ objectFit: 'cover' }} />
                    ) : (
                      <>
                        <div className="pf-gal-blur" style={{ backgroundImage: `url("${thumb}")` }} />
                        <img
                          src={thumb}
                          /* Two real files exist (500px thumb + 1600px full) — let the
                             browser pick. Skipped when both point at the same file,
                             which is the case for GIFs. */
                          srcSet={(!isYT && img.thumb_data && img.image_data && img.thumb_data !== img.image_data)
                            ? `${img.thumb_data} 500w, ${img.image_data} 1600w`
                            : undefined}
                          sizes="(max-width: 600px) 45vw, (max-width: 1100px) 30vw, 260px"
                          className="pf-gal-photo" alt="" loading="lazy" decoding="async" />
                      </>
                    )}
                  </div>
                  {(isYT || isVid) && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                      <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.8)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><polygon points="6 4 20 12 6 20 6 4"/></svg>
                      </div>
                    </div>
                  )}
                  {admin && <DragHandle style={{ top: 8, left: 8, transform: 'none', zIndex: 12, background: 'rgba(16,11,7,0.7)' }} />}

                  {/* Cover badge */}
                  {isCover && (
                    <span style={{
                      position: 'absolute', bottom: 10, left: 10, zIndex: 11,
                      fontSize: 10, padding: '3px 10px', borderRadius: 8,
                      background: 'var(--accent)', color: '#1a1410',
                      fontFamily: 'var(--font-mono)', letterSpacing: '0.08em',
                      textTransform: 'uppercase', fontWeight: 600,
                    }}>обложка</span>
                  )}

                  {/* Admin controls — always visible */}
                  {admin && (
                    <ItemTools className="pf-img-tools" style={{ position: 'absolute', top: 8, right: 8, zIndex: 15 }}
                      extra={
                        <button type="button" className={`ed-tool ${isCover ? 'on' : ''}`}
                          title={isCover ? 'Это обложка' : 'Сделать обложкой'}
                          onClick={e => { e.stopPropagation(); setCover(img.id); }}>
                          <EdIcon name="star" size={14} />
                        </button>
                      }
                      onDelete={() => deleteImage(img.id)}
                      deleteText={isCover ? 'Удалить работу? Это обложка карточки — обложкой станет следующая.' : 'Удалить работу из карточки?'} />
                  )}
                </div>
              );
            })}

            {/* Плитка загрузки — можно перетащить сюда сразу несколько файлов */}
            {admin && (
              <EdDropzone className="pf-drop-tile" multiple busy={uploading}
                accept="image/*,.gif,video/mp4,video/webm"
                onFiles={uploadFiles}
                label={lang === 'ru' ? 'Добавить работы' : 'Add works'}
                hint={lang === 'ru' ? 'Перетащи файлы сюда или нажми' : 'Drop files or click'} />
            )}
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightboxIdx !== null && catImages[lightboxIdx] && (
        <Lightbox
          src={catImages[lightboxIdx].image_data}
          current={lightboxIdx}
          total={catImages.length}
          onClose={() => setLightboxIdx(null)}
          onPrev={lightboxIdx > 0 ? () => setLightboxIdx(lightboxIdx - 1) : null}
          onNext={lightboxIdx < catImages.length - 1 ? () => setLightboxIdx(lightboxIdx + 1) : null}
        />
      )}
    </div>,
    document.body
  );
}

// ── Coverflow (top-level so React keeps it mounted → smooth animation) ──
function CoverflowRow({ catItems, idx, setIdx, openCategory, setOpenCategory, admin, lang, t, getCoverSrc, getCatCount, setPfEdit, pfRes }) {
  const total = catItems.length;
  const swipeRef = pfRef(null);

  pfEffect(() => {
    if (idx >= total && total > 0) setIdx(0);
  }, [total]);

  pfEffect(() => {
    const handler = (e) => {
      if (openCategory) return;
      if (e.key === 'ArrowLeft') setIdx(i => (i - 1 + total) % total);
      if (e.key === 'ArrowRight') setIdx(i => (i + 1) % total);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [total, openCategory]);

  if (total === 0) return null;
  const prev = () => setIdx(i => (i - 1 + total) % total);
  const next = () => setIdx(i => (i + 1) % total);

  // Keyboard already had arrows; touch had nothing, so on a phone the carousel
  // could only be moved by hitting the small side cards.
  function onTouchStart(e) {
    const t = e.touches[0];
    swipeRef.current = { x: t.clientX, y: t.clientY, done: false };
  }
  function onTouchMove(e) {
    const s = swipeRef.current;
    if (!s || s.done || total < 2) return;
    const t = e.touches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    // Claim only clearly horizontal movement so the page still scrolls.
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      dx < 0 ? next() : prev();
      s.done = true;
    }
  }
  function onTouchEnd() { swipeRef.current = null; }

  return (
    <div className="pf-coverflow-outer"
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div className="pf-coverflow">
        {catItems.map((item, i) => {
          const offset = ((i - idx) % total + total) % total;
          const normOffset = offset > total / 2 ? offset - total : offset;
          const abs = Math.abs(normOffset);
          if (abs > 2) return null;

          const isCenter = normOffset === 0;
          const side = normOffset > 0 ? 1 : -1;
          const coverSrc = getCoverSrc(item.id);
          const cover = pfResolveCover(coverSrc);
          const count = getCatCount(item.id) || item.count || 0;

          let transform, zIndex, opacity, pointerEvents;
          if (isCenter) {
            transform = 'translateX(0) scale(1) rotateY(0deg)';
            zIndex = 10; opacity = 1; pointerEvents = 'auto';
          } else if (abs === 1) {
            transform = `translateX(${side * 52}%) scale(0.82) rotateY(${-side * 18}deg)`;
            zIndex = 5; opacity = 0.75; pointerEvents = 'auto';
          } else {
            transform = `translateX(${side * 88}%) scale(0.65) rotateY(${-side * 30}deg)`;
            zIndex = 2; opacity = 0.4; pointerEvents = 'none';
          }

          return (
            <div key={item.id} className={`pf-cover-card ${isCenter ? 'active' : ''}`}
              style={{ transform, zIndex, opacity, pointerEvents, transition: 'transform 0.45s cubic-bezier(.25,.8,.25,1), opacity 0.45s ease' }}
              onClick={() => { if (isCenter) setOpenCategory(item); else setIdx(i); }}>
              <div className="pf-cover-img">
                {cover.type === 'image' || cover.type === 'youtube' ? (
                  <>
                    {/* Blurred fill background */}
                    <div className="pf-cover-blur" style={{ backgroundImage: `url("${cover.thumb}")` }} />
                    {/* Full image (contain) */}
                    <img src={cover.thumb} alt={item.key} className="pf-cover-photo" loading="lazy" decoding="async" />
                    {cover.type === 'youtube' && <span className="pf-cover-play">▶</span>}
                  </>
                ) : cover.type === 'video' ? (
                  <>
                    <video className="pf-cover-photo" src={cover.src} muted playsInline preload="metadata"
                      style={{ objectFit: 'cover' }} />
                    <span className="pf-cover-play">▶</span>
                  </>
                ) : (
                  <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, hsl(${item.hue},60%,30%), hsl(${item.hue+30},50%,20%))`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 48, fontFamily: 'var(--font-display)', color: 'rgba(255,255,255,.3)' }}>{item.key[0]?.toUpperCase()}</span>
                  </div>
                )}
              </div>
              <div className="pf-cover-info">
                {item.emoji && <span className="pf-cover-emoji">{item.emoji}</span>}
                <h3 className="pf-cover-title">{t.portfolio.categories[item.key] || item.key}</h3>
                <span className="pf-cover-count">{count} {lang === 'ru' ? 'работ' : 'works'}</span>
              </div>
              {isCenter && (
                <div className="pf-cover-open-hint">{lang === 'ru' ? 'Открыть галерею →' : 'Open gallery →'}</div>
              )}
              {admin && isCenter && (
                <ItemTools style={{ position: 'absolute', top: 10, right: 10, zIndex: 20 }}
                  onEdit={() => setPfEdit({ item, isNew: false })}
                  onDelete={() => pfRes.remove(item.id)}
                  deleteText={`Удалить категорию «${t.portfolio.categories[item.key] || item.key}»? Работы внутри перестанут показываться.`} />
              )}
            </div>
          );
        })}
      </div>

      {total > 1 && (
        <>
          <button className="pf-side-arrow pf-side-left" onClick={prev} aria-label="Previous">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="15 18 9 12 15 6"/></svg>
            <span>{catItems[(idx - 1 + total) % total] ? (t.portfolio.categories[catItems[(idx - 1 + total) % total].key] || catItems[(idx - 1 + total) % total].key) : ''}</span>
          </button>
          <button className="pf-side-arrow pf-side-right" onClick={next} aria-label="Next">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="9 18 15 12 9 6"/></svg>
            <span>{catItems[(idx + 1) % total] ? (t.portfolio.categories[catItems[(idx + 1) % total].key] || catItems[(idx + 1) % total].key) : ''}</span>
          </button>
        </>
      )}
      {total > 1 && (
        <div className="pf-coverflow-dots">
          {catItems.map((_, i) => (
            <span key={i} className={i === idx ? 'on' : ''} onClick={() => setIdx(i)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Section ──
function PortfolioSection({ t, admin, lang }) {
  const pfDefaults = pfMemo(() => [
    ...DEFAULT_PORTFOLIO.models.map((m, i) => ({ id: 'def-m-'+i, key: m.key, kind: 'model', count: m.count, hue: m.hue, sort_order: i })),
    ...DEFAULT_PORTFOLIO.illustrations.map((m, i) => ({ id: 'def-i-'+i, key: m.key, kind: 'illustration', count: m.count, hue: m.hue, sort_order: i + 100 })),
  ], []);
  const pfRes = useResource('portfolio_categories', pfDefaults);
  const imagesRes = useResource('portfolio_images', [], { noCache: true });
  const allImages = Array.isArray(imagesRes.items) ? imagesRes.items : [];

  const [openCategory, setOpenCategory] = pfState(null);
  const [pfEdit, setPfEdit] = pfState(null);
  const [coverIdx, setCoverIdx] = pfState(0);

  const pfFields = pfMemo(() => [
    { key: 'key', label: lang === 'ru' ? 'Название' : 'Name', type: 'text', required: true, default: '' },
    { key: 'emoji', label: lang === 'ru' ? 'Эмодзи' : 'Emoji', type: 'text', default: '', half: true, placeholder: '✨',
      hint: lang === 'ru' ? 'Появляется при наведении на карточку.' : 'Shown on hover.' },
    { key: 'kind', label: lang === 'ru' ? 'Вид' : 'Kind', type: 'select', default: 'model', half: true, options: [
      { value: 'model', label: lang === 'ru' ? 'Модель' : 'Model' },
      { value: 'illustration', label: lang === 'ru' ? 'Иллюстрация' : 'Illustration' },
    ]},
    { key: 'hue', label: lang === 'ru' ? 'Оттенок карточки' : 'Card hue', type: 'number', min: 0, max: 360, default: 40,
      hint: lang === 'ru' ? 'Цвет подложки, пока обложка не загрузилась.' : 'Background tint while the cover loads.' },
    { key: 'video_url', label: 'YouTube', type: 'text', default: '', placeholder: 'https://youtube.com/watch?v=...' },
  ], [lang]);

  function handleSavePf(draft) {
    if (pfEdit.isNew) pfRes.add({ key: draft.key, emoji: draft.emoji || '', kind: draft.kind || 'model', hue: draft.hue || 40, video_url: draft.video_url || '' });
    else pfRes.update(pfEdit.item.id, { ...draft, emoji: draft.emoji || '' });
  }

  const items = Array.isArray(pfRes.items) ? pfRes.items : [];
  const portfolio = pfMemo(() => ({
    models: items.filter(c => c.kind === 'model'),
    illustrations: items.filter(c => c.kind === 'illustration'),
  }), [items]);

  // Cover: prefer stored cover_data on category (instant, light), fall back to images
  function getCoverSrc(catId) {
    const cat = items.find(c => c.id === catId);
    if (cat && cat.cover_data) return cat.cover_data;
    const cover = allImages.find(img => img.category_id === catId && img.is_cover);
    if (cover) return cover.image_data;
    const first = allImages.find(img => img.category_id === catId);
    return first?.image_data || null;
  }

  // Count: when images loaded use real count; otherwise stored pic_count
  function getCatCount(catId) {
    if (imagesRes.loaded) {
      return allImages.filter(img => img.category_id === catId).length;
    }
    const cat = items.find(c => c.id === catId);
    return (cat && typeof cat.pic_count === 'number') ? cat.pic_count : 0;
  }

  // Keep category.cover_data + pic_count in sync after image changes / on load
  pfEffect(() => {
    if (!imagesRes.loaded || !admin) return;
    const isRealId = (id) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(id);
    items.forEach(cat => {
      if (!isRealId(cat.id)) return; // skip default placeholders (def-m-0 etc.)
      const imgs = allImages.filter(i => i.category_id === cat.id);
      const cover = imgs.find(i => i.is_cover) || imgs.slice().sort((a,b) => (a.sort_order||0)-(b.sort_order||0))[0];
      const newCover = cover ? cover.image_data : null;
      const newCount = imgs.length;
      if (cat.cover_data !== newCover || cat.pic_count !== newCount) {
        pfRes.update(cat.id, { cover_data: newCover, pic_count: newCount });
      }
    });
  }, [allImages, imagesRes.loaded]);

  const renderCard = (item) => ({
    item,
    coverSrc: getCoverSrc(item.id),
    count: getCatCount(item.id) || item.count || 0,
  });

  // All categories in one list
  const allCats = pfMemo(() => [
    ...portfolio.models,
    ...portfolio.illustrations,
  ], [portfolio.models, portfolio.illustrations]);

  return (
    <section id="portfolio" className="page-section stagger-children">
      <PageHead eyebrow={`✦ ${t.portfolio.title} ✦`} subtitle={t.portfolio.subtitle} />
      <CoverflowRow
        catItems={allCats}
        idx={coverIdx} setIdx={setCoverIdx}
        openCategory={openCategory} setOpenCategory={setOpenCategory}
        admin={admin} lang={lang} t={t}
        getCoverSrc={getCoverSrc} getCatCount={getCatCount}
        setPfEdit={setPfEdit} pfRes={pfRes}
      />

      {admin && (
        <button className="add-btn" onClick={() => setPfEdit({ item: null, isNew: true })}>
          <EdIcon name="plus" size={15} /> {lang === 'ru' ? 'Добавить категорию' : 'Add category'}
        </button>
      )}

      {pfEdit && (
        <EditItemModal open={true} onClose={() => setPfEdit(null)} onSave={handleSavePf}
          fields={pfFields} values={pfEdit.item}
          title={pfEdit.isNew ? (lang === 'ru' ? 'Новая категория' : 'New') : (lang === 'ru' ? 'Редактировать' : 'Edit')}
          lang={lang} />
      )}

      {openCategory && (
        <CategoryGallery
          category={openCategory} images={allImages} imagesRes={imagesRes}
          t={t} lang={lang} admin={admin}
          onClose={() => setOpenCategory(null)} />
      )}
    </section>
  );
}

Object.assign(window, { PortfolioSection });

  