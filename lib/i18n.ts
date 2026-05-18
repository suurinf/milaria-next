export const I18N = {
  ru: {
    nav: { home: 'Главная', queue: 'Очередь', portfolio: 'Портфолио', calculator: 'Калькулятор', prices: 'Прайс', debts: 'Долги' },
    home: { eyebrow: 'Принимаю заказы', greeting1: 'Привет, меня зовут', greeting2: 'Мила', subtitle: 'Стример · художник · риггер. Работаю с VTuber-моделями, иллюстрациями, чибиками и Live2D-ригом.' },
    queue: { tag: '✦ очередь', title: 'Что в работе', inProgress: 'В работе', completed: 'Готово', empty: 'Сейчас тут пусто', progress: 'прогресс', addNew: 'Добавить заказ' },
    portfolio: { tag: '✦ портфолио', title: 'Работы', models: 'Модели', illustrations: 'Иллюстрации', categories: { vtuber: 'VTuber', chibi: 'Чибики', png: 'PNG', portrait: 'Портреты', other: 'Другое' } },
    prices: { tag: '✦ прайс', title: 'Услуги и цены' },
    debts: { tag: '✦ долги', title: 'Долги', status: { open: 'Открыт', inProgress: 'В работе', done: 'Готово' } },
    links: { tag: '✦ связь', title: 'Ссылки' },
    calculator: { tag: '✦ калькулятор', title: 'Подсчёт стоимости', total: 'Итого', empty: 'Выбери опции' },
    banner: { open: 'Слоты открыты', closed: 'Слоты закрыты', waitlist: 'Лист ожидания', titleOpen: 'Открыты заказы на', titleClosed: 'Заказы закрыты', titleWaitlist: 'Лист ожидания на' },
  },
  en: {
    nav: { home: 'Home', queue: 'Queue', portfolio: 'Portfolio', calculator: 'Calculator', prices: 'Prices', debts: 'Debts' },
    home: { eyebrow: 'Taking commissions', greeting1: 'Hi, my name is', greeting2: 'Mila', subtitle: 'Streamer · artist · rigger. Working with VTuber models, illustrations, chibis and Live2D rigs.' },
    queue: { tag: '✦ queue', title: 'In progress', inProgress: 'In progress', completed: 'Done', empty: 'Nothing here', progress: 'progress', addNew: 'Add order' },
    portfolio: { tag: '✦ portfolio', title: 'Works', models: 'Models', illustrations: 'Illustrations', categories: { vtuber: 'VTuber', chibi: 'Chibi', png: 'PNG', portrait: 'Portraits', other: 'Other' } },
    prices: { tag: '✦ prices', title: 'Services & rates' },
    debts: { tag: '✦ debts', title: 'Debts', status: { open: 'Open', inProgress: 'In progress', done: 'Done' } },
    links: { tag: '✦ contact', title: 'Links' },
    calculator: { tag: '✦ calculator', title: 'Price calculator', total: 'Total', empty: 'Pick options' },
    banner: { open: 'Slots open', closed: 'Slots closed', waitlist: 'Waitlist', titleOpen: 'Commissions open for', titleClosed: 'Commissions closed', titleWaitlist: 'Waitlist for' },
  },
};

export type Lang = 'ru' | 'en';
export type I18n = typeof I18N.ru;
