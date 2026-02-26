import { createClient } from '@/lib/supabase';
import { createTextSummary } from '@/lib/utils/html';

/**
 * Supabaseのクエリで使用する特殊文字をエスケープする
 * PostgRESTのorフィルタ構文で問題になる文字をエスケープ
 * 参考: https://postgrest.org/en/stable/references/api/tables_views.html#reserved-characters
 *
 * ilike演算子で%ワイルドカードと組み合わせて使用するため、
 * %を含めたパターン全体をダブルクォートで囲んで返す
 */
function escapePostgrestLikePattern(value: string): string {
	// PostgRESTのorフィルタでは、特殊文字（カンマ、括弧、ピリオド）を含む値は
	// ダブルクォートで囲む必要がある
	// 値の中のダブルクォートはエスケープが必要
	const escaped = value.replace(/"/g, '\\"');
	// %ワイルドカードを含めたパターン全体をダブルクォートで囲む
	return `"%${escaped}%"`;
}

export type SearchResultType =
	| 'event'
	| 'notice'
	| 'consultation'
	| 'archive'
	| 'question'
	| 'bookkeeping'
	| 'beginner'
	| 'faq'
	| 'radio';

export type SearchResult = {
	id: string;
	name: string;
	type: SearchResultType;
	path: string;
};

/**
 * 全ジャンルから検索結果を取得する
 * @param query 検索キーワード
 * @param page ページ番号（1から開始）
 * @param pageSize 1ページあたりのアイテム数
 * @param types フィルタするタイプ（空の場合は全て）
 * @returns 検索結果と総件数
 */
export async function searchAll(
	query: string,
	page = 1,
	pageSize = 20,
	types?: SearchResultType[],
): Promise<{ items: SearchResult[]; totalCount: number }> {
	if (!query) {
		return { items: [], totalCount: 0 };
	}

	try {
		const supabase = createClient();
		const allResults: SearchResult[] = [];
		const nowUTC = new Date().toISOString();

		// 検索キーワードをエスケープ（%ワイルドカード付きのLIKEパターンとして）
		const likePattern = escapePostgrestLikePattern(query);

		// Stage 1: ユーザー認証とグループ情報を取得
		const {
			data: { user },
		} = await supabase.auth.getUser();
		const userId = user?.id;
		let userGroupIds: string[] = [];

		if (userId) {
			const { data: userGroups } = await supabase
				.from('trn_group_user')
				.select('group_id')
				.eq('user_id', userId)
				.is('deleted_at', null);

			if (userGroups) {
				userGroupIds = userGroups.map((ug) => ug.group_id);
			}
		}

		// Stage 2: 独立したクエリを並列実行
		const [
			bookkeepingTypeResult,
			basicGroupResult,
			noticeResult,
			consultationResult,
			questionResult,
			beginnerResult,
			faqResult,
			eventVisibleGroupResult,
			noticeVisibleGroupResult,
			radioVisibleGroupResult,
		] = await Promise.all([
			// 簿記講座のイベントタイプIDを取得
			supabase
				.from('mst_event_type')
				.select('event_type_id')
				.eq('event_type_name', '簿記講座')
				.is('deleted_at', null),

			// 簿記講座の基本グループ（簿記3期、運営、講師）のIDを取得
			supabase
				.from('mst_group')
				.select('group_id')
				.in('title', ['簿記3期', '運営', '講師'])
				.is('deleted_at', null),

			// お知らせを検索
			!types || types.includes('notice')
				? supabase
						.from('mst_notice')
						.select('notice_id, title, content')
						.or(`title.ilike.${likePattern},content.ilike.${likePattern}`)
						.is('deleted_at', null)
						.eq('is_draft', false)
						.lte('publish_start_at', nowUTC)
						.or('publish_end_at.is.null,publish_end_at.gt.' + nowUTC)
				: Promise.resolve({ data: null, error: null }),

			// 個別面談予約を検索
			!types || types.includes('consultation')
				? supabase
						.from('mst_consultation')
						.select('consultation_id, title, description')
						.or(`title.ilike.${likePattern},description.ilike.${likePattern}`)
						.is('deleted_at', null)
						.eq('is_draft', false)
						.lte('publish_start_at', nowUTC)
						.gte('publish_end_at', nowUTC)
				: Promise.resolve({ data: null, error: null }),

			// 質問を検索
			!types || types.includes('question')
				? supabase
						.from('trn_question')
						.select('question_id, content')
						.ilike('content', `%${query}%`)
						.is('deleted_at', null)
						.eq('is_anonymous', false)
						.eq('is_hidden', false)
				: Promise.resolve({ data: null, error: null }),

			// 初めての方へを検索
			!types || types.includes('beginner')
				? supabase
						.from('mst_beginner_guide_item')
						.select('guide_item_id, title, description')
						.or(`title.ilike.${likePattern},description.ilike.${likePattern}`)
						.is('deleted_at', null)
						.eq('is_draft', false)
				: Promise.resolve({ data: null, error: null }),

			// よくある質問を検索
			!types || types.includes('faq')
				? supabase
						.from('mst_faq')
						.select('faq_id, title, description')
						.or(`title.ilike.${likePattern},description.ilike.${likePattern}`)
						.is('deleted_at', null)
				: Promise.resolve({ data: null, error: null }),

			// イベントのグループ制限データを取得
			supabase
				.from('trn_event_visible_group')
				.select('event_id, group_id')
				.is('deleted_at', null),

			// お知らせのグループ制限データを取得
			supabase
				.from('trn_notice_visible_group')
				.select('notice_id, group_id')
				.is('deleted_at', null),

			// ラジオのグループ制限データを取得
			supabase
				.from('trn_radio_visible_group')
				.select('radio_id, group_id')
				.is('deleted_at', null),
		]);

		const bookkeepingTypeId =
			bookkeepingTypeResult.data?.[0]?.event_type_id || '';
		const basicGroupIds = basicGroupResult.data?.map((g) => g.group_id) || [];
		const hasFullAccess = userGroupIds.some((groupId) =>
			basicGroupIds.includes(groupId),
		);

		// Stage 3: bookkeepingTypeIdに依存するクエリを並列実行
		const [eventResult, bookkeepingResult, archiveResult, radioResult] =
			await Promise.all([
				// イベントを検索（簿記講座を除外）
				!types || types.includes('event')
					? supabase
							.from('mst_event')
							.select('event_id, event_name, event_type, event_description')
							.or(
								`event_name.ilike.${likePattern},event_description.ilike.${likePattern}`,
							)
							.is('deleted_at', null)
							.eq('is_draft', false)
							.lte('publish_start_at', nowUTC)
							.gte('publish_end_at', nowUTC)
							.neq('event_type', bookkeepingTypeId)
					: Promise.resolve({ data: null, error: null }),

				// 簿記講座を検索
				!types || types.includes('bookkeeping')
					? supabase
							.from('mst_event')
							.select('event_id, event_name, event_description')
							.or(
								`event_name.ilike.${likePattern},event_description.ilike.${likePattern}`,
							)
							.is('deleted_at', null)
							.eq('is_draft', false)
							.lte('publish_start_at', nowUTC)
							.gte('publish_end_at', nowUTC)
							.eq('event_type', bookkeepingTypeId)
					: Promise.resolve({ data: null, error: null }),

				// アーカイブを検索
				!types || types.includes('archive')
					? supabase
							.from('mst_event_archive')
							.select('archive_id, title, description, event_id, event_type_id')
							.or(`title.ilike.${likePattern},description.ilike.${likePattern}`)
							.is('deleted_at', null)
							.eq('is_draft', false)
							.lte('publish_start_at', nowUTC)
							.or('publish_end_at.is.null,publish_end_at.gt.' + nowUTC)
					: Promise.resolve({ data: null, error: null }),

				// ラジオを検索
				!types || types.includes('radio')
					? supabase
							.from('mst_radio')
							.select('radio_id, radio_name, radio_description')
							.or(
								`radio_name.ilike.${likePattern},radio_description.ilike.${likePattern}`,
							)
							.is('deleted_at', null)
							.eq('is_draft', false)
							.lte('publish_start_at', nowUTC)
							.or('publish_end_at.is.null,publish_end_at.gt.' + nowUTC)
					: Promise.resolve({ data: null, error: null }),
			]);

		// グループフィルタリング用のデータを準備
		const eventVisibleGroupData = eventVisibleGroupResult.data;
		const eventRestrictedIds = new Set(
			eventVisibleGroupData?.map((r) => r.event_id) || [],
		);
		const eventVisibleIds =
			userGroupIds.length > 0
				? eventVisibleGroupData
						?.filter((r) => userGroupIds.includes(r.group_id))
						.map((r) => r.event_id) || []
				: [];

		const noticeVisibleGroupData = noticeVisibleGroupResult.data;
		const noticeRestrictedIds = new Set(
			noticeVisibleGroupData?.map((r) => r.notice_id) || [],
		);
		const noticeVisibleIds =
			userGroupIds.length > 0
				? noticeVisibleGroupData
						?.filter((r) => userGroupIds.includes(r.group_id))
						.map((r) => r.notice_id) || []
				: [];

		const radioVisibleGroupData = radioVisibleGroupResult.data;
		const radioRestrictedIds = new Set(
			radioVisibleGroupData?.map((r) => r.radio_id) || [],
		);
		const radioVisibleIds =
			userGroupIds.length > 0
				? radioVisibleGroupData
						?.filter((r) => userGroupIds.includes(r.group_id))
						.map((r) => r.radio_id) || []
				: [];

		// イベントデータを処理（グループフィルタリング適用）
		const eventData = eventResult.data;
		const eventError = eventResult.error;
		if (!eventError && eventData) {
			eventData
				.filter((event) => {
					if (!eventRestrictedIds.has(event.event_id)) {
						return true;
					}
					return eventVisibleIds.includes(event.event_id);
				})
				.forEach((event) => {
					allResults.push({
						id: event.event_id,
						name: event.event_name,
						type: 'event',
						path: `/events/${event.event_id}`,
					});
				});
		}

		// 簿記講座データを処理（2段階のグループフィルタリング）
		const bookkeepingData = bookkeepingResult.data;
		const bookkeepingError = bookkeepingResult.error;
		if (!bookkeepingError && bookkeepingData) {
			let filteredBookkeepingData: typeof bookkeepingData = [];

			if (hasFullAccess) {
				filteredBookkeepingData = bookkeepingData;
			} else {
				filteredBookkeepingData = bookkeepingData.filter((event) =>
					eventVisibleIds.includes(event.event_id),
				);
			}

			filteredBookkeepingData.forEach((event) => {
				allResults.push({
					id: event.event_id,
					name: event.event_name,
					type: 'bookkeeping',
					path: `/bookkeeping/${event.event_id}`,
				});
			});
		}

		// お知らせデータを処理（グループフィルタリング適用）
		const noticeData = noticeResult.data;
		const noticeError = noticeResult.error;
		if (!noticeError && noticeData) {
			noticeData
				.filter((notice) => {
					if (!noticeRestrictedIds.has(notice.notice_id)) {
						return true;
					}
					return noticeVisibleIds.includes(notice.notice_id);
				})
				.forEach((notice) => {
					const noticeIntId = Number.parseInt(notice.notice_id, 16) % 1000000;
					allResults.push({
						id: notice.notice_id,
						name: notice.title,
						type: 'notice',
						path: `/notice?noticeId=${noticeIntId}`,
					});
				});
		}

		// 個別面談予約を処理
		const consultationData = consultationResult.data;
		const consultationError = consultationResult.error;
		if (!consultationError && consultationData) {
			consultationData.forEach((consultation) => {
				allResults.push({
					id: consultation.consultation_id,
					name: consultation.title || '',
					type: 'consultation',
					path: `/consultations/${consultation.consultation_id}`,
				});
			});
		}

		// アーカイブデータを処理（グループフィルタリング適用）
		const archiveData = archiveResult.data;
		const archiveError = archiveResult.error;
		if (!archiveError && archiveData) {
			archiveData
				.filter((archive) => {
					if (!archive.event_id) {
						return true;
					}

					if (archive.event_type_id === bookkeepingTypeId) {
						if (hasFullAccess) {
							return true;
						}
						return (
							eventRestrictedIds.has(archive.event_id) &&
							eventVisibleIds.includes(archive.event_id)
						);
					}

					if (!eventRestrictedIds.has(archive.event_id)) {
						return true;
					}
					return eventVisibleIds.includes(archive.event_id);
				})
				.forEach((archive) => {
					allResults.push({
						id: archive.archive_id,
						name: archive.title || '',
						type: 'archive',
						path: `/archive/detail/${archive.archive_id}`,
					});
				});
		}

		// 質問を処理
		const questionData = questionResult.data;
		const questionError = questionResult.error;
		if (!questionError && questionData) {
			questionData.forEach((question) => {
				const title = createTextSummary(question.content, 80);
				allResults.push({
					id: question.question_id,
					name: title,
					type: 'question',
					path: `/questions/${question.question_id}`,
				});
			});
		}

		// 初めての方へを処理
		const beginnerData = beginnerResult.data;
		const beginnerError = beginnerResult.error;
		if (!beginnerError && beginnerData) {
			beginnerData.forEach((guide) => {
				allResults.push({
					id: guide.guide_item_id,
					name: guide.title || '',
					type: 'beginner',
					path: `/beginner?item=${guide.guide_item_id}`,
				});
			});
		}

		// よくある質問を処理
		const faqData = faqResult.data;
		const faqError = faqResult.error;
		if (!faqError && faqData) {
			faqData.forEach((faq) => {
				allResults.push({
					id: faq.faq_id,
					name: faq.title || '',
					type: 'faq',
					path: `/faq?faqId=${faq.faq_id}`,
				});
			});
		}

		// ラジオデータを処理（グループフィルタリング適用）
		const radioData = radioResult.data;
		const radioError = radioResult.error;
		if (!radioError && radioData) {
			radioData
				.filter((radio) => {
					if (!radioRestrictedIds.has(radio.radio_id)) {
						return true;
					}
					return radioVisibleIds.includes(radio.radio_id);
				})
				.forEach((radio) => {
					allResults.push({
						id: radio.radio_id,
						name: radio.radio_name || '',
						type: 'radio',
						path: `/radio/${radio.radio_id}`,
					});
				});
		}

		// ページネーション適用
		const totalCount = allResults.length;
		const start = (page - 1) * pageSize;
		const end = start + pageSize;
		const paginatedResults = allResults.slice(start, end);

		return {
			items: paginatedResults,
			totalCount,
		};
	} catch (error) {
		console.error('Error in searchAll:', error);
		return { items: [], totalCount: 0 };
	}
}
