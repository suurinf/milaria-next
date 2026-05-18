import { fetchSiteData } from '@/lib/supabase/server';
import DebtsContent from '@/components/debts/DebtsContent';
import RealtimeRefresher from '@/components/RealtimeRefresher';

export default async function DebtsPage() {
  const data = await fetchSiteData();
  return (
    <>
      <DebtsContent debts={data.debts} />
      <RealtimeRefresher tables={['debts']} />
    </>
  );
}
