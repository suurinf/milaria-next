'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push('/admin');
    router.refresh();
  }

  return (
    <main className="shell" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={handleSubmit} style={{ maxWidth: 400, width: '100%' }}>
        <div className="page-head" style={{ textAlign: 'left' }}>
          <span className="page-eyebrow">✦ вход</span>
          <h1 className="page-title">Админка</h1>
        </div>
        <label className="login-field">
          <span>Email</span>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} autoFocus />
        </label>
        <label className="login-field">
          <span>Пароль</span>
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} />
        </label>
        {error && <div style={{ color: '#ff6b6b', fontSize: 13, marginTop: 8, fontFamily: 'var(--font-mono)' }}>{error}</div>}
        <button type="submit" disabled={loading} className="btn btn-primary"
          style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}>
          {loading ? '...' : 'Войти'}
        </button>
      </form>
    </main>
  );
}
