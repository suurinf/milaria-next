
// home.jsx — Главная: hero (left-aligned, horizontal socials) + banner + tall recent tiles + CTA

const { useRef: homeRef, useState: homeState, useEffect: homeEffect, useMemo: homeMemo } = React;

// ── Библиотека иконок соцсетей ──────────────────────────────────────────────
// Иконки нарисованы как SVG-пути в едином стиле, а не взяты из чужих наборов.
// Каждая запись знает, по каким доменам её узнавать в URL — это даёт
// автоопределение: вставил ссылку, иконка подхватилась сама.
//
// currentColor во всех путях — иконка наследует цвет текста, поэтому одна и та
// же картинка работает и в золотой гамме сайта, и в ховере.

const SOCIAL_ICONS = {
  twitch: { label: 'Twitch', match: ['twitch.tv'], brand: '#9146FF',
    svg: '<path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>' },
  youtube: { label: 'YouTube', match: ['youtube.com', 'youtu.be'], brand: '#FF0000',
    svg: '<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>' },
  twitter: { label: 'Twitter / X', match: ['twitter.com', 'x.com'], brand: '#fff',
    svg: '<path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"/>' },
  bluesky: { label: 'Bluesky', match: ['bsky.app', 'bsky.social'], brand: '#0085FF',
    svg: '<path d="M5.202 2.857C7.954 4.922 10.913 9.11 12 11.358c1.087-2.247 4.046-6.436 6.798-8.501C20.783 1.366 24 .213 24 3.883c0 .732-.42 6.156-.667 7.037-.856 3.061-3.978 3.842-6.755 3.37 4.854.826 6.089 3.562 3.422 6.299-5.065 5.196-7.28-1.304-7.847-2.97-.104-.305-.152-.448-.153-.327 0-.121-.05.022-.153.327-.568 1.666-2.782 8.166-7.847 2.97-2.667-2.737-1.432-5.473 3.422-6.3-2.777.473-5.899-.308-6.755-3.369C.42 10.04 0 4.615 0 3.883c0-3.67 3.217-2.517 5.202-1.026"/>' },
  instagram: { label: 'Instagram', match: ['instagram.com'], brand: '#E4405F',
    svg: '<path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"/>' },
  telegram: { label: 'Telegram', match: ['t.me', 'telegram.me', 'telegram.org'], brand: '#26A5E4',
    svg: '<path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>' },
  discord: { label: 'Discord', match: ['discord.gg', 'discord.com', 'discordapp.com'], brand: '#5865F2',
    svg: '<path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>' },
  boosty: { label: 'Boosty', match: ['boosty.to'], brand: '#F15F2C',
    svg: '<path d="M2.661 14.337 6.801 0h6.362L11.88 4.444l-.038.077-3.378 11.733h3.15c-1.321 3.289-2.35 5.867-3.086 7.733-5.816-.063-7.442-4.228-6.02-9.155M8.554 24l7.67-11.035h-3.25l2.83-7.073c4.852.508 7.137 4.33 5.791 8.952C20.16 19.81 14.344 24 8.68 24h-.127z"/>' },
  tiktok: { label: 'TikTok', match: ['tiktok.com'], brand: '#fff',
    svg: '<path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>' },
  pinterest: { label: 'Pinterest', match: ['pinterest.com', 'pin.it'], brand: '#BD081C',
    svg: '<path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/>' },
  kofi: { label: 'Ko-fi', match: ['ko-fi.com'], brand: '#FF5E5B',
    svg: '<path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.816zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.006-1.086 4.363.407 0 0 1.565-1.782 3.335-.847 1.774.938 1.481 3.15.856 4.195zm6.14.135c-.786.05-1.404-.024-1.404-.024V9.365h1.505s1.678.056 1.678 1.597c0 1.171-.653 1.517-1.779 1.632z" fill="currentColor"/>' },
  vk: { label: 'VK', match: ['vk.com', 'vk.ru', 'vkontakte'], brand: '#0077FF',
    svg: '<path d="M13.162 18.994c-6.386 0-11.028-4.383-11.222-11.658h3.219c.134 5.338 2.529 7.573 4.426 8.048V7.336h3.033v4.63c1.873-.201 3.84-2.336 4.503-4.63h3.032c-.508 2.827-2.641 4.962-4.159 5.84 1.518.712 3.946 2.574 4.87 5.818h-3.338c-.72-2.242-2.52-3.977-4.908-4.211v4.211h-.365z" fill="currentColor"/>' },
  patreon: { label: 'Patreon', match: ['patreon.com'], brand: '#F96854',
    svg: '<path d="M14.82 2.41c3.96 0 7.18 3.24 7.18 7.21 0 3.96-3.22 7.18-7.18 7.18-3.97 0-7.21-3.22-7.21-7.18 0-3.97 3.24-7.21 7.21-7.21M2 21.6h3.5V2.41H2V21.6z" fill="currentColor"/>' },
  github: { label: 'GitHub', match: ['github.com'], brand: '#fff',
    svg: '<path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" fill="currentColor"/>' },
  hipolink: { label: 'Hipolink', match: ['hipolink'], brand: '#6C5CE7', letter: 'H' },
  ych: { label: 'YCH Commishes', match: ['ych.commishes','commishes.com'], brand: '#00B894', letter: 'Y' },
  mail: { label: 'Email', match: ['mailto:'], brand: '#EAB308',
    svg: '<rect x="2.5" y="5" width="19" height="14" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.5 7l8.5 6 8.5-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' },
  link: { label: 'Ссылка', match: [], brand: '#EAB308',
    svg: '<path d="M9 15l6-6M10 6l1-1a4 4 0 0 1 6 6l-1 1M14 18l-1 1a4 4 0 0 1-6-6l1-1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' },
};

const SOCIAL_ICON_OPTIONS = Object.keys(SOCIAL_ICONS).filter(k => k !== 'link');

