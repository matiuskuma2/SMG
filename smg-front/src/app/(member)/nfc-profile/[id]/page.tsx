'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase';
import { NFCExchangeHistoryPage } from '@/components/mypage/NFCExchangeHistoryPage';

interface Props {
  params: { id: string };
}

export default function NFCProfilePage({ params }: Props) {
  const { user } = useAuth();
  const otherUserId = params.id;

  useEffect(() => {
    const recordExchange = async () => {
      if (!user) return;
      
      // 自分自身の場合は記録しない
      if (user.id === otherUserId) {
        console.log('[NFC] 自分自身のプロフィールのため交換記録をスキップ');
        return;
      }
      
      const supabase = createClient();

      console.log('[NFC] NFC交換履歴記録開始:', { user_id_1: user.id, user_id_2: otherUserId });
      
      // 今日開催のイベントを検索（ログインユーザー参加）
      console.log('[NFC] 今日開催イベント取得処理開始:', new Date().toISOString());
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

      const { data: attendeeData, error: attError } = await supabase
        .from('trn_event_attendee')
        .select('event_id')
        .eq('user_id', user.id)
        .is('deleted_at', null);
      if (attError) console.error('参加イベント取得中にエラー:', attError);
      const eventIds = attendeeData?.map(item => item.event_id) || [];
      console.log('[NFC] 参加イベントID一覧:', eventIds);

      let targetEventId: string | null = null;
      if (eventIds.length > 0) {
        const { data: events, error: evtError } = await supabase
          .from('mst_event')
          .select('event_id, mst_event_type(event_type_name)')
          .in('event_id', eventIds)
          .gte('event_start_datetime', startOfDay)
          .lt('event_start_datetime', endOfDay)
          .is('deleted_at', null);
        if (evtError) {
          console.error('イベント取得中にエラー:', evtError);
        } else if (events) {
          // リアルイベント優先
          const realEvents = events.filter(e => e.mst_event_type?.event_type_name !== 'オンラインセミナー');
          if (realEvents.length > 0) {
            targetEventId = realEvents[0].event_id;
          } else if (events.length > 0) {
            targetEventId = events[0].event_id;
          }
          console.log('[NFC] 取得イベント数:', events.length, 'ターゲットイベントID:', targetEventId);
        }
      }

      // UPSERT（ON CONFLICT）を使用してNFC交換履歴を記録
      const insertData = { 
        user_id_1: user.id, 
        user_id_2: otherUserId, 
        event_id: (targetEventId || null) as any // 一時的な型アサーション
      };
      console.log('[NFC] UPSERT データ:', insertData);
      
      const { error: upsertError } = await supabase
        .from('trn_nfc_exchange')
        .upsert(insertData, {
          onConflict: 'user_id_1,user_id_2',
          ignoreDuplicates: true
        });
        
      if (upsertError) {
        console.error('[NFC] UPSERT エラー:', JSON.stringify(upsertError, null, 2));
      } else {
        console.log('[NFC] NFC交換履歴記録成功（新規作成または更新）');
      }
    };
    recordExchange();
  }, [user, otherUserId]);

  return <NFCExchangeHistoryPage userId={otherUserId} />;
}