import { createClient } from '@/lib/supabase';

// イベント質問関連の型定義
export type EventQuestion = {
	question_id: string;
	event_id: string;
	title: string;
	question_type: 'text' | 'boolean' | 'select' | 'multiple_select';
	options?: string[] | null;
	is_required: boolean;
	display_order: number;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
};

export type EventQuestionAnswer = {
	answer_id: string;
	question_id: string;
	user_id: string;
	answer: any; // JSONBフィールド（任意の形式の回答）
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
};

// イベント質問を取得する関数
export async function getEventQuestions(
	eventId: string,
): Promise<EventQuestion[]> {
	const supabase = createClient();

	const { data, error } = await (supabase as any)
		.from('trn_event_question')
		.select('*')
		.eq('event_id', eventId)
		.is('deleted_at', null)
		.order('display_order', { ascending: true });

	if (error) {
		console.error('Failed to fetch event questions:', error);
		throw new Error('イベント質問の取得に失敗しました');
	}

	return (data as EventQuestion[]) || [];
}

// イベント質問回答を保存する関数
export async function saveEventQuestionAnswers(
	eventId: string,
	answers: { question_id: string; answer: any }[],
) {
	const supabase = createClient();

	console.log('saveEventQuestionAnswers called with:', { eventId, answers });

	// 現在のユーザー情報を取得
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();

	if (userError || !user) {
		throw new Error('ユーザーが認証されていません。');
	}

	// 既存の回答を削除（論理削除）
	const { error: deleteError } = await (supabase as any)
		.from('trn_event_question_answer')
		.update({ deleted_at: new Date().toISOString() })
		.eq('user_id', user.id)
		.in(
			'question_id',
			answers.map((a) => a.question_id),
		);

	if (deleteError) {
		console.error('Failed to delete existing answers:', deleteError);
		throw new Error('既存の回答の削除に失敗しました');
	}

	console.log('Existing answers deleted successfully');

	// 新しい回答を保存（回答がある場合のみ）
	if (answers.length > 0) {
		const answersToInsert = answers.map((answer) => ({
			question_id: answer.question_id,
			user_id: user.id,
			answer: answer.answer,
		}));

		console.log('Inserting new answers:', answersToInsert);

		const { error: insertError } = await (supabase as any)
			.from('trn_event_question_answer')
			.insert(answersToInsert);

		if (insertError) {
			console.error('Failed to save answers:', insertError);
			console.error(
				'Insert error details:',
				JSON.stringify(insertError, null, 2),
			);
			throw new Error(
				`回答の保存に失敗しました: ${insertError.message || insertError.code || 'Unknown error'}`,
			);
		}

		console.log('New answers inserted successfully');
	}

	return { success: true };
}

// イベント質問回答を取得する関数（特定ユーザー）
export async function getEventQuestionAnswers(
	eventId: string,
): Promise<EventQuestionAnswer[]> {
	const supabase = createClient();

	// 現在のユーザー情報を取得
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();

	if (userError || !user) {
		console.error('User not authenticated');
		return [];
	}

	// まず、該当イベントの質問IDを取得
	const { data: questions, error: questionsError } = await (supabase as any)
		.from('trn_event_question')
		.select('question_id')
		.eq('event_id', eventId)
		.is('deleted_at', null);

	if (questionsError) {
		console.error('Failed to fetch event questions:', questionsError);
		return [];
	}

	if (!questions || questions.length === 0) {
		return [];
	}

	const questionIds = questions.map((q: any) => q.question_id);

	// ユーザーの回答を取得
	const { data, error } = await (supabase as any)
		.from('trn_event_question_answer')
		.select('*')
		.eq('user_id', user.id)
		.in('question_id', questionIds)
		.is('deleted_at', null);

	if (error) {
		console.error('Failed to fetch event question answers:', error);
		return [];
	}

	return (data as EventQuestionAnswer[]) || [];
}

