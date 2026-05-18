import { fetchSiteData } from '@/lib/supabase/server';
import AdminTable from '@/components/admin/AdminTable';

export default async function AdminPrices() {
  const data = await fetchSiteData();
  return (
    <AdminTable
      table="prices"
      title="Прайс"
      rows={data.prices}
      fields={[
        { key: 'title', label: 'Название', type: 'text' },
        { key: 'rub', label: 'Цена (₽)', type: 'number', default: 0 },
        { key: 'image', label: 'URL картинки', type: 'text' },
        { key: 'sort_order', label: 'Порядок', type: 'number', default: 0 },
      ]}
    />
  );
}
