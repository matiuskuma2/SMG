'use server';

import { createClient } from '@/lib/supabase/server';

export const fetchUsers = async () => {
  const client = createClient();
  const { data: users, error } = await client
    .from('mst_user')
    .select(`
      id:user_id,
      username,
      icon,
      groups:mst_group (
        id:group_id,
        title
      )
  `)
    .is('groups.deleted_at', null)
    .is('deleted_at', null);

  if (error) return [];

  return users;
};

export const getCurrentUser = async () => {
  const client = createClient();
  const { data } = await client.auth.getUser();
  return data.user?.id ?? '';
};
