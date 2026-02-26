import type { MstGroup } from '@/lib/supabase/types';
import type { User } from '../userlist/types';

export type Group = MstGroup & {
  users?: User[]; // ユーザーリスト（オプショナル）
};
