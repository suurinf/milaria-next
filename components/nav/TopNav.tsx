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
        <Link href="/" className="topnav-logo">
          <span>✦</span><span>Milaria</span>
        </Link>
        <div className="topnav-tabs">
          {TABS.map(tab => (
            <Link key={tab.path} href={tab.path}
              className={`topnav-tab ${pathname === tab.path ? 'active' : ''}`}>
              {t.nav[tab.key as keyof typeof t.nav]}
            </Link>
          ))}
        </div>
        <div className="topnav-utils">
          <button className="topnav-util" onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')}>
            {lang === 'ru' ? 'EN' : 'RU'}
          </button>
          <button className="topnav-util" onClick={() => setCurrency(currency === 'rub' ? 'usd' : 'rub')}>
            {currency === 'rub' ? '₽' : '$'}
          </button>
        </div>
      </div>
    </nav>
  );
}
