import type { MstGroup } from '@/lib/supabase/types';

// グループ作成の型
export type GroupFormData = Omit<MstGroup, 'deleted_at'> & {
  users: string[];
};
