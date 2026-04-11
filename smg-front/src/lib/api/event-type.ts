import { createClient } from '@/lib/supabase';

/**
 * イベントタイプ情報の型定義
 */
export type EventTypeOption = {
	id: string;
	name: string;
};

/**
 * イベント予約一覧に表示するイベントタイプを取得する
 */
export async function getEventTypes(): Promise<EventTypeOption[]> {
	const supabase = createClient();

	try {
		const { data, error } = await supabase
			.from('mst_event_type')
			.select('event_type_id, event_type_name')
			.is('deleted_at', null)
			.order('created_at');

		if (error) {
			console.warn(
				'イベントタイプテーブルが見つかりませんでした:',
				error.message,
			);
			return [];
		}

		// すべてのイベントタイプを返す
		return (data || []).map((item) => ({
			id: item.event_type_id,
			name: item.event_type_name,
		}));
	} catch (error) {
		console.warn('イベントタイプの取得でエラーが発生しました:', error);
		return [];
	}
}
