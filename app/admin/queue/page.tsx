import { fetchSiteData } from '@/lib/supabase/server';
import AdminTable from '@/components/admin/AdminTable';

export default async function AdminQueue() {
  const data = await fetchSiteData();
  return (
    <AdminTable
      table="queue_items"
      title="Очередь"
      rows={data.queue}
      fields={[
        { key: 'title', label: 'Название', type: 'text' },
        { key: 'progress', label: 'Прогресс (%)', type: 'number', default: 0 },
        { key: 'tag', label: 'Тег', type: 'select', default: '', options: [
          { value: '', label: '— нет —' },
          { value: 'paid', label: 'Оплачено' },
          { value: 'free', label: 'Бесплатно' },
          { value: 'secret', label: 'Секрет' },
        ]},
        { key: 'kind', label: 'Статус', type: 'select', default: 'in_progress', options: [
          { value: 'in_progress', label: 'В работе' },
          { value: 'completed', label: 'Готово' },
        ]},
        { key: 'sort_order', label: 'Порядок', type: 'number', default: 0 },
      ]}
    />
  );
}
