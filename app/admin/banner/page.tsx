import { fetchSiteData } from '@/lib/supabase/server';
import BannerEditor from '@/components/admin/BannerEditor';

export default async function AdminBanner() {
  const data = await fetchSiteData();
  return <BannerEditor initial={data.settings.banner || {}} />;
}
