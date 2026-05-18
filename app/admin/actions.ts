'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  return supabase;
}

export async function upsertRow(table: string, row: any) {
  const supabase = await requireAdmin();
  // text-id tables need id, uuid tables auto-generate
  if (!row.id) delete row.id;
  const { data, error } = await supabase.from(table).upsert(row).select().single();
  if (error) throw new Error(error.message);
  revalidatePath('/');
  revalidatePath('/queue');
  revalidatePath('/portfolio');
  revalidatePath('/prices');
  revalidatePath('/calculator');
  revalidatePath('/debts');
  return data;
}

export async function deleteRow(table: string, id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/');
  revalidatePath('/queue');
  revalidatePath('/portfolio');
  revalidatePath('/prices');
  revalidatePath('/calculator');
  revalidatePath('/debts');
  return true;
}

export async function setSetting(key: string, value: any) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from('settings').upsert({ key, value });
  if (error) throw new Error(error.message);
  revalidatePath('/');
  return true;
}
