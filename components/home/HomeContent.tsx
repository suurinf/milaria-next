'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useT, useSite } from '../ClientShell';
import type { Link as LinkType, PortfolioCategory, PortfolioImage } from '@/lib/types';

const HOME_SOC_GLYPHS: Record<string, { letter: string }> = {
  Twitch: { letter: 'T' }, YouTube: { letter: 'Y' },
  'Twitter / X': { letter: 'X' }, Twitter: { letter: 'X' }, X: { letter: 'X' },
  Bluesky: { letter: 'B' }, Instagram: { letter: 'I' },
  Telegram: { letter: '✈' }, Discord: { letter: 'D' },
  Boosty: { letter: 'B' }, 'Ko-fi': { letter: 'K' },
  Email: { letter: '@' }, VK: { letter: 'V' }, TikTok: { letter: 'T' },
};

function HeroSocials({ links }: { links: LinkType[] }) {
  return (
    <div className="hero-socials-h">
      {links.slice(0, 6).map(l => {
        const g = HOME_SOC_GLYPHS[l.label] || { letter: l.label[0] };
        return (
          <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className="hero-soc-h">
            <span className="hero-soc-h-letter">{g.letter}</span>
            <span>{l.label}</span>
          </a>
        );
      })}
    </div>
  );
}

