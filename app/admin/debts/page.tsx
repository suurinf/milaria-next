import { fetchSiteData } from '@/lib/supabase/server';
import AdminTable from '@/components/admin/AdminTable';

export default async function AdminDebts() {
  const data = await fetchSiteData();
  return (
    <AdminTable
      table="debts"
      title="Долги"
      rows={data.debts}
      fields={[
        { key: 'title', label: 'Название', type: 'text' },
        { key: 'stream_date', label: 'Дата стрима', type: 'date' },
        { key: 'reason', label: 'Причина', type: 'text' },
        { key: 'status', label: 'Статус', type: 'select', default: 'open', options: [
          { value: 'open', label: 'Открыт' },
          { value: 'inProgress', label: 'В работе' },
          { value: 'done', label: 'Готово' },
        ]},
        { key: 'progress', label: 'Прогресс (%)', type: 'number', default: 0 },
        { key: 'sort_order', label: 'Порядок', type: 'number', default: 0 },
      ]}
    />
  );
}