// Определяем иконку по URL — сердце автоматики.
function detectSocialIcon(url) {
  const u = String(url || '').toLowerCase();
  for (const key of Object.keys(SOCIAL_ICONS)) {
    if (SOCIAL_ICONS[key].match.some(dom => u.includes(dom))) return key;
  }
  return null;
}

// Какую иконку показать: сохранённый выбор → определение по URL → по названию → запасная.
function resolveSocialIcon(item) {
  if (item && item.icon && SOCIAL_ICONS[item.icon]) return item.icon;
  const byUrl = detectSocialIcon(item && item.url);
  if (byUrl) return byUrl;
  const byLabel = String((item && item.label) || '').toLowerCase();
  const hit = Object.keys(SOCIAL_ICONS).find(k => SOCIAL_ICONS[k].label.toLowerCase() === byLabel);
  // Ничего не распознали — вместо одинаковой «цепочки» показываем первую букву
  // названия. Так неизвестный сервис читается, а не сливается с другими.
  if (hit) return hit;
  const first = String((item && item.label) || '?').trim()[0];
  return { letter: (first || '?').toUpperCase() };
}

// Готовый SVG нужного размера.
function SocialGlyph({ name, size = 20 }) {
  // name — либо ключ в SOCIAL_ICONS, либо объект { letter } для неизвестного сервиса
  const icon = (name && typeof name === 'object') ? name
    : (SOCIAL_ICONS[name] || SOCIAL_ICONS.link);
  // Часть сервисов (Hipolink, ych) не имеет иконки в открытых наборах —
  // для них рисуем букву, вписанную в кружок, в общем стиле.
  if (icon.letter) {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
        <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <text x="12" y="16.5" textAnchor="middle" fontSize="12" fontWeight="600"
          fill="currentColor" fontFamily="var(--font-mono), monospace">{icon.letter}</text>
      </svg>
    );
  }
  // fill="currentColor" на самом <svg>: пути от Simple Icons идут без атрибута
  // fill, а по спецификации это значит «чёрный». Так они наследуют цвет текста
  // и красятся в гамму сайта — золото в покое, акцент на ховере.
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true"
      fill="currentColor"
      dangerouslySetInnerHTML={{ __html: icon.svg }} />
  );
}

// ── Меню выбора канала ──────────────────────────────────────────────────────
// Показывается, когда у одной иконки два адреса (напр. два YouTube). Аватарку и
// название берём из настроек ссылки. Для Discord пробуем дотянуть их автоматически
// по коду приглашения — но это лишь удобство: если не выйдет (блокировка/ошибка),
// остаётся то, что вписано вручную, и пустых кружков не бывает.
function ChannelChooser({ link, lang, onClose }) {
  // Иконку раздела показываем ту же, что на кнопке — так меню визуально связано
  // с тем, что нажали. Аватарок нет: два адреса одного сервиса, читаются по названию.
  const iconName = resolveSocialIcon(link);
  const options = [
    { label: link.label,  url: link.url,  handle: link.handle },
    { label: link.label2, url: link.url2, handle: link.handle2 },
  ].filter(o => o.url && o.label);

  return (
    <Modal open={true} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 22, margin: 0, textAlign: 'center' }}>
          {lang === 'ru' ? 'Куда перейти?' : 'Where to go?'}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {options.map((o, i) => (
            <a key={i} href={o.url} target="_blank" rel="noopener noreferrer"
               className="channel-choice" onClick={onClose}>
              <span className="channel-choice-ico"><SocialGlyph name={iconName} size={22} /></span>
              <span className="channel-choice-text">
                <span className="channel-choice-name">{o.label}</span>
                {o.handle && <span className="channel-choice-handle">{o.handle}</span>}
              </span>
              <span className="channel-choice-arrow">→</span>
            </a>
          ))}
        </div>
      </div>
    </Modal>
  );
}
function HeroSocials({ links, admin, linksRes, lang }) {
  const shown = admin ? links : links.slice(0, 12);
  const [editLink, setEditLink] = homeState(null);
  const [chooseLink, setChooseLink] = homeState(null); // ссылка с двумя каналами → меню выбора

  const linkFields = React.useMemo(() => [
    { key: 'label', label: lang === 'ru' ? 'Название' : 'Label', type: 'text', required: true, default: '' },
    { key: 'handle', label: 'Handle / @', type: 'text', default: '' },
    { key: 'url', label: 'URL', type: 'text', required: true, default: 'https://' },
    // Иконка по умолчанию определяется по ссылке автоматически; выбор здесь —
    // только если хочется переопределить вручную.
    { key: 'icon', label: lang === 'ru' ? 'Иконка' : 'Icon', type: 'select', default: '',
      options: [{ value: '', label: lang === 'ru' ? 'Авто (по ссылке)' : 'Auto (by URL)' }]
        .concat(SOCIAL_ICON_OPTIONS.map(k => ({ value: k, label: SOCIAL_ICONS[k].label }))) },
    // Два канала на одной иконке: если заполнить — клик открывает меню выбора.
    // Название первого варианта берётся из «Название» выше, ссылка — из «URL».
    // Второй канал: если заполнить, клик по иконке откроет меню выбора.
    { key: 'label2', label: lang === 'ru' ? '2-й канал: название' : '2nd: name', type: 'text', default: '' },
    { key: 'url2', label: lang === 'ru' ? '2-й канал: ссылка' : '2nd: URL', type: 'text', default: '' },
  ], [lang]);

  function handleSave(draft) {
    const payload = {
      label: draft.label, handle: draft.handle, url: draft.url, icon: draft.icon || null,
      label2: draft.label2 || null, url2: draft.url2 || null,
    };
    if (editLink?.isNew) {
      linksRes.add(payload);
    } else {
      linksRes.update(editLink.item.id, payload);
    }
  }

  return (
    <div className="hero-socials-h">
      {shown.map((l) => {
        const iconName = resolveSocialIcon(l);
        const hasTwo = !admin && l.url2 && l.label2;
        return (
          <a key={l.id}
             href={admin || hasTwo ? undefined : l.url}
             target="_blank" rel="noopener noreferrer"
             className="hero-soc-h" title={l.label} aria-label={l.label}
             onClick={(e) => {
               if (admin) { e.preventDefault(); return; }
               if (hasTwo) { e.preventDefault(); setChooseLink(l); }
             }}>
            <span className="hero-soc-h-icon"><SocialGlyph name={iconName} /></span>
            {admin && (
              <span className="hero-soc-admin">
                <button className="admin-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditLink({ item: l, isNew: false }); }}>✎</button>
                <button className="admin-btn danger" onClick={(e) => { e.preventDefault(); e.stopPropagation(); linksRes.remove(l.id); }}>×</button>
              </span>
            )}
          </a>);
      })}
      {admin && (
        <button className="hero-soc-h" style={{ cursor: 'pointer', border: '1px dashed rgba(255,255,255,0.15)' }}
          onClick={() => setEditLink({ item: null, isNew: true })}>
          <span className="hero-soc-h-icon" style={{ fontSize: 18, lineHeight: 1 }}>+</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em' }}>
            {lang === 'ru' ? 'Добавить' : 'Add'}
          </span>
        </button>
      )}

      {chooseLink && (
        <ChannelChooser link={chooseLink} lang={lang} onClose={() => setChooseLink(null)} />
      )}

      {admin && editLink && (
        <EditItemModal
          open={true}
          onClose={() => setEditLink(null)}
          onSave={handleSave}
          fields={linkFields}
          values={editLink.item}
          title={editLink.isNew ? (lang === 'ru' ? 'Новая ссылка' : 'New link') : (lang === 'ru' ? 'Редактировать' : 'Edit')}
          lang={lang}
        />
      )}
    </div>);
}

