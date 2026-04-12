import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { createAdminClient } from '@/lib/supabase-admin';

// StripeのAPIキーを環境変数から取得
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  throw new Error('環境変数STRIPE_SECRET_KEYが設定されていません');
}

// APIキーがundefinedの場合にエラーを防ぐため、代替値を使用
const stripe = new Stripe(stripeKey, {
  apiVersion: '2024-04-10' as any, // 型アサーションで現在の有効なAPIバージョンを使用
});

export async function POST(request: Request) {
  try {
    // 認証（Cookie or Bearer 両対応）
    const authResult = await getAuthenticatedUser();
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    const userId = authResult.userId;
    if (!userId) {
      return NextResponse.json(
        { error: 'ユーザー情報の取得に失敗しました' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { event_id, selectedTypes, participationType, questionAnswers, isUrgent, isFirstConsultation } = body;

    // 入力バリデーション (400で返すべきもの。throw→500化させない)
    if (!event_id || typeof event_id !== 'string') {
      return NextResponse.json(
        { error: 'event_id は必須です' },
        { status: 400 }
      );
    }
    if (!Array.isArray(selectedTypes) || selectedTypes.length === 0) {
      return NextResponse.json(
        { error: 'selectedTypes は1件以上の配列が必要です' },
        { status: 400 }
      );
    }
    const ALLOWED_TYPES = ['Event', 'Networking', 'Consultation'];
    if (!selectedTypes.every((t: unknown) => typeof t === 'string' && ALLOWED_TYPES.includes(t))) {
      return NextResponse.json(
        { error: 'selectedTypes に不正な値が含まれています' },
        { status: 400 }
      );
    }

    // service_role クライアント（RLSバイパス）
    const adminSupabase = createAdminClient();

    // イベントの情報を取得（公開データだが、Bearer経路でも確実に動くよう admin で取得）
    const { data: eventData, error: eventError } = await (adminSupabase as any)
      .from('mst_event')
      .select('gather_price, event_name, event_start_datetime, event_capacity, gather_capacity, consultation_capacity, registration_end_datetime, gather_registration_end_datetime')
      .eq('event_id', event_id)
      .single();

    if (eventError || !eventData) {
      return NextResponse.json(
        { error: '指定されたイベントが見つかりません' },
        { status: 404 }
      );
    }

    // 締切日チェック（サーバーサイドバリデーション）
    const now = new Date();

    if (selectedTypes.includes('Event')) {
      if (eventData.registration_end_datetime && now > new Date(eventData.registration_end_datetime)) {
        return NextResponse.json(
          { error: 'イベントの申し込み期間が終了しています' },
          { status: 400 }
        );
      }
    }

    if (selectedTypes.includes('Networking')) {
      // 懇親会専用の締切日が設定されている場合はそちらを使用、なければイベント全体の締切日を使用
      const gatherDeadline = eventData.gather_registration_end_datetime || eventData.registration_end_datetime;
      if (gatherDeadline && now > new Date(gatherDeadline)) {
        return NextResponse.json(
          { error: '懇親会の申し込み期間が終了しています' },
          { status: 400 }
        );
      }
    }

    // 動的な商品名を生成（例: "4月24日(金) 東京定例会＆懇親会参加申込み"）
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'];
    const eventDate = new Date(eventData.event_start_datetime);
    const formattedDate = `${eventDate.getMonth() + 1}月${eventDate.getDate()}日(${dayOfWeek[eventDate.getDay()]})`;
    const productName = `${formattedDate} ${eventData.event_name}参加申込み`;

    // 定員数チェック（RLSバイパス）
    // 業務系エラーは 409 (Conflict) / 400 / 503 で明示的に返し、500 化を避ける。
    if (selectedTypes.includes('Event')) {
      const { count: totalEventCount, error: totalEventCountError } = await (adminSupabase as any)
        .from('trn_event_attendee')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event_id)
        .is('deleted_at', null);

      if (totalEventCountError) {
        console.error('イベント参加者数取得エラー:', totalEventCountError);
        return NextResponse.json(
          { error: 'イベント参加者数の取得に失敗しました。時間をおいて再度お試しください' },
          { status: 503 }
        );
      }

      if ((totalEventCount || 0) >= eventData.event_capacity) {
        return NextResponse.json(
          { error: 'イベントの定員に達しています', code: 'EVENT_FULL' },
          { status: 409 }
        );
      }
    }

    if (selectedTypes.includes('Networking')) {
      const { count: gatherCount, error: gatherCountError } = await (adminSupabase as any)
        .from('trn_gather_attendee')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event_id)
        .is('deleted_at', null);

      if (gatherCountError) {
        console.error('懇親会参加者数取得エラー:', gatherCountError);
        return NextResponse.json(
          { error: '懇親会参加者数の取得に失敗しました。時間をおいて再度お試しください' },
          { status: 503 }
        );
      }

      if ((gatherCount || 0) >= (eventData.gather_capacity || 0)) {
        return NextResponse.json(
          { error: '懇親会の定員に達しています', code: 'GATHER_FULL' },
          { status: 409 }
        );
      }
    }

    if (selectedTypes.includes('Consultation')) {
      const { count: consultationCount, error: consultationCountError } = await (adminSupabase as any)
        .from('trn_consultation_attendee')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event_id)
        .is('deleted_at', null);

      if (consultationCountError) {
        console.error('個別相談参加者数取得エラー:', consultationCountError);
        return NextResponse.json(
          { error: '個別相談参加者数の取得に失敗しました。時間をおいて再度お試しください' },
          { status: 503 }
        );
      }

      if ((consultationCount || 0) >= (eventData.consultation_capacity || 0)) {
        return NextResponse.json(
          { error: '個別相談の定員に達しています', code: 'CONSULTATION_FULL' },
          { status: 409 }
        );
      }
    }

    // 請求項目の作成
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    const checkoutMetadata: Record<string, string> = {
      event_id: event_id.toString(),
      selectedTypes: JSON.stringify(selectedTypes),
      userId: userId,
      participationType: participationType ? String(participationType) : '',
      questionAnswers: JSON.stringify(questionAnswers || {}),
      isUrgent: isUrgent ? 'true' : 'false',
      isFirstConsultation: isFirstConsultation ? 'true' : 'false',
    };

    if (selectedTypes.includes('Networking')) {
      // 料金未設定はサーバー側の構成不備。クライアントに 409 で返しつつ
      // 500化は避ける。運営が料金設定するまで申込不可という業務意味。
      if (eventData.gather_price === null || eventData.gather_price === undefined) {
        console.error('懇親会の料金未設定 event_id=', event_id);
        return NextResponse.json(
          { error: '懇親会の料金が設定されていません。運営までお問い合わせください', code: 'GATHER_PRICE_NOT_SET' },
          { status: 409 }
        );
      }

      lineItems.push({
        price_data: {
          currency: 'jpy',
          product_data: {
            name: productName,
          },
          unit_amount: eventData.gather_price,
        },
        quantity: 1,
      });
    }
    
    if (selectedTypes.includes('Consultation')) {
      // 個別相談は無料なので、請求項目は追加しない
    }

    // チェックアウトセッションの作成
    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: 'payment',
      success_url: selectedTypes.includes('Consultation') 
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/off-line-consulations/${event_id}?session_id={CHECKOUT_SESSION_ID}`
        : `${process.env.NEXT_PUBLIC_BASE_URL}/events/${event_id}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/events/${event_id}`,
      metadata: checkoutMetadata,
      payment_intent_data: {
        description: productName,
        metadata: checkoutMetadata,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe決済セッション作成エラー:', error);
    return NextResponse.json(
      { error: '決済セッションの作成に失敗しました' },
      { status: 500 }
    );
  }
} 