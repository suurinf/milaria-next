
// data.js — Все данные сайта milaria (заказы, портфолио, прайс, переводы)
// Чтобы это редактировалось без кода — данные читаются из localStorage если есть,
// иначе берутся отсюда по умолчанию.

const I18N = {
  ru: {
    nav: {
      home: "Главная",
      queue: "Очередь заказов",
      portfolio: "Портфолио",
      calculator: "Калькулятор",
      debts: "Twitch долги",
      links: "Ссылки",
      tos: "Условия / T.O.S.",
    },
    home: {
      eyebrow: "Принимаю заказы",
      hi: "Привет, меня зовут",
      name: "Мила",
      bio: "Стример · художник · риггер. Работаю с VTuber-моделями, иллюстрациями, чибиками и Live2D-ригом.",
      ctaCalc: "Рассчитать заказ",
      ctaPortfolio: "Смотреть портфолио",
      recent: "Последние работы",
      recentMeta: "Свежие иллюстрации и модели",
      ctaCardTitle: "Хочешь свою модель или арт?",
      ctaCardSub: "Загляни в калькулятор — прикинешь стоимость за пару минуту. По всем деталям дальше обсуждаем в личных сообщениях.",
      ctaCardBtn: "Открыть калькулятор",
    },
    queue: {
      title: "Очередь заказов",
      subtitle: "Что сейчас в работе и что уже отдано клиентам",
      inProgress: "В работе",
      completed: "Выполнено",
      paid: "оплачено",
      prepaid: "предоплата",
      free: "бесплатно",
      secret: "секретка",
      progress: "прогресс",
      ready: "готово",
      done: "Завершён",
      search: "Поиск по заказам…",
      sort: { progress: "по прогрессу", priority: "по приоритету", new: "сначала новые", old: "сначала старые" },
      filter: { all: "все", paid: "оплачено", free: "бесплатно" },
      empty: "Здесь пока пусто",
      addNew: "+ Добавить заказ",
    },
    portfolio: {
      title: "Портфолио",
      subtitle: "Что я умею и в каком виде это бывает",
      models: "Модели",
      illustrations: "Иллюстрации",
      categories: {
        vtuber: "2Д модели",
        ych: "YCH модели",
        png: "PNG модели",
        portrait: "Портреты",
        halfFull: "Half / Full body",
        chibi: "Чиби",
        ref: "Design / Ref. Sheet",
        smiles: "Смайлы | Панели | Алерты",
      },
      view: "Открыть",
      pieces: "работ",
      addNew: "+ Загрузить",
    },
    calculator: {
      title: "Калькулятор",
      subtitle: "Прикинуть стоимость заказа",
      result: "Примерная стоимость",
      note: "Это только примерная средняя цена. После обсуждения деталей она может измениться в ту или иную сторону.",
      hintTab: "Выбери тип заказа, потом включай нужные опции",
      qty: "Кол-во",
      cats: {
        vtuber: "2Д модель",
        chibi: "Чиби модель",
        rig: "Ригг/Анимация",
        png: "PNG модель",
        illust: "Иллюстрация",
      },
      groupBase: "База",
      groupAddon: "Дополнения",
    },
    debts: {
      title: "Twitch долги",
      subtitle: "Невыполненные обещания со стримов. Стараюсь закрыть всё.",
      streamFrom: "стрим от",
      reason: "обещание",
      status: { open: "открыт", inProgress: "в работе", done: "закрыт" },
      empty: "Сейчас долгов нет ✦",
    },
    links: {
      title: "Где меня найти",
      subtitle: "Все соцсети и контакты в одном месте",
      copy: "копировать",
      copied: "скопировано!",
    },
    common: {
      currency: "₽",
      currencyName: "руб.",
      lang: "RU",
      langSwitch: "EN",
      adminOn: "Режим редактирования",
      adminOff: "Только просмотр",
      save: "Сохранить",
      cancel: "Отмена",
      delete: "Удалить",
      edit: "Изменить",
      reset: "Сбросить данные",
    },
  },
  en: {
    nav: {
      home: "Home",
      queue: "Order queue",
      portfolio: "Portfolio",
      calculator: "Calculator",
      debts: "Twitch debts",
      links: "Links",
      tos: "Terms / T.O.S.",
    },
    home: {
      eyebrow: "Taking commissions",
      hi: "Hi, I'm",
      name: "Mila",
      bio: "Streamer · artist · rigger. I work with VTuber models, illustrations, chibi, and Live2D rigging.",
      ctaCalc: "Estimate a commission",
      ctaPortfolio: "See portfolio",
      recent: "Recent work",
      recentMeta: "Fresh illustrations and models",
      ctaCardTitle: "Want your own model?",
      ctaCardSub: "Try the calculator — get an estimate in a minute. We discuss the rest in DMs.",
      ctaCardBtn: "Open calculator",
    },
    queue: {
      title: "Order queue",
      subtitle: "What's in progress and what has shipped",
      inProgress: "In progress",
      completed: "Completed",
      paid: "paid",
      prepaid: "prepaid",
      free: "free",
      secret: "secret",
      progress: "progress",
      ready: "done",
      done: "Finished",
      search: "Search orders…",
      sort: { progress: "by progress", priority: "by priority", new: "newest first", old: "oldest first" },
      filter: { all: "all", paid: "paid", free: "free" },
      empty: "Nothing here yet",
      addNew: "+ Add order",
    },
    portfolio: {
      title: "Portfolio",
      subtitle: "What I make and what shape it takes",
      models: "Models",
      illustrations: "Illustrations",
      categories: {
        vtuber: "2D models",
        ych: "YCH models",
        png: "PNG models",
        portrait: "Portraits",
        halfFull: "Half / Full body",
        chibi: "Chibi",
        ref: "Design / Ref. Sheet",
        smiles: "Smiles | Panels | Alerts",
      },
      view: "Open",
      pieces: "pieces",
      addNew: "+ Upload",
    },
    calculator: {
      title: "Calculator",
      subtitle: "Estimate the cost of an order",
      result: "Estimated cost",
      note: "This is just a rough average. After we discuss the details it may go up or down.",
      hintTab: "Pick a type, then toggle options",
      qty: "Qty",
      cats: {
        vtuber: "2D model",
        chibi: "Chibi model",
        rig: "Rig/Animation",
        png: "PNG model",
        illust: "Illustration",
      },
      groupBase: "Base",
      groupAddon: "Add-ons",
    },
    debts: {
      title: "Twitch debts",
      subtitle: "Promises from streams I haven't fulfilled yet. Working on it.",
      streamFrom: "stream from",
      reason: "promise",
      status: { open: "open", inProgress: "in progress", done: "closed" },
      empty: "No debts right now ✦",
    },
    links: {
      title: "Where to find me",
      subtitle: "All socials and contacts in one place",
      copy: "copy",
      copied: "copied!",
    },
    common: {
      currency: "$",
      currencyName: "USD",
      lang: "EN",
      langSwitch: "RU",
      adminOn: "Edit mode",
      adminOff: "View only",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      reset: "Reset data",
    },
  },
};