// ─── Banner: "Открыты заказы на Май" ───
function CommissionBanner({ t, lang, onGoTo, admin }) {
  const autoMonth = lang === 'ru' ?
  new Date().toLocaleDateString('ru-RU', { month: 'long' }) :
  new Date().toLocaleDateString('en-US', { month: 'long' });
  const [bannerCfg, saveBannerCfg] = useSetting('banner', {});
  const month = (lang === 'en' ? (bannerCfg.banner_month_en || bannerCfg.banner_month) : bannerCfg.banner_month) || autoMonth;
  const bannerSlots = Array.isArray(bannerCfg.banner_slots) ? bannerCfg.banner_slots.filter(s => typeof s === 'string').map(localSupaUrl) : ['','','',''];
  const bannerImages = bannerSlots.filter(Boolean);
  const bannerStatus = bannerCfg.banner_status || 'open';
  const [editBanner, setBannerEdit] = homeState(false);

  const bannerVideoYT = (bannerCfg.banner_video || '').match(/(?:v=|youtu\.be\/|embed\/)([\w-]+)/)?.[1];
  // Show only filled slots — if all empty, show all 4 default slots
  const displaySlots = bannerImages.length > 0 ? bannerImages : ['','','',''];
  const imgCount = displaySlots.length;
  const [bIdx, setBIdx] = homeState(0);
  const [bHover, setBHover] = homeState(false);
  const bRef = homeRef(null);
  homeEffect(() => {
    if (bHover && imgCount > 1) {
      bRef.current = setInterval(() => setBIdx((i) => (i + 1) % imgCount), 2000);
    } else {
      clearInterval(bRef.current);
      setBIdx(0);
    }
    return () => clearInterval(bRef.current);
  }, [bHover, imgCount]);

  const bannerFields = React.useMemo(() => [
    { key: 'banner_month', label: 'Месяц — рус. (напр. Май)', type: 'text', default: '' },
    { key: 'banner_month_en', label: 'Month — eng. (e.g. May)', type: 'text', default: '' },
    { key: 'banner_status', label: lang === 'ru' ? 'Статус' : 'Status', type: 'select', default: 'open', options: [
      { value: 'open', label: lang === 'ru' ? 'Открыты' : 'Open' },
      { value: 'closed', label: lang === 'ru' ? 'Закрыты' : 'Closed' },
      { value: 'waitlist', label: lang === 'ru' ? 'Лист ожидания' : 'Waitlist' },
    ]},
    { key: 'banner_video', label: 'YouTube (URL)', type: 'text', default: '' },
  ], [lang, autoMonth]);

  return (
    <div
      className="banner anim-in"
      onMouseEnter={() => setBHover(true)}
      onMouseLeave={() => setBHover(false)}>
      <div className="banner-img">
        {displaySlots.map((src, i) => {
          const isYT = typeof src === 'string' && (src.includes('youtube.com') || src.includes('youtu.be'));
          const ytId = isYT ? (src.match(/(?:v=|youtu\.be\/|embed\/)([\w-]+)/)?.[1]) : null;
          return (
            <div
              key={i}
              className={`banner-img-layer ${i === bIdx ? 'show' : ''}`}
              style={typeof src === 'string' ? {
                backgroundImage: ytId ? `url(https://img.youtube.com/vi/${ytId}/hqdefault.jpg)` : `url(${src})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
              } : { '--hue': 30 + i * 18 }}>
            </div>
          );
        })}
        <div className="recent-tile-counter banner-counter">
          {Array.from({ length: imgCount }, (_, i) =>
            <span key={i} className={i === bIdx ? 'on' : ''}></span>
          )}
        </div>
        <button className="banner-arrow banner-arrow-prev"
          onClick={(e) => { e.stopPropagation(); setBIdx((i) => (i - 1 + imgCount) % imgCount); }}
          aria-label="Предыдущее">‹</button>
        <button className="banner-arrow banner-arrow-next"
          onClick={(e) => { e.stopPropagation(); setBIdx((i) => (i + 1) % imgCount); }}
          aria-label="Следующее">›</button>
      </div>
      <div className="banner-content">
        <span className="banner-eyebrow">
          <span className="status-lamp" data-status={bannerStatus}></span>
          {bannerStatus === 'closed'
            ? (lang === 'ru' ? 'Слоты закрыты' : 'Slots closed')
            : bannerStatus === 'waitlist'
            ? (lang === 'ru' ? 'Лист ожидания' : 'Waitlist')
            : (lang === 'ru' ? 'Слоты открыты' : 'Slots open')}
        </span>
        <h2 className="banner-title">
          {bannerStatus === 'closed'
            ? (lang === 'ru' ? 'Заказы закрыты' : 'Commissions closed')
            : bannerStatus === 'waitlist'
            ? (lang === 'ru' ? 'Лист ожидания на' : 'Waitlist for')
            : (lang === 'ru' ? 'Открыты заказы на' : 'Commissions open for')}
          <span className="banner-month">{month}</span>
        </h2>
        <button className="btn btn-primary banner-cta" onClick={() => onGoTo('calculator')}>
          {lang === 'ru' ? 'Прикинуть стоимость' : 'Get an estimate'} →
        </button>
        <span className="banner-deco">✦ ✦ ✦</span>
        {admin && (
          <button className="admin-btn" style={{ position: 'absolute', top: 8, right: 8 }}
            onClick={() => setBannerEdit(true)}>✎</button>
        )}
      </div>
      {admin && editBanner && (
        <Modal open={true} onClose={() => setBannerEdit(false)}>
          <div style={{ maxWidth: 520, minWidth: 320 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.04em', color: 'var(--accent)', marginBottom: 8 }}>✦ баннер</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 32, margin: '0 0 20px', fontWeight: 500 }}>
              {lang === 'ru' ? 'Настройки баннера' : 'Banner settings'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label className="login-field">
                <span>Месяц — рус. (напр. Май)</span>
                <input type="text" value={bannerCfg.banner_month || ''} onChange={e => {
                  const upd = {...bannerCfg, banner_month: e.target.value};
                  saveBannerCfg(upd);
                }} />
              </label>

              <label className="login-field">
                <span>Month — eng. (e.g. May)</span>
                <input type="text" value={bannerCfg.banner_month_en || ''} placeholder="May" onChange={e => {
                  const upd = {...bannerCfg, banner_month_en: e.target.value};
                  saveBannerCfg(upd);
                }} />
              </label>

              <label className="login-field">
                <span>{lang === 'ru' ? 'Статус' : 'Status'}</span>
                <select value={bannerCfg.banner_status || 'open'} onChange={e => {
                  const upd = {...bannerCfg, banner_status: e.target.value};
                  saveBannerCfg(upd);
                }}>
                  <option value="open">{lang === 'ru' ? '🟢 Открыты' : '🟢 Open'}</option>
                  <option value="closed">{lang === 'ru' ? '🔴 Закрыты' : '🔴 Closed'}</option>
                  <option value="waitlist">{lang === 'ru' ? '🟡 Лист ожидания' : '🟡 Waitlist'}</option>
                </select>
              </label>

              <label className="login-field">
                <span>YouTube (URL)</span>
                <input type="text" value={bannerCfg.banner_video || ''} placeholder="https://youtube.com/watch?v=..." onChange={e => {
                  const upd = {...bannerCfg, banner_video: e.target.value};
                  saveBannerCfg(upd);
                }} />
              </label>

              <div>
                <span style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
                  {lang === 'ru' ? `Слоты баннера (${bannerSlots.length}) — картинка или YouTube` : `Banner slots (${bannerSlots.length}) — image or YouTube`}
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {bannerSlots.map((slot, i) => {
                    const slotYT = slot && (slot.includes('youtube.com') || slot.includes('youtu.be'))
                      ? slot.match(/(?:v=|youtu\.be\/|embed\/)([\w-]+)/)?.[1] : null;
                    const thumb = slotYT ? `https://img.youtube.com/vi/${slotYT}/mqdefault.jpg` : slot;
                    return (
                      <div key={i} style={{
                        position: 'relative', aspectRatio: '16/9', borderRadius: 8, overflow: 'hidden',
                        background: slot ? 'none' : `linear-gradient(135deg, hsl(${30+i*18},50%,30%), hsl(${48+i*18},45%,20%))`,
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}>
                        {thumb && <img src={thumb} style={{ width:'100%',height:'100%',objectFit:'cover' }} alt="" />}
                        <div style={{ position:'absolute',top:4,left:4,fontFamily:'var(--font-mono)',fontSize:10,color:'rgba(255,255,255,.5)' }}>#{i+1}</div>
                        <div style={{ position:'absolute',bottom:4,right:4,display:'flex',gap:3 }}>
                          <ImageUploader label="📷" onUpload={(url) => {
                            const slots = [...bannerSlots]; slots[i] = url;
                            const upd = {...bannerCfg, banner_slots: slots};
                            saveBannerCfg(upd);
                          }} />
                          {slot && <button className="admin-btn danger" style={{width:24,height:24,fontSize:11}} onClick={() => {
                            const slots = bannerSlots.filter((_, idx) => idx !== i);
                            const upd = {...bannerCfg, banner_slots: slots};
                            saveBannerCfg(upd);
                          }}>×</button>}
                        </div>
                      </div>
                    );
                  })}
                  {/* Add new slot card */}
                  <button onClick={() => {
                    const slots = [...bannerSlots, ''];
                    const upd = {...bannerCfg, banner_slots: slots};
                    saveBannerCfg(upd);
                  }} style={{
                    aspectRatio: '16/9', borderRadius: 8,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1.5px dashed rgba(255,255,255,0.18)',
                    color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                    fontFamily: 'var(--font-mono)', fontSize: 14,
                  }}>+ {lang === 'ru' ? 'Добавить слот' : 'Add slot'}</button>
                </div>
                <label className="login-field" style={{ marginTop: 8 }}>
                  <span>{lang === 'ru' ? 'Вставить YouTube URL → создаст новый слот' : 'Paste YouTube URL → creates new slot'}</span>
                  <div style={{ display:'flex', gap:6 }}>
                    <input type="text" placeholder="https://youtube.com/watch?v=..." style={{flex:1}} id="yt-new-url" />
                    <button className="btn btn-primary" style={{fontSize:12,padding:'6px 14px'}} onClick={() => {
                      const url = document.getElementById('yt-new-url').value.trim();
                      if (url) {
                        const slots = [...bannerSlots, url];
                        const upd = {...bannerCfg, banner_slots: slots};
                        saveBannerCfg(upd);
                        document.getElementById('yt-new-url').value = '';
                      }
                    }}>+ {lang === 'ru' ? 'Добавить' : 'Add'}</button>
                  </div>
                </label>
              </div>
            </div>

            <button className="btn btn-primary" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}
              onClick={() => setBannerEdit(false)}>
              {lang === 'ru' ? 'Готово' : 'Done'}
            </button>
          </div>
        </Modal>
      )}
    </div>);

}

// ─── Recent Works: 4 editable tiles, each with multiple image slots ───
const DEFAULT_TILES = [
  { label: 'АРТ', label_en: 'ART', hue: 320, color: 'blue', slots: [] },
  { label: 'СКЕТЧ', label_en: 'SKETCH', hue: 200, color: 'violet', slots: [] },
  { label: 'МОДЕЛЬ 2D', label_en: 'MODEL 2D', hue: 280, color: 'red', slots: [] },
  { label: 'РИГ', label_en: 'RIG', hue: 0, color: 'amber', slots: [] },
];

// ── Media type detection (handles query params in Storage URLs) ──
// Ссылки на наши файлы держим короткими (/supa/...), чтобы они работали на
// любом домене. В базе остались полные адреса со старого домена
// milaria-next-suurin.amvera.io — после переезда Amvera он не отвечает,
// и плитки «Последних работ» стояли пустыми.
function localSupaUrl(u) {
  return typeof u === 'string' ? u.replace(/^https?:\/\/[^\/]+(?=\/supa\/)/, '') : u;
}

function detectMedia(url) {
  if (!url) return 'image';
  const clean = url.split('?')[0].toLowerCase();
  if (clean.includes('youtube.com') || clean.includes('youtu.be')) return 'youtube';
  if (/\.(mp4|webm|mov|m4v)$/.test(clean)) return 'video';
  if (/\.gif$/.test(clean)) return 'gif';
  return 'image';
}
function ytIdFrom(url) {
  return (String(url).match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]+)/) || [])[1];
}

