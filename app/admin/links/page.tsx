import { fetchSiteData } from '@/lib/supabase/server';
import AdminTable from '@/components/admin/AdminTable';

export default async function AdminLinks() {
  const data = await fetchSiteData();
  return (
    <AdminTable
      table="links"
      title="Ссылки"
      rows={data.links}
      fields={[
        { key: 'label', label: 'Название', type: 'text' },
        { key: 'handle', label: 'Handle / @', type: 'text' },
        { key: 'url', label: 'URL', type: 'text' },
        { key: 'kind', label: 'Тип', type: 'select', default: 'social', options: [
          { value: 'social', label: 'Соц. сеть' },
          { value: 'stream', label: 'Стрим' },
          { value: 'video', label: 'Видео' },
          { value: 'chat', label: 'Чат' },
          { value: 'support', label: 'Поддержка' },
          { value: 'mail', label: 'Email' },
        ]},
        { key: 'sort_order', label: 'Порядок', type: 'number', default: 0 },
      ]}
    />
  );
}