// Курс примерно 1 USD = 95 RUB. Можно крутить.

// Очередь — только реальные данные из Supabase.
// Раньше здесь лежали демо-заказы из сайта-референса: при загрузке они
// успевали отрисоваться до прихода настоящих и мелькали чужими именами.
const DEFAULT_QUEUE_IN_PROGRESS = [];
const DEFAULT_QUEUE_COMPLETED = [];

// Портфолио — заглушки, пользователь загрузит свои
const DEFAULT_PORTFOLIO = {
  models: [
    { id: "m-vtuber", key: "vtuber", count: 12, hue: 320 },
    { id: "m-ych",    key: "ych",    count: 5,  hue: 30 },
    { id: "m-png",    key: "png",    count: 8,  hue: 140 },
  ],
  illustrations: [
    { id: "i-portrait", key: "portrait", count: 24, hue: 280 },
    { id: "i-half",     key: "halfFull", count: 18, hue: 340 },
    { id: "i-chibi",    key: "chibi",    count: 30, hue: 40  },
    { id: "i-ref",      key: "ref",      count: 6,  hue: 0   },
    { id: "i-smiles",   key: "smiles",   count: 14, hue: 350 },
  ],
};

// Прайс в рублях. Конвертируется в USD автоматически.
const DEFAULT_PRICES = [
  { id: "p1",  key: "Portrait",                   rub: 3000  },
  { id: "p2",  key: "Half body",                  rub: 6000  },
  { id: "p3",  key: "Full body",                  rub: 8000  },
  { id: "p4",  key: "Chibi",                      rub: 5000  },
  { id: "p5",  key: "Smiles",                     rub: 1000  },
  { id: "p6",  key: "Smiles + dividing for Live2D", rub: 1500 },
  { id: "p7",  key: "Icons",                      rub: 600   },
  { id: "p8",  key: "Panels | Alert",             rub: 2000  },
  { id: "p9",  key: "Alert + dividing for Live2D",  rub: 5000 },
  { id: "p10", key: "Chibi PNG model",            rub: 5000  },
  { id: "p11", key: "Half body PNG model",        rub: 8000  },
  { id: "p12", key: "Full body PNG model",        rub: 10000 },
  { id: "p13", key: "VTuber model",               rub: 60000 },
  { id: "p14", key: "Chibi model v.1",            rub: 8000  },
  { id: "p15", key: "Chibi model v.2",            rub: 5000  },
  { id: "p16", key: "Background",                 rub: 12000 },
  { id: "p17", key: "Background + dividing for Live2D", rub: 17000 },
  { id: "p18", key: "Reference sheet",            rub: 10000 },
];