// イベント質問回答をすべて取得する関数（管理者用）
export async function getAllEventQuestionAnswers(
	eventId: string,
): Promise<EventQuestionAnswer[]> {
	const supabase = createClient();

	// まず、該当イベントの質問IDを取得
	const { data: questions, error: questionsError } = await (supabase as any)
		.from('trn_event_question')
		.select('question_id')
		.eq('event_id', eventId)
		.is('deleted_at', null);

	if (questionsError) {
		console.error('Failed to fetch event questions:', questionsError);
		return [];
	}

	if (!questions || questions.length === 0) {
		return [];
	}

	const questionIds = questions.map((q: any) => q.question_id);

	// すべてのユーザーの回答を取得
	const { data, error } = await (supabase as any)
		.from('trn_event_question_answer')
		.select('*')
		.in('question_id', questionIds)
		.is('deleted_at', null)
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Failed to fetch all event question answers:', error);
		return [];
	}

	return (data as EventQuestionAnswer[]) || [];
}

// イベント一覧を取得する関数（ページネーション対応）
export async function getEvents(
	searchTerm?: string,
	sortOption?: string,
	eventTypeId?: string,
	page = 1,
	pageSize = 5,
	filters?: {
		locations?: string[];
		formats?: string[];
		eventTypes?: string[];
		applied?: boolean;
	},
): Promise<{
	events: any[];
	totalCount: number;
}> {
	const supabase = createClient();

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

	// 簿記講座のイベントタイプIDを取得
	const { data: bookkeepingTypeData } = await supabase
		.from('mst_event_type')
		.select('event_type_id')
		.eq('event_type_name', '簿記講座')
		.is('deleted_at', null);

	const bookkeepingTypeId = bookkeepingTypeData?.[0]?.event_type_id || '';

	// グループ制限があるイベントIDを取得
	const { data: restrictedEvents, error: restrictedError } = await supabase
		.from('trn_event_visible_group')
		.select('event_id')
		.is('deleted_at', null);

	if (restrictedError) {
		console.error('Error fetching restricted events:', restrictedError);
	}

	const restrictedEventIds = new Set(
		restrictedEvents?.map((re) => re.event_id) || [],
	);

	// ユーザーが閲覧可能なイベントIDを取得
	let visibleEventIds: string[] = [];
	if (userGroupIds.length > 0) {
		const { data: visibleEvents, error: visibleError } = await supabase
			.from('trn_event_visible_group')
			.select('event_id')
			.in('group_id', userGroupIds)
			.is('deleted_at', null);

		if (visibleError) {
			console.error('Error fetching visible events:', visibleError);
		} else {
			visibleEventIds = visibleEvents.map((ve) => ve.event_id);
		}
	}

	// 除外するイベントIDを計算（制限があるが、ユーザーが閲覧できないイベント）
	const excludeEventIds = Array.from(restrictedEventIds).filter(
		(eventId) => !visibleEventIds.includes(eventId),
	);

	// 申込済みフィルターの場合、ユーザーが申し込んでいるイベントIDを取得
	let appliedEventIds: string[] = [];
	if (filters?.applied && userId) {
		// イベント参加者テーブルから取得
		const { data: userAttendees } = await supabase
			.from('trn_event_attendee')
			.select('event_id')
			.eq('user_id', userId)
			.is('deleted_at', null);

		// 懇親会参加者テーブルからも取得
		const { data: userGathers } = await supabase
			.from('trn_gather_attendee')
			.select('event_id')
			.eq('user_id', userId)
			.is('deleted_at', null);

		const attendeeEventIds = userAttendees?.map((a) => a.event_id) || [];
		const gatherEventIds = userGathers?.map((g) => g.event_id) || [];
		appliedEventIds = [...new Set([...attendeeEventIds, ...gatherEventIds])];

		// 申し込んでいるイベントが0件の場合、空の結果を返す
		if (appliedEventIds.length === 0) {
			return { events: [], totalCount: 0 };
		}
	}

	// ベースクエリを構築
	let eventQuery = supabase
		.from('mst_event')
		.select(
			`
      *,
      mst_event_type (
        event_type_name
      )
    `,
			{ count: 'exact' },
		)
		.neq('event_type', bookkeepingTypeId) // 簿記講座を除外
		.is('deleted_at', null)
		.eq('is_draft', false)
		.lte('publish_start_at', new Date().toISOString())
		.gte('publish_end_at', new Date().toISOString());

	// グループフィルタリング（除外するイベントがある場合）
	if (excludeEventIds.length > 0) {
		eventQuery = eventQuery.not(
			'event_id',
			'in',
			`(${excludeEventIds.join(',')})`,
		);
	}

	// 申込済みフィルター（申し込んでいるイベントのみ表示）
	if (filters?.applied && appliedEventIds.length > 0) {
		eventQuery = eventQuery.in('event_id', appliedEventIds);
	}

	// 検索キーワードでフィルタリング
	if (searchTerm) {
		eventQuery = eventQuery.ilike('event_name', `%${searchTerm}%`);
	}

	// イベント種類でフィルタリング（IDベース）
	if (filters?.eventTypes && filters.eventTypes.length > 0) {
		// URLパラメータから渡されるのはevent_type_idなので、直接フィルタリング
		const validEventTypeIds = filters.eventTypes.filter((id) => id);
		if (validEventTypeIds.length > 0) {
			eventQuery = eventQuery.in('event_type', validEventTypeIds);
		}
	}

	// 開催地でフィルタリング
	if (filters?.locations && filters.locations.length > 0) {
		const locationMap: { [key: string]: string } = {
			tokyo: '東京',
			osaka: '大阪',
			fukuoka: '福岡',
			sendai: '仙台',
			nagoya: '名古屋',
			online: 'オンライン',
		};
		const locationValues = filters.locations
			.map((loc) => locationMap[loc])
			.filter(Boolean);
		if (locationValues.length > 0) {
			eventQuery = eventQuery.in('event_city', locationValues);
		}
	}

	// 開催形式でフィルタリング（オンライン/オフライン）
	if (filters?.formats && filters.formats.length > 0) {
		// オンラインセミナーのイベントタイプIDを取得
		const { data: onlineSeminarType, error: typeError } = await supabase
			.from('mst_event_type')
			.select('event_type_id')
			.eq('event_type_name', 'オンラインセミナー')
			.is('deleted_at', null)
			.maybeSingle();

		if (typeError) {
			console.error('Error fetching online seminar type:', typeError);
		}

		const onlineSeminarTypeId = onlineSeminarType?.event_type_id;

		if (
			filters.formats.includes('online') &&
			!filters.formats.includes('offline')
		) {
			// オンラインのみ
			if (onlineSeminarTypeId) {
				eventQuery = eventQuery.eq('event_type', onlineSeminarTypeId);
			}
		} else if (
			filters.formats.includes('offline') &&
			!filters.formats.includes('online')
		) {
			// オフラインのみ
			if (onlineSeminarTypeId) {
				eventQuery = eventQuery.neq('event_type', onlineSeminarTypeId);
			}
		}
		// 両方選択されている場合はフィルタリングしない
	}

	// 参加人数順・定員数順の場合は全件取得が必要
	const needsFullFetch =
		sortOption === 'participants' ||
		sortOption === 'participants_asc' ||
		sortOption === 'capacity' ||
		sortOption === 'capacity_asc';

	// ソート順（日付順の場合）
	// 降順（date）: 未来の開催日が上、昇順（date_asc）: 過去の開催日が上
	if (sortOption === 'date_asc') {
		eventQuery = eventQuery.order('event_start_datetime', { ascending: true });
	} else if (sortOption === 'date' || !sortOption || needsFullFetch) {
		// 参加人数順・定員数順の場合も、一旦日付降順で取得
		eventQuery = eventQuery.order('event_start_datetime', { ascending: false });
	}

	// 総件数を取得するためのクエリ実行
	const { count, error: countError } = await eventQuery;
	if (countError) {
		console.error('Error fetching event count:', countError);
		return { events: [], totalCount: 0 };
	}

	// ページネーション（日付順の場合のみここで適用）
	const startIndex = (page - 1) * pageSize;
	const endIndex = startIndex + pageSize - 1;
	if (!needsFullFetch) {
		eventQuery = eventQuery.range(startIndex, endIndex);
	}

	const { data: eventData, error: eventError } = await eventQuery;

	if (eventError) {
		console.error('Error fetching events:', eventError);
		return { events: [], totalCount: 0 };
	}

	// すべてのイベントのIDを取得
	const eventIds = eventData.map((event: any) => event.event_id);

	if (eventIds.length === 0) {
		return { events: [], totalCount: count || 0 };
	}

	// 参加者数を取得（オフライン参加者のみ）
	const { data: attendeeData, error: attendeeError } = await supabase
		.from('trn_event_attendee')
		.select('event_id, user_id, is_offline')
		.in('event_id', eventIds)
		.is('deleted_at', null);

	if (attendeeError) {
		console.error('Error fetching attendees:', attendeeError);
	}

	// イベントごとの参加者数を集計
	const attendeeCounts: { [key: string]: number } = {};
	const userAppliedEvents: Set<string> = new Set();

	attendeeData?.forEach((attendee: any) => {
		// オフライン参加者のみを参加者数にカウント
		if (attendee.is_offline) {
			attendeeCounts[attendee.event_id] =
				(attendeeCounts[attendee.event_id] || 0) + 1;
		}

		// ログインユーザーが申し込んでいるイベントを記録（オンライン・オフライン問わず）
		if (attendee.user_id === userId) {
			userAppliedEvents.add(attendee.event_id);
		}
	});

	// 懇親会の申し込みも反映
	const { data: gatherData, error: gatherError } = await supabase
		.from('trn_gather_attendee')
		.select('event_id, user_id')
		.in('event_id', eventIds)
		.is('deleted_at', null);

	if (gatherError) {
		console.error('Error fetching gather attendees:', gatherError);
	}

	gatherData?.forEach((gather: any) => {
		// ログインユーザーが懇親会に申し込んでいるか記録
		if (gather.user_id === userId) {
			userAppliedEvents.add(gather.event_id);
		}
	});

	// データを変換
	let formattedEvents = eventData.map((event: any) => {
		return {
			event_id: event.event_id,
			event_name: event.event_name,
			event_start_datetime: event.event_start_datetime,
			event_end_datetime: event.event_end_datetime,
			event_location: event.event_location,
			event_city: event.event_city,
			event_description: event.event_description,
			event_capacity: event.event_capacity,
			event_type: event.mst_event_type?.event_type_name || '',
			event_type_name: event.mst_event_type?.event_type_name,
			image_url: event.image_url,
			has_consultation: event.has_consultation,
			has_gather: event.has_gather,
			consultation_capacity: event.consultation_capacity,
			gather_capacity: event.gather_capacity,
			gather_price: event.gather_price,
			gather_start_time: event.gather_start_time,
			gather_end_time: event.gather_end_time,
			gather_location: event.gather_location,
			registration_start_datetime: event.registration_start_datetime,
			registration_end_datetime: event.registration_end_datetime,
			publish_start_at: event.publish_start_at,
			publish_end_at: event.publish_end_at,
			spreadsheet_id: event.spreadsheet_id,
			created_at: event.created_at,
			updated_at: event.updated_at,
			deleted_at: event.deleted_at,
			is_draft: event.is_draft,
			notification_sent: event.notification_sent ?? false,
			gather_registration_end_datetime: event.gather_registration_end_datetime || null,
			is_applied: userAppliedEvents.has(event.event_id),
			participants_count: attendeeCounts[event.event_id] || 0,
			visible_group_ids: [],
		};
	});

	// ソート順が参加人数順または定員数順の場合、全件ソート後にページネーション
	if (sortOption === 'participants') {
		formattedEvents.sort((a, b) => b.participants_count - a.participants_count);
		formattedEvents = formattedEvents.slice(startIndex, startIndex + pageSize);
	} else if (sortOption === 'participants_asc') {
		formattedEvents.sort((a, b) => a.participants_count - b.participants_count);
		formattedEvents = formattedEvents.slice(startIndex, startIndex + pageSize);
	} else if (sortOption === 'capacity') {
		formattedEvents.sort(
			(a, b) => (b.event_capacity || 0) - (a.event_capacity || 0),
		);
		formattedEvents = formattedEvents.slice(startIndex, startIndex + pageSize);
	} else if (sortOption === 'capacity_asc') {
		formattedEvents.sort(
			(a, b) => (a.event_capacity || 0) - (b.event_capacity || 0),
		);
		formattedEvents = formattedEvents.slice(startIndex, startIndex + pageSize);
	}

	return {
		events: formattedEvents,
		totalCount: count || 0,
	};
}
