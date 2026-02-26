'use client';

import type { DmMemo } from '@/features/direct-message/actions/memo';

import { createContext } from '@/lib/create-context';
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react';
import * as action from '../actions/memo';
import { useThreadParams } from './use-threads';

export const useMemos = () => {
  const { id } = useThreadParams();
  const { memos, refetch, setMemos } = useMemoContext();

  const create = async ({
    title,
    content,
    assignee,
  }: { title: string; content: string; assignee: string }) => {
    if (!id) return;

    const result = await action.createMemo(
      id,
      title,
      content,
      assignee.length !== 0 ? assignee : null,
    );
    if (result) setMemos((prev) => [...prev, result]);
  };

  const remove = async (id: string) => {
    const result = await action.deleteMemo(id);
    if (!result) return;

    const targetIdx = memos.findIndex((memo) => memo.memo_id === id);
    if (targetIdx === -1) return;

    setMemos(() => memos.toSpliced(targetIdx, 1));
  };

  const update = async (
    id: string,
    {
      title,
      content,
      assignee,
    }: { title: string; content: string; assignee: string },
  ) => {
    await action.updateMemo(
      id,
      title,
      content,
      assignee.length !== 0 ? assignee : null,
    );
    refetch();
  };

  const getById = useCallback(
    (memoId?: string) => {
      return memos.find((memo) => memo.memo_id === memoId);
    },
    [memos],
  );

  return {
    memos,
    refetch,
    create,
    remove,
    update,
    getById,
  };
};

type MemoContextState = {
  memos: DmMemo[];
  setMemos: Dispatch<SetStateAction<DmMemo[]>>;
  refetch: () => Promise<void>;
};
export const [MemoContext, useMemoContext] = createContext<MemoContextState>({
  memos: [],
  setMemos: () => {},
  refetch: () => Promise.resolve(),
});

export const MemoProvider = ({ children }: React.PropsWithChildren) => {
  const { id } = useThreadParams();

  const [memos, setMemos] = useState<DmMemo[]>([]);
  const refetch = useCallback(async () => {
    if (!id) return;
    const result = await action.fetchMemos(id);
    setMemos(result);
  }, [id]);

  useEffect(() => {
    if (id) refetch();
  }, [id, refetch]);

  return (
    <MemoContext.Provider value={{ memos, refetch, setMemos }}>
      {children}
    </MemoContext.Provider>
  );
};
