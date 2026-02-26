import type { Radio } from '@/components/radio/types';
import { createClient } from '@/lib/supabase';
import type { PostgrestError } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

export const useRadios = (
	year?: string,
	sortOrder: 'newest' | 'oldest' = 'newest',
	page?: number,
	pageSize = 10,
) => {
	const [radios, setRadios] = useState<Radio[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<PostgrestError | null>(null);
	const [totalCount, setTotalCount] = useState(0);

	useEffect(() => {
		const fetchRadios = async () => {
			const supabase = createClient();

			try {
				setLoading(true);

				// ログインユーザーのIDを取得
				const {
					data: { user },
				} = await supabase.auth.getUser();
				const userId = user?.id;

				// ユーザーが所属するグループのIDを取得
				let userGroupIds: string[] = [];
				if (userId) {
					const { data: userGroups, error: userGroupError } = await supabase
						.from('trn_group_user')
						.select('group_id')
						.eq('user_id', userId)
						.is('deleted_at', null);

					if (userGroupError) {
						console.error('Error fetching user groups:', userGroupError);
					} else {
						userGroupIds = userGroups.map((ug) => ug.group_id);
					}
				}

				// 現在時刻（UTC）を取得
				const nowUTC = new Date().toISOString();

				// 基本クエリ - 配信期間内のラジオを取得
				const query = supabase
					.from('mst_radio')
					.select('*', { count: 'exact' })
					.is('deleted_at', null)
					.eq('is_draft', false)
					.lte('publish_start_at', nowUTC)
					.or(`publish_end_at.is.null,publish_end_at.gt.${nowUTC}`); // すべてのラジオデータを取得
				const { data: radioData, error: radioError, count } = await query;

				if (radioError) throw radioError;

				// ラジオの表示制限をチェック
				let accessibleRadioData = radioData || [];

				if (radioData && radioData.length > 0 && userGroupIds.length > 0) {
					// 制限対象のラジオIDを取得
					const { data: restrictionData, error: restrictionError } =
						await supabase
							.from('trn_radio_visible_group')
							.select('radio_id, group_id')
							.is('deleted_at', null);

					if (restrictionError) {
						console.error('Error fetching restriction data:', restrictionError);
					}

					// すべての制限対象ラジオID
					const restrictedRadioIds = new Set(
						restrictionData?.map((r) => r.radio_id) || [],
					);

					// ユーザーが表示可能なラジオID（JavaScriptでフィルタリング）
					const visibleRadioIds =
						restrictionData
							?.filter((r) => userGroupIds.includes(r.group_id))
							.map((r) => r.radio_id) || [];

					// ラジオをフィルタリング
					accessibleRadioData = radioData.filter((radio) => {
						// ラジオに制限がない場合は表示
						if (!restrictedRadioIds.has(radio.radio_id)) {
							return true;
						}

						// 制限があるラジオの場合、ユーザーのグループで表示可能かチェック
						return visibleRadioIds.includes(radio.radio_id);
					});
				} else if (!radioData || radioData.length === 0) {
					accessibleRadioData = [];
				}

				// 年でフィルタリング（必要な場合）
				const filteredData = year
					? accessibleRadioData.filter((radio) => {
							// publish_start_atを優先、nullの場合はcreated_atを使用
							let targetDate: Date | null = null;
							if (radio.publish_start_at) {
								targetDate = new Date(radio.publish_start_at);
							} else if (radio.created_at) {
								targetDate = new Date(radio.created_at);
							}
							return targetDate && targetDate.getFullYear().toString() === year;
						})
					: accessibleRadioData;

				// ソート
				const sortedData = filteredData.sort((a, b) => {
					// publish_start_atを優先、nullの場合はcreated_atを使用
					const dateA = a.publish_start_at
						? new Date(a.publish_start_at).getTime()
						: new Date(a.created_at).getTime();
					const dateB = b.publish_start_at
						? new Date(b.publish_start_at).getTime()
						: new Date(b.created_at).getTime();

					if (sortOrder === 'newest') {
						return dateB - dateA; // 降順（新しい順）
					}
					return dateA - dateB; // 昇順（古い順）
				}); // 総件数を設定
				setTotalCount(sortedData.length);

				// ページネーション適用
				let paginatedData = sortedData;
				if (page !== undefined) {
					const startIndex = (page - 1) * pageSize;
					const endIndex = startIndex + pageSize;
					paginatedData = sortedData.slice(startIndex, endIndex);
				}

				setRadios(paginatedData);
			} catch (error) {
				setError(error as PostgrestError);
				console.error('Error fetching radios:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchRadios();
	}, [page, pageSize, year, sortOrder]);

	return { radios, loading, error, totalCount };
};
