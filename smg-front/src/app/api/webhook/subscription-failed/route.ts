import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase-server';
import { headers } from 'next/headers';

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  throw new Error('環境変数STRIPE_SECRET_KEYが設定されていません');
}

const stripe = new Stripe(stripeKey, {
  apiVersion: '2020-08-27' as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_SUBSCRIPTION;
if (!webhookSecret) {
  throw new Error('環境変数STRIPE_WEBHOOK_SECRET_SUBSCRIPTIONが設定されていません');
}

// 未決済グループのタイトル
const UNPAID_GROUP_TITLE = '未決済';

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

    // サブスクリプション決済失敗イベントを処理
    if (event.type === 'invoice.payment_failed') {
      console.log('Webhook: invoice.payment_failed イベントを受信');
      console.log('イベントデータ:', JSON.stringify(event.data, null, 2));
      const invoice = event.data.object as Stripe.Invoice;

      // サブスクリプションに関連する決済失敗のみ処理
      console.log('サブスクリプション確認:', (invoice as any).subscription);
      if ((invoice as any).subscription) {
        console.log('サブスクリプション関連の決済失敗を処理します');
        const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);
        const customerId = subscription.customer as string;

        // カスタマー情報からメールアドレスを取得
        const customer = await stripe.customers.retrieve(customerId);

        if (customer.deleted) {
          console.log('削除されたカスタマーです');
          return NextResponse.json({ received: true });
        }

        const customerEmail = customer.email;
        console.log('取得したカスタマーメール:', customerEmail);

        if (!customerEmail) {
          console.error('カスタマーのメールアドレスが見つかりません');
          return NextResponse.json(
            { error: 'カスタマーのメールアドレスが見つかりません' },
            { status: 400 }
          );
        }

        const supabase = createClient();

        // メールアドレスからユーザーIDを取得し、未決済グループに既に所属しているかチェック
        const { data: userData, error: userError } = await supabase
          .from('mst_user')
          .select(`
            user_id,
            email,
            trn_group_user!left(
              group_id,
              deleted_at,
              mst_group!inner(
                group_id,
                title
              )
            )
          `)
          .eq('email', customerEmail)
          .eq('trn_group_user.mst_group.title', UNPAID_GROUP_TITLE)
          .is('trn_group_user.deleted_at', null)
          .single();

        if (userError && userError.code !== 'PGRST116') {
          console.error('ユーザー確認エラー:', userError);
          return NextResponse.json(
            { error: 'ユーザー確認に失敗しました' },
            { status: 500 }
          );
        }

        if (!userData) {
          console.error('指定されたメールアドレスのユーザーが見つかりません:', customerEmail);
          return NextResponse.json(
            { error: 'ユーザーが見つかりません' },
            { status: 400 }
          );
        }

        const userId = userData.user_id;
        const hasUnpaidGroup = userData.trn_group_user?.length > 0;

        // 既に未決済グループに所属していない場合のみ追加
        if (!hasUnpaidGroup) {
          // 未決済グループのIDを取得
          const { data: unpaidGroup, error: getGroupError } = await supabase
            .from('mst_group')
            .select('group_id')
            .eq('title', UNPAID_GROUP_TITLE)
            .is('deleted_at', null)
            .single();

          if (getGroupError) {
            console.error('未決済グループ取得エラー:', getGroupError);
            return NextResponse.json(
              { error: '未決済グループが見つかりません' },
              { status: 500 }
            );
          }

          const { error: insertError } = await supabase
            .from('trn_group_user')
            .upsert({
              group_id: unpaidGroup.group_id,
              user_id: userId,
              deleted_at: null,
            }, {
              onConflict: 'group_id,user_id'
            });

          if (insertError) {
            console.error('未決済グループへの追加エラー:', insertError);
            return NextResponse.json(
              { error: '未決済グループへの追加に失敗しました' },
              { status: 500 }
            );
          }

          console.log(`ユーザー ${userId} (${customerEmail}) を未決済グループに追加しました`);
        } else {
          console.log(`ユーザー ${userId} (${customerEmail}) は既に未決済グループに所属しています`);
        }
      }
    }

    // サブスクリプション決済成功イベントを処理
    if (event.type === 'invoice.payment_succeeded') {
      console.log('Webhook: invoice.payment_succeeded イベントを受信');
      console.log('イベントデータ:', JSON.stringify(event.data, null, 2));
      const invoice = event.data.object as Stripe.Invoice;

      // サブスクリプションに関連する決済成功のみ処理
      console.log('サブスクリプション確認:', (invoice as any).subscription);
      if ((invoice as any).subscription) {
        console.log('サブスクリプション関連の決済成功を処理します');
        const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);
        const customerId = subscription.customer as string;

        // カスタマー情報からメールアドレスを取得
        const customer = await stripe.customers.retrieve(customerId);

        if (customer.deleted) {
          console.log('削除されたカスタマーです');
          return NextResponse.json({ received: true });
        }

        const customerEmail = customer.email;
        console.log('取得したカスタマーメール:', customerEmail);

        if (!customerEmail) {
          console.error('カスタマーのメールアドレスが見つかりません');
          return NextResponse.json(
            { error: 'カスタマーのメールアドレスが見つかりません' },
            { status: 400 }
          );
        }

        const supabase = createClient();

        // メールアドレスからユーザーIDを取得
        const { data: userData, error: userError } = await supabase
          .from('mst_user')
          .select('user_id, email')
          .eq('email', customerEmail)
          .single();

        if (userError && userError.code !== 'PGRST116') {
          console.error('ユーザー確認エラー:', userError);
          return NextResponse.json(
            { error: 'ユーザー確認に失敗しました' },
            { status: 500 }
          );
        }

        if (!userData) {
          console.error('指定されたメールアドレスのユーザーが見つかりません:', customerEmail);
          return NextResponse.json(
            { error: 'ユーザーが見つかりません' },
            { status: 400 }
          );
        }

        const userId = userData.user_id;

        // 未決済グループのIDを取得
        const { data: unpaidGroup, error: getGroupError } = await supabase
          .from('mst_group')
          .select('group_id')
          .eq('title', UNPAID_GROUP_TITLE)
          .is('deleted_at', null)
          .single();

        if (getGroupError) {
          console.error('未決済グループ取得エラー:', getGroupError);
          return NextResponse.json(
            { error: '未決済グループが見つかりません' },
            { status: 500 }
          );
        }

        // 未決済グループから論理削除（削除日時を設定）
        const { error: removeError } = await supabase
          .from('trn_group_user')
          .update({
            deleted_at: new Date().toISOString(),
          })
          .eq('group_id', unpaidGroup.group_id)
          .eq('user_id', userId)
          .is('deleted_at', null);

        if (removeError) {
          console.error('未決済グループからの削除エラー:', removeError);
          return NextResponse.json(
            { error: '未決済グループからの削除に失敗しました' },
            { status: 500 }
          );
        }

        console.log(`ユーザー ${userId} (${customerEmail}) を未決済グループから削除しました`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Subscription failed webhookエラー:', error);
    return NextResponse.json(
      { error: 'Webhookの処理に失敗しました' },
      { status: 500 }
    );
  }
}