// ── Focal point picker: click image → sets center point ──
// ── Focal point picker: drag the frame, preview = exactly what the tile shows ──
function FocalPicker({ src, focal, onChange }) {
  function parseFocal(f) {
    if (!f) return { x: 50, y: 50 };
    const p = String(f).replace(/%/g, '').trim().split(/\s+/);
    const x = parseFloat(p[0]), y = parseFloat(p[1]);
    return { x: isNaN(x) ? 50 : x, y: isNaN(y) ? 50 : y };
  }

  const [pos, setPos] = homeState(() => parseFocal(focal));
  const [ratio, setRatio] = homeState(0.487);      // tile w/h — measured from the real tile
  const [imgRatio, setImgRatio] = homeState(null); // natural w/h of the picture

  const imgWrapRef = homeRef(null);
  const frameRef = homeRef(null);
  const previewRef = homeRef(null);
  const posRef = homeRef(pos);
  const draggingRef = homeRef(false);

  // Measure the real tile on screen so the preview matches 1:1
  homeEffect(() => {
    const tile = document.querySelector('.recent-tile');
    if (tile) {
      const r = tile.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setRatio(r.width / r.height);
    }
  }, []);

  // The crop rectangle the tile actually shows, in % of the image (background-size:cover math)
  function cropBox() {
    if (!imgRatio) return { w: 45, h: 92 };
    if (imgRatio > ratio) {
      // image wider than tile → full height used, width cropped
      return { w: (ratio / imgRatio) * 100, h: 100 };
    }
    // image taller than tile → full width used, height cropped
    return { w: 100, h: (imgRatio / ratio) * 100 };
  }

  // Paint frame + preview straight to the DOM (no React re-render → no lag)
  function paint(x, y) {
    const box = cropBox();
    const left = Math.max(0, Math.min(100 - box.w, x - box.w / 2));
    const top = Math.max(0, Math.min(100 - box.h, y - box.h / 2));
    if (frameRef.current) {
      frameRef.current.style.left = left + '%';
      frameRef.current.style.top = top + '%';
      frameRef.current.style.width = box.w + '%';
      frameRef.current.style.height = box.h + '%';
    }
    if (previewRef.current) previewRef.current.style.backgroundPosition = x + '% ' + y + '%';
  }

  homeEffect(() => { paint(pos.x, pos.y); }, [imgRatio, ratio]);

  function pointFromEvent(e) {
    const el = imgWrapRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return {
      x: Math.max(0, Math.min(100, (src.clientX - r.left) / r.width * 100)),
      y: Math.max(0, Math.min(100, (src.clientY - r.top) / r.height * 100)),
    };
  }

  function moveTo(e) {
    const p = pointFromEvent(e);
    if (!p) return;
    posRef.current = p;
    paint(p.x, p.y); // instant, DOM-only
  }

  function commit() {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const p = posRef.current;
    const x = Math.round(p.x), y = Math.round(p.y);
    setPos({ x, y });        // one re-render at the very end
    onChange(x + '% ' + y + '%');
  }

  function onDown(e) {
    draggingRef.current = true;
    moveTo(e);
    e.preventDefault();
  }

  // Track drag beyond the image bounds too
  homeEffect(() => {
    function onMove(e) { if (draggingRef.current) moveTo(e); }
    function onUp() { commit(); }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [imgRatio, ratio]);

  const box = cropBox();
  const initLeft = Math.max(0, Math.min(100 - box.w, pos.x - box.w / 2));
  const initTop = Math.max(0, Math.min(100 - box.h, pos.y - box.h / 2));

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
        Перетащи рамку — справа видно как будет в плашке
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* Image with draggable crop frame */}
        <div ref={imgWrapRef}
          style={{ flex: '1 1 0', position: 'relative', borderRadius: 8, overflow: 'hidden',
                   cursor: 'grab', lineHeight: 0, userSelect: 'none', touchAction: 'none' }}
          onMouseDown={onDown} onTouchStart={onDown}>
          <img src={src} alt=""
            onLoad={e => {
              const n = e.target;
              if (n.naturalWidth && n.naturalHeight) setImgRatio(n.naturalWidth / n.naturalHeight);
            }}
            style={{ width: '100%', display: 'block', maxHeight: 190, objectFit: 'contain', background: '#111' }} />
          {/* Crop frame — dark outside, clear inside */}
          <div ref={frameRef} style={{
            position: 'absolute',
            left: initLeft + '%', top: initTop + '%',
            width: box.w + '%', height: box.h + '%',
            border: '2px solid var(--accent)',
            borderRadius: 4, pointerEvents: 'none',
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
          }} />
        </div>

        {/* Live preview — identical CSS to the real tile */}
        <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>в плашке</span>
          <div ref={previewRef} style={{
            width: Math.round(190 * ratio), height: 190,
            borderRadius: 14, border: '1px solid var(--line)',
            backgroundImage: 'url(' + src + ')',
            backgroundSize: 'cover',
            backgroundPosition: pos.x + '% ' + pos.y + '%',
            backgroundColor: '#111',
          }} />
          <button className="admin-btn" style={{ fontSize: 10 }}
            onClick={() => { posRef.current = { x: 50, y: 50 }; paint(50, 50); setPos({ x: 50, y: 50 }); onChange('50% 50%'); }}>
            ⟳ по центру
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Single media layer inside tile ──
function TileMediaLayer({ src, focal, active, hovering, onScreen = true }) {
  const type = detectMedia(src);
  const vidRef = homeRef(null);
  const focalStr = focal || '50% 50%';

  // Видео играет всегда, пока плашка видна — наведение больше ни при чём.
  // Но за экраном пауза: четыре ролика, крутящиеся в фоне, съедают
  // мобильный трафик и батарею впустую.
  homeEffect(() => {
    const v = vidRef.current;
    if (!v) return;
    if (active && onScreen) v.play().catch(() => {});
    else v.pause();
  }, [active, onScreen]);

  if (type === 'youtube') {
    const id = ytIdFrom(src);
    return (
      <div style={{
        position: 'absolute', inset: 0, opacity: active ? 1 : 0,
        transition: 'opacity 0.5s ease',
        backgroundImage: id ? `url(https://img.youtube.com/vi/${id}/hqdefault.jpg)` : 'none',
        backgroundSize: 'cover', backgroundPosition: focalStr,
      }} />
    );
  }
  if (type === 'video') {
    return (
      <div style={{
        position: 'absolute', inset: 0, opacity: active ? 1 : 0,
        transition: 'opacity 0.5s ease', overflow: 'hidden',
      }}>
        <video ref={vidRef} src={src} loop muted playsInline preload="metadata"
          style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition: focalStr }}
        />
      </div>
    );
  }
  // image or gif — both work as background-image (GIF animates natively)
  return (
    <div style={{
      position: 'absolute', inset: 0, opacity: active ? 1 : 0,
      transition: 'opacity 0.5s ease',
      backgroundImage: `url(${src})`, backgroundSize: 'cover',
      backgroundPosition: focalStr,
    }} />
  );
}

