'use client';

import { EventInformation } from '@/components/event/EventInformation';
import { ParticipantsList } from '@/components/event/ParticipantsList';
import { ParticipantsTabs } from '@/components/event/ParticipantsTabs';
import type { EventData } from '@/components/event/types';
import type { Participant } from '@/components/event/types';
import { useMediaQuery } from '@/components/event/useMediaQuery';
import { css } from '@/styled-system/css';
import { vstack } from '@/styled-system/patterns';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

// 仮のデータ（実際にはAPIから取得する）
const eventData: EventData = {
  event_id: '1',
  event_name: '2024年 春のビジネス交流会',
  image_url:
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
  event_start_datetime: '2024-04-15T10:00:00',
  event_end_datetime: '2024-04-15T17:00:00',
  event_location: '東京都渋谷区 〇〇ホール',
  event_city: '東京都',
  event_capacity: 100,
  event_description:
    'ビジネスパーソン向けの交流会です。業界を超えた交流の場を提供します。',
  event_type: 'business',
  registration_start_datetime: '2024-03-01T00:00:00',
  registration_end_datetime: '2024-04-10T23:59:59',
  has_gather: true,
  gather_start_time: '2024-04-15T18:00:00',
  gather_end_time: '2024-04-15T20:00:00',
  gather_location: '東京都渋谷区 〇〇レストラン',
  gather_price: 5000,
  gather_capacity: 50,
  has_consultation: true,
  consultation_capacity: 20,
  publish_start_at: '2024-02-01T00:00:00',
  publish_end_at: '2024-04-15T23:59:59',
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
  deleted_at: null,
  notification_sent: false,
  spreadsheet_id: null,
  is_draft: null,
};

// イベント参加者データ
const eventParticipantsData: Participant[] = [
  {
    id: 1,
    icon: '👤',
    name: '田中秀一',
    userId: 'shu1995',
    companyName: '株式会社ABC',
    status: '参加予定',
    email: 'tanaka@abc-corp.co.jp',
    phone: '090-1234-5678',
    memberNumber: 'M12345',
    userType: '代表者',
    groupAffiliation: '営業部',
    profileImage:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
  },
  {
    id: 2,
    icon: '👤',
    name: '佐藤健太',
    userId: 'kenta_s',
    companyName: '株式会社XYZ',
    status: '申込あり',
    email: 'sato.k@xyz.co.jp',
    phone: '080-2345-6789',
    memberNumber: 'M23456',
    userType: '一般',
    groupAffiliation: '技術部',
    profileImage:
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
  },
  {
    id: 3,
    icon: '👤',
    name: '鈴木美咲',
    userId: 'misaki2000',
    companyName: 'テクノソリューション株式会社',
    status: '参加予定',
    email: 'suzuki@techno-solution.jp',
    phone: '090-3456-7890',
    memberNumber: 'M34567',
    userType: '代表者',
    groupAffiliation: 'マーケティング部',
    profileImage:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
  },
];

// 懇親会参加者データ
const partyParticipantsData: Participant[] = [
  {
    id: 1,
    icon: '👤',
    name: '田中秀一',
    userId: 'shu1995',
    companyName: '株式会社ABC',
    status: '参加予定',
    email: 'tanaka@abc-corp.co.jp',
    phone: '090-1234-5678',
    memberNumber: 'M12345',
    userType: '代表者',
    groupAffiliation: '営業部',
    paymentStatus: '支払い済み',
    profileImage:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
  },
  {
    id: 4,
    icon: '👤',
    name: '山田太郎',
    userId: 'taro_yamada',
    companyName: '山田商事',
    status: '申込あり',
    email: 'yamada@yamada-corp.jp',
    phone: '070-1234-5678',
    memberNumber: 'M45678',
    userType: '一般',
    groupAffiliation: '営業部',
    paymentStatus: '未払い',
    profileImage:
      'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
  },
  {
    id: 5,
    icon: '👤',
    name: '伊藤花子',
    userId: 'hanako123',
    companyName: 'デザインスタジオ',
    status: '参加予定',
    email: 'ito.h@design-studio.com',
    phone: '080-9876-5432',
    memberNumber: 'M56789',
    userType: 'パートナー',
    groupAffiliation: 'デザイン部',
    paymentStatus: '支払い済み',
    profileImage:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
  },
];

