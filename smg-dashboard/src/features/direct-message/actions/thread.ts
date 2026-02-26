'use server';

import { createClient } from '@/lib/supabase/server';
import type { QueryData } from '@supabase/supabase-js';
import dayjs from 'dayjs';

const toDmThread = ({ label, ...d }: Threads[number]) => ({
  ...d,
  labelId: label?.label_id ?? null,
  latestMessage: d.messages.at(-1),
});

const fetchQuery = () =>
  createClient()
    .from('mst_dm_thread')
    .select(`
  thread_id,
  user:user_id (
    user_id,
    username,
    icon
  ),
  label:trn_dm_thread_label!left(label_id),
  messages:trn_dm_message (
    is_read,
    created_at
  ),
  created_at,
  is_admin_read,
  last_sent_at
`);

type Threads = QueryData<ReturnType<typeof fetchQuery>>;

export const fetchThreads = async () => {
  const { data, error } = await fetchQuery()
    .order('created_at', {
      referencedTable: 'messages',
      ascending: false,
    })
    .limit(1, { foreignTable: 'messages' });

  if (error) return [];

  return [...data].map(toDmThread);
};

export const updateThreadLabel = async (threadId: string, labelId: string) => {
  const client = createClient();
  const updatedAt = dayjs().toISOString();
  const { error } = await client.from('trn_dm_thread_label').upsert(
    {
      label_id: labelId,
      thread_id: threadId,
      updated_at: updatedAt,
    },
    {
      onConflict: 'thread_id',
    },
  );

  if (error) return false;

  return true;
};

export const createThread = async (userId: string) => {
  const client = createClient();
  const createdAt = dayjs().toISOString();
  const { data, error } = await client
    .from('mst_dm_thread')
    .insert({
      user_id: userId,
      created_at: createdAt,
      updated_at: createdAt,
    })
    .select(`
      thread_id,
      user:user_id (
        user_id,
        username,
        icon
      ),
      label:trn_dm_thread_label!left(label_id),
      messages:trn_dm_message (
        is_read,
        created_at
      ),
      created_at,
      is_admin_read,
      last_sent_at
    `)
    .single();

  if (error) return null;

  return toDmThread(data);
};