// Touch devices have no hover, so anything gated behind it is dead there.
const IS_TOUCH = typeof window !== 'undefined' &&
  window.matchMedia && window.matchMedia('(hover: none)').matches;

function RecentTile({ tileData, lang, onClick }) {
  const slots = (tileData.slots || []).filter(Boolean).map(localSupaUrl);
  const focal = tileData.focal || [];
  const count = slots.length;
  const [idx, setIdx] = homeState(0);
  const [hovering, setHovering] = homeState(false);
  const intRef = homeRef(null);
  const touchRef = homeRef(null);
  const swipedRef = homeRef(false);
  const rootRef = homeRef(null);

  // Видео нельзя перелистывать по таймеру: человек не успеет посмотреть.
  // Пока показан ролик — автопрокрутка стоит, листать можно только стрелками
  // или свайпом.
  const currentIsVideo = detectMedia(slots[idx]) === 'video';

  homeEffect(() => {
    // Auto-cycling is a hover affordance. On touch the user drives it by
    // swiping, so don't spin images under their finger.
    if (hovering && !IS_TOUCH && count > 1 && !currentIsVideo) {
      intRef.current = setInterval(() => setIdx(i => (i + 1) % count), 3000);
    } else {
      clearInterval(intRef.current);
    }
    return () => clearInterval(intRef.current);
  }, [hovering, count, currentIsVideo, idx]);

  // Плашка на экране? Видео за пределами вьюпорта играть не должно —
  // это лишний трафик и разряд батареи на телефоне.
  const [onScreen, setOnScreen] = homeState(true);
  homeEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      entries => setOnScreen(entries[0].isIntersecting),
      { rootMargin: '150px' }   // включаем чуть заранее, чтобы не было рывка
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const go = (dir) => setIdx(i => (i + dir + count) % count);

  function onTouchStart(e) {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY };
    swipedRef.current = false;
  }
  function onTouchMove(e) {
    if (!touchRef.current || count < 2) return;
    const t = e.touches[0];
    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;
    // Only claim the gesture once it's clearly horizontal — otherwise the page
    // must stay scrollable through the tile.
    if (Math.abs(dx) > 34 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      go(dx < 0 ? 1 : -1);
      swipedRef.current = true;
      touchRef.current = null;
    }
  }
  function onTouchEnd() { touchRef.current = null; }

  const label = lang === 'en' ? (tileData.label_en || tileData.label) : tileData.label;

  return (
    <div ref={rootRef} className="recent-tile" data-color={tileData.color}
      style={{ '--hue': tileData.hue }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={() => { if (swipedRef.current) { swipedRef.current = false; return; } onClick(); }}>
      <div className="recent-tile-imgs">
        {/* Gradient placeholder underneath */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(135deg, hsl(${tileData.hue} 55% 45%), hsl(${tileData.hue + 30} 35% 22%))`,
          opacity: slots.length ? 0 : 1,
        }} />
        {slots.map((src, i) => (
          <TileMediaLayer key={i} src={src} focal={focal[i]} active={i === idx} hovering={hovering} onScreen={onScreen} />
        ))}
      </div>
      {count > 1 && (
        <>
          <button className="rtile-arr rtile-arr-l" aria-label="Предыдущая работа"
            onTouchStart={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); go(-1); }}>‹</button>
          <button className="rtile-arr rtile-arr-r" aria-label="Следующая работа"
            onTouchStart={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); go(1); }}>›</button>
          <div className="recent-tile-counter">
            {slots.map((_, i) => <span key={i} className={i === idx ? 'on' : ''} />)}
          </div>
        </>
      )}
      <div className="recent-tile-vlabel">{label}</div>
      <div className="recent-tile-arrow">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline>
        </svg>
      </div>
    </div>
  );
}

function RecentTileEditor({ tile, onSave, onClose, lang }) {
  const [draft, setDraft] = homeState(() => ({
    ...tile,
    slots: (tile.slots || []).map(localSupaUrl),
    focal: [...(tile.focal || [])],
  }));
  const [urlInput, setUrlInput] = homeState('');
  const [focalSlot, setFocalSlot] = homeState(null); // index of slot being edited
  const fileRef = homeRef(null);

  // Autosave: keep refs fresh so a flush never writes with a stale closure
  const draftRef = homeRef(draft);   draftRef.current = draft;
  const onSaveRef = homeRef(onSave); onSaveRef.current = onSave;
  const firstRef = homeRef(true);
  const dirtyRef = homeRef(false);

  homeEffect(() => {
    if (firstRef.current) { firstRef.current = false; return; }
    dirtyRef.current = true;
    const t = setTimeout(() => { onSaveRef.current(draftRef.current); dirtyRef.current = false; }, 500);
    return () => clearTimeout(t);
  }, [draft]);

  // Flush pending changes when switching tabs / closing
  homeEffect(() => () => {
    if (dirtyRef.current) onSaveRef.current(draftRef.current);
  }, []);

  function addUrl() {
    if (!urlInput.trim()) return;
    setDraft(d => ({ ...d, slots: [...d.slots, urlInput.trim()], focal: [...(d.focal || []), '50% 50%'] }));
    setUrlInput('');
  }
  function removeSlot(i) {
    setDraft(d => {
      const slots = d.slots.filter((_, j) => j !== i);
      const focal = (d.focal || []).filter((_, j) => j !== i);
      return { ...d, slots, focal };
    });
    if (focalSlot === i) setFocalSlot(null);
  }
  function setFocal(i, val) {
    setDraft(d => {
      const focal = [...(d.focal || d.slots.map(() => '50% 50%'))];
      focal[i] = val;
      return { ...d, focal };
    });
  }
  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const up = await window.uploadToStorage(file);
    if (up) {
      setDraft(d => ({ ...d, slots: [...d.slots, up.url], focal: [...(d.focal || []), '50% 50%'] }));
    }
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <label className="login-field">
          <span>Название (RU)</span>
          <input value={draft.label || ''} onChange={e => setDraft(d => ({ ...d, label: e.target.value }))} />
        </label>
        <label className="login-field">
          <span>Label (EN)</span>
          <input value={draft.label_en || ''} onChange={e => setDraft(d => ({ ...d, label_en: e.target.value }))} />
        </label>

        <div>
          <span style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
            {lang === 'ru' ? 'Медиафайлы — картинки, видео (mp4), гиф' : 'Media — images, video (mp4), gif'}
          </span>

          {/* Slot list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
            {(draft.slots || []).map((s, i) => {
              const type = detectMedia(s);
              const focal = (draft.focal || [])[i] || '50% 50%';
              const isEditing = focalSlot === i;
              return (
                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 8 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {type === 'video' ? (
                      <div style={{ width: 48, height: 36, borderRadius: 4, background: '#111', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <span style={{ fontSize: 18 }}>🎬</span>
                      </div>
                    ) : type === 'gif' ? (
                      <img src={s} style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 4 }} alt="" />
                    ) : (
                      <img src={s} style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 4 }} alt=""
                        onError={e => e.target.style.display='none'} />
                    )}
                    <span style={{ flex: 1, fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {type === 'video' ? '🎬 ' : type === 'gif' ? '🎞 ' : ''}{s.split('/').pop().split('?')[0]}
                    </span>
                    {type !== 'video' && (
                      <button className="admin-btn" style={{ fontSize: 11, whiteSpace: 'nowrap' }}
                        onClick={() => setFocalSlot(isEditing ? null : i)}
                        title="Выбрать кадр">
                        {isEditing ? '✓' : '🎯'}
                      </button>
                    )}
                    <button className="admin-btn danger" style={{ width: 24, height: 24, fontSize: 11, flexShrink: 0 }}
                      onClick={() => removeSlot(i)}>×</button>
                  </div>
                  {/* Focal picker expanded */}
                  {isEditing && type !== 'video' && (
                    <FocalPicker src={s} focal={focal}
                      onChange={val => setFocal(i, val)} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Add URL */}
          <label className="login-field">
            <span>+ {lang === 'ru' ? 'URL (картинка / mp4 / youtube)' : 'URL (image / mp4 / youtube)'}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={urlInput} onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addUrl()}
                placeholder="https://..." style={{ flex: 1 }} />
              <button className="btn btn-primary" style={{ fontSize: 12, padding: '6px 14px', flexShrink: 0 }} onClick={addUrl}>+</button>
            </div>
          </label>

          {/* Upload file */}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button className="btn" style={{ fontSize: 12 }} onClick={() => fileRef.current?.click()}>
              📷 {lang === 'ru' ? 'Загрузить файл' : 'Upload file'}
            </button>
            <input ref={fileRef} type="file" accept="image/*,video/mp4,video/webm" style={{ display: 'none' }} onChange={handleFile} />
          </div>
        </div>

        <button className="btn btn-primary" style={{ marginTop: 6, justifyContent: 'center' }}
          onClick={() => { onSaveRef.current(draftRef.current); dirtyRef.current = false; onClose(); }}>
          {lang === 'ru' ? 'Готово' : 'Done'}
        </button>
    </div>
  );
}

function RecentWorks({ t, lang, onGoTo, admin }) {
  const [tilesData, saveTilesData] = useSetting('recent_tiles', DEFAULT_TILES);
  const tiles = Array.isArray(tilesData) && tilesData.length === 4 ? tilesData : DEFAULT_TILES;
  const [editorOpen, setEditorOpen] = homeState(false);
  const [activeTab, setActiveTab] = homeState(0);

  function saveTile(i, updated) {
    const next = tiles.map((tl, idx) => idx === i ? { ...tl, ...updated } : tl);
    saveTilesData(next);
  }

  return (
    <div className="recent-strip">
      <div className="home-section-head">
        <h2 className="home-section-title"><em>{t.home.recent}</em></h2>
        {admin && (
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 14px' }}
            onClick={() => setEditorOpen(true)}>
            ✎ {lang === 'ru' ? 'Редактировать плашки' : 'Edit tiles'}
          </button>
        )}
      </div>
      <div className="recent-tiles">
        {tiles.map((tile, i) => (
          <RecentTile key={i} tileData={tile} lang={lang} onClick={() => onGoTo('portfolio')} />
        ))}
      </div>
      {admin && editorOpen && (
        <Modal open={true} onClose={() => setEditorOpen(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '86vh', overflowY: 'auto' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 22, margin: 0 }}>
              {lang === 'ru' ? 'Плашки последних работ' : 'Recent works tiles'}
            </h3>
            {/* Разделы — по одной вкладке на плашку */}
            <div style={{ display: 'flex', gap: 6 }}>
              {tiles.map((tile, i) => (
                <button key={i} onClick={() => setActiveTab(i)}
                  className={activeTab === i ? 'btn btn-primary' : 'btn'}
                  style={{ flex: 1, fontSize: 11, padding: '8px 4px', justifyContent: 'center' }}>
                  {tile.label || `#${i + 1}`}
                </button>
              ))}
            </div>
            <RecentTileEditor
              key={activeTab}
              tile={tiles[activeTab]}
              lang={lang}
              onSave={updated => saveTile(activeTab, updated)}
              onClose={() => setEditorOpen(false)}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

