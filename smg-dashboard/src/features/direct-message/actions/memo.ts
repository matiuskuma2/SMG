'use server';

import { createClient } from '@/lib/supabase/server';
import dayjs from 'dayjs';

const selectText = `
  memo_id,
  thread_id,
  title,
  content,
  created_at,
  updated_at,
  deleted_at,
  assignee (user_id, username, icon)
`;

export type DmMemo = Awaited<ReturnType<typeof fetchMemos>>[number];

export const fetchMemos = async (id: string) => {
  const client = createClient();
  const { data, error } = await client
    .from('trn_dm_memo')
    .select(selectText)
    .eq('thread_id', id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) return [];

  return data;
};

export const createMemo = async (
  id: string,
  title: string,
  content: string,
  assignee: string | null,
) => {
  const client = createClient();
  const { data, error } = await client
    .from('trn_dm_memo')
    .insert({ thread_id: id, title, content, assignee })
    .select(selectText)
    .single();

  if (error) return null;

  return data;
};

export const updateMemo = async (
  id: string,
  title: string,
  content: string,
  assignee: string | null,
) => {
  const client = createClient();
  const { data, error } = await client
    .from('trn_dm_memo')
    .update({ title, content, assignee, updated_at: dayjs().toISOString() })
    .eq('memo_id', id)
    .select(selectText)
    .single();

  if (error) return null;

  return data;
};

export const deleteMemo = async (id: string) => {
  const client = createClient();
  const { error } = await client
    .from('trn_dm_memo')
    .update({ deleted_at: dayjs().toISOString() })
    .eq('memo_id', id)
    .select()
    .single();

  if (error) return false;

  return true;
};
