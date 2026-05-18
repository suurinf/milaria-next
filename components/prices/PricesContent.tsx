'use client';
import { useT, useSite } from '../ClientShell';
import type { Price } from '@/lib/types';

const FX_RATE = 95;

export default function PricesContent({ prices }: { prices: Price[] }) {
  const t = useT();
  const { currency } = useSite();
  return (
    <main className="shell">
      <section className="page-section">
        <div className="page-head">
          <span className="page-eyebrow">{t.prices.tag}</span>
          <h1 className="page-title">{t.prices.title}</h1>
        </div>
        <div className="price-grid">
          {prices.map(p => (
            <div key={p.id} className="price-card" style={{ '--card-img': p.image ? `url("${p.image}")` : 'none' } as any}>
              <h3 className="price-card-title">{p.title}</h3>
              <span className="price-card-price">
                {currency === 'rub' ? `${p.rub.toLocaleString('ru-RU')} ₽` : `$${Math.round(p.rub / FX_RATE)}`}
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
