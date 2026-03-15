import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase-admin';
import { headers } from 'next/headers';
import {
  createEventApplicationNotification,
  createGatherApplicationNotification,
} from '@/lib/api/notification-server';

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  throw new Error('環境変数STRIPE_SECRET_KEYが設定されていません');
}

const stripe = new Stripe(stripeKey, {
  apiVersion: '2020-08-27' as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!webhookSecret) {
  throw new Error('環境変数STRIPE_WEBHOOK_SECRETが設定されていません');
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Stripeシグネチャが見つかりません' },
        { status: 400 }
      );
    }

    if (!webhookSecret) {
      return NextResponse.json(
        { error: 'Webhookシークレットが設定されていません' },
        { status: 500 }
      );
    }

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    // 旧サイトのサブスクリプション決済エラー回避: mode が subscription の場合は 200 を返す
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === 'subscription') {
        console.log('Subscription mode detected, returning 200 to avoid old site errors');
        return NextResponse.json({ received: true });
      }
    }

    if (event.type === 'checkout.session.completed') {
      console.log('Webhook: checkout.session.completed イベントを受信');
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('セッションメタデータ:', session.metadata);
      const { event_id, selectedTypes, userId, participationType, questionAnswers } = session.metadata || {};
      
      if (!event_id) {
        console.log('Payment link決済またはmetadata不足の決済を検出、処理をスキップします');
        return NextResponse.json({ received: true });
      }

      if (!userId) {
        console.error('ユーザーIDが見つかりません:', session.metadata);
        return NextResponse.json(
          { error: 'ユーザーIDが見つかりません' },
          { status: 400 }
        );
      }

      // WebhookはユーザーのCookieがないため、service_role keyを使用してRLSをバイパス
      const supabase = createAdminClient();

      // selectedTypesを先にパースする（データ保存の分岐に必要）
      let parsedSelectedTypes: string[] = [];
      try {
        parsedSelectedTypes = selectedTypes ? JSON.parse(selectedTypes) : [];
      } catch (parseError) {
        console.error('selectedTypesのパースに失敗しました:', parseError);
      }
      console.log('パース済みselectedTypes:', parsedSelectedTypes);

      // イベント名を取得して通知作成で使用
      const { data: eventData } = await supabase
        .from('mst_event')
        .select('event_name')
        .eq('event_id', event_id)
        .single();
      
      const eventName = eventData?.event_name || 'イベント';

      // 重複Webhook判定: payment_intentが既に保存されているかチェック
      // trn_gather_attendee または trn_event_attendee のいずれかで判定
      let isDuplicateWebhook = false;
      if (parsedSelectedTypes.includes('Networking')) {
        const { data: priorGather } = await supabase
          .from('trn_gather_attendee')
          .select('stripe_payment_intent_id')
          .eq('event_id', event_id)
          .eq('user_id', userId)
          .is('deleted_at', null)
          .eq('stripe_payment_intent_id', session.payment_intent as string)
          .maybeSingle();
        isDuplicateWebhook = !!priorGather;
      } else if (parsedSelectedTypes.includes('Event')) {
        const { data: priorEvent } = await supabase
          .from('trn_event_attendee')
          .select('event_id')
          .eq('event_id', event_id)
          .eq('user_id', userId)
          .is('deleted_at', null)
          .maybeSingle();
        isDuplicateWebhook = !!priorEvent;
      }
      console.log(`isDuplicateWebhook=${isDuplicateWebhook}, payment_intent=${session.payment_intent}`);

      // === データベースへの保存（重複でも必ず実行 - upsertなので安全） ===

      // 懇親会（Networking）が選択されている場合のみ trn_gather_attendee に保存
      if (parsedSelectedTypes.includes('Networking')) {
        console.log('懇親会が選択されているため、gather_attendeeテーブルを更新します');
        const { error: gatherError } = await supabase
          .from('trn_gather_attendee')
          .upsert({
            event_id: event_id,
            user_id: userId,
            stripe_payment_intent_id: session.payment_intent as string,
            stripe_payment_status: 'succeeded',
            payment_amount: session.amount_total || 0,
            payment_date: new Date().toISOString(),
            deleted_at: null,
          });

        if (gatherError) {
          console.error('懇親会データベース更新エラー:', gatherError);
          // エラーでも処理を続行（他のテーブルの更新を妨げない）
        } else {
          console.log('懇親会データベース更新成功');
        }
      }

      // イベント参加（Event）が選択されている場合 trn_event_attendee に保存
      if (parsedSelectedTypes.includes('Event')) {
        console.log('イベント参加が選択されているため、event_attendeeテーブルを更新します');
        const { error: eventError } = await supabase
          .from('trn_event_attendee')
          .upsert({
            event_id: event_id,
            user_id: userId,
            is_offline: participationType ? participationType === 'Offline' : true,
            deleted_at: null,
          });
        if (eventError) {
          console.error('イベント参加データベース更新エラー:', eventError);
        } else {
          console.log('イベント参加データベース更新成功');
        }
      }

      // 個別相談（Consultation）が選択されている場合 trn_consultation_attendee に保存
      if (parsedSelectedTypes.includes('Consultation')) {
        console.log('個別相談が選択されているため、consultation_attendeeテーブルを更新します');
        const { error: consultationError } = await supabase
          .from('trn_consultation_attendee')
          .upsert({
            event_id: event_id,
            user_id: userId,
            deleted_at: null,
          });
        if (consultationError) {
          console.error('個別相談データベース更新エラー:', consultationError);
        } else {
          console.log('個別相談データベース更新成功');
        }
      }

      // 質問回答を保存（重複処理チェックに関係なく実行）
      try {
        if (questionAnswers) {
          const parsedQuestionAnswers = JSON.parse(questionAnswers);
          const answersToSave = Object.entries(parsedQuestionAnswers)
            .filter(([_, answer]) => answer !== '' && answer !== null && answer !== undefined)
            .map(([questionId, answer]) => ({ question_id: questionId, answer }));

          if (answersToSave.length > 0) {
            // 既存の回答を削除（論理削除）
            const { error: deleteError } = await supabase
              .from('trn_event_question_answer')
              .update({ deleted_at: new Date().toISOString() })
              .eq('user_id', userId)
              .in('question_id', answersToSave.map(a => a.question_id));

            if (deleteError) {
              console.error('質問回答の削除に失敗:', deleteError);
            } else {
              // 新しい回答を保存
              const answersToInsert = answersToSave.map(answer => ({
                question_id: answer.question_id,
                user_id: userId,
                answer: answer.answer as any
              }));

              const { error: insertError } = await supabase
                .from('trn_event_question_answer')
                .insert(answersToInsert);

              if (insertError) {
                console.error('質問回答の保存に失敗:', insertError);
              } else {
                console.log('質問回答が正常に保存されました');
              }
            }
          }
        }
      } catch (questionError) {
        console.error('質問回答の処理に失敗:', questionError);
      }

      // === 通知処理（重複Webhookの場合はスキップ） ===
      if (isDuplicateWebhook) {
        console.log(
          `Webhook duplicate: payment_intent=${session.payment_intent} 通知処理をスキップします`
        );
      } else {
        // 懇親会通知は選択時のみ作成
        if (parsedSelectedTypes.includes('Networking') && !parsedSelectedTypes.includes('Consultation')) {
          try {
            await createGatherApplicationNotification(userId, event_id, eventName);
            console.log('懇親会申し込み通知が作成されました');
          } catch (notificationError) {
            console.error('懇親会通知作成に失敗しました:', notificationError);
          }
        }

        // イベント通知（Networking選択時はスキップ）
        if (parsedSelectedTypes.includes('Event') && !parsedSelectedTypes.includes('Networking')) {
          try {
            await createEventApplicationNotification(userId, event_id, eventName);
            console.log('イベント申し込み通知が作成されました');
          } catch (notificationError) {
            console.error('イベント通知作成に失敗しました:', notificationError);
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhookエラー:', error);
    return NextResponse.json(
      { error: 'Webhookの処理に失敗しました' },
      { status: 500 }
    );
  }
} 