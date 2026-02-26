import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  throw new Error('環境変数STRIPE_SECRET_KEYが設定されていません');
}

const stripe = new Stripe(stripeKey, {
  apiVersion: '2025-05-28.basil',
});

export async function POST(request: Request) {
  try {
    const { paymentIntentId } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: '支払いインテントIDが必要です' },
        { status: 400 },
      );
    }

    console.log('返金処理開始:', { paymentIntentId });

    const supabase = createClient();

    try {
      // 支払い情報を取得
      const paymentIntent =
        await stripe.paymentIntents.retrieve(paymentIntentId);
      console.log('支払い情報:', {
        amount: paymentIntent.amount,
        status: paymentIntent.status,
        currency: paymentIntent.currency,
      });

      // Stripeで返金を実行
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        reason: 'requested_by_customer',
      });

      console.log('返金処理成功:', {
        refundId: refund.id,
        amount: refund.amount,
        status: refund.status,
      });

      // 返金成功時にデータベースを更新
      const { error: updateError } = await supabase
        .from('trn_gather_attendee')
        .update({
          stripe_payment_status: 'refunded',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_payment_intent_id', paymentIntentId);

      if (updateError) {
        console.error('データベース更新エラー:', updateError);
        throw new Error('返金状態の更新に失敗しました');
      }

      return NextResponse.json({
        success: true,
        refund: {
          id: refund.id,
          amount: refund.amount,
          status: refund.status,
          currency: refund.currency,
        },
      });
    } catch (stripeError: unknown) {
      console.error('Stripe返金エラー:', {
        code:
          stripeError instanceof Stripe.errors.StripeError
            ? stripeError.code
            : null,
        message:
          stripeError instanceof Stripe.errors.StripeError
            ? stripeError.message
            : null,
      });

      // すでに返金済みの場合
      if (
        stripeError instanceof Stripe.errors.StripeError &&
        stripeError.code === 'charge_already_refunded'
      ) {
        // すでに返金済みの場合もデータベースを更新
        const { error: updateError } = await supabase
          .from('trn_gather_attendee')
          .update({
            stripe_payment_status: 'already_refunded',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentIntentId);

        if (updateError) {
          console.error('データベース更新エラー:', updateError);
        }

        return NextResponse.json(
          {
            success: true,
            message: 'この支払いはすでに返金済みです',
          },
          { status: 200 },
        );
      }

      // 返金失敗時にデータベースを更新
      const { error: updateError } = await supabase
        .from('trn_gather_attendee')
        .update({
          stripe_payment_status: 'refund_failed',
        })
        .eq('stripe_payment_intent_id', paymentIntentId);

      if (updateError) {
        console.error('データベース更新エラー:', updateError);
      }

      throw stripeError;
    }
  } catch (error) {
    console.error('返金処理エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: '返金処理に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー',
      },
      { status: 500 },
    );
  }
}
