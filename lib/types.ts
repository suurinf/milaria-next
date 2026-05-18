export type QueueItem = {
  id: string;
  kind: 'in_progress' | 'completed';
  title: string;
  progress: number;
  tag: string | null;
  completed_date: string | null;
  sort_order: number;
};

export type PortfolioCategory = {
  id: string;
  key: string;
  kind: 'model' | 'illustration';
  count: number;
  hue: number;
  sort_order: number;
  video_url?: string;
};

export type PortfolioImage = {
  id: string;
  category_id: string;
  image_data: string;
  is_cover: boolean;
  sort_order: number;
};

export type Price = {
  id: string;
  title: string;
  rub: number;
  image: string;
  sort_order: number;
};

export type CalcOption = {
  id: string;
  category: string;
  variant: string;
  group_type: 'base' | 'addon';
  label_ru: string;
  label_en: string;
  rub: number;
  has_qty: boolean;
  sort_order: number;
};

export type Debt = {
  id: string;
  title: string;
  stream_date: string;
  reason: string;
  status: 'open' | 'inProgress' | 'done';
  progress: number;
  sort_order: number;
};

export type Link = {
  id: string;
  label: string;
  handle: string;
  url: string;
  kind: 'social' | 'stream' | 'video' | 'chat' | 'support' | 'mail';
  sort_order: number;
};

export type SiteData = {
  queue: QueueItem[];
  portfolioCategories: PortfolioCategory[];
  portfolioImages: PortfolioImage[];
  prices: Price[];
  calcOptions: CalcOption[];
  debts: Debt[];
  links: Link[];
  settings: Record<string, any>;
};
