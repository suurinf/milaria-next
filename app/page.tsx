import { fetchSiteData } from '@/lib/supabase/server';
import HomeContent from '@/components/home/HomeContent';
import RealtimeRefresher from '@/components/RealtimeRefresher';

export default async function HomePage() {
  const data = await fetchSiteData();
  return (
    <>
      <HomeContent
        banner={data.settings.banner || {}}
        links={data.links}
        portfolioCategories={data.portfolioCategories}
        portfolioImages={data.portfolioImages}
      />
      <RealtimeRefresher tables={['settings', 'links', 'portfolio_categories', 'portfolio_images']} />
    </>
  );
}
