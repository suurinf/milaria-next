'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function RealtimeRefresher({ tables }: { tables: string[] }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channels = tables.map(table =>
      supabase.channel(`rt:${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
          router.refresh(); // re-fetches SSR data + re-renders, but preserves state
        })
        .subscribe()
    );
    return () => { channels.forEach(c => supabase.removeChannel(c)); };
  }, [tables.join(','), router]);

  return null;
}
