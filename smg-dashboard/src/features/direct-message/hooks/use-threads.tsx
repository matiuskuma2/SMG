'use client';

import type { Thread } from '@/features/direct-message/actions/dm-page';
import { updateReadStatus } from '@/features/direct-message/actions/message';
import { createThread } from '@/features/direct-message/actions/thread';
import type { fetchThreads } from '@/features/direct-message/actions/thread';
import { createContext } from '@/lib/create-context';
import { createClient } from '@/lib/supabase/client';
import type { TrnDmMessage } from '@/lib/supabase/types';
import type { RealtimePostgresInsertPayload } from '@supabase/supabase-js';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

export const useThreadParams = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selected = searchParams.get('id');

  const update = (value?: string) => {
    if (!value) return;
    const baseURL = new URL(window.location.origin);
    const url = new URL(pathname, baseURL);
    url.searchParams.set('id', value);
    window.history.pushState({}, '', url);
  };

  return {
    id: selected,
    update,
  };
};

export const useThreads = () => {
  const { id, update } = useThreadParams();
  const {
    threads,
    refetch,
    setThreads,
    changePage,
    page,
    total,
    limit,
    isLoading,
  } = useThreadContext();

  const setSelected = useCallback(
    async (value?: string) => {
      if (!value) return false;

      await updateReadStatus(value, true);

      // 既読にしたスレッドのis_admin_readをtrueに更新し、ソートし直す
      setThreads((prev) => {
        const updated = prev.map((thread) =>
          thread.thread_id === value
            ? { ...thread, is_admin_read: true }
            : thread,
        );

        // 未読優先、その後last_sent_at降順でソート
        return updated.sort((a, b) => {
          // 未読優先
          if (a.is_admin_read !== b.is_admin_read) {
            return a.is_admin_read ? 1 : -1;
          }

          // last_sent_atで降順ソート（nullは最後）
          const aDate = a.last_sent_at || '';
          const bDate = b.last_sent_at || '';
          return bDate.localeCompare(aDate);
        });
      });

      update(value);
      return true;
    },
    [update, setThreads],
  );

  const revertToUnread = useCallback(
    async (value: string) => {
      // スレッドユーザーの最新メッセージを未読にする
      const result = await updateReadStatus(value, false);
      if (result) {
        // 未読に戻したスレッドのis_admin_readをfalseに更新し、ソートし直す
        setThreads((prev) => {
          const updated = prev.map((thread) =>
            thread.thread_id === value
              ? { ...thread, is_admin_read: false }
              : thread,
          );

          // 未読優先、その後last_sent_at降順でソート
          return updated.sort((a, b) => {
            // 未読優先
            if (a.is_admin_read !== b.is_admin_read) {
              return a.is_admin_read ? 1 : -1;
            }

            // last_sent_atで降順ソート（nullは最後）
            const aDate = a.last_sent_at || '';
            const bDate = b.last_sent_at || '';
            return bDate.localeCompare(aDate);
          });
        });
      }
      return result;
    },
    [setThreads],
  );

  const [fetchedThread, setFetchedThread] = useState<Threads[number] | null>(
    null,
  );

  // 現在のスレッドを取得（threads配列になければ個別取得したものを使用）
  const currentThread = useMemo(() => {
    const found = threads.find((d) => d.thread_id === id);
    if (found) return found;
    if (fetchedThread && fetchedThread.thread_id === id) return fetchedThread;
    return undefined;
  }, [id, threads, fetchedThread]);

  // スレッドが現在のページに存在しない場合、個別に取得
  useEffect(() => {
    if (!id) return;
    const threadExists = threads.some((d) => d.thread_id === id);
    if (threadExists) {
      setFetchedThread(null);
      return;
    }

    // 個別取得
    const fetchThread = async () => {
      const { fetchThreadById } = await import(
        '@/features/direct-message/actions/dm-page'
      );
      const thread = await fetchThreadById(id);
      if (thread) {
        setFetchedThread(thread as Threads[number]);
      }
    };
    fetchThread();
  }, [id, threads]);

  const createNewThread = async (userId: string) => {
    const thread = await createThread(userId);
    if (!thread) return;
    setThreads((prev) => [thread, ...prev]);
    update(thread.thread_id);
  };

  return {
    threads,
    selected: id,
    currentThread,
    refetch,
    setSelected,
    createNewThread,
    revertToUnread,
    changePage,
    page,
    total,
    limit,
    isLoading,
  };
};

export type Threads = Awaited<ReturnType<typeof fetchThreads>>;
type ThreadsContextState = {
  threads: Threads;
  setThreads: React.Dispatch<React.SetStateAction<Threads>>;
  refetch: () => Promise<void>;
  changePage: (page: number) => Promise<void>;
  page: number;
  total: number;
  limit: number;
  isLoading: boolean;
};

const [ThreadContext, useThreadContext] = createContext<ThreadsContextState>({
  threads: [],
  setThreads: () => {},
  refetch: () => Promise.resolve(),
  changePage: () => Promise.resolve(),
  page: 1,
  total: 0,
  limit: 30,
  isLoading: false,
});

// スレッドが未読かどうかを判定する共通関数
// is_admin_readがfalseの場合に未読とする
export const isThreadUnread = (thread: Threads[number]): boolean => {
  return thread.is_admin_read === false;
};

export const ThreadProvider = ({
  value,
  total: initialTotal = 0,
  children,
}: React.PropsWithChildren<{ value: Threads | Thread[]; total?: number }>) => {
  // サーバー側でソート済みなので、そのまま使用
  const [threads, setThreads] = useState<Threads>(value as Threads);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(initialTotal);
  const [isLoading, setIsLoading] = useState(false);
  const limit = 30;

  const refetch = useCallback(async () => {
    const { fetchMoreThreads } = await import(
      '@/features/direct-message/actions/dm-page'
    );
    const offset = (page - 1) * 30;
    const result = await fetchMoreThreads(offset, 30);
    // サーバー側でソート済み
    setThreads(result.threads as Threads);
    setTotal(result.total);
  }, [page]);

  const changePage = useCallback(
    async (newPage: number) => {
      if (isLoading) return;

      setIsLoading(true);
      try {
        const { fetchMoreThreads } = await import(
          '@/features/direct-message/actions/dm-page'
        );
        const offset = (newPage - 1) * limit;
        const result = await fetchMoreThreads(offset, limit);

        // サーバー側でソート済み
        setThreads(result.threads as Threads);
        setTotal(result.total);
        setPage(newPage);
      } catch (error) {
        console.error('Error changing page:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading],
  );

  const updateLatestMessage = useCallback(
    async (payload: RealtimePostgresInsertPayload<TrnDmMessage>) => {
      // 新しいメッセージが来たら、is_admin_readの状態やlast_sent_atの更新を反映するため
      // 常にrefetchして最新の状態を取得
      return await refetch();
    },
    [refetch],
  );

  useEffect(() => {
    const client = createClient();
    const subscription = client
      .channel('threads')
      .on<TrnDmMessage>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trn_dm_message',
        },
        updateLatestMessage,
      )
      .subscribe();
    return () => {
      subscription.unsubscribe();
    };
  }, [updateLatestMessage]);

  return (
    <ThreadContext.Provider
      value={{
        threads,
        setThreads,
        refetch,
        changePage,
        page,
        total,
        limit,
        isLoading,
      }}
    >
      {children}
    </ThreadContext.Provider>
  );
};
