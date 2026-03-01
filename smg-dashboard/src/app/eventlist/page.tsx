'use client';

import type { Event } from '@/components/event/types';
import { EventListCards } from '@/components/eventlist/EventListCards';
import { EventListFooter } from '@/components/eventlist/EventListFooter';
import { EventListHeader } from '@/components/eventlist/EventListHeader';
import { EventListSearch } from '@/components/eventlist/EventListSearch';
import { EventListTable } from '@/components/eventlist/EventListTable';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { createClient } from '@/lib/supabase/client';
import { css } from '@/styled-system/css';
import { buildEditPageUrl } from '@/utils/navigation';
import { useRouter, useSearchParams } from 'next/navigation';
import type React from 'react';
import { Suspense, useEffect, useRef, useState } from 'react';

// SearchParamsを使用するコンポーネントを分離
function EventListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [events, setEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [itemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<string>('createdDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [eventTypes, setEventTypes] = useState<{ [key: string]: string }>({});
  const [eventTypesOrder, setEventTypesOrder] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // モーダル用の状態を追加
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  // URLからパラメータを取得し、状態を初期化
  useEffect(() => {
    if (searchParams && !isInitialized) {
      const pageParam = searchParams.get('page');
      const searchQueryParam = searchParams.get('search');
      const sortOrderParam = searchParams.get('sortOrder');
      const sortByParam = searchParams.get('sortBy');
      const filterLevelParam = searchParams.get('filterLevel');

      setCurrentPage(pageParam ? Number.parseInt(pageParam) : 1);

      if (searchQueryParam) {
        setSearchQuery(searchQueryParam);
        setInputValue(searchQueryParam); // 入力値も初期化
      }

      if (sortOrderParam === 'asc' || sortOrderParam === 'desc') {
        setSortOrder(sortOrderParam);
      }

      if (
        sortByParam === 'eventDate' ||
        sortByParam === 'applicants' ||
        sortByParam === 'createdDate'
      ) {
        setSortBy(sortByParam);
      }

      if (filterLevelParam) {
        setFilterLevel(filterLevelParam);
      }

      setIsInitialized(true);
    }
  }, [searchParams, isInitialized]);

  // イベントタイプの取得（初回のみ）
  useEffect(() => {
    const fetchEventTypes = async () => {
      try {
        const { data: eventTypeData, error: eventTypeError } = await supabase
          .from('mst_event_type')
          .select('event_type_id, event_type_name, created_at')
          .is('deleted_at', null)
          .order('created_at', { ascending: true });

        if (eventTypeError) throw eventTypeError;

        // イベントタイプをマップに変換
        const eventTypeMap = eventTypeData.reduce(
          (acc, type) => {
            acc[type.event_type_id] = type.event_type_name;
            return acc;
          },
          {} as { [key: string]: string },
        );

        // created_at順の名前リストを作成
        const eventTypeNames = eventTypeData.map(
          (type) => type.event_type_name,
        );

        setEventTypes(eventTypeMap);
        setEventTypesOrder(eventTypeNames);
      } catch (error) {
        console.error('Error fetching event types:', error);
      }
    };

    fetchEventTypes();
  }, [supabase]);

  // イベントデータの取得（ページネーション対応）
  useEffect(() => {
    if (!isInitialized) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // クエリの開始位置と終了位置を計算
        const from = (currentPage - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        // ベースクエリを構築
        let query = supabase
          .from('mst_event')
          .select(
            `
            *,
            attendees:trn_event_attendee!left(count)
          `,
            { count: 'exact' },
          )
          .is('deleted_at', null)
          .is('trn_event_attendee.deleted_at', null);

        // 検索フィルター
        if (searchQuery) {
          query = query.or(`event_name.ilike.%${searchQuery}%`);
        }

        // イベントタイプフィルター
        if (filterLevel !== 'all') {
          // event_type_nameからevent_type_idを逆引き
          const eventTypeId = Object.entries(eventTypes).find(
            ([, name]) => name === filterLevel,
          )?.[0];
          if (eventTypeId) {
            query = query.eq('event_type', eventTypeId);
          }
        }

        // ソート
        if (sortBy === 'eventDate') {
          query = query.order('event_start_datetime', {
            ascending: sortOrder === 'asc',
          });
        } else if (sortBy === 'createdDate') {
          query = query.order('created_at', { ascending: sortOrder === 'asc' });
        } else if (sortBy === 'applicants') {
          // 参加者数でのソートはクライアントサイドで実施
          query = query.order('event_start_datetime', { ascending: true });
        }

        // ページネーション
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) throw error;

        if (count !== null) {
          setTotalCount(count);
        }

        // 参加者数でソートする場合はここで処理
        let sortedData = data || [];
        if (sortBy === 'applicants') {
          sortedData = [...sortedData].sort((a, b) => {
            const aCount = a.attendees?.[0]?.count || 0;
            const bCount = b.attendees?.[0]?.count || 0;
            return sortOrder === 'asc' ? aCount - bCount : bCount - aCount;
          });
        }

        // アーカイブ存在状態を取得（現在のページのイベントのみ）
        const eventIds = sortedData.map((event) => event.event_id);

        // イベントIDを分割して取得（バッチ処理）
        const batchSize = 50;
        const archiveData: Array<{ event_id: string; is_draft: boolean }> = [];

        for (let i = 0; i < eventIds.length; i += batchSize) {
          const batchIds = eventIds.slice(i, i + batchSize);
          const { data: batchArchiveData, error: archiveError } = await supabase
            .from('mst_event_archive')
            .select('event_id, is_draft')
            .in('event_id', batchIds)
            .is('deleted_at', null);

          if (archiveError) throw archiveError;
          if (batchArchiveData) {
            // null値を除外して追加
            const validArchiveData = batchArchiveData.filter(
              (item): item is { event_id: string; is_draft: boolean } =>
                item.event_id !== null && item.is_draft !== null,
            );
            archiveData.push(...validArchiveData);
          }
        }

        // アーカイブが存在するイベントIDのセットとマップを作成
        const archiveEventIds = new Set(
          archiveData.map((archive) => archive.event_id),
        );
        const archiveStatusMap = new Map(
          archiveData.map((archive) => [
            archive.event_id,
            archive.is_draft || false,
          ]),
        );

        // データをEvent型に変換
        const formattedEvents = sortedData.map((event) => ({
          event_id: event.event_id,
          event_name: event.event_name,
          event_start_datetime: event.event_start_datetime,
          event_end_datetime: event.event_end_datetime,
          event_location: event.event_location,
          event_city: event.event_city,
          event_capacity: event.event_capacity,
          event_description: event.event_description,
          event_type: event.event_type,
          image_url: event.image_url,
          registration_start_datetime: event.registration_start_datetime,
          registration_end_datetime: event.registration_end_datetime,
          has_gather: event.has_gather,
          gather_start_time: event.gather_start_time,
          gather_end_time: event.gather_end_time,
          gather_location: event.gather_location,
          gather_price: event.gather_price,
          gather_capacity: event.gather_capacity,
          has_consultation: event.has_consultation,
          consultation_capacity: event.consultation_capacity,
          publish_start_at: event.publish_start_at,
          publish_end_at: event.publish_end_at,
          created_at: event.created_at,
          updated_at: event.updated_at,
          deleted_at: event.deleted_at,
          notification_sent: event.notification_sent,
          spreadsheet_id: event.spreadsheet_id,
          attendees: event.attendees,
          has_archive: archiveEventIds.has(event.event_id),
          archive_is_draft: archiveStatusMap.get(event.event_id) || null,
          is_draft: event.is_draft,
          gather_registration_end_datetime: event.gather_registration_end_datetime || null,
        }));

        setEvents(formattedEvents);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [
    supabase,
    currentPage,
    itemsPerPage,
    searchQuery,
    filterLevel,
    sortBy,
    sortOrder,
    isInitialized,
    eventTypes,
  ]);

  // 参加者一覧ページへのリダイレクト
  const handleViewParticipants = (eventId: string) => {
    router.push(`/event/participants/${eventId}`);
  };

  // 編集ページへのリダイレクト
  const handleEdit = (eventId: string) => {
    const editUrl = buildEditPageUrl(`/event/edit/${eventId}`, searchParams);
    router.push(editUrl);
  };

  // 入力値の変更処理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // 検索実行処理
  const executeSearch = () => {
    setSearchQuery(inputValue);
    updateQueryParams(1, { search: inputValue });
  };

  // URLクエリパラメータを更新する関数
  const updateQueryParams = (
    page: number,
    additionalParams?: {
      search?: string;
      sortOrder?: 'asc' | 'desc';
      sortBy?: string;
      filterLevel?: string;
    },
  ) => {
    setCurrentPage(page);
    const params = new URLSearchParams();

    params.set('page', page.toString());

    // 検索クエリ
    const searchValue =
      additionalParams?.search !== undefined
        ? additionalParams.search
        : searchQuery;
    if (searchValue) {
      params.set('search', searchValue);
    }

    // ソート順
    const sortOrderValue =
      additionalParams?.sortOrder !== undefined
        ? additionalParams.sortOrder
        : sortOrder;
    if (sortOrderValue) {
      params.set('sortOrder', sortOrderValue);
    }

    // ソート基準
    const sortByValue =
      additionalParams?.sortBy !== undefined ? additionalParams.sortBy : sortBy;
    if (sortByValue) {
      params.set('sortBy', sortByValue);
    }

    // フィルターレベル
    const filterLevelValue =
      additionalParams?.filterLevel !== undefined
        ? additionalParams.filterLevel
        : filterLevel;
    if (filterLevelValue && filterLevelValue !== 'all') {
      params.set('filterLevel', filterLevelValue);
    }

    router.push(`?${params.toString()}`);
  };

  // ページネーション用の計算（サーバーサイドでフィルタリング済み）
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // 現在のページのイベント（既にフィルタリング・ソート・ページネーション済み）
  const currentEvents = events;

  // ページ変更ハンドラー
  const handlePageChange = (page: number) => {
    updateQueryParams(page);
  };

  // 削除ボタンのハンドラー
  const handleDelete = (eventId: string) => {
    setEventToDelete(eventId);
    setIsDeleteModalOpen(true);
  };

  // 削除確認時の処理
  const confirmDelete = async () => {
    if (eventToDelete) {
      try {
        const { error } = await supabase
          .from('mst_event')
          .update({ deleted_at: new Date().toISOString() })
          .eq('event_id', eventToDelete);

        if (error) throw error;

        setEvents(events.filter((event) => event.event_id !== eventToDelete));
        setIsDeleteModalOpen(false);
        setEventToDelete(null);
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  // 削除キャンセル時の処理
  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setEventToDelete(null);
  };

  // ソート順を切り替える関数
  const toggleSortOrder = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    // ソート変更時は1ページ目に戻す
    updateQueryParams(1, { sortOrder: newOrder });
  };

  // フィルタリングの処理
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFilterLevel(value);
    // フィルタリング変更時は1ページ目に戻す
    updateQueryParams(1, { filterLevel: value });
  };

  // ソート基準変更の処理
  const handleSortByChange = (value: string) => {
    setSortBy(value);
    updateQueryParams(currentPage, { sortBy: value });
  };

  const handleCreateEvent = () => {
    router.push('/event/create');
  };

  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  return (
    <>
      <div
        className={css({
          p: { base: '2', xl: '8' },
          pt: { base: '4', xl: '20' },
          minH: 'calc(100vh - 64px)',
        })}
      >
        <div
          className={css({
            bg: 'white',
            rounded: 'lg',
            shadow: 'sm',
            overflow: 'hidden',
          })}
        >
          {/* ヘッダー部分 */}
          <EventListHeader handleCreateEvent={handleCreateEvent} />

          {/* 検索・アクション部分 */}
          <EventListSearch
            searchQuery={inputValue}
            handleInputChange={handleInputChange}
            executeSearch={executeSearch}
            sortBy={sortBy}
            sortOrder={sortOrder}
            filterLevel={filterLevel}
            setSortBy={handleSortByChange}
            toggleSortOrder={toggleSortOrder}
            handleFilterChange={handleFilterChange}
            eventTypesOrder={eventTypesOrder}
          />

          {/* テーブル部分 - デスクトップ表示 */}
          <EventListTable
            events={currentEvents}
            handleViewParticipants={handleViewParticipants}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            eventTypes={eventTypes}
          />

          {/* カード表示 - モバイル表示 */}
          <EventListCards
            events={currentEvents}
            handleViewParticipants={handleViewParticipants}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            eventTypes={eventTypes}
          />

          {/* フッター部分 */}
          <EventListFooter
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>

        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          itemName="イベント"
          targetName={
            events.find((e) => e.event_id === eventToDelete)?.event_name ??
            undefined
          }
        />
      </div>
    </>
  );
}

// メインコンポーネント - Suspenseで囲む
const EventListPage = () => {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <EventListContent />
    </Suspense>
  );
};

export default EventListPage;
