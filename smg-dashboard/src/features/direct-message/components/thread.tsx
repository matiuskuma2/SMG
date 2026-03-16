'use client';

import { css } from '@/styled-system/css';
import { Flex, Grid, Stack } from '@/styled-system/jsx';
import dayjs from 'dayjs';
import { ContextMenu } from 'radix-ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LuCheck, LuFilter, LuMessageCircle, LuSearch, LuX } from 'react-icons/lu';
import { TbMessageCirclePlus } from 'react-icons/tb';
import type { Thread } from '../actions/dm-page';
import { type Threads, isThreadUnread, useThreads } from '../hooks/use-threads';
import { useUsers } from '../hooks/use-users';
import { useTags } from '../hooks/use-tags';
import { useLabels } from '../hooks/use-labels';
import { FormPrompt } from './dialog';
import { Input } from './form';
import { StatusTag } from './labels';
import { toLabelColor } from './labels/styled';
import { DmAvator } from './memo/user-select';

export const ThreadItem = ({
  active = false,
  thread,
  onSelect,
  onRevert,
  onMarkRead,
  allTags,
}: {
  active?: boolean;
  thread: Threads[number];
  onSelect?: (value: string) => void;
  onRevert?: (value: string) => void;
  onMarkRead?: (value: string) => void;
  allTags?: Array<{ tag_id: string; name: string }>;
}) => {
  // スレッドに紐づくタグ名を取得
  const threadTags = useMemo(() => {
    const tagIds = (thread as unknown as Thread).tagIds || [];
    if (!allTags || tagIds.length === 0) return [];
    return tagIds
      .map((id) => allTags.find((t) => t.tag_id === id))
      .filter(Boolean) as Array<{ tag_id: string; name: string }>;
  }, [thread, allTags]);

  const isDeleted = (thread as unknown as Thread).user?.is_deleted === true;

  return (
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
              py={'3'}
              justify={'space-between'}
              borderBottom={'1px solid #e0e0e0'}
              fontSize={'sm'}
            >
              <Stack gap={0.5} minW={0} flex={1}>
                <div className={css({ display: 'flex', alignItems: 'center', gap: '1.5' })}>
                  <span className={css({ fontSize: 'large', lineClamp: 1 })}>
                    {thread.user.username}
                  </span>
                  {isDeleted && (
                    <span
                      className={css({
                        fontSize: 'xs',
                        px: '1.5',
                        py: '0.5',
                        bg: 'red.100',
                        color: 'red.700',
                        rounded: 'sm',
                        fontWeight: 'medium',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      })}
                    >
                      退会済
                    </span>
                  )}
                </div>
                {/* タグ表示 */}
                {threadTags.length > 0 && (
                  <Flex gap={'1'} flexWrap={'wrap'}>
                    {threadTags.map((tag) => (
                      <span
                        key={tag.tag_id}
                        className={css({
                          fontSize: '2xs',
                          px: '1.5',
                          py: '0.5',
                          bg: 'blue.50',
                          color: 'blue.700',
                          rounded: 'sm',
                          lineClamp: 1,
                        })}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </Flex>
                )}
                {(() => {
                  const threadWithLatest = thread as typeof thread & {
                    allLatestMessageCreatedAt?: string;
                  };
                  const displayDate =
                    threadWithLatest.allLatestMessageCreatedAt ||
                    thread.latestMessage?.created_at;
                  return displayDate ? (
                    <div className={css({ fontSize: 'xs', color: 'gray.500' })}>
                      {dayjs(displayDate).format('YYYY/MM/DD HH:mm')}
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
          {isThreadUnread(thread) ? (
            <ContextMenu.Item asChild className={css({ p: '2', outline: 'none', cursor: 'pointer', _hover: { bg: 'gray.100' } })}>
              <button type="button" onClick={() => onMarkRead?.(thread.thread_id)}>
                既読にする
              </button>
            </ContextMenu.Item>
          ) : (
            <ContextMenu.Item asChild className={css({ p: '2', outline: 'none', cursor: 'pointer', _hover: { bg: 'gray.100' } })}>
              <button type="button" onClick={() => onRevert?.(thread.thread_id)}>
                未読としてマークする
              </button>
            </ContextMenu.Item>
          )}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
};

// ステータスフィルターパネル
const StatusFilterPanel = ({
  selectedLabelIds,
  onToggle,
  onClear,
  onClose,
}: {
  selectedLabelIds: string[];
  onToggle: (labelId: string) => void;
  onClear: () => void;
  onClose: () => void;
}) => {
  const { labels, defaultLabel } = useLabels();
  const allOptions = [defaultLabel, ...labels];

  return (
    <div
      className={css({
        bg: 'white',
        border: '1px solid',
        borderColor: 'gray.200',
        rounded: 'lg',
        shadow: 'md',
        p: '3',
        mb: '2',
      })}
    >
      <Flex justifyContent="space-between" alignItems="center" mb="2">
        <span className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'gray.700' })}>
          ステータスで絞り込み
        </span>
        <button
          type="button"
          onClick={onClose}
          className={css({
            p: '1',
            rounded: 'md',
            _hover: { bg: 'gray.100' },
            cursor: 'pointer',
          })}
        >
          <LuX size={16} />
        </button>
      </Flex>
      <Flex flexDir="column" gap="1.5">
        {allOptions.map((option) => {
          const isSelected = selectedLabelIds.includes(option.label_id);
          const colorVariant = toLabelColor(option.color);
          return (
            <button
              key={option.label_id}
              type="button"
              onClick={() => onToggle(option.label_id)}
              className={css({
                display: 'flex',
                alignItems: 'center',
                gap: '2',
                px: '2.5',
                py: '1.5',
                rounded: 'md',
                cursor: 'pointer',
                transition: 'all 0.15s',
                _hover: { bg: 'gray.50' },
                w: '100%',
                textAlign: 'left',
              })}
              style={{
                background: isSelected ? 'var(--colors-gray-50)' : undefined,
              }}
            >
              {/* チェックボックス */}
              <div
                className={css({
                  w: '4',
                  h: '4',
                  rounded: 'sm',
                  border: '2px solid',
                  borderColor: isSelected ? 'blue.500' : 'gray.300',
                  bg: isSelected ? 'blue.500' : 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.15s',
                })}
              >
                {isSelected && <LuCheck size={12} color="white" />}
              </div>
              {/* ステータスカラードット + 名前 */}
              <Flex alignItems="center" gap="1.5">
                <div
                  className={css({
                    w: '3',
                    h: '3',
                    rounded: 'full',
                    flexShrink: 0,
                  })}
                  style={{
                    backgroundColor:
                      colorVariant === 'red'
                        ? 'var(--colors-rose-400)'
                        : colorVariant === 'blue'
                          ? 'var(--colors-blue-400)'
                          : colorVariant === 'yellow'
                            ? 'var(--colors-orange-400)'
                            : colorVariant === 'green'
                              ? 'var(--colors-green-400)'
                              : colorVariant === 'gray'
                                ? 'var(--colors-neutral-400)'
                                : 'var(--colors-gray-300)',
                  }}
                />
                <span className={css({ fontSize: 'sm', color: 'gray.700' })}>
                  {option.name}
                </span>
              </Flex>
            </button>
          );
        })}
      </Flex>
      {selectedLabelIds.length > 0 && (
        <button
          type="button"
          onClick={onClear}
          className={css({
            mt: '2',
            pt: '2',
            borderTop: '1px solid',
            borderColor: 'gray.200',
            fontSize: 'xs',
            color: 'gray.500',
            cursor: 'pointer',
            w: '100%',
            textAlign: 'center',
            _hover: { color: 'gray.700' },
          })}
        >
          絞り込みをクリア
        </button>
      )}
    </div>
  );
};

// 選択中のステータスフィルターをタグとして表示
const StatusFilterActiveTags = ({
  selectedLabelIds,
  onRemove,
  onClear,
}: {
  selectedLabelIds: string[];
  onRemove: (id: string) => void;
  onClear: () => void;
}) => {
  const { labels, defaultLabel } = useLabels();
  const allOptions = [defaultLabel, ...labels];

  return (
    <Flex gap={'1'} flexWrap={'wrap'} alignItems={'center'}>
      <button
        type="button"
        onClick={onClear}
        className={css({
          fontSize: '2xs',
          px: '1.5',
          py: '0.5',
          bg: 'gray.200',
          color: 'gray.600',
          rounded: 'sm',
          cursor: 'pointer',
          _hover: { bg: 'gray.300' },
        })}
      >
        ✕ クリア
      </button>
      {selectedLabelIds.map((labelId) => {
        const option = allOptions.find((o) => o.label_id === labelId);
        if (!option) return null;
        const colorVariant = toLabelColor(option.color);
        return (
          <button
            key={labelId}
            type="button"
            onClick={() => onRemove(labelId)}
            className={css({
              fontSize: '2xs',
              px: '1.5',
              py: '0.5',
              rounded: 'sm',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '1',
              transition: 'all 0.15s',
            })}
            style={{
              backgroundColor:
                colorVariant === 'red'
                  ? 'var(--colors-rose-100)'
                  : colorVariant === 'blue'
                    ? 'var(--colors-blue-100)'
                    : colorVariant === 'yellow'
                      ? 'var(--colors-orange-100)'
                      : colorVariant === 'green'
                        ? 'var(--colors-green-100)'
                        : colorVariant === 'gray'
                          ? 'var(--colors-neutral-100)'
                          : 'var(--colors-gray-100)',
              color:
                colorVariant === 'red'
                  ? 'var(--colors-rose-700)'
                  : colorVariant === 'blue'
                    ? 'var(--colors-blue-700)'
                    : colorVariant === 'yellow'
                      ? 'var(--colors-orange-700)'
                      : colorVariant === 'green'
                        ? 'var(--colors-green-700)'
                        : colorVariant === 'gray'
                          ? 'var(--colors-neutral-700)'
                          : 'var(--colors-gray-700)',
            }}
          >
            {option.name}
            <LuX size={10} />
          </button>
        );
      })}
    </Flex>
  );
};

export const ThreadMenu = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Thread[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<string>('');
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterRefreshKey, setFilterRefreshKey] = useState(0);
  const {
    threads,
    selected,
    setSelected,
    markAsRead,
    revertToUnread,
    refetch,
    changePage,
    page,
    total,
    limit,
    isLoading,
  } = useThreads();
  const { tags } = useTags();

  // threadsの変更を検知してフィルター結果を更新
  useEffect(() => {
    if (selectedLabelIds.length > 0 || selectedTagId || search.trim()) {
      setFilterRefreshKey((prev) => prev + 1);
    }
  }, [threads]);

  // テキスト検索
  useEffect(() => {
    if (selectedTagId || selectedLabelIds.length > 0) return; // タグ・ステータス絞り込み中はテキスト検索しない

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

    const timeoutId = setTimeout(searchThreads, 300);
    return () => clearTimeout(timeoutId);
  }, [search, selectedTagId, selectedLabelIds, filterRefreshKey]);

  // タグ絞り込み
  useEffect(() => {
    if (!selectedTagId) {
      if (!search.trim() && selectedLabelIds.length === 0) setSearchResults([]);
      return;
    }

    const filterByTag = async () => {
      setIsSearching(true);
      try {
        const { searchThreadsByTagId } = await import(
          '@/features/direct-message/actions/dm-page'
        );
        const result = await searchThreadsByTagId(selectedTagId);
        setSearchResults(result.threads);
      } catch (error) {
        console.error('Error filtering by tag:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    filterByTag();
  }, [selectedTagId, filterRefreshKey]);

  // ステータス絞り込み
  useEffect(() => {
    if (selectedLabelIds.length === 0) {
      if (!search.trim() && !selectedTagId) setSearchResults([]);
      return;
    }

    const filterByLabel = async () => {
      setIsSearching(true);
      try {
        const { searchThreadsByLabelIds } = await import(
          '@/features/direct-message/actions/dm-page'
        );
        const result = await searchThreadsByLabelIds(selectedLabelIds);
        setSearchResults(result.threads);
      } catch (error) {
        console.error('Error filtering by label:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    filterByLabel();
  }, [selectedLabelIds, filterRefreshKey]);

  const handleToggleLabel = useCallback((labelId: string) => {
    setSelectedLabelIds((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId]
    );
    // ステータス絞り込み時は他のフィルターをクリア
    setSearch('');
    setSelectedTagId('');
  }, []);

  const handleClearLabels = useCallback(() => {
    setSelectedLabelIds([]);
  }, []);

  const isFiltering = search.trim() || selectedTagId || selectedLabelIds.length > 0;
  const displayThreads = isFiltering
    ? (searchResults as unknown as Threads)
    : threads;

  const handleChangePage = useCallback(
    async (newPage: number) => {
      await changePage(newPage);
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

  const onMarkRead = useCallback(
    async (value: string) => {
      const result = await markAsRead(value);
      if (result) refetch();
    },
    [markAsRead, refetch],
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
      gridTemplateRows={'auto auto auto auto auto 1fr auto'}
      rowGap={'2'}
      pt={6}
      w={'300px'}
      minH={0}
    >
      <Flex justifyContent={'space-between'} alignItems={'center'}>
        <h2 className={css({ fontWeight: 'bold' })}>メッセージ</h2>
        <CreateThreadDialog />
      </Flex>
      <Flex gap="2" alignItems="center">
        <div className={css({ flex: 1 })}>
          <Input
            placeholder="ユーザー名 / メールアドレスで検索"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (e.target.value.trim()) {
                setSelectedTagId('');
                setSelectedLabelIds([]);
              }
            }}
            py={3}
          />
        </div>
        <button
          type="button"
          onClick={() => setIsFilterOpen((prev) => !prev)}
          className={css({
            p: '2',
            rounded: 'md',
            cursor: 'pointer',
            position: 'relative',
            transition: 'all 0.15s',
            _hover: { bg: 'gray.100' },
            flexShrink: 0,
          })}
          style={{
            background: isFilterOpen || selectedLabelIds.length > 0
              ? 'var(--colors-blue-50)'
              : undefined,
            color: isFilterOpen || selectedLabelIds.length > 0
              ? 'var(--colors-blue-600)'
              : undefined,
          }}
          title="ステータスで絞り込み"
        >
          <LuFilter size={18} />
          {selectedLabelIds.length > 0 && (
            <div
              className={css({
                position: 'absolute',
                top: '0',
                right: '0',
                w: '4',
                h: '4',
                bg: 'blue.500',
                color: 'white',
                rounded: 'full',
                fontSize: '2xs',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
              })}
            >
              {selectedLabelIds.length}
            </div>
          )}
        </button>
      </Flex>
      {/* ステータス絞り込みパネル */}
      {isFilterOpen && (
        <StatusFilterPanel
          selectedLabelIds={selectedLabelIds}
          onToggle={handleToggleLabel}
          onClear={handleClearLabels}
          onClose={() => setIsFilterOpen(false)}
        />
      )}
      {/* 選択中のステータスタグ表示 */}
      {selectedLabelIds.length > 0 && !isFilterOpen && (
        <StatusFilterActiveTags
          selectedLabelIds={selectedLabelIds}
          onRemove={(id) => setSelectedLabelIds((prev) => prev.filter((v) => v !== id))}
          onClear={handleClearLabels}
        />
      )}
      {/* タグ絞り込み */}
      <Flex gap={'1'} flexWrap={'wrap'} px={'1'}>
        {selectedTagId && (
          <button
            type="button"
            onClick={() => setSelectedTagId('')}
            className={css({
              fontSize: '2xs',
              px: '1.5',
              py: '0.5',
              bg: 'gray.200',
              color: 'gray.600',
              rounded: 'sm',
              cursor: 'pointer',
              _hover: { bg: 'gray.300' },
            })}
          >
            ✕ クリア
          </button>
        )}
        {tags.map((tag) => (
          <button
            key={tag.tag_id}
            type="button"
            onClick={() => {
              setSelectedTagId((prev) => (prev === tag.tag_id ? '' : tag.tag_id));
              setSearch('');
              setSelectedLabelIds([]);
            }}
            className={css({
              fontSize: '2xs',
              px: '1.5',
              py: '0.5',
              rounded: 'sm',
              cursor: 'pointer',
              transition: 'all 0.15s',
            })}
            style={{
              background:
                selectedTagId === tag.tag_id
                  ? 'var(--colors-blue-600)'
                  : 'var(--colors-blue-50)',
              color:
                selectedTagId === tag.tag_id
                  ? 'white'
                  : 'var(--colors-blue-700)',
            }}
          >
            {tag.name}
          </button>
        ))}
      </Flex>
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
              onMarkRead={onMarkRead}
              active={thread.thread_id === selected}
              allTags={tags}
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
          {isFiltering && !isSearching && displayThreads.length === 0 && (
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
      {!isFiltering && (
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
      (d.username?.toLowerCase().includes(search.toLowerCase()) ||
        d.email?.toLowerCase().includes(search.toLowerCase())),
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
              placeholder="ユーザー名 / メールアドレスで検索"
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
                gap={0}
              >
                <span
                  className={css({
                    color: selected === d.id ? 'blue.800' : 'gray.800',
                    fontWeight: 'medium',
                  })}
                >
                  {d.username}
                </span>
                {d.email && (
                  <span
                    className={css({
                      fontSize: 'xs',
                      color: 'gray.500',
                      lineClamp: 1,
                    })}
                  >
                    {d.email}
                  </span>
                )}
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
