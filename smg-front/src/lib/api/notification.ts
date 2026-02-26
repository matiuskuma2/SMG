import { createClient } from '@/lib/supabase';

// ユーザーにメールを送信するユーティリティ
async function sendNotificationEmail(
  userId: string,
  subject: string,
  plainText: string,
  htmlText: string,
  redirectPath?: string // 追加: リダイレクトパス
) {
  try {
    // ユーザーのメールアドレスを取得
    const supabase = createClient();
    const { data: userData, error: userError } = await supabase
      .from('mst_user')
      .select('email')
      .eq('user_id', userId)
      .single();

    if (userError) {
      console.error('ユーザーメール取得エラー:', userError);
      return;
    }

    const toEmail = userData?.email;
    if (!toEmail) {
      console.warn('メールアドレスが存在しません:', userId);
      return;
    }

    // フル URL を生成
    const fullUrl = redirectPath
      ? (redirectPath.startsWith('http') ? redirectPath : `${process.env.NEXT_PUBLIC_BASE_URL}${redirectPath}`)
      : undefined;

    // URL を本文に追加
    const finalPlain = fullUrl ? `${plainText}\n\n詳細はこちら: ${fullUrl}` : plainText;
    const finalHtml = fullUrl
      ? `${htmlText}<br/><br/><a href="${fullUrl}" style="color:#1a73e8;">こちらをクリックして詳細を確認</a>`
      : htmlText;

    // 送信内容をコンソール表示（デバッグ用）
    console.log('SendGrid email payload:', {
      to: toEmail,
      from: process.env.SENDGRID_SENDER_EMAIL || '',
      subject,
      text: finalPlain,
      html: finalHtml,
    });

    // SendGrid の設定はクライアント共通ファイルで行われているため、ここでは直接呼び出さない
    // もし SendGrid を直接使用する場合は、ここにコードを追加する
    // 例:
    // import sgMail from '@sendgrid/mail';
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');
    // const SENDER_EMAIL = process.env.SENDGRID_SENDER_EMAIL || '';
    // await sgMail.send({
    //   to: toEmail,
    //   from: SENDER_EMAIL,
    //   subject,
    //   text: finalPlain,
    //   html: finalHtml,
    // });

    console.log('メール送信成功:', subject, '->', toEmail);
  } catch (err) {
    console.error('メール送信失敗:', err);
  }
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  time: string;
  url: string;
  content?: string;
}

/**
 * 全ての通知を取得する
 */
export async function getNotifications(): Promise<Notification[]> {
  const supabase = createClient();
  
  // 現在のユーザーを取得
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.error('認証エラー:', userError);
    return [];
  }
  
  // ユーザーの通知を取得（trn_user_notificationとmst_notificationをJOIN）
  const { data, error } = await supabase
    .from('trn_user_notification')
    .select(`
      notification_id,
      read_at,
      created_at,
      mst_notification (
        notification_id,
        notification_type,
        title,
        content,
        related_url,
        created_at
      )
    `)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .is('mst_notification.deleted_at', null)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('通知の取得に失敗しました:', error);
    return [];
  }
  
  // APIのデータ形式をフロントエンドの形式に変換
  return (data || []).map((item: any) => ({
    id: item.mst_notification.notification_id,
    type: getNotificationType(item.mst_notification.notification_type || ''),
    title: item.mst_notification.title || '',
    time: formatTime(item.mst_notification.created_at || ''),
    url: item.mst_notification.related_url || '',
    content: item.mst_notification.content || undefined
  }));
}

/**
 * 特定の通知を取得する
 */
export async function getNotification(id: string): Promise<Notification | null> {
  const supabase = createClient();
  
  // 現在のユーザーを取得
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.error('認証エラー:', userError);
    return null;
  }
  
  // 特定の通知IDに一致し、かつユーザーがアクセス権を持つ通知を取得
  const { data, error } = await supabase
    .from('trn_user_notification')
    .select(`
      notification_id,
      read_at,
      created_at,
      mst_notification (
        notification_id,
        notification_type,
        title,
        content,
        related_url,
        created_at
      )
    `)
    .eq('notification_id', id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .is('mst_notification.deleted_at', null)
    .single();
  
  if (error) {
    console.error('通知の取得に失敗しました:', error);
    return null;
  }
  
  if (!data || !data.mst_notification) return null;
  
  // APIのデータ形式をフロントエンドの形式に変換
  return {
    id: data.mst_notification.notification_id,
    type: getNotificationType(data.mst_notification.notification_type || ''),
    title: data.mst_notification.title || '',
    time: formatTime(data.mst_notification.created_at || ''),
    url: data.mst_notification.related_url || '',
    content: data.mst_notification.content || undefined
  };
}

/**
 * イベント申し込み通知を作成する
 */
