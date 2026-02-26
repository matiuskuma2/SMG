import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const stripePaymentIntentId = searchParams.get('stripe_payment_intent_id');

    // 必須パラメータの検証
    if (!stripePaymentIntentId) {
      return NextResponse.json(
        { error: 'stripe_payment_intent_idが必要です' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // 領収書履歴を取得
    const { data, error } = await supabase
      .from('trn_receipt_history')
      .select('receipt_id, number, name, amount, description, is_dashboard_issued, is_email_issued, created_at')
      .eq('stripe_payment_intent_id', stripePaymentIntentId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('領収書履歴の取得に失敗しました:', error);
      return NextResponse.json(
        { error: '領収書履歴の取得に失敗しました', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      history: data || [],
    });

  } catch (error) {
    console.error('領収書履歴取得エラー:', error);
    return NextResponse.json(
      { error: '領収書履歴の取得に失敗しました' },
      { status: 500 }
    );
  }
}
