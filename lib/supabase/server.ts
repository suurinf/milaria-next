import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value; },
        set(name, value, options) {
          try { cookieStore.set({ name, value, ...options }); } catch {}
        },
        remove(name, options) {
          try { cookieStore.set({ name, value: '', ...options }); } catch {}
        },
      },
    }
  );
}

// Fetch all data needed for the site in one pass
export async function fetchSiteData() {
  const supabase = createClient();
  const [
    { data: queue },
    { data: portfolioCategories },
    { data: portfolioImages },
    { data: prices },
    { data: calcOptions },
    { data: debts },
    { data: links },
    { data: settings },
  ] = await Promise.all([
    supabase.from('queue_items').select('*').order('sort_order'),
    supabase.from('portfolio_categories').select('*').order('sort_order'),
    supabase.from('portfolio_images').select('*').order('sort_order'),
    supabase.from('prices').select('*').order('sort_order'),
    supabase.from('calc_options').select('*').order('sort_order'),
    supabase.from('debts').select('*').order('sort_order'),
    supabase.from('links').select('*').order('sort_order'),
    supabase.from('settings').select('*'),
  ]);

  const settingsMap: Record<string, any> = {};
  for (const s of settings || []) settingsMap[s.key] = s.value;

  return {
    queue: queue || [],
    portfolioCategories: portfolioCategories || [],
    portfolioImages: portfolioImages || [],
    prices: prices || [],
    calcOptions: calcOptions || [],
    debts: debts || [],
    links: links || [],
    settings: settingsMap,
  };
}
