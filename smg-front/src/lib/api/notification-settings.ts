import { createClient } from '@/lib/supabase';

// イベント種類の定義（ARCHIVE_CATEGORIESと同じ形式）
export const EVENT_TYPES = {
	tereikai: {
		key: 'event_published_tereikai',
		label: '定例会',
		description: '定例会のイベントが公開された際に通知を受け取ります',
	},
	boki: {
		key: 'event_published_boki',
		label: '簿記講座',
		description: '簿記講座のイベントが公開された際に通知を受け取ります',
	},
	special_seminar: {
		key: 'event_published_special_seminar',
		label: '特別セミナー',
		description: '特別セミナーのイベントが公開された際に通知を受け取ります',
	},
	online_seminar: {
		key: 'event_published_online_seminar',
		label: 'オンラインセミナー',
		description:
			'オンラインセミナーのイベントが公開された際に通知を受け取ります',
	},
	pdca: {
		key: 'event_published_pdca',
		label: 'PDCA会議実践講座',
		description: 'PDCA会議実践講座のイベントが公開された際に通知を受け取ります',
	},
	group_consultation: {
		key: 'event_published_group_consultation',
		label: 'グループ相談会&交流会',
		description:
			'グループ相談会&交流会のイベントが公開された際に通知を受け取ります',
	},
} as const;

export type EventTypeKey = keyof typeof EVENT_TYPES;

// アーカイブ区分の定義
export const ARCHIVE_CATEGORIES = {
	tereikai: {
		key: 'archive_published_tereikai',
		label: '定例会',
		description: '定例会のアーカイブが公開された際に通知を受け取ります',
	},
	boki: {
		key: 'archive_published_boki',
		label: '簿記講座',
		description: '簿記講座のアーカイブが公開された際に通知を受け取ります',
	},
	group_consultation: {
		key: 'archive_published_group_consultation',
		label: 'グループ相談会',
		description: 'グループ相談会のアーカイブが公開された際に通知を受け取ります',
	},
	online_seminar: {
		key: 'archive_published_online_seminar',
		label: 'オンラインセミナー',
		description:
			'オンラインセミナーのアーカイブが公開された際に通知を受け取ります',
	},
	special_seminar: {
		key: 'archive_published_special_seminar',
		label: '特別セミナー',
		description: '特別セミナーのアーカイブが公開された際に通知を受け取ります',
	},
	photo: {
		key: 'archive_published_photo',
		label: '写真',
		description: '写真のアーカイブが公開された際に通知を受け取ります',
	},
	newsletter: {
		key: 'archive_published_newsletter',
		label: 'ニュースレター',
		description: 'ニュースレターが公開された際に通知を受け取ります',
	},
	sawabe: {
		key: 'archive_published_sawabe',
		label: '沢辺講師',
		description: '沢辺講師のアーカイブが公開された際に通知を受け取ります',
	},
} as const;

export type ArchiveCategoryKey = keyof typeof ARCHIVE_CATEGORIES;

// 通知タイプの定義
export const NOTIFICATION_TYPES = {
	event_application: {
		key: 'event_application',
		label: 'イベント申し込み完了',
		description: 'イベントへの申し込みが完了した際に通知を受け取ります',
	},
	gather_application: {
		key: 'gather_application',
		label: '懇親会申し込み完了',
		description: '懇親会への申し込みが完了した際に通知を受け取ります',
	},
	consultation_application: {
		key: 'consultation_application',
		label: '個別相談申し込み完了',
		description: '個別相談への申し込みが完了した際に通知を受け取ります',
	},
	question_answered: {
		key: 'question_answered',
		label: '質問への回答',
		description: 'あなたの質問に回答があった際に通知を受け取ります',
	},
	question_answer_edited: {
		key: 'question_answer_edited',
		label: '質問への回答の編集',
		description: 'あなたの質問への回答が編集された際に通知を受け取ります',
	},
} as const;

// イベント種類別の通知タイプを動的に生成
export const EVENT_PUBLISHED_TYPES = Object.entries(EVENT_TYPES).reduce(
	(acc, [_key, eventType]) => {
		acc[eventType.key] = {
			key: eventType.key,
			label: eventType.label,
			description: eventType.description,
		};
		return acc;
	},
	{} as Record<string, { key: string; label: string; description: string }>,
);

export type NotificationType = keyof typeof NOTIFICATION_TYPES;
export type EventPublishedType = keyof typeof EVENT_PUBLISHED_TYPES;
export type AllNotificationType =
	| NotificationType
	| EventPublishedType
	| string;

export interface NotificationSetting {
	notification_type: string;
	is_enabled: boolean;
}

export interface NotificationSettingsGroup {
	general: NotificationSetting[];
	eventPublished: NotificationSetting[];
	archivePublished: NotificationSetting[];
}

/**
 * ユーザーの通知設定を取得する
 */
export async function getNotificationSettings(): Promise<NotificationSettingsGroup> {
	const supabase = createClient();

	// 現在のユーザーを取得
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();

	if (userError || !user) {
		console.error('認証エラー:', userError);
		throw new Error('認証が必要です');
	}

	// ユーザーの通知設定を取得
	const { data, error } = await supabase
		.from('mst_notification_settings')
		.select('notification_type, is_enabled')
		.eq('user_id', user.id)
		.is('deleted_at', null);

	if (error) {
		console.error('通知設定の取得に失敗しました:', error);
		throw new Error('通知設定の取得に失敗しました');
	}

	// 全ての通知タイプに対してデフォルト値を設定
	const settingsMap = new Map<string, boolean>();

	// 取得したデータをマップに格納
	if (data) {
		for (const setting of data) {
			settingsMap.set(setting.notification_type, setting.is_enabled);
		}
	}

	// 一般的な通知設定
	const generalSettings: NotificationSetting[] = Object.keys(
		NOTIFICATION_TYPES,
	).map((type) => ({
		notification_type: type,
		is_enabled: settingsMap.get(type) ?? false,
	}));

	// イベント種類別の通知設定
	const eventPublishedSettings: NotificationSetting[] = Object.keys(
		EVENT_PUBLISHED_TYPES,
	).map((type) => ({
		notification_type: type,
		is_enabled: settingsMap.get(type) ?? false,
	}));

	// アーカイブ区分別の通知設定
	const archivePublishedSettings: NotificationSetting[] = Object.values(
		ARCHIVE_CATEGORIES,
	).map((category) => ({
		notification_type: category.key,
		is_enabled: settingsMap.get(category.key) ?? false,
	}));

	return {
		general: generalSettings,
		eventPublished: eventPublishedSettings,
		archivePublished: archivePublishedSettings,
	};
}

/**
 * 通知設定を更新する
 */
export async function updateNotificationSetting(
	notificationType: string,
	isEnabled: boolean,
): Promise<void> {
	const supabase = createClient();

	// 現在のユーザーを取得
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();

	if (userError || !user) {
		console.error('認証エラー:', userError);
		throw new Error('認証が必要です');
	}

	// upsert で設定を挿入または更新
	const { error } = await supabase.from('mst_notification_settings').upsert(
		{
			user_id: user.id,
			notification_type: notificationType,
			is_enabled: isEnabled,
			updated_at: new Date().toISOString(),
		},
		{
			onConflict: 'user_id,notification_type',
		},
	);

	if (error) {
		console.error('通知設定の更新に失敗しました:', error);
		throw new Error('通知設定の更新に失敗しました');
	}
}

/**
 * 特定の通知タイプが有効かどうかを確認する
 */
export async function isNotificationEnabled(
	userId: string,
	notificationType: string,
): Promise<boolean> {
	const supabase = createClient();

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
