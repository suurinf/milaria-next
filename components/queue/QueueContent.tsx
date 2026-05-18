'use client';
import { useT, useSite } from '../ClientShell';
import type { QueueItem } from '@/lib/types';

export default function QueueContent({ items }: { items: QueueItem[] }) {
  const t = useT();
  const { lang } = useSite();
  const inProgress = items.filter(i => i.kind === 'in_progress');
  const completed = items.filter(i => i.kind === 'completed');

  return (
    <main className="shell">
      <section className="page-section">
        <div className="page-head">
          <span className="page-eyebrow">{t.queue.tag}</span>
          <h1 className="page-title">{t.queue.title}</h1>
        </div>

        <div className="section-label">
          <span className="dot"></span>
          <span>{t.queue.inProgress}</span>
          <span style={{ color: 'var(--accent)' }}>{inProgress.length}</span>
        </div>

        {inProgress.length === 0 ? (
          <div className="empty">{t.queue.empty}</div>
        ) : (
          <div className="q-list">
            {inProgress.map((item, idx) => (
              <div key={item.id} className={`q-row ${item.tag === 'secret' ? 'secret-row' : ''}`}>
                <span className="q-idx">{String(idx + 1).padStart(2, '0')}</span>
                <div className="q-content">
                  <h3 className="q-title">{item.tag === 'secret' ? '????' : item.title}</h3>
                  {item.tag && <span className={`q-tag tag-${item.tag}`}>{item.tag}</span>}
                </div>
                <div className="q-bar-wrap">
                  <div className="q-bar"><div className="q-bar-fill" style={{ width: `${item.progress}%` }} /></div>
                  <span className="q-progress-label">{item.progress}% {t.queue.progress}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {completed.length > 0 && (
          <>
            <div className="section-label done" style={{ marginTop: 56 }}>
              <span className="dot"></span>
              <span>{t.queue.completed}</span>
              <span style={{ color: 'var(--ok)' }}>{completed.length}</span>
            </div>
            <div className="q-list">
              {completed.map((item, idx) => (
                <div key={item.id} className="q-row done">
                  <span className="q-idx">{String(idx + 1).padStart(2, '0')}</span>
                  <div className="q-content">
                    <h3 className="q-title">{item.title}</h3>
                  </div>
                  <span className="q-completed-date">{item.completed_date}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