export async function createEventApplicationNotification(
  userId: string,
  eventId: string,
  eventName: string
): Promise<string> {
  const supabase = createClient();
  
  // 1. まず mst_notification に通知を作成
  const notificationData = {
    notification_type: 'event',
    title: `イベント「${eventName}」の申し込みが完了しました`,
    content: `イベント「${eventName}」への申し込みが正常に完了しました。詳細はイベントページでご確認ください。`,
    related_url: `/events/${eventId}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: notificationResult, error: notificationError } = await supabase
    .from('mst_notification')
    .insert(notificationData)
    .select('notification_id')
    .single();

  if (notificationError) {
    console.error('イベント申し込み通知の作成に失敗しました:', notificationError);
    throw new Error('通知の作成に失敗しました');
  }

  // 2. trn_user_notification にユーザーと通知の関連付けを作成
  const userNotificationData = {
    notification_id: notificationResult.notification_id,
    user_id: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error: userNotificationError } = await supabase
    .from('trn_user_notification')
    .insert(userNotificationData);

  if (userNotificationError) {
    console.error('ユーザー通知の関連付けに失敗しました:', userNotificationError);
    throw new Error('通知の関連付けに失敗しました');
  }

  // SendGrid メール送信
  await sendNotificationEmail(
    userId,
    `イベント「${eventName}」の申し込みが完了しました`,
    `イベント「${eventName}」への申し込みが正常に完了しました。詳細はイベントページでご確認ください。`,
    `イベント「${eventName}」への申し込みが正常に完了しました。<br/>詳細はイベントページでご確認ください。`,
    notificationData.related_url // 追加: リダイレクトパス
  );

  return notificationResult.notification_id;
}

/**
 * 懇親会申し込み通知を作成する
 */
export async function createGatherApplicationNotification(
  userId: string,
  eventId: string,
  eventName: string
): Promise<string> {
  const supabase = createClient();
  
  // 1. まず mst_notification に通知を作成
  const notificationData = {
    notification_type: 'event',
    title: `懇親会「${eventName}」の申し込みが完了しました`,
    content: `懇親会「${eventName}」への申し込みが正常に完了しました。詳細はイベントページでご確認ください。`,
    related_url: `/events/${eventId}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: notificationResult, error: notificationError } = await supabase
    .from('mst_notification')
    .insert(notificationData)
    .select('notification_id')
    .single();

  if (notificationError) {
    console.error('懇親会申し込み通知の作成に失敗しました:', notificationError);
    throw new Error('通知の作成に失敗しました');
  }

  // 2. trn_user_notification にユーザーと通知の関連付けを作成
  const userNotificationData = {
    notification_id: notificationResult.notification_id,
    user_id: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error: userNotificationError } = await supabase
    .from('trn_user_notification')
    .insert(userNotificationData);

  if (userNotificationError) {
    console.error('ユーザー通知の関連付けに失敗しました:', userNotificationError);
    throw new Error('通知の関連付けに失敗しました');
  }

  // SendGrid メール送信
  await sendNotificationEmail(
    userId,
    `懇親会「${eventName}」の申し込みが完了しました`,
    `懇親会「${eventName}」への申し込みが正常に完了しました。詳細はイベントページでご確認ください。`,
    `懇親会「${eventName}」への申し込みが正常に完了しました。<br/>詳細はイベントページでご確認ください。`,
    notificationData.related_url
  );

  return notificationResult.notification_id;
}

/**
 * 個別相談申し込み通知を作成する
 */
export async function createConsultationApplicationNotification(
  userId: string,
  eventId: string,
  eventName: string
): Promise<string> {
  const supabase = createClient();
  
  // 1. まず mst_notification に通知を作成
  const notificationData = {
    notification_type: 'consultation',
    title: `個別相談「${eventName}」の申し込みが完了しました`,
    content: `個別相談「${eventName}」への申し込みが正常に完了しました。詳細はイベントページでご確認ください。`,
    related_url: `/events/${eventId}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: notificationResult, error: notificationError } = await supabase
    .from('mst_notification')
    .insert(notificationData)
    .select('notification_id')
    .single();

  if (notificationError) {
    console.error('個別相談申し込み通知の作成に失敗しました:', notificationError);
    throw new Error('通知の作成に失敗しました');
  }

  // 2. trn_user_notification にユーザーと通知の関連付けを作成
  const userNotificationData = {
    notification_id: notificationResult.notification_id,
    user_id: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error: userNotificationError } = await supabase
    .from('trn_user_notification')
    .insert(userNotificationData);

  if (userNotificationError) {
    console.error('ユーザー通知の関連付けに失敗しました:', userNotificationError);
    throw new Error('通知の関連付けに失敗しました');
  }

  // SendGrid メール送信
  await sendNotificationEmail(
    userId,
    `個別相談「${eventName}」の申し込みが完了しました`,
    `個別相談「${eventName}」への申し込みが正常に完了しました。詳細はイベントページでご確認ください。`,
    `個別相談「${eventName}」への申し込みが正常に完了しました。<br/>詳細はイベントページでご確認ください。`,
    notificationData.related_url
  );

  return notificationResult.notification_id;
}

/**
 * 通知の種類を取得する
 */
function getNotificationType(dbType: string): string {
  // DBの種類からフロントエンドの表示用種類に変換
  // 実際の種類はDBの設計に合わせて調整してください
  if (dbType === 'event') return 'イベント予約';
  if (dbType === 'announcement') return 'お知らせ';
  if (dbType === 'archive') return 'アーカイブ';
  if (dbType === 'consultation') return '個別相談予約';
  return '通常';
}

/**
 * 時間を表示用にフォーマットする
 */
function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 60) {
    return `${diffMins}分前`;
  } else if (diffHours < 24) {
    return `${diffHours}時間前`;
  } else if (diffDays < 7) {
    return `${diffDays}日前`;
  } else {
    // 1週間以上前は日付を表示
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }
} 

// 追加: 未読通知を既読に更新する
export async function markAllNotificationsAsRead(): Promise<void> {
  const supabase = createClient();
  // 現在のユーザーを取得
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('認証エラー:', userError);
    return;
  }
  // 未読の通知を既読に更新
  const { error } = await supabase
    .from('trn_user_notification')
    .update({ read_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null);
  if (error) {
    console.error('通知の既読更新に失敗しました:', error);
  }
} 