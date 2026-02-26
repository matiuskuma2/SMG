'use server';

import { createClient } from '@/lib/supabase/server';
import type { MstDmLabel } from '@/lib/supabase/types';
import dayjs from 'dayjs';

export const fetchLabels = async () => {
  const client = createClient();
  const { data, error } = await client
    .from('mst_dm_label')
    .select()
    .is('deleted_at', null);

  if (error) return [];

  return data;
};

export const insertLabels = async (labels: MstDmLabel[]) => {
  const client = createClient();
  const createdAt = dayjs().toISOString();

  const { data, error } = await client
    .from('mst_dm_label')
    .insert(
      labels.map((d) => ({
        name: d.name,
        color: d.color,
        created_at: createdAt,
        updated_at: createdAt,
      })),
    )
    .select();

  if (error) return false;

  return data;
};

export const updateLabels = async (labels: MstDmLabel[]) => {
  const client = createClient();
  const updatedAt = dayjs().toISOString();

  const updateSingle = async (label: MstDmLabel) => {
    const { data, error } = await client
      .from('mst_dm_label')
      .update({
        name: label.name,
        color: label.color,
        updated_at: label.updated_at,
      })
      .eq('label_id', label.label_id)
      .select();

    if (error) throw error;

    return data;
  };

  try {
    await Promise.all(
      labels.map((d) => updateSingle({ ...d, updated_at: updatedAt })),
    );
  } catch {
    return false;
  }

  return true;
};

export const deleteLabels = async (labels: MstDmLabel[]) => {
  const client = createClient();
  const deletedAt = dayjs().toISOString();
  const ids = labels.map((d) => d.label_id);

  const { data, error } = await client
    .from('mst_dm_label')
    .update({
      deleted_at: deletedAt,
    })
    .in('label_id', ids)
    .select();

  return Boolean(!error);
};
