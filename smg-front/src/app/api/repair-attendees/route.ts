import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase-admin';

/**
 * 一時的なデータ修復エンドポイント
 * Stripeから決済データを取得し、trn_gather_attendee / trn_consultation_attendee に反映する
 * 
 * GET /api/repair-attendees?event_id=xxx&secret=REPAIR_SECRET
 */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10' as any,
});

// セキュリティ用のシークレット（修復完了後に削除する）
const REPAIR_SECRET = 'smg-repair-2026-03-15';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('event_id');
  const secret = searchParams.get('secret');

  // セキュリティチェック
  if (secret !== REPAIR_SECRET) {
    return NextResponse.json({ error: '認証エラー' }, { status: 403 });
  }

  if (!eventId) {
    return NextResponse.json({ error: 'event_idが必要です' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const results: any[] = [];
  const errors: any[] = [];

  try {
    // Stripeから該当イベントの決済セッションを取得
    // payment_intent のmetadataにevent_idが含まれているものを検索
    let hasMore = true;
    let startingAfter: string | undefined;
    const sessions: Stripe.Checkout.Session[] = [];

    while (hasMore) {
      const params: Stripe.Checkout.SessionListParams = {
        limit: 100,
        expand: ['data.payment_intent'],
      };
      if (startingAfter) {
        params.starting_after = startingAfter;
      }

      const result = await stripe.checkout.sessions.list(params);
      
      // event_idでフィルタ
      const filtered = result.data.filter(
        (s) => s.metadata?.event_id === eventId && s.payment_status === 'paid'
      );
      sessions.push(...filtered);
      
      hasMore = result.has_more;
      if (result.data.length > 0) {
        startingAfter = result.data[result.data.length - 1].id;
      }

      // 最大1000件まで
      if (sessions.length > 1000) break;
      // 古いセッションまで遡らないように（3ヶ月前まで）
      const threeMonthsAgo = Date.now() / 1000 - 90 * 24 * 60 * 60;
      const lastSession = result.data[result.data.length - 1];
      if (lastSession && lastSession.created < threeMonthsAgo) break;
    }

    console.log(`Found ${sessions.length} paid sessions for event ${eventId}`);

    for (const session of sessions) {
      const { event_id, selectedTypes, userId, participationType } = session.metadata || {};

      if (!userId || !event_id) {
        errors.push({ sessionId: session.id, error: 'missing metadata' });
        continue;
      }

      let parsedSelectedTypes: string[] = [];
      try {
        parsedSelectedTypes = selectedTypes ? JSON.parse(selectedTypes) : [];
      } catch {
        errors.push({ sessionId: session.id, error: 'invalid selectedTypes' });
        continue;
      }

      const sessionResult: any = {
        sessionId: session.id,
        userId,
        selectedTypes: parsedSelectedTypes,
        actions: [],
      };

      // Networking -> trn_gather_attendee
      if (parsedSelectedTypes.includes('Networking')) {
        const paymentIntent = typeof session.payment_intent === 'string' 
          ? session.payment_intent 
          : session.payment_intent?.id || '';

        const { error } = await supabase
          .from('trn_gather_attendee')
          .upsert({
            event_id,
            user_id: userId,
            stripe_payment_intent_id: paymentIntent,
            stripe_payment_status: 'succeeded',
            payment_amount: session.amount_total || 0,
            payment_date: new Date(session.created * 1000).toISOString(),
            deleted_at: null,
          });

        if (error) {
          sessionResult.actions.push({ table: 'trn_gather_attendee', status: 'error', error });
        } else {
          sessionResult.actions.push({ table: 'trn_gather_attendee', status: 'success' });
        }
      }

      // Event -> trn_event_attendee
      if (parsedSelectedTypes.includes('Event')) {
        const { error } = await supabase
          .from('trn_event_attendee')
          .upsert({
            event_id,
            user_id: userId,
            is_offline: participationType ? participationType === 'Offline' : true,
            deleted_at: null,
          });

        if (error) {
          sessionResult.actions.push({ table: 'trn_event_attendee', status: 'error', error });
        } else {
          sessionResult.actions.push({ table: 'trn_event_attendee', status: 'success' });
        }
      }

      // Consultation -> trn_consultation_attendee
      if (parsedSelectedTypes.includes('Consultation')) {
        const { error } = await supabase
          .from('trn_consultation_attendee')
          .upsert({
            event_id,
            user_id: userId,
            deleted_at: null,
          });

        if (error) {
          sessionResult.actions.push({ table: 'trn_consultation_attendee', status: 'error', error });
        } else {
          sessionResult.actions.push({ table: 'trn_consultation_attendee', status: 'success' });
        }
      }

      results.push(sessionResult);
    }

    return NextResponse.json({
      message: `Processed ${sessions.length} sessions for event ${eventId}`,
      totalSessions: sessions.length,
      results,
      errors,
    });
  } catch (error) {
    console.error('修復エラー:', error);
    return NextResponse.json(
      { error: 'データ修復に失敗しました', details: String(error) },
      { status: 500 }
    );
  }
}
