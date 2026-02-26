'use client';

import { css } from '@/styled-system/css';
import { Flex, Grid, Stack } from '@/styled-system/jsx';
import { formatIsoDate } from '@/utils/date';
import { ContextMenu } from 'radix-ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LuCheck, LuMessageCircle, LuSearch } from 'react-icons/lu';
import { TbMessageCirclePlus } from 'react-icons/tb';
import type { Thread } from '../actions/dm-page';
import { type Threads, isThreadUnread, useThreads } from '../hooks/use-threads';
import { useUsers } from '../hooks/use-users';
import { FormPrompt } from './dialog';
import { Input } from './form';
import { StatusTag } from './labels';
import { DmAvator } from './memo/user-select';

export const ThreadItem = ({
  active = false,
  thread,
  onSelect,
  onRevert,
}: {
  active?: boolean;
  thread: Threads[number];
  onSelect?: (value: string) => void;
  onRevert?: (value: string) => void;
}) => (
  <ContextMenu.Root>
    <ContextMenu.Trigger>
      <li
        className={`thread-item ${css({
          px: '4',
          cursor: 'pointer',
          _selected: { bg: 'gray.100' },
        })}`}
        aria-selected={active}
      >
        <Grid
          gridTemplateColumns={'auto 1fr'}
          alignItems={'center'}
          onClick={() => !active && onSelect?.(thread.thread_id)}
        >
          <div className={css({ pos: 'relative' })}>
            <DmAvator user={thread.user} />
            {isThreadUnread(thread) && (
              <div
                className={css({
                  w: '2.5',
                  h: '2.5',
                  top: '-1.5',
                  right: '-1',
                  pos: 'absolute',
                  bg: 'red.500',
                  rounded: 'full',
                })}
              />
            )}
          </div>
          <Flex
            py={'4'}
            justify={'space-between'}
            borderBottom={'1px solid #e0e0e0'}
            fontSize={'sm'}
          >
            <Stack gap={0.5}>
              <div className={css({ fontSize: 'large' })}>
                {thread.user.username}
              </div>
              {(() => {
                const threadWithLatest = thread as typeof thread & {
                  allLatestMessageCreatedAt?: string;
                };
                const displayDate =
                  threadWithLatest.allLatestMessageCreatedAt ||
                  thread.latestMessage?.created_at;
                return displayDate ? (
                  <div className={css({ fontSize: 'xs', color: 'gray.500' })}>
                    {formatIsoDate(displayDate)}
                  </div>
                ) : null;
              })()}
            </Stack>
            <StatusTag tagId={thread.labelId ?? '0'} />
          </Flex>
        </Grid>
      </li>
    </ContextMenu.Trigger>
    <ContextMenu.Portal>
      <ContextMenu.Content
        className={css({
          bg: 'white',
          border: '1px solid',
          borderColor: 'zinc.400',
          color: 'zinc.700',
          rounded: 'sm',
        })}
      >
        <ContextMenu.Item asChild className={css({ p: '2', outline: 'none' })}>
          <button type="button" onClick={() => onRevert?.(thread.thread_id)}>
            未読としてマークする
          </button>
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Portal>
  </ContextMenu.Root>
);

