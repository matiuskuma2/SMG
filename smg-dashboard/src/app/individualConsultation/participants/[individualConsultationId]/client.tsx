'use client';

import { useMediaQuery } from '@/components/event/useMediaQuery';
import { IndividualConsultationInformation } from '@/components/individualConsultation/IndividualConsultationInformation';
import { ParticipantsList } from '@/components/individualConsultation/ParticipantsList';
import { ParticipantsTabs } from '@/components/individualConsultation/ParticipantsTabs';
import { css } from '@/styled-system/css';
import { vstack } from '@/styled-system/patterns';
import type {
  IndividualConsultationFormType,
  Participant,
} from '@/types/individualConsultation';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

// このコンポーネントはクライアントコンポーネントとして実行される
export function ParticipantsClientPage({
  participants,
  consultationData,
  individualConsultationId,
}: {
  participants: Participant[];
  consultationData: IndividualConsultationFormType;
  individualConsultationId: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // 検索実行
  const executeSearch = () => {
    setSearchQuery(searchInput);
  };

  const ITEMS_PER_PAGE = 5;
  // URLのクエリパラメータからタブとページを取得
  const pageParam = searchParams.get('page');
  const currentPage = pageParam ? Number.parseInt(pageParam) : 1;

  // メールアドレスでフィルタリングし、申し込み順（created_at）でソート
  const filteredAndSortedParticipants = useMemo(() => {
    let result = [...participants];

    // メールアドレスで検索
    if (searchQuery.trim()) {
      result = result.filter((p) =>
        p.email.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // 申し込み順（created_at）でソート
    result.sort((a, b) => {
      const aDate = new Date(a.created_at || 0).getTime();
      const bDate = new Date(b.created_at || 0).getTime();
      return sortOrder === 'desc' ? bDate - aDate : aDate - bDate;
    });

    return result;
  }, [participants, searchQuery, sortOrder]);

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;

  const TOTAL_PAGES = Math.ceil(
    filteredAndSortedParticipants.length / ITEMS_PER_PAGE,
  );

  // ページ変更ハンドラー
  const handlePageChange = (page: number) => {
    router.push(
      `/individualConsultation/participants/${individualConsultationId}?page=${page}`,
    );
  };

  const currentPageData = filteredAndSortedParticipants.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  return (
    <div
      className={css({
        p: { base: '2', xl: '8' },
        pt: { base: '4', xl: '20' },
        minH: 'calc(100vh - 64px)',
      })}
    >
      <div
        className={vstack({
          gap: '6',
          p: { base: '3', md: '6' },
          alignItems: 'stretch',
          bg: 'white',
          borderRadius: 'md',
          boxShadow: 'sm',
          width: 'full',
          height: 'auto',
        })}
      >
        {/* イベント情報セクション */}
        <IndividualConsultationInformation
          individualConsultation={consultationData}
        />

        {/* フィルタ・アクションボタン */}
        <ParticipantsTabs
          participants={currentPageData}
          individualConsultation={consultationData}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          executeSearch={executeSearch}
        />

        {/* 参加者一覧 */}
        <ParticipantsList
          participants={currentPageData}
          isMobile={isMobile}
          currentPage={currentPage}
          totalPages={TOTAL_PAGES}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
