'use client';

import { EventInformation } from '@/components/event/EventInformation';
import { ParticipantsList } from '@/components/event/ParticipantsList';
import { ParticipantsTabs } from '@/components/event/ParticipantsTabs';
import type { EventData } from '@/components/event/types';
import type { Participant } from '@/components/event/types';
import { useMediaQuery } from '@/components/event/useMediaQuery';
import { createClient } from '@/lib/supabase/client';
import { css } from '@/styled-system/css';
import { vstack } from '@/styled-system/patterns';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

// ページごとの表示件数
const ITEMS_PER_PAGE = 10;

type Tab = 'event' | 'party' | 'consultation';

export default function ParticipantsPage({
  params,
}: { params: { eventid: string } }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const supabase = createClient();

  // URLのクエリパラメータからタブとページを取得
  const tabParam = (searchParams.get('tab') as Tab) || 'event';
  const pageParam = searchParams.get('page');
  const currentPage = pageParam ? Number.parseInt(pageParam) : 1;
  const [activeTab, setActiveTab] = useState<Tab>(tabParam);

  // データの状態管理
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [eventParticipants, setEventParticipants] = useState<Participant[]>([]);
  const [partyParticipants, setPartyParticipants] = useState<Participant[]>([]);
  const [consultationParticipants, setConsultationParticipants] = useState<
    Participant[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundSuccess, setRefundSuccess] = useState<{
    [key: string]: boolean;
  }>({});
  const [refundError, setRefundError] = useState<{ [key: string]: string }>({});
  const [isOperator, setIsOperator] = useState(false);

  // イベント情報を取得
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const { data: event, error: eventError } = await supabase
          .from('mst_event')
          .select('*')
          .eq('event_id', params.eventid)
          .single();

        if (eventError) throw eventError;
        if (event) {
          setEventData({
            event_id: event.event_id,
            event_name: event.event_name,
            image_url: event.image_url || '',
            event_start_datetime: event.event_start_datetime,
            event_end_datetime: event.event_end_datetime,
            event_location: event.event_location,
            event_city: event.event_city || '',
            event_capacity: event.event_capacity,
            event_description: event.event_description || '',
            event_type: event.event_type,
            registration_start_datetime: event.registration_start_datetime,
            registration_end_datetime: event.registration_end_datetime,
            has_gather: event.has_gather || false,
            gather_start_time: event.gather_start_time || '',
            gather_end_time: event.gather_end_time || '',
            gather_location: event.gather_location || '',
            gather_price: event.gather_price || 0,
            gather_capacity: event.gather_capacity || 0,
            has_consultation: event.has_consultation || false,
            consultation_capacity: event.consultation_capacity || 0,
            publish_start_at: event.publish_start_at || '',
            publish_end_at: event.publish_end_at || '',
            created_at: event.created_at || '',
            updated_at: event.updated_at || '',
            deleted_at: event.deleted_at,
            notification_sent: event.notification_sent || false,
            spreadsheet_id: event.spreadsheet_id || '',
            is_draft: event.is_draft || null,
          });
        }
      } catch (e) {
        console.error('イベント情報の取得に失敗しました:', e);
        setError('イベント情報の取得に失敗しました');
      }
    };

    fetchEventData();
  }, [params.eventid, supabase]);

  // 参加者データを取得
  useEffect(() => {
    const fetchParticipants = async () => {
      setIsLoading(true);
      try {
        // イベント参加者データの取得
        const { data: eventAttendees, error: eventError } = await supabase
          .from('trn_event_attendee')
          .select(`
            *,
            user:user_id(
              *,
              trn_group_user(
                group:group_id(
                  title
                ),
                deleted_at
              )
            )
          `)
          .eq('event_id', params.eventid)
          .is('deleted_at', null);

        if (eventError) throw eventError;

        // 懇親会参加者データの取得（grouユーザーでleft joinを使用）
        const { data: gatherAttendees, error: gatherError } = await supabase
          .from('trn_gather_attendee')
          .select(`
            *,
            user:user_id(
              *,
              trn_group_user(
                group:group_id(
                  title
                ),
                deleted_at
              )
            )
          `)
          .eq('event_id', params.eventid);

        if (gatherError) throw gatherError;

        // 個別相談会参加者データの取得
        const { data: consultationAttendees, error: consultationError } =
          await supabase
            .from('trn_consultation_attendee')
            .select(`
            *,
            user:user_id(
              *,
              trn_group_user(
                group:group_id(
                  title
                ),
                deleted_at
              )
            )
          `)
            .eq('event_id', params.eventid)
            .is('deleted_at', null);

        if (consultationError) throw consultationError;

        // デバッグ用のコンソールログ
        console.log(
          '参加者のグループ情報:',
          eventAttendees?.map((attendee) => ({
            username: attendee.user?.username,
            groupInfo: attendee.user?.trn_group_user,
            rawData: attendee,
          })),
        );

        // データを適切な形式に変換
        if (eventAttendees) {
          const formattedEventParticipants = eventAttendees.map(
            (attendee, index) => {
              // アクティブなグループメンバーシップを取得（deleted_atがnullのもの）
              const activeGroupMemberships =
                attendee.user?.trn_group_user?.filter(
                  (membership) => membership.deleted_at === null,
                ) || [];

              const groupTitles = activeGroupMemberships
                .map((membership) => membership.group?.title)
                .filter((title) => title) as string[];

              const primaryGroupTitle = groupTitles[0] || '未所属';

              console.log(
                `イベント参加者 ${attendee.user?.username} のグループ情報:`,
                {
                  allMemberships: attendee.user?.trn_group_user,
                  activeMemberships: activeGroupMemberships,
                  groupTitles: groupTitles,
                  primaryGroupTitle: primaryGroupTitle,
                },
              );

              return {
                id: index + 1,
                icon: '👤',
                name: attendee.user?.username || '名前なし',
                userId: attendee.user_id,
                companyName: attendee.user?.company_name || '',
                status: '参加予定',
                email: attendee.user?.email || '',
                phone: attendee.user?.phone_number || '',
                memberNumber: '',
                userType: attendee.user?.user_type || '',
                groupAffiliation: primaryGroupTitle,
                groupAffiliations:
                  groupTitles.length > 0 ? groupTitles : undefined,
                profileImage: attendee.user?.icon || '',
                is_offline: attendee.is_offline,
              };
            },
          );
          console.log('変換後の参加者データ:', formattedEventParticipants);
          setEventParticipants(formattedEventParticipants);
        }

        if (gatherAttendees) {
          // デバッグ用に支払い状況をログ出力
          console.log(
            '懇親会参加者データ:',
            gatherAttendees.map((a) => ({
              user_id: a.user_id,
              username: a.user?.username,
              payment_status: a.stripe_payment_status,
              payment_intent: a.stripe_payment_intent_id,
            })),
          );

          const formattedPartyParticipants = gatherAttendees.map(
            (attendee, index) => {
              // アクティブなグループメンバーシップを取得（deleted_atがnullのもの）
              const activeGroupMemberships =
                attendee.user?.trn_group_user?.filter(
                  (membership) => membership.deleted_at === null,
                ) || [];

              const groupTitles = activeGroupMemberships
                .map((membership) => membership.group?.title)
                .filter((title) => title) as string[];

              const primaryGroupTitle = groupTitles[0] || '未所属';

              // デバッグログ追加
              console.log(
                `懇親会参加者 ${attendee.user?.username} のグループ情報:`,
                {
                  allMemberships: attendee.user?.trn_group_user,
                  activeMemberships: activeGroupMemberships,
                  groupTitles: groupTitles,
                  primaryGroupTitle: primaryGroupTitle,
                },
              );

              return {
                id: index + 1,
                icon: '👤',
                name: attendee.user?.username || '名前なし',
                userId: attendee.user_id,
                companyName: attendee.user?.company_name || '',
                status: attendee.deleted_at ? 'キャンセル済み' : '参加予定',
                email: attendee.user?.email || '',
                phone: attendee.user?.phone_number || '',
                memberNumber: '',
                userType: attendee.user?.user_type || '',
                groupAffiliation: primaryGroupTitle,
                groupAffiliations:
                  groupTitles.length > 0 ? groupTitles : undefined,
                profileImage: attendee.user?.icon || '',
                paymentStatus: attendee.stripe_payment_status || '未払い',
                paymentIntentId: attendee.stripe_payment_intent_id || '',
                deleted_at: attendee.deleted_at,
              };
            },
          );
          setPartyParticipants(formattedPartyParticipants);
        }

        if (consultationAttendees) {
          const formattedConsultationParticipants = consultationAttendees.map(
            (attendee, index) => {
              // アクティブなグループメンバーシップを取得（deleted_atがnullのもの）
              const activeGroupMemberships =
                attendee.user?.trn_group_user?.filter(
                  (membership) => membership.deleted_at === null,
                ) || [];

              const groupTitles = activeGroupMemberships
                .map((membership) => membership.group?.title)
                .filter((title) => title) as string[];

              const primaryGroupTitle = groupTitles[0] || '未所属';

              return {
                id: index + 1,
                icon: '👤',
                name: attendee.user?.username || '名前なし',
                userId: attendee.user_id,
                companyName: attendee.user?.company_name || '',
                status: '参加予定',
                email: attendee.user?.email || '',
                phone: attendee.user?.phone_number || '',
                memberNumber: '',
                userType: attendee.user?.user_type || '',
                groupAffiliation: primaryGroupTitle,
                groupAffiliations:
                  groupTitles.length > 0 ? groupTitles : undefined,
                profileImage: attendee.user?.icon || '',
                is_urgent: attendee.is_urgent,
                is_first_consultation: attendee.is_first_consultation,
                notes: attendee.notes || undefined,
              };
            },
          );
          setConsultationParticipants(formattedConsultationParticipants);
        }
      } catch (e) {
        console.error('参加者データの取得に失敗しました:', e);
        setError('参加者データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.eventid) {
      fetchParticipants();
    }
  }, [params.eventid, supabase]);

  // ログインユーザーの情報とグループ情報を取得
  useEffect(() => {
    const checkUserPermission = async () => {
      try {
        // 現在のログインユーザーを取得
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (user) {
          // ユーザーのグループ情報を取得
          const { data: userGroups, error: groupError } = await supabase
            .from('trn_group_user')
            .select(`
              group:group_id(
                title
              )
            `)
            .eq('user_id', user.id)
            .is('deleted_at', null);

          if (groupError) throw groupError;

          // 運営者グループに所属しているかチェック
          const isUserOperator = userGroups?.some(
            (group) => group.group?.title === '運営',
          );

          setIsOperator(!!isUserOperator);
          console.log('ユーザーは運営者か:', isUserOperator);
        }
      } catch (e) {
        console.error('ユーザー権限の確認に失敗しました:', e);
      }
    };

    checkUserPermission();
  }, [supabase]);

  // 返金処理
  const handleRefund = async (userId: string, paymentIntentId: string) => {
    setIsRefunding(true);
    setRefundError((prev) => ({ ...prev, [userId]: '' }));

    try {
      const response = await fetch('/api/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentIntentId }),
      });

      const result = await response.json();

      if (result.success) {
        setRefundSuccess((prev) => ({ ...prev, [userId]: true }));
        // エラーをクリア
        setRefundError((prev) => {
          const newErrors = { ...prev };
          delete newErrors[userId];
          return newErrors;
        });
        // ページをリロード
        window.location.reload();
      } else {
        const errorMessage = result.error || '返金処理に失敗しました';
        setRefundError((prev) => ({ ...prev, [userId]: errorMessage }));
      }
    } catch (error) {
      console.error('返金処理でエラーが発生しました:', error);
      const errorMessage = '返金処理でエラーが発生しました';
      setRefundError((prev) => ({ ...prev, [userId]: errorMessage }));
    } finally {
      setIsRefunding(false);
    }
  };

  // タブに応じた参加者データを取得
  const getParticipantsData = useCallback(() => {
    switch (activeTab) {
      case 'event':
        return eventParticipants;
      case 'party':
        return partyParticipants;
      case 'consultation':
        return consultationParticipants;
      default:
        return eventParticipants;
    }
  }, [
    activeTab,
    eventParticipants,
    partyParticipants,
    consultationParticipants,
  ]);

  // 現在のタブに応じたデータを取得
  const participantsData = getParticipantsData();

  // ページネーション用の計算
  useEffect(() => {
    const data = getParticipantsData();
    setTotalPages(Math.ceil(data.length / ITEMS_PER_PAGE));
  }, [getParticipantsData]);

  // 現在のページに表示するデータを計算
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPageData = participantsData.slice(startIndex, endIndex);

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

  // ローディング中の表示
  if (isLoading) {
    return (
      <div
        className={css({
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        })}
      >
        <p>データを読み込み中...</p>
      </div>
    );
  }

  // エラー時の表示
  if (error || !eventData) {
    return (
      <div
        className={css({
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        })}
      >
        <p>{error || 'イベントデータが見つかりませんでした'}</p>
      </div>
    );
  }

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
          maxWidth: '1400px',
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
          activeTab={activeTab}
          eventData={eventData}
          handleTabChange={handleTabChange}
          participantsMap={{
            event: eventParticipants,
            party: partyParticipants,
            consultation: consultationParticipants,
          }}
        />

        {/* 参加者一覧 */}
        <ParticipantsList
          participants={currentPageData}
          activeTab={activeTab}
          isMobile={isMobile}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          eventId={params.eventid}
          onRefund={
            activeTab === 'party' && isOperator ? handleRefund : undefined
          }
        />
      </div>
    </div>
  );
}
