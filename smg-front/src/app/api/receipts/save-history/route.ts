import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      receiptNumber,
      recipientName,
      amount,
      description = 'イベント参加費として',
      notes = null,
      isDashboardIssued = false,
      isEmailIssued = false,
      stripePaymentIntentId = null
    } = body;

    // 必須パラメータの検証
    if (!userId || !receiptNumber || !recipientName || !amount) {
      return NextResponse.json(
        { error: '必須パラメータが不足しています' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // 領収書履歴を保存
    const { data, error } = await supabase
      .from('trn_receipt_history')
      .insert({
        user_id: userId,
        number: receiptNumber,
        name: recipientName,
        amount: amount,
        description: description,
        notes: notes,
        is_dashboard_issued: isDashboardIssued,
        is_email_issued: isEmailIssued,
        stripe_payment_intent_id: stripePaymentIntentId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('領収書履歴の保存に失敗しました:', error);
      return NextResponse.json(
        { error: '領収書履歴の保存に失敗しました', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      receiptId: data.receipt_id,
      message: '領収書履歴が保存されました',
    });

  } catch (error) {
    console.error('領収書履歴保存エラー:', error);
    return NextResponse.json(
      { error: '領収書履歴の保存に失敗しました' },
      { status: 500 }
    );
  }
}
