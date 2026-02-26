import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase-server';
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

      const supabase = createClient();
      // 事前重複Webhook判定: キャンセル済レコードを除外して同一 payment_intent が保存されているか確認
      const { data: priorAttendee, error: priorError } = await supabase
        .from('trn_gather_attendee')
        .select('stripe_payment_intent_id, deleted_at')
        .eq('event_id', event_id)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();
      if (priorError && priorError.code !== 'PGRST116') {
        console.error('priorAttendee取得エラー:', priorError);
      }
      const isDuplicateWebhook = priorAttendee?.stripe_payment_intent_id === session.payment_intent;
      // ログ出力：priorAttendee とセッション、重複判定結果
      console.log(`priorAttendee.stripe_payment_intent_id=${priorAttendee?.stripe_payment_intent_id}, session.payment_intent=${session.payment_intent}, isDuplicateWebhook=${isDuplicateWebhook}`);
      
      // 支払い情報をデータベースに保存
      console.log('データベース更新を試行:', {
        event_id: event_id,
        user_id: userId,
        stripe_payment_intent_id: session.payment_intent,
        payment_amount: session.amount_total
      });

      const { error: updateError } = await supabase
        .from('trn_gather_attendee')
        .upsert({
          event_id: event_id,
          user_id: userId,
          stripe_payment_intent_id: session.payment_intent as string,
          stripe_payment_status: 'succeeded',
          payment_amount: session.amount_total || 0,
          payment_date: new Date().toISOString(),
        });

      if (updateError) {
        console.error('データベース更新エラー:', updateError);
        return NextResponse.json(
          { error: 'データベースの更新に失敗しました', details: updateError },
          { status: 500 }
        );
      }

      console.log('データベース更新成功');
      
      // イベント名を取得して通知作成で使用
      const { data: eventData } = await supabase
        .from('mst_event')
        .select('event_name')
        .eq('event_id', event_id)
        .single();
      
      const eventName = eventData?.event_name || 'イベント';
      
      // selectedTypesが文字列として保存されているため、JSONとしてパース
      let parsedSelectedTypes: string[] = [];
      try {
        parsedSelectedTypes = selectedTypes ? JSON.parse(selectedTypes) : [];
      } catch (parseError) {
        console.error('selectedTypesのパースに失敗しました:', parseError);
      }

      // 質問回答を保存（重複処理チェックに関係なく実行）
      try {
        if (questionAnswers) {
          const parsedQuestionAnswers = JSON.parse(questionAnswers);
          const answersToSave = Object.entries(parsedQuestionAnswers)
            .filter(([_, answer]) => answer !== '' && answer !== null && answer !== undefined)
            .map(([questionId, answer]) => ({ question_id: questionId, answer }));

          if (answersToSave.length > 0) {
            // saveEventQuestionAnswersをWebhook用に修正する必要があるため、直接データベースに保存
            const supabase = createClient();
            
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

        // イベント参加情報も更新
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
            // Networkng（懇親会）選択時はイベント通知をスキップ
            if (!parsedSelectedTypes.includes('Networking')) {
              try {
                await createEventApplicationNotification(userId, event_id, eventName);
                console.log('イベント申し込み通知が作成されました');
              } catch (notificationError) {
                console.error('イベント通知作成に失敗しました:', notificationError);
              }
            } else {
              console.log('懇親会決済の際はイベント通知をスキップします');
            }
          }
        }

        // 個別相談が選択されていれば、consultation_attendeeテーブルを更新
        // 通知はoff-line-consulations/[id]ページのフォーム送信時に作成される
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