function CommissionBanner({ banner }: { banner: any }) {
  const router = useRouter();
  const { lang } = useSite();
  const autoMonth = new Date().toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { month: 'long' });
  const month = banner.banner_month || autoMonth;
  const bannerSlots: string[] = Array.isArray(banner.banner_slots) ? banner.banner_slots : ['','','',''];
  const bannerStatus = banner.banner_status || 'open';
  const imgCount = 4;
  const [bIdx, setBIdx] = useState(0);
  const [bHover, setBHover] = useState(false);
  const bRef = useRef<any>(null);

  useEffect(() => {
    if (bHover) {
      bRef.current = setInterval(() => setBIdx(i => (i + 1) % imgCount), 2000);
    } else {
      clearInterval(bRef.current);
      setBIdx(0);
    }
    return () => clearInterval(bRef.current);
  }, [bHover]);

  return (
    <div className="banner anim-in" onMouseEnter={() => setBHover(true)} onMouseLeave={() => setBHover(false)}>
      <div className="banner-img">
        {bannerSlots.map((src, i) => {
          const isYT = typeof src === 'string' && (src.includes('youtube.com') || src.includes('youtu.be'));
          const ytId = isYT ? src.match(/(?:v=|youtu\.be\/|embed\/)([\w-]+)/)?.[1] : null;
          return (
            <div key={i} className={`banner-img-layer ${i === bIdx ? 'show' : ''}`}
              style={typeof src === 'string' && src ? {
                backgroundImage: ytId ? `url(https://img.youtube.com/vi/${ytId}/hqdefault.jpg)` : `url(${src})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
              } as any : { '--hue': 30 + i * 18 } as any} />
          );
        })}
        <div className="recent-tile-counter banner-counter">
          {Array.from({ length: imgCount }, (_, i) =>
            <span key={i} className={i === bIdx ? 'on' : ''}></span>
          )}
        </div>
      </div>
      <div className="banner-content">
        <span className="banner-eyebrow">
          <span className="status-lamp" data-status={bannerStatus}></span>
          {bannerStatus === 'closed' ? (lang === 'ru' ? 'Слоты закрыты' : 'Slots closed')
            : bannerStatus === 'waitlist' ? (lang === 'ru' ? 'Лист ожидания' : 'Waitlist')
            : (lang === 'ru' ? 'Слоты открыты' : 'Slots open')}
        </span>
        <h2 className="banner-title">
          {bannerStatus === 'closed' ? (lang === 'ru' ? 'Заказы закрыты' : 'Commissions closed')
            : bannerStatus === 'waitlist' ? (lang === 'ru' ? 'Лист ожидания на' : 'Waitlist for')
            : (lang === 'ru' ? 'Открыты заказы на' : 'Commissions open for')}
          <span className="banner-month">{month}</span>
        </h2>
        <button className="btn btn-primary banner-cta" onClick={() => router.push('/calculator')}>
          {lang === 'ru' ? 'Прикинуть стоимость' : 'Get an estimate'} →
        </button>
        <span className="banner-deco">✦ ✦ ✦</span>
      </div>
    </div>
  );
}

function RecentWorks({ portfolioCategories, portfolioImages }: { portfolioCategories: PortfolioCategory[]; portfolioImages: PortfolioImage[] }) {
  const router = useRouter();
  const { lang } = useSite();
  const recent = portfolioImages.slice(0, 4);
  if (recent.length === 0) return null;

  return (
    <div>
      <div className="home-section-head">
        <h2 className="home-section-title">
          <em>{lang === 'ru' ? 'Последние работы' : 'Recent works'}</em>
        </h2>
      </div>
      <div className="pf-grid" style={{ marginTop: 16 }}>
        {recent.map(img => {
          const cat = portfolioCategories.find(c => c.id === img.category_id);
          return (
            <div key={img.id} className="pf-card" onClick={() => router.push('/portfolio')}>
              <div className="pf-card-img">
                <img src={img.image_data} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              {cat && (
                <div className="pf-card-info">
                  <h3 className="pf-card-title">{cat.key}</h3>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function HomeContent({ banner, links, portfolioCategories, portfolioImages }: {
  banner: any;
  links: LinkType[];
  portfolioCategories: PortfolioCategory[];
  portfolioImages: PortfolioImage[];
}) {
  const t = useT();
  const { lang } = useSite();
  const router = useRouter();
  const bannerStatus = banner.banner_status || 'open';

  return (
    <div className="home anim-in">
      <section className="hero" style={{ '--hero-art': `url("/assets/hero-art.jpg")` } as any}>
        <div className="hero-art"></div>
        <div className="hero-content">
          <div className="hero-text">
            <span className="hero-eyebrow">
              <span className="status-lamp" data-status={bannerStatus}></span>
              {bannerStatus === 'closed' ? (lang === 'ru' ? 'Заказы закрыты' : 'Commissions closed')
                : bannerStatus === 'waitlist' ? (lang === 'ru' ? 'Лист ожидания' : 'Waitlist')
                : t.home.eyebrow}
            </span>
            <h1 className="hero-title">
              {t.home.greeting1} <em>{t.home.greeting2}</em>.
            </h1>
            <p className="hero-sub">{t.home.subtitle}</p>
            <div className="hero-cta-row">
              <button className="btn btn-primary" onClick={() => router.push('/calculator')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="2" width="16" height="20" rx="2"></rect>
                  <line x1="8" y1="6" x2="16" y2="6"></line>
                  <line x1="8" y1="14" x2="8.01" y2="14"></line>
                  <line x1="12" y1="14" x2="12.01" y2="14"></line>
                  <line x1="16" y1="14" x2="16.01" y2="14"></line>
                  <line x1="8" y1="18" x2="16" y2="18"></line>
                </svg>
                {lang === 'ru' ? 'Калькулятор' : 'Calculator'}
              </button>
              <button className="btn btn-ghost" onClick={() => router.push('/portfolio')}>
                {lang === 'ru' ? 'Портфолио' : 'Portfolio'} →
              </button>
            </div>
            <HeroSocials links={links} />
          </div>
          <div className="hero-side">
            <div className="hero-side-mark"></div>
          </div>
        </div>
      </section>

      <div className="shell">
        <CommissionBanner banner={banner} />
        <RecentWorks portfolioCategories={portfolioCategories} portfolioImages={portfolioImages} />

        <div className="home-cta">
          <div className="home-cta-text">
            <h3><em>{lang === 'ru' ? 'Готов обсудить?' : 'Ready to chat?'}</em></h3>
            <p>{lang === 'ru' ? 'Прикинь стоимость работы и напиши в любую соцсеть' : 'Get an estimate and DM me on any platform'}</p>
          </div>
          <button className="btn btn-primary" onClick={() => router.push('/calculator')}>
            {lang === 'ru' ? 'К калькулятору' : 'To calculator'} →
          </button>
        </div>
      </div>
    </div>
  );
}
