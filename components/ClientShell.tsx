'use client';
import { createContext, useContext, useState, ReactNode } from 'react';
import { Lang, I18N } from '@/lib/i18n';
import TopNav from './nav/TopNav';
import BackgroundLayer from './nav/BackgroundLayer';

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  currency: 'rub' | 'usd';
  setCurrency: (c: 'rub' | 'usd') => void;
};

const SiteContext = createContext<Ctx | null>(null);
export const useSite = () => {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used within ClientShell');
  return ctx;
};

export const useT = () => I18N[useSite().lang];

export function ClientShell({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('ru');
  const [currency, setCurrency] = useState<'rub' | 'usd'>('rub');

  return (
    <SiteContext.Provider value={{ lang, setLang, currency, setCurrency }}>
      <BackgroundLayer />
      <TopNav />
      {children}
    </SiteContext.Provider>
  );
}
