import { createAdminClient } from '@/lib/supabase-admin';
import sgMail from '@sendgrid/mail';

// SendGrid 設定
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');
const SENDER_EMAIL = process.env.SENDGRID_SENDER_EMAIL || '';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || '';

/**
 * ユーザーの通知設定を確認する
 * 設定が無い場合はデフォルトでOFF（false）を返す
 */
export async function isNotificationEnabledForUser(
	userId: string,
	notificationType: string,
): Promise<boolean> {
	const supabase = createAdminClient();

	const { data, error } = await supabase
		.from('mst_notification_settings')
		.select('is_enabled')
		.eq('user_id', userId)
		.eq('notification_type', notificationType)
		.is('deleted_at', null)
		.single();

	if (error) {
		// レコードが存在しない場合はデフォルトでOFF
		if (error.code === 'PGRST116') {
			return false;
		}
		console.error('通知設定の確認に失敗しました:', error);
		return false; // エラー時もデフォルトでOFF
	}

	return data?.is_enabled ?? false;
}

// ユーザーにメールを送信するユーティリティ
async function sendNotificationEmail(
	userId: string,
	subject: string,
	plainText: string,
	htmlText: string,
	redirectPath?: string,
) {
	try {
		const supabase = createAdminClient();
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

		const fullUrl = redirectPath
			? redirectPath.startsWith('http')
				? redirectPath
				: `${BASE_URL}${redirectPath}`
			: undefined;

		const finalPlain = fullUrl
			? `${plainText}\n\n詳細はこちら: ${fullUrl}`
			: plainText;
		const finalHtml = fullUrl
			? `${htmlText}<br/><br/><a href="${fullUrl}" style="color:#1a73e8;">こちらをクリックして詳細を確認</a>`
			: htmlText;

		console.log('SendGrid email payload:', {
			to: toEmail,
			from: SENDER_EMAIL,
			subject,
			text: finalPlain,
			html: finalHtml,
		});

		await sgMail.send({
			to: toEmail,
			from: SENDER_EMAIL,
			subject,
			text: finalPlain,
			html: finalHtml,
		});
	} catch (err) {
		console.error('メール送信失敗:', err);
	}
}

/** イベント申し込み通知を作成する */
export async function createEventApplicationNotification(
	userId: string,
	eventId: string,
	eventName: string,
): Promise<string> {
	// 通知設定をチェック
	const isEnabled = await isNotificationEnabledForUser(
		userId,
		'event_application',
	);
	if (!isEnabled) {
		console.log(
			'イベント申し込み通知はユーザー設定によりスキップされました:',
			userId,
		);
		return '';
	}

	const supabase = createAdminClient();
	const notificationData = {
		notification_type: 'event',
		title: `イベント「${eventName}」の申し込みが完了しました`,
		content: `イベント「${eventName}」への申し込みが正常に完了しました。詳細はイベントページでご確認ください。`,
		related_url: `/events/${eventId}`,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	} as const;

	const { data: notificationResult, error: notificationError } = await supabase
		.from('mst_notification')
		.insert(notificationData)
		.select('notification_id')
		.single();
	if (notificationError) {
		console.error(
			'イベント申し込み通知の作成に失敗しました:',
			notificationError,
		);
		throw new Error('通知の作成に失敗しました');
	}

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
		console.error(
			'ユーザー通知の関連付けに失敗しました:',
			userNotificationError,
		);
		throw new Error('通知の関連付けに失敗しました');
	}

	await sendNotificationEmail(
		userId,
		notificationData.title,
		notificationData.content,
		notificationData.content,
		notificationData.related_url,
	);

	return notificationResult.notification_id;
}

/** 懇親会申し込み通知を作成する */
export async function createGatherApplicationNotification(
	userId: string,
	eventId: string,
	eventName: string,
): Promise<string> {
	// 通知設定をチェック
	const isEnabled = await isNotificationEnabledForUser(
		userId,
		'gather_application',
	);
	if (!isEnabled) {
		console.log(
			'懇親会申し込み通知はユーザー設定によりスキップされました:',
			userId,
		);
		return '';
	}

	const supabase = createAdminClient();
	const notificationData = {
		notification_type: 'event',
		title: `懇親会「${eventName}」の申し込みが完了しました`,
		content: `懇親会「${eventName}」への申し込みが正常に完了しました。詳細はイベントページでご確認ください。`,
		related_url: `/events/${eventId}`,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	} as const;

	const { data: notificationResult, error: notificationError } = await supabase
		.from('mst_notification')
		.insert(notificationData)
		.select('notification_id')
		.single();
	if (notificationError) {
		console.error('懇親会申し込み通知の作成に失敗しました:', notificationError);
		throw new Error('通知の作成に失敗しました');
	}

	const { error: userNotificationError } = await supabase
		.from('trn_user_notification')
		.insert({
			notification_id: notificationResult.notification_id,
			user_id: userId,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		});
	if (userNotificationError) {
		console.error(
			'ユーザー通知の関連付けに失敗しました:',
			userNotificationError,
		);
		throw new Error('通知の関連付けに失敗しました');
	}

	await sendNotificationEmail(
		userId,
		notificationData.title,
		notificationData.content,
		notificationData.content,
		notificationData.related_url,
	);

	return notificationResult.notification_id;
}

/** 個別相談申し込み通知を作成する */
export async function createConsultationApplicationNotification(
	userId: string,
	eventId: string,
	eventName: string,
	isEventConsultation: boolean = false,
): Promise<string> {
	// 通知設定をチェック
	const isEnabled = await isNotificationEnabledForUser(
		userId,
		'consultation_application',
	);
	if (!isEnabled) {
		console.log(
			'個別相談申し込み通知はユーザー設定によりスキップされました:',
			userId,
		);
		return '';
	}

	const supabase = createAdminClient();
	const relatedUrl = isEventConsultation
		? `/events/${eventId}`
		: `/consultations/${eventId}`;
	const notificationData = {
		notification_type: 'consultation',
		title: `個別相談「${eventName}」の申し込みが完了しました`,
		content: `個別相談「${eventName}」への申し込みが正常に完了しました。詳細はイベントページでご確認ください。`,
		related_url: relatedUrl,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	};

	const { data: notificationResult, error: notificationError } = await supabase
		.from('mst_notification')
		.insert(notificationData)
		.select('notification_id')
		.single();
	if (notificationError) {
		console.error(
			'個別相談申し込み通知の作成に失敗しました:',
			notificationError,
		);
		throw new Error('通知の作成に失敗しました');
	}

	const { error: userNotificationError } = await supabase
		.from('trn_user_notification')
		.insert({
			notification_id: notificationResult.notification_id,
			user_id: userId,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		});
	if (userNotificationError) {
		console.error(
			'ユーザー通知の関連付けに失敗しました:',
			userNotificationError,
		);
		throw new Error('通知の関連付けに失敗しました');
	}

	await sendNotificationEmail(
		userId,
		notificationData.title,
		notificationData.content,
		notificationData.content,
		notificationData.related_url,
	);

	return notificationResult.notification_id;
}
