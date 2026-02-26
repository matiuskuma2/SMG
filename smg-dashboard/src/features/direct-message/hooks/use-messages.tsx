'use client';

import { createContext } from '@/lib/create-context';
import { createClient } from '@/lib/supabase/client';
import type { TrnDmMessage } from '@/lib/supabase/types';
import type {
  RealtimeChannel,
  RealtimePostgresInsertPayload,
} from '@supabase/supabase-js';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  fetchImagesByMessage,
  fetchMessages,
  postImageMessage,
  postMessage,
} from '../actions/message';
import { MESSAGE_PAGE_SIZE } from '../lib/message';
import { useThreads } from './use-threads';

const client = createClient();

export const useMessages = () => {
  const { selected: id, currentThread } = useThreads();
  const { messages, isLoading, hasMore } = useMessageContext();

  const postText = async (content: string) => {
    if (!id) return;
    await postMessage(id, content);
  };

  const postImages = async (files: File[]) => {
    if (!id) return;
    const formData = new FormData();
    for (const file of files) {
      formData.append('file', file);
    }
    await postImageMessage(id, formData);
  };

  return {
    messages,
    currentThread,
    isLoading,
    hasMore,
    postText,
    postImages,
  };
};

export type DmMessage = Awaited<ReturnType<typeof fetchMessages>>[number];
const useRealtimeMessages = () => {
  const { selected: id, currentThread } = useThreads();

  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messageChannel = useRef<RealtimeChannel | null>(null);

  const getInitialMessages = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    const result = await fetchMessages(id, 0, MESSAGE_PAGE_SIZE);
    setMessages(result);
    setIsLoading(false);
  }, [id]);

  const unsubscribeChannel = useCallback(() => {
    messageChannel.current?.unsubscribe();
    messageChannel.current = null;
  }, []);

  const setNewMessage = useCallback(
    async (payload: RealtimePostgresInsertPayload<TrnDmMessage>) => {
      const images =
        payload.new.content === ''
          ? await fetchImagesByMessage(payload.new.message_id)
          : [];
      setMessages((prev) => [
        ...prev,
        {
          ...payload.new,
          images,
          isMe: payload.new.user_id !== currentThread?.user.user_id,
        },
      ]);
    },
    [currentThread?.user.user_id],
  );

  const getMessagesandSubscribe = useCallback(async () => {
    if (!id) return;

    messageChannel.current = client
      .channel(`thread:${id}`)
      .on<TrnDmMessage>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trn_dm_message',
          filter: `thread_id=eq.${id}`,
        },
        setNewMessage,
      )
      .subscribe();
  }, [id, setNewMessage]);

  const fetchNext = async () => {
    if (!id) return;
    const result = await fetchMessages(id, messages.length, MESSAGE_PAGE_SIZE);
    setMessages((prev) => [...result, ...prev]);
  };

  useLayoutEffect(() => {
    if (!id) return;
    getInitialMessages();
  }, [id, getInitialMessages]);

  useEffect(() => {
    getMessagesandSubscribe();
    return () => {
      unsubscribeChannel();
    };
  }, [unsubscribeChannel, getMessagesandSubscribe]);

  return {
    messages,
    isLoading,
    currentThread,
    hasMore: messages.length > 0 && messages.length % MESSAGE_PAGE_SIZE === 0,
    fetchNext,
  };
};

type MessageContextState = {
  messages: DmMessage[];
  isLoading: boolean;
  fetchNext: () => Promise<void>;
  hasMore: boolean;
};
export const [MessageContext, useMessageContext] =
  createContext<MessageContextState>({
    messages: [],
    isLoading: true,
    fetchNext: () => Promise.resolve(),
    hasMore: false,
  });

export const MessageProvider = ({ children }: React.PropsWithChildren) => {
  const { messages, isLoading, fetchNext, hasMore } = useRealtimeMessages();
  return (
    <MessageContext.Provider
      value={{ messages, isLoading, fetchNext, hasMore }}
    >
      {children}
    </MessageContext.Provider>
  );
};
