import { createClient } from '@/lib/supabase';

/**
 * イベントタイプ情報の型定義
 */
export type EventTypeOption = {
	id: string;
	name: string;
};

/**
 * 全てのイベントタイプを取得する（簿記講座を除く）
 */
export async function getEventTypes(): Promise<EventTypeOption[]> {
	const supabase = createClient();

	try {
		const { data, error } = await supabase
			.from('mst_event_type')
			.select('event_type_id, event_type_name')
			.neq('event_type_name', '簿記講座')
			.is('deleted_at', null)
			.order('created_at');

		if (error) {
			console.warn(
				'イベントタイプテーブルが見つかりませんでした:',
				error.message,
			);
			return [];
		}

		return (data || []).map((item) => ({
			id: item.event_type_id,
			name: item.event_type_name,
		}));
	} catch (error) {
		console.warn('イベントタイプの取得でエラーが発生しました:', error);
		return [];
	}
}
