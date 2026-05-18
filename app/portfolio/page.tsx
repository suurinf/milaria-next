import { fetchSiteData } from '@/lib/supabase/server';
import PortfolioContent from '@/components/portfolio/PortfolioContent';
import RealtimeRefresher from '@/components/RealtimeRefresher';

export default async function PortfolioPage() {
  const data = await fetchSiteData();
  return (
    <>
      <PortfolioContent
        categories={data.portfolioCategories}
        images={data.portfolioImages}
      />
      <RealtimeRefresher tables={['portfolio_categories', 'portfolio_images']} />
    </>
  );
}