// Калькулятор — категории с подвариантами (art only / art + rig / etc.)
const DEFAULT_CALC = {
  vtuber: {
    labelKey: 'vtuber',
    variants: {
      art: {
        ru: 'Только арт', en: 'Art only',
        base: [
          { id: "v-a-concept",  ru: "Концепт",             en: "Concept",              rub: 10300, qty: true },
          { id: "v-a-model",    ru: "Полная модель (face + body)", en: "Full model (face + body)", rub: 35000 },
        ],
        addon: [
          { id: "v-a-hair",     ru: "Волосы",        en: "Hair",        rub: 19400, qty: true },
          { id: "v-a-costume",  ru: "Костюмы",       en: "Costumes",    rub: 17200, qty: true },
          { id: "v-a-hands",    ru: "Позы рук",      en: "Hand poses",  rub: 3500,  qty: true },
          { id: "v-a-sleeves",  ru: "Рукава",        en: "Sleeves",     rub: 3000 },
          { id: "v-a-emotions", ru: "Эмоции",        en: "Emotions",    rub: 4000,  qty: true },
          { id: "v-a-items",    ru: "Итемы",         en: "Items",       rub: 2000,  qty: true },
          { id: "v-a-mascot",   ru: "Маскот",        en: "Mascot",      rub: 8000 },
          { id: "v-a-wings",    ru: "Крылья",        en: "Wings",       rub: 6500 },
          { id: "v-a-tail",     ru: "Хвост",         en: "Tail",        rub: 4000 },
          { id: "v-a-horns",    ru: "Рога",          en: "Horns",       rub: 3000 },
          { id: "v-a-ears",     ru: "Уши",           en: "Ears",        rub: 2500 },
          { id: "v-a-fx",       ru: "Эффекты",       en: "Effects",     rub: 5000 },
          { id: "v-a-nsfw",     ru: "NSFW",          en: "NSFW",        rub: 10000 },
        ],
      },
      rig: {
        ru: 'Арт + риг', en: 'Art + Live2D rig',
        base: [
          { id: "v-r-concept",  ru: "Концепт",                       en: "Concept",                       rub: 10300, qty: true },
          { id: "v-r-model",    ru: "Полная модель + риг Live2D",    en: "Full model + Live2D rig",        rub: 60000 },
        ],
        addon: [
          { id: "v-r-hair",     ru: "Волосы (разделение для рига)",  en: "Hair (rig-ready)",   rub: 19400, qty: true },
          { id: "v-r-costume",  ru: "Костюмы (разделение для рига)", en: "Costumes (rig-ready)",rub: 17200, qty: true },
          { id: "v-r-hands",    ru: "Позы рук",                      en: "Hand poses",          rub: 3500,  qty: true },
          { id: "v-r-emotions", ru: "Эмоции (со слоями)",            en: "Emotions (layered)",  rub: 5000,  qty: true },
          { id: "v-r-items",    ru: "Итемы",                         en: "Items",               rub: 2000,  qty: true },
          { id: "v-r-mascot",   ru: "Маскот",                        en: "Mascot",              rub: 8000 },
          { id: "v-r-gamepad",  ru: "Геймпад",                       en: "Gamepad",             rub: 2500 },
          { id: "v-r-patpat",   ru: "Пат-пат анимация",              en: "Pat-pat animation",   rub: 3500 },
          { id: "v-r-physics",  ru: "Физика волос/одежды",           en: "Hair/cloth physics",  rub: 4000 },
          { id: "v-r-extra-eyes", ru: "Доп. глаза",                  en: "Extra eyes",          rub: 3500 },
          { id: "v-r-fx",       ru: "Эффекты со слоями",             en: "Effects (layered)",   rub: 5500 },
          { id: "v-r-nsfw",     ru: "NSFW",                          en: "NSFW",                rub: 12000 },
        ],
      },
    },
  },
  chibi: {
    labelKey: 'chibi',
    variants: {
      art: {
        ru: 'Только арт', en: 'Art only',
        base: [
          { id: "c-a-base",   ru: "Чиби модель",   en: "Chibi model",  rub: 5000 },
        ],
        addon: [
          { id: "c-a-emotions", ru: "Эмоции",        en: "Emotions",   rub: 1500, qty: true },
          { id: "c-a-costume",  ru: "Костюм",        en: "Costume",    rub: 3000, qty: true },
          { id: "c-a-props",    ru: "Аксессуары",    en: "Props",      rub: 1200, qty: true },
          { id: "c-a-bg",       ru: "Фон",           en: "Background", rub: 3000 },
        ],
      },
      rig: {
        ru: 'Арт + риг', en: 'Art + Live2D rig',
        base: [
          { id: "c-r-base", ru: "Чиби модель + риг Live2D", en: "Chibi model + Live2D rig", rub: 8000 },
        ],
        addon: [
          { id: "c-r-emotions", ru: "Эмоции (со слоями)",      en: "Emotions (layered)",    rub: 2000, qty: true },
          { id: "c-r-costume",  ru: "Костюм (разделение)",     en: "Costume (rig-ready)",   rub: 4000, qty: true },
          { id: "c-r-props",    ru: "Аксессуары",              en: "Props",                 rub: 1500, qty: true },
          { id: "c-r-physics",  ru: "Физика",                  en: "Physics",               rub: 2500 },
        ],
      },
    },
  },
  png: {
    labelKey: 'png',
    variants: {
      plus: {
        ru: 'PNG+', en: 'PNG+',
        base: [
          { id: "p-p-base", ru: "PNG+ модель (несколько поз)", en: "PNG+ model (multiple poses)", rub: 10000 },
        ],
        addon: [
          { id: "p-p-pose",     ru: "Доп. поза",      en: "Extra pose",      rub: 2500, qty: true },
          { id: "p-p-costume",  ru: "Костюм",         en: "Costume",         rub: 3000, qty: true },
          { id: "p-p-emotions", ru: "Эмоции",         en: "Emotions",        rub: 1500, qty: true },
          { id: "p-p-mascot",   ru: "Маскот",         en: "Mascot",          rub: 4000 },
          { id: "p-p-bg",       ru: "Фон",            en: "Background",      rub: 5000 },
        ],
      },
      basic: {
        ru: 'PNG', en: 'PNG',
        base: [
          { id: "p-b-base", ru: "PNG модель (1 поза)", en: "PNG model (1 pose)", rub: 5000 },
        ],
        addon: [
          { id: "p-b-emotions", ru: "Эмоции",  en: "Emotions",  rub: 1000, qty: true },
          { id: "p-b-items",    ru: "Итемы",   en: "Items",     rub: 800,  qty: true },
        ],
      },
    },
  },
  rig: {
    labelKey: 'rig',
    variants: {
      default: {
        ru: 'Ригг/Анимация', en: 'Rig/Animation',
        base: [
          { id: "r-live2d",     ru: "Live2D риг (базовый)",     en: "Live2D rig (basic)",     rub: 25000 },
          { id: "r-live2d-adv", ru: "Live2D риг (продвинутый)", en: "Live2D rig (advanced)",  rub: 40000 },
          { id: "r-l2d-full",   ru: "Live2D риг (полный)",      en: "Live2D rig (full)",      rub: 60000 },
        ],
        addon: [
          { id: "r-emote",    ru: "Эмоты",           en: "Emotes",          rub: 3500, qty: true },
          { id: "r-toggle",   ru: "Переключатели",    en: "Toggles",         rub: 2500, qty: true },
          { id: "r-physics",  ru: "Физика",           en: "Physics",         rub: 4000 },
          { id: "r-dance",    ru: "Танец/Анимация",   en: "Dance/Animation", rub: 8000 },
          { id: "r-idle",     ru: "Idle анимация",    en: "Idle animation",  rub: 5000 },
          { id: "r-vfx",      ru: "VFX эффекты",      en: "VFX effects",     rub: 6000 },
          { id: "r-tracking", ru: "Трекинг настройка",en: "Tracking setup",  rub: 3000 },
        ],
      },
    },
  },
};

