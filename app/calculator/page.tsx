import { fetchSiteData } from '@/lib/supabase/server';
import CalculatorContent from '@/components/calculator/CalculatorContent';
import RealtimeRefresher from '@/components/RealtimeRefresher';

export default async function CalculatorPage() {
  const data = await fetchSiteData();
  return (
    <>
      <CalculatorContent options={data.calcOptions} />
      <RealtimeRefresher tables={['calc_options']} />
    </>
  );
}
