'use client';

import type { fetchUsers } from '@/features/direct-message/actions/user';
import { isAdminUser } from '@/lib/auth';
import { createContext } from '@/lib/create-context';
import { useMemo } from 'react';

export const useUsers = () => {
  const { users, currentUserId } = useUserContext();

  const {
    me,
    admin = [],
    member = [],
  } = useMemo(() => {
    const groupBy = Object.groupBy(users, (user) => {
      if (user.id === currentUserId) return 'me';
      if (isAdminUser(user.groups)) return 'admin';

      return 'member';
    });
    return { ...groupBy, me: groupBy.me?.at(0) as DmUser };
  }, [users, currentUserId]);

  return {
    me,
    admin,
    member,
  };
};

type Users = Awaited<ReturnType<typeof fetchUsers>>;
export type DmUser = Users[number];
type UserContextState = { users: Users; currentUserId: string };
export const [UserContext, useUserContext] = createContext<UserContextState>({
  users: [],
  currentUserId: '',
});

export const UserProvider = ({
  value,
  children,
}: React.PropsWithChildren<{ value: UserContextState }>) => (
  <UserContext.Provider value={value}>{children}</UserContext.Provider>
);
