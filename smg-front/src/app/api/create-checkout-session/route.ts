import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase-server';
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
    const body = await request.json();
    const { event_id, selectedTypes, participationType, questionAnswers, isUrgent, isFirstConsultation } = body;

    // Supabaseクライアントの作成
    const supabase = await createClient();

    // イベントの情報を取得
    const { data: eventData, error: eventError } = await supabase
      .from('mst_event')
      .select('gather_price, event_name, event_start_datetime, event_capacity, gather_capacity, consultation_capacity, registration_end_datetime, gather_registration_end_datetime')
      .eq('event_id', event_id)
      .single();

    if (eventError) {
      throw new Error('イベント情報の取得に失敗しました');
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

    // service_roleクライアントで定員数チェック（RLSバイパス）
    const adminSupabase = createAdminClient();

    if (selectedTypes.includes('Event')) {
      const { count: totalEventCount, error: totalEventCountError } = await (adminSupabase as any)
        .from('trn_event_attendee')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event_id)
        .is('deleted_at', null);

      if (totalEventCountError) {
        throw new Error('イベント参加者数の取得に失敗しました');
      }

      if ((totalEventCount || 0) >= eventData.event_capacity) {
        throw new Error('イベントの定員に達しています');
      }
    }

    if (selectedTypes.includes('Networking')) {
      const { count: gatherCount, error: gatherCountError } = await (adminSupabase as any)
        .from('trn_gather_attendee')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event_id)
        .is('deleted_at', null);

      if (gatherCountError) {
        throw new Error('懇親会参加者数の取得に失敗しました');
      }

      if ((gatherCount || 0) >= (eventData.gather_capacity || 0)) {
        throw new Error('懇親会の定員に達しています');
      }
    }

    if (selectedTypes.includes('Consultation')) {
      const { count: consultationCount, error: consultationCountError } = await (adminSupabase as any)
        .from('trn_consultation_attendee')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event_id)
        .is('deleted_at', null);

      if (consultationCountError) {
        throw new Error('個別相談参加者数の取得に失敗しました');
      }

      if ((consultationCount || 0) >= (eventData.consultation_capacity || 0)) {
        throw new Error('個別相談の定員に達しています');
      }
    }

    // 請求項目の作成
    const lineItems = [];
    
    if (selectedTypes.includes('Networking')) {
      if (eventData.gather_price === null) {
        throw new Error('懇親会の料金が設定されていません');
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
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: selectedTypes.includes('Consultation') 
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/off-line-consulations/${event_id}?session_id={CHECKOUT_SESSION_ID}`
        : `${process.env.NEXT_PUBLIC_BASE_URL}/events/${event_id}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/events/${event_id}`,
      metadata: {
        event_id: event_id.toString(),
        selectedTypes: JSON.stringify(selectedTypes),
        userId: (await supabase.auth.getUser()).data.user?.id || '',
        participationType: participationType || null,
        questionAnswers: JSON.stringify(questionAnswers || {}),
        isUrgent: isUrgent ? 'true' : 'false',
        isFirstConsultation: isFirstConsultation ? 'true' : 'false',
      },
      payment_intent_data: {
        description: productName,
        metadata: {
          event_id: event_id.toString(),
          selectedTypes: JSON.stringify(selectedTypes),
          userId: (await supabase.auth.getUser()).data.user?.id || '',
          participationType: participationType || null,
          questionAnswers: JSON.stringify(questionAnswers || {}),
          isUrgent: isUrgent ? 'true' : 'false',
          isFirstConsultation: isFirstConsultation ? 'true' : 'false',
        },
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