export const ThreadMenu = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Thread[]>([]);
  const {
    threads,
    selected,
    setSelected,
    revertToUnread,
    refetch,
    changePage,
    page,
    total,
    limit,
    isLoading,
  } = useThreads();

  // 検索実行
  useEffect(() => {
    const searchThreads = async () => {
      if (!search.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const { searchThreadsByUsername } = await import(
          '@/features/direct-message/actions/dm-page'
        );
        const result = await searchThreadsByUsername(search);
        setSearchResults(result.threads);
      } catch (error) {
        console.error('Error searching threads:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    // デバウンス処理
    const timeoutId = setTimeout(searchThreads, 300);
    return () => clearTimeout(timeoutId);
  }, [search]);

  // 表示するスレッドリスト（検索中は検索結果、それ以外は通常のスレッド）
  const displayThreads = search.trim()
    ? (searchResults as unknown as Threads)
    : threads;

  // ページ変更時にリストを一番上にスクロール
  const handleChangePage = useCallback(
    async (newPage: number) => {
      await changePage(newPage);
      // ページ変更後にスクロール位置をリセット
      if (listRef.current) {
        listRef.current.scrollTop = 0;
      }
    },
    [changePage],
  );

  const onSelect = useCallback(
    async (value: string) => {
      await setSelected(value);
    },
    [setSelected],
  );

  const onRevert = useCallback(
    async (value: string) => {
      const result = await revertToUnread(value);
      if (result) refetch();
    },
    [revertToUnread, refetch],
  );

  const totalPages = Math.ceil(total / limit);

  return (
    <Grid
      gridTemplateRows={'auto auto 1fr auto'}
      rowGap={'3'}
      pt={6}
      w={'300px'}
      minH={0}
    >
      <Flex justifyContent={'space-between'} alignItems={'center'}>
        <h2 className={css({ fontWeight: 'bold' })}>メッセージ</h2>
        <CreateThreadDialog />
      </Flex>
      <Input
        placeholder="ユーザー名で検索"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        py={3}
      />
      <div
        ref={listRef}
        className={css({
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          scrollbarWidth: 'none',
        })}
      >
        <ul>
          {displayThreads.map((thread) => (
            <ThreadItem
              key={`thread-${thread.thread_id}`}
              thread={thread}
              onSelect={onSelect}
              onRevert={onRevert}
              active={thread.thread_id === selected}
            />
          ))}
          {(isLoading || isSearching) && (
            <div
              className={css({
                p: '4',
                textAlign: 'center',
                color: 'gray.500',
              })}
            >
              読み込み中...
            </div>
          )}
          {search.trim() && !isSearching && displayThreads.length === 0 && (
            <div
              className={css({
                p: '4',
                textAlign: 'center',
                color: 'gray.500',
              })}
            >
              該当するユーザーが見つかりません
            </div>
          )}
        </ul>
      </div>
      {!search.trim() && (
        <Flex justifyContent="center" alignItems="center" gap="4" py="2">
          <button
            type="button"
            onClick={() => handleChangePage(page - 1)}
            disabled={page <= 1 || isLoading}
            className={css({
              cursor: page <= 1 || isLoading ? 'not-allowed' : 'pointer',
              opacity: page <= 1 || isLoading ? 0.5 : 1,
              p: '2',
              rounded: 'md',
              _hover: {
                bg: page <= 1 || isLoading ? 'transparent' : 'gray.100',
              },
            })}
          >
            &lt;
          </button>
          <span className={css({ fontSize: 'sm', color: 'gray.600' })}>
            {page} / {totalPages || 1}
          </span>
          <button
            type="button"
            onClick={() => handleChangePage(page + 1)}
            disabled={page >= totalPages || isLoading}
            className={css({
              cursor:
                page >= totalPages || isLoading ? 'not-allowed' : 'pointer',
              opacity: page >= totalPages || isLoading ? 0.5 : 1,
              p: '2',
              rounded: 'md',
              _hover: {
                bg:
                  page >= totalPages || isLoading ? 'transparent' : 'gray.100',
              },
            })}
          >
            &gt;
          </button>
        </Flex>
      )}
    </Grid>
  );
};

const CreateThreadDialog = () => {
  const { member } = useUsers();
  const { createNewThread, threads } = useThreads();

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');

  const existUserOnThread = threads.map((d) => d.user.user_id);

  const filtered = member.filter(
    (d) =>
      !existUserOnThread.includes(d.id) &&
      d.username?.toLowerCase().includes(search.toLowerCase()),
  );

  const onSave = async () => {
    if (!selected) return;
    await createNewThread(selected);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className={css({
          rounded: 'full',
          p: '2',
          _hover: { bg: 'gray.200' },
        })}
        onClick={() => setOpen(true)}
      >
        <TbMessageCirclePlus size={24} />
      </button>
      <FormPrompt
        title={
          <div
            className={css({
              d: 'inline-flex',
              gap: '2',
              alignItems: 'center',
              fontSize: 'xl',
              fontWeight: 'semibold',
            })}
          >
            <LuMessageCircle className={css({ w: '5', h: '5' })} />
            <span>スレッドの相手を選択</span>
          </div>
        }
        open={open}
        onOpenChange={setOpen}
        submitButtonProps={{
          children: 'スレッドを作成',
          onClick: onSave,
          disabled: selected === null,
        }}
      >
        <Stack>
          <Stack pos={'relative'}>
            <LuSearch
              className={css({
                pos: 'absolute',
                left: '2.5',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'gray.400',
                w: '5',
                h: '5',
              })}
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              pl={10}
              placeholder="ユーザー名で検索"
            />
          </Stack>
        </Stack>
        <Stack overflowY="auto" py="1" maxH="80">
          {filtered.map((d) => (
            <Flex
              alignItems="center"
              rounded="lg"
              cursor="pointer"
              gap={'3'}
              py="2"
              px="3"
              key={d.id}
              bg={selected === d.id ? 'blue.50' : { _hover: 'gray.50' }}
              border={'1px solid'}
              borderColor={selected === d.id ? 'blue.500' : 'transparent'}
              onClick={() => setSelected(d.id)}
            >
              <Stack pos={'relative'}>
                <DmAvator user={d} />
              </Stack>
              <Stack
                flex={1}
                minW={0}
                color={selected === d.id ? 'blue.800' : 'gray.800'}
                fontWeight="medium"
              >
                {d.username}
              </Stack>
              {selected === d.id && (
                <LuCheck
                  className={css({
                    flexShrink: 0,
                    w: '5',
                    h: '5',
                    color: 'blue.700',
                  })}
                />
              )}
            </Flex>
          ))}
          {filtered.length === 0 && (
            <Stack color={'gray.600'} textAlign={'center'} paddingInline={'6'}>
              ユーザーが見つかりません
            </Stack>
          )}
        </Stack>
      </FormPrompt>
    </>
  );
};
