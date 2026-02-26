import type { MstGroup } from './supabase/types';

export const isAdminUser = <T extends Pick<MstGroup, 'title'>>(
  group: T[] | T,
) => {
  const target = Array.isArray(group) ? group : [group];
  return target.some((group) => ['運営', '講師'].includes(group.title));
};
