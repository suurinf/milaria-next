import { fetchSiteData } from '@/lib/supabase/server';
import PricesContent from '@/components/prices/PricesContent';
import RealtimeRefresher from '@/components/RealtimeRefresher';

export default async function PricesPage() {
  const data = await fetchSiteData();
  return (
    <>
      <PricesContent prices={data.prices} />
      <RealtimeRefresher tables={['prices']} />
    </>
  );
}
