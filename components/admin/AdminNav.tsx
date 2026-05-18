'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminNav({ email }: { email: string }) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  const sections = [
    { href: '/admin', label: 'Дашборд' },
    { href: '/admin/queue', label: 'Очередь' },
    { href: '/admin/portfolio', label: 'Портфолио' },
    { href: '/admin/prices', label: 'Прайс' },
    { href: '/admin/calculator', label: 'Калькулятор' },
    { href: '/admin/debts', label: 'Долги' },
    { href: '/admin/links', label: 'Ссылки' },
    { href: '/admin/banner', label: 'Баннер' },
  ];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '16px 24px',
      background: 'rgba(255,255,255,0.03)', borderRadius: 12, marginBottom: 28,
      border: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap',
    }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        ✦ admin
      </span>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: 1 }}>
        {sections.map(s => (
          <Link key={s.href} href={s.href} style={{
            padding: '6px 12px', fontSize: 12, fontFamily: 'var(--font-mono)',
            color: 'var(--text-dim)', textDecoration: 'none', borderRadius: 6,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
          }}>{s.label}</Link>
        ))}
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{email}</span>
      <button onClick={signOut} style={{
        padding: '6px 14px', fontSize: 12, fontFamily: 'var(--font-mono)',
        background: 'rgba(220,50,50,0.15)', color: '#ff8888',
        border: '1px solid rgba(220,50,50,0.25)', borderRadius: 6, cursor: 'pointer',
      }}>Выйти</button>
    </div>
  );
}
