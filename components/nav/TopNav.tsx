'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useT, useSite } from '../ClientShell';

const TABS = [
  { path: '/',           key: 'home'       },
  { path: '/queue',      key: 'queue'      },
  { path: '/portfolio',  key: 'portfolio'  },
  { path: '/calculator', key: 'calculator' },
  { path: '/prices',     key: 'prices'     },
  { path: '/debts',      key: 'debts'      },
];

export default function TopNav() {
  const t = useT();
  const { lang, setLang, currency, setCurrency } = useSite();
  const pathname = usePathname();

  return (
    <nav className="topnav">
      <div className="topnav-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="white" stroke="none"/>
            </svg>
          </span>
          <span className="brand-text">
            <span className="brand-name">Milaria</span>
            <span className="brand-status">VTuber artist · rigger</span>
          </span>
        </Link>

        <div className="nav-tabs">
          {TABS.map(tab => (
            <Link key={tab.path} href={tab.path}
              className={`nav-tab ${pathname === tab.path ? 'active' : ''}`}>
              {t.nav[tab.key as keyof typeof t.nav]}
            </Link>
          ))}
        </div>

        <div className="nav-right">
          <button className="icon-btn lang-btn" onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')}>
            {lang === 'ru' ? 'EN' : 'RU'}
          </button>
          <button className="icon-btn" onClick={() => setCurrency(currency === 'rub' ? 'usd' : 'rub')}>
            {currency === 'rub' ? '₽' : '$'}
          </button>
        </div>
      </div>
    </nav>
  );
}
