'use client';
import { useT, useSite } from '../ClientShell';
import type { Link as LinkType, PortfolioCategory, PortfolioImage } from '@/lib/types';

const HOME_SOC_GLYPHS: Record<string, { letter: string }> = {
  Telegram: { letter: 'T' }, Twitter: { letter: 'X' }, Twitch: { letter: 'T' },
  YouTube: { letter: 'Y' }, Discord: { letter: 'D' }, Instagram: { letter: 'I' },
  Boosty: { letter: 'B' }, VK: { letter: 'V' }, TikTok: { letter: 'T' }, Email: { letter: '@' },
};

function StatusLamp({ status }: { status: string }) {
  return <span className="status-lamp" data-status={status || 'open'}></span>;
}

export default function HomeContent({ banner, links, portfolioCategories, portfolioImages }: {
  banner: any;
  links: LinkType[];
  portfolioCategories: PortfolioCategory[];
  portfolioImages: PortfolioImage[];
}) {
  const t = useT();
  const { lang } = useSite();
  const bannerStatus = banner.banner_status || 'open';
  const bannerMonth = banner.banner_month
    || new Date().toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { month: 'long' });
  const bannerSlots = Array.isArray(banner.banner_slots) ? banner.banner_slots : ['', '', '', ''];

  const statusText =
    bannerStatus === 'closed' ? t.banner.closed :
    bannerStatus === 'waitlist' ? t.banner.waitlist :
    t.banner.open;

  const titlePrefix =
    bannerStatus === 'closed' ? t.banner.titleClosed :
    bannerStatus === 'waitlist' ? t.banner.titleWaitlist :
    t.banner.titleOpen;

  // Latest works from portfolio
  const latestImages = portfolioImages.slice(0, 6);

  return (
    <main>
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <span className="hero-eyebrow">
              <StatusLamp status={bannerStatus} />
              {bannerStatus === 'closed' ? t.banner.titleClosed
                : bannerStatus === 'waitlist' ? t.banner.waitlist
                : t.home.eyebrow}
            </span>
            <h1 className="hero-title">
              {t.home.greeting1} <em>{t.home.greeting2}</em>.
            </h1>
            <p className="hero-sub">{t.home.subtitle}</p>

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
          </div>
          <div className="hero-art"></div>
        </div>
      </section>

      {/* Banner */}
      <section className="banner-section">
        <div className="banner">
          <div className="banner-text">
            <span className="banner-eyebrow">
              <StatusLamp status={bannerStatus} />
              {statusText}
            </span>
            <h2 className="banner-title">{titlePrefix} <em>{bannerMonth}</em></h2>
          </div>
          <div className="banner-img">
            {bannerSlots.map((src: string, i: number) => {
              if (!src) return (
                <div key={i} className="banner-img-layer" style={{ '--hue': 30 + i * 18 } as any} />
              );
              const ytId = (src.includes('youtube.com') || src.includes('youtu.be'))
                ? src.match(/(?:v=|youtu\.be\/|embed\/)([\w-]+)/)?.[1] : null;
              const url = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : src;
              return (
                <div key={i} className="banner-img-layer show"
                  style={{ backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center' } as any}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* Latest works */}
      {latestImages.length > 0 && (
        <section className="page-section">
          <div className="section-label">
            <span className="dot"></span>
            <span>{lang === 'ru' ? 'Последние работы' : 'Latest works'}</span>
          </div>
          <div className="pf-grid">
            {latestImages.map(img => {
              const cat = portfolioCategories.find(c => c.id === img.category_id);
              const label = cat ? (t.portfolio.categories[cat.key as keyof typeof t.portfolio.categories] || cat.key) : '';
              return (
                <div key={img.id} className="pf-card">
                  <div className="pf-card-img">
                    <img src={img.image_data} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div className="pf-card-info">
                    <h3 className="pf-card-title">{label}</h3>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
