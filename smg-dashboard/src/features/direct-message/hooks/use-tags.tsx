'use client';

import {
  createTag,
  deleteTag,
  fetchActivateTags,
  fetchTags,
  updateBindToThread,
  updateTag,
} from '@/features/direct-message/actions/tag';
import { createContext } from '@/lib/create-context';
import type { MstDmTag } from '@/lib/supabase/types';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useThreads } from './use-threads';

export const useTags = () => {
  const { tags, refetch, activeIds, refetchActivate } = useTagContext();
  const { currentThread } = useThreads();

  const create = async (name: string, isBindToCurrent: boolean) =>
    await createTag(name, isBindToCurrent ? currentThread?.thread_id : null);

  const update = async (id: string, name: string) => await updateTag(id, name);

  const remove = async (id: string) => await deleteTag(id);

  const activeTags = useMemo(() => {
    return tags.filter((d) => activeIds.includes(d.tag_id));
  }, [tags, activeIds]);

  const updateBind = async (values: MstDmTag[]) => {
    if (!currentThread?.thread_id) return;

    const before = new Set(activeTags.map((d) => d.tag_id));
    const after = new Set(values.map((d) => d.tag_id));

    const added = after.difference(before).values().toArray();
    const removed = before.difference(after).values().toArray();

    if (added.length === 0 && removed.length === 0) return;

    await updateBindToThread(currentThread?.thread_id, { added, removed });

    return await refetchActivate();
  };

  return {
    tags,
    activeTags,
    create,
    update,
    remove,
    refetch,
    refetchActivate,
    updateBind,
  };
};

const useTagQuery = (value: MstDmTag[]) => {
  const [tags, setTags] = useState<MstDmTag[]>(value);
  const [activeIds, setActiveIds] = useState<string[]>([]);
  const params = useSearchParams();
  const threadId = params.get('id');

  const refetch = useCallback(async () => {
    const result = await fetchTags();
    setTags(result);
  }, []);

  const refetchActivate = useCallback(async () => {
    if (!threadId) {
      setActiveIds([]);
      return;
    }
    const result = await fetchActivateTags(threadId);
    setActiveIds(result);
  }, [threadId]);

  useEffect(() => {
    refetchActivate();
  }, [refetchActivate]);

  return {
    tags,
    activeIds,
    refetch,
    refetchActivate,
  };
};

type TagContextState = {
  tags: MstDmTag[];
  refetch: () => Promise<void>;
  activeIds: string[];
  refetchActivate: () => Promise<void>;
};
export const [TagContext, useTagContext] = createContext<TagContextState>({
  tags: [],
  refetch: () => Promise.resolve(),
  activeIds: [],
  refetchActivate: () => Promise.resolve(),
});

export const TagProvider = ({
  value,
  children,
}: React.PropsWithChildren<{ value: MstDmTag[] }>) => {
  const query = useTagQuery(value);
  return <TagContext.Provider value={query}>{children}</TagContext.Provider>;
};