const DEFAULT_DEBTS = [
  { id: "d1", title: "Чиби для @kuromiu",          stream: "2026-04-12", reason: "розыгрыш",     status: "inProgress", progress: 65 },
  { id: "d2", title: "Эмоция для @vinepop",        stream: "2026-04-05", reason: "донат-цель",   status: "open",       progress: 0  },
  { id: "d3", title: "Иконка для @sasacchi",       stream: "2026-03-21", reason: "розыгрыш",     status: "open",       progress: 20 },
  { id: "d4", title: "Скетч для @lunaaa",          stream: "2026-03-10", reason: "обещание",      status: "done",       progress: 100 },
];

const DEFAULT_LINKS = [
  { id: "l1",  label: "Twitch",     handle: "milaria",        url: "https://twitch.tv/milaria",        kind: "stream" },
  { id: "l2",  label: "YouTube",    handle: "@milaria",       url: "https://youtube.com/@milaria",     kind: "video"  },
  { id: "l3",  label: "Twitter / X", handle: "@milaria_art",  url: "https://x.com/milaria_art",        kind: "social" },
  { id: "l4",  label: "Bluesky",    handle: "milaria.bsky.social", url: "https://bsky.app/profile/milaria.bsky.social", kind: "social" },
  { id: "l5",  label: "Instagram",  handle: "@milaria.art",   url: "https://instagram.com/milaria.art", kind: "social" },
  { id: "l6",  label: "Telegram",   handle: "@milaria",       url: "https://t.me/milaria",             kind: "chat"   },
  { id: "l7",  label: "Discord",    handle: "milaria",        url: "#",                                kind: "chat"   },
  { id: "l8",  label: "Boosty",     handle: "milaria",        url: "https://boosty.to/milaria",        kind: "support" },
  { id: "l9",  label: "Ko-fi",      handle: "milaria",        url: "https://ko-fi.com/milaria",        kind: "support" },
  { id: "l10", label: "Email",      handle: "milariayt@gmail.com", url: "mailto:milariayt@gmail.com",      kind: "mail"   },
];

// helpers
function loadLS(key, fallback) {
  try {
    const raw = localStorage.getItem("milaria:" + key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) { return fallback; }
}
function saveLS(key, val) {
  try { localStorage.setItem("milaria:" + key, JSON.stringify(val)); } catch (e) {}
}
function clearLS() {
  try {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith("milaria:")) localStorage.removeItem(k);
    });
  } catch (e) {}
}

Object.assign(window, {
  I18N,
  DEFAULT_QUEUE_IN_PROGRESS, DEFAULT_QUEUE_COMPLETED,
  DEFAULT_PORTFOLIO, DEFAULT_PRICES, DEFAULT_CALC,
  DEFAULT_DEBTS, DEFAULT_LINKS,
  loadLS, saveLS, clearLS,
});

  