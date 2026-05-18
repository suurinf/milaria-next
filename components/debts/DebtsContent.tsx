'use client';
import { useT } from '../ClientShell';
import type { Debt } from '@/lib/types';

export default function DebtsContent({ debts }: { debts: Debt[] }) {
  const t = useT();
  return (
    <main className="shell">
      <section className="page-section">
        <div className="page-head">
          <span className="page-eyebrow">{t.debts.tag}</span>
          <h1 className="page-title">{t.debts.title}</h1>
        </div>
        <div className="debt-grid">
          {debts.map(d => (
            <div key={d.id} className={`debt-card status-${d.status}`}>
              <div className="debt-card-head">
                <h3 className="debt-card-title">{d.title}</h3>
                <span className="debt-card-status">{t.debts.status[d.status]}</span>
              </div>
              <p className="debt-card-reason">{d.reason}</p>
              <div className="debt-card-meta">
                <span className="debt-card-date">{d.stream_date}</span>
                <span className="debt-card-progress">{d.progress}%</span>
              </div>
              <div className="debt-card-bar"><div className="debt-card-bar-fill" style={{ width: `${d.progress}%` }} /></div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
