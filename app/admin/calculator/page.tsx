import { fetchSiteData } from '@/lib/supabase/server';
import AdminTable from '@/components/admin/AdminTable';

export default async function AdminCalc() {
  const data = await fetchSiteData();
  return (
    <AdminTable
      table="calc_options"
      title="Опции калькулятора"
      idPrefix="opt"
      rows={data.calcOptions}
      fields={[
        { key: 'label_ru', label: 'Название (RU)', type: 'text' },
        { key: 'label_en', label: 'Label (EN)', type: 'text' },
        { key: 'rub', label: 'Цена (₽)', type: 'number', default: 0 },
        { key: 'category', label: 'Категория', type: 'select', default: 'vtuber', options: [
          { value: 'vtuber', label: 'VTuber' },
          { value: 'chibi', label: 'Chibi' },
          { value: 'png', label: 'PNG' },
          { value: 'illust', label: 'Иллюстрация' },
        ]},
        { key: 'variant', label: 'Вариант (a/b/c)', type: 'text', default: 'a' },
        { key: 'group_type', label: 'Группа', type: 'select', default: 'base', options: [
          { value: 'base', label: 'База' },
          { value: 'addon', label: 'Дополнительно' },
        ]},
        { key: 'has_qty', label: 'С количеством?', type: 'select', default: 'false', options: [
          { value: 'false', label: 'Нет' },
          { value: 'true', label: 'Да' },
        ]},
        { key: 'sort_order', label: 'Порядок', type: 'number', default: 0 },
      ]}
    />
  );
}
