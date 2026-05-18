import { fetchSiteData } from '@/lib/supabase/server';

export default async function AdminDashboard() {
  const data = await fetchSiteData();
  const stats = [
    { label: 'Заказов в очереди', value: data.queue.filter(q => q.kind === 'in_progress').length },
    { label: 'Готово', value: data.queue.filter(q => q.kind === 'completed').length },
    { label: 'Категорий портфолио', value: data.portfolioCategories.length },
    { label: 'Картинок в портфолио', value: data.portfolioImages.length },
    { label: 'Прайс позиций', value: data.prices.length },
    { label: 'Опций калькулятора', value: data.calcOptions.length },
    { label: 'Долгов', value: data.debts.length },
    { label: 'Ссылок', value: data.links.length },
  ];

  return (
    <section className="page-section">
      <div className="page-head">
        <span className="page-eyebrow">✦ дашборд</span>
        <h1 className="page-title">Обзор</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {stats.map(s => (
          <div key={s.label} style={{
            padding: 20, borderRadius: 12,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.06em' }}>
              {s.label}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: 'var(--accent)', marginTop: 4 }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 32, padding: 20, borderRadius: 12, background: 'rgba(232,169,59,0.05)', border: '1px solid rgba(232,169,59,0.2)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)' }}>
          ✦ как пользоваться
        </div>
        <ul style={{ marginTop: 12, fontSize: 14, lineHeight: 1.7, color: 'var(--text-dim)' }}>
          <li>Все изменения сохраняются в Supabase и сразу видны посетителям</li>
          <li>Изменения распространяются через Realtime — никаких задержек или кешей</li>
          <li>Каждая страница имеет свой раздел в админке</li>
        </ul>
      </div>
    </section>
  );
}
