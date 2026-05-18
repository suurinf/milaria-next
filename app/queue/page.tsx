import { fetchSiteData } from '@/lib/supabase/server';
import QueueContent from '@/components/queue/QueueContent';
import RealtimeRefresher from '@/components/RealtimeRefresher';

export default async function QueuePage() {
  const data = await fetchSiteData();
  return (
    <>
      <QueueContent items={data.queue} />
      <RealtimeRefresher tables={['queue_items']} />
    </>
  );
}
