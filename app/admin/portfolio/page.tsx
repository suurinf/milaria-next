import { fetchSiteData } from '@/lib/supabase/server';
import PortfolioManager from '@/components/admin/PortfolioManager';

export default async function AdminPortfolio() {
  const data = await fetchSiteData();
  return (
    <PortfolioManager
      categories={data.portfolioCategories}
      images={data.portfolioImages}
    />
  );
}
