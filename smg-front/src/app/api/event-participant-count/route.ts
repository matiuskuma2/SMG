import { createAdminClient } from '@/lib/supabase-admin';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * イベント参加者数を取得するAPI
 * service_role を使用してRLSをバイパスし、正確なカウントを返す
 * 
 * Query params:
 *   event_id: string (required)
 * 
 * Returns:
 *   eventCount: 全イベント参加者数（オンライン+オフライン）
 *   offlineEventCount: オフラインイベント参加者数
 *   gatherCount: 懇親会参加者数
 *   consultationCount: 個別相談参加者数
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック（Cookie or Bearer の両方に対応）
    const authResult = await getAuthenticatedUser();
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');

    if (!eventId) {
      return NextResponse.json(
        { error: 'event_id は必須パラメータです' },
        { status: 400 }
      );
    }

    // service_role クライアントで参加者数を取得（RLSバイパス）
    const supabase = createAdminClient();

    const [eventCountResult, offlineEventCountResult, gatherCountResult, consultationCountResult] = await Promise.all([
      // 全イベント参加者数（オンライン+オフライン）
      (supabase as any)
        .from('trn_event_attendee')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .is('deleted_at', null),
      // オフライン参加者数
      (supabase as any)
        .from('trn_event_attendee')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('is_offline', true)
        .is('deleted_at', null),
      // 懇親会参加者数
      (supabase as any)
        .from('trn_gather_attendee')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .is('deleted_at', null),
      // 個別相談参加者数
      (supabase as any)
        .from('trn_consultation_attendee')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .is('deleted_at', null),
    ]);

    return NextResponse.json({
      eventCount: eventCountResult.count || 0,
      offlineEventCount: offlineEventCountResult.count || 0,
      gatherCount: gatherCountResult.count || 0,
      consultationCount: consultationCountResult.count || 0,
    });
  } catch (error) {
    console.error('参加者数取得エラー:', error);
    return NextResponse.json(
      { error: '参加者数の取得に失敗しました' },
      { status: 500 }
    );
  }
}
