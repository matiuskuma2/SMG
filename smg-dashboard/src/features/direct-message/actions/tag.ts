'use server';

import { createClient } from '@/lib/supabase/server';
import dayjs from 'dayjs';

export const fetchTags = async () => {
  const client = createClient();
  const { data, error } = await client
    .from('mst_dm_tag')
    .select()
    .is('deleted_at', null);

  if (error) return [];

  return data;
};

export const fetchActivateTags = async (threadId: string) => {
  const client = createClient();
  const { data, error } = await client
    .from('trn_dm_thread_tag')
    .select('tag:tag_id(*)')
    .eq('thread_id', threadId);

  if (error) return [];

  return data.map((d) => d.tag.tag_id);
};

export const createTag = async (name: string, threadId?: string | null) => {
  const client = createClient();
  const createdAt = dayjs().toISOString();

  const { data, error } = await client
    .from('mst_dm_tag')
    .insert({
      name,
      created_at: createdAt,
      updated_at: createdAt,
    })
    .select()
    .single();

  if (error) return [];

  if (threadId) {
    await client.from('trn_dm_thread_tag').insert({
      thread_id: threadId,
      tag_id: data.tag_id,
      created_at: data.created_at,
      updated_at: data.created_at,
    });
  }

  return data;
};

export const updateBindToThread = async (
  threadId: string,
  diff: { added: string[]; removed: string[] },
) => {
  const client = createClient();
  const now = dayjs().toISOString();

  const [insertResult, deleteResult] = await Promise.all([
    client
      .from('trn_dm_thread_tag')
      .insert(
        diff.added.map((d) => ({
          thread_id: threadId,
          tag_id: d,
          created_at: now,
          updated_at: now,
        })),
      )
      .select(),
    client
      .from('trn_dm_thread_tag')
      .delete()
      .eq('thread_id', threadId)
      .in('tag_id', diff.removed),
  ]);

  if (insertResult.error || deleteResult.error) return false;

  return true;
};

export const updateTag = async (id: string, name: string) => {
  const client = createClient();
  const now = dayjs().toISOString();

  const { error } = await client
    .from('mst_dm_tag')
    .update({
      name,
      updated_at: now,
    })
    .eq('tag_id', id)
    .select();

  return Boolean(!error);
};

export const deleteTag = async (id: string) => {
  const client = createClient();
  const now = dayjs().toISOString();

  const { error } = await client
    .from('mst_dm_tag')
    .update({
      deleted_at: now,
    })
    .eq('tag_id', id)
    .select();

  if (error) return false;

  client.from('trn_dm_thread_tag').delete().eq('tag_id', id);

  return;
};