// 個別相談会参加者データ
const consultationParticipantsData: Participant[] = [
  {
    id: 3,
    icon: '👤',
    name: '鈴木美咲',
    userId: 'misaki2000',
    companyName: 'テクノソリューション株式会社',
    status: '参加予定',
    email: 'suzuki@techno-solution.jp',
    phone: '090-3456-7890',
    memberNumber: 'M34567',
    userType: '代表者',
    groupAffiliation: 'マーケティング部',
    profileImage:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
  },
  {
    id: 6,
    icon: '👤',
    name: '高橋誠',
    userId: 'makoto_t',
    companyName: '高橋電機',
    status: '申込あり',
    email: 'takahashi@takahashi-electric.co.jp',
    phone: '090-8765-4321',
    memberNumber: 'M67890',
    userType: '代表者',
    groupAffiliation: '開発部',
    profileImage:
      'https://images.unsplash.com/photo-1504257432389-52343af06ae3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
  },
];

// ページごとの表示件数
const ITEMS_PER_PAGE = 1;

type Tab = 'event' | 'party' | 'consultation';

export default function ParticipantsPage({
  params,
}: { params: { eventid: string } }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');

  // URLのクエリパラメータからタブとページを取得
  const tabParam = (searchParams.get('tab') as Tab) || 'event';
  const pageParam = searchParams.get('page');
  const currentPage = pageParam ? Number.parseInt(pageParam) : 1;
  const [activeTab, setActiveTab] = useState<Tab>(tabParam);

  // タブに応じた参加者データを取得
  const getParticipantsData = () => {
    switch (activeTab) {
      case 'event':
        return eventParticipantsData;
      case 'party':
        return partyParticipantsData;
      case 'consultation':
        return consultationParticipantsData;
      default:
        return eventParticipantsData;
    }
  };

  // 現在のタブに応じたデータを取得
  const participantsData = getParticipantsData();

  // 総ページ数をデータの長さから計算
  const TOTAL_PAGES = participantsData.length;

  // 現在のページに表示するデータを計算
  const currentPageData = participantsData.slice(currentPage - 1, currentPage);

  // タブが変更されたらURLも更新し、ページを1に戻す
  useEffect(() => {
    router.push(
      `/event/participants/${params.eventid}?tab=${activeTab}&page=1`,
    );
  }, [activeTab, params.eventid, router]);

  // タブ変更ハンドラー
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
  };

  // ページ変更ハンドラー
  const handlePageChange = (page: number) => {
    router.push(
      `/event/participants/${params.eventid}?tab=${activeTab}&page=${page}`,
    );
  };

  return (
    <div
      className={css({
        display: 'flex',
        justifyContent: 'center',
        width: 'full',
        height: 'auto',
      })}
    >
      <div
        className={vstack({
          gap: '6',
          p: { base: '3', md: '6' },
          alignItems: 'stretch',
          bg: 'white',
          m: { base: '2', md: '4' },
          borderRadius: 'md',
          boxShadow: 'sm',
          maxWidth: '1200px',
          width: 'full',
          height: 'auto',
        })}
      >
        {/* イベント情報セクション */}
        <EventInformation
          eventData={eventData}
          activeTab={activeTab}
          participants={participantsData}
        />

        {/* タブとCSVダウンロードボタン */}
        <ParticipantsTabs
          eventData={eventData}
          activeTab={activeTab}
          handleTabChange={handleTabChange}
          participantsMap={{
            event: eventParticipantsData,
            party: partyParticipantsData,
            consultation: consultationParticipantsData,
          }}
        />

        {/* 参加者一覧 */}
        <ParticipantsList
          participants={currentPageData}
          activeTab={activeTab}
          isMobile={isMobile}
          currentPage={currentPage}
          totalPages={TOTAL_PAGES}
          onPageChange={handlePageChange}
          eventId={params.eventid}
        />
      </div>
    </div>
  );
}