function HomeSection({ t, lang, admin, onGoTo }) {
  const linksRes = useResource('links', DEFAULT_LINKS);
  const [bannerCfg] = useSetting('banner', {});
  const links = linksRes.items;
  
  return (
    <div className="home anim-in">
      <section className="hero">
        <div className="hero-art"></div>
        <div className="hero-content">
          <div className="hero-text">
            <span className="hero-eyebrow">
              <span className="status-lamp" data-status={bannerCfg.banner_status || 'open'}></span>
              {(bannerCfg.banner_status || 'open') === 'closed'
                ? (lang === 'ru' ? 'Заказы закрыты' : 'Commissions closed')
                : (bannerCfg.banner_status || 'open') === 'waitlist'
                ? (lang === 'ru' ? 'Лист ожидания' : 'Waitlist')
                : t.home.eyebrow}
            </span>
            <h1 className="hero-title">
              {t.home.hi} <em>{t.home.name}</em>.
            </h1>
            <p className="hero-sub">{t.home.bio}</p>
            <div className="hero-cta-row">
              <button className="btn btn-primary" onClick={() => onGoTo('calculator')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="2" width="16" height="20" rx="2"></rect>
                  <line x1="8" y1="6" x2="16" y2="6"></line>
                  <line x1="8" y1="14" x2="8.01" y2="14"></line>
                  <line x1="12" y1="14" x2="12.01" y2="14"></line>
                  <line x1="16" y1="14" x2="16.01" y2="14"></line>
                  <line x1="8" y1="18" x2="16" y2="18"></line>
                </svg>
                {t.home.ctaCalc}
              </button>
              <button className="btn btn-ghost" onClick={() => onGoTo('portfolio')}>
                {t.home.ctaPortfolio} →
              </button>
            </div>
            <HeroSocials links={links} admin={admin} linksRes={linksRes} lang={lang} />
          </div>
          <div className="hero-side">
            <div className="hero-side-mark"></div>
          </div>
        </div>
      </section>

      <div className="shell">
        <CommissionBanner t={t} lang={lang} onGoTo={onGoTo} admin={admin} />
        <RecentWorks t={t} lang={lang} onGoTo={onGoTo} admin={admin} />

        <div className="home-cta">
          <div className="home-cta-text">
            <h3><em>{t.home.ctaCardTitle}</em></h3>
            <p>{t.home.ctaCardSub}</p>
          </div>
          <button className="btn btn-primary" onClick={() => onGoTo('calculator')}>
            {t.home.ctaCardBtn} →
          </button>
        </div>
      </div>
    </div>);

}

Object.assign(window, { HomeSection });
  