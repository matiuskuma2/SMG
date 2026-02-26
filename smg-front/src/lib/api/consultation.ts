import { createClient } from '@/lib/supabase';
import type {
	MstConsultation,
	MstConsultationSchedule,
} from '@/lib/supabase/types';
import type { Json } from '@/lib/supabase/types';

// Supabaseの型定義をベースにしたConsultation型
export type Consultation = MstConsultation & {
	instructor: {
		user_id: string;
		username: string | null;
		created_at: string | null;
	};
};

// ConsultationScheduleもSupabaseの型定義を使用
export type ConsultationSchedule = MstConsultationSchedule;

export type ConsultationDetail = Consultation & {
	schedules: ConsultationSchedule[];
};

export type ConsultationWithApplicationStatus = Consultation & {
	is_applied: boolean;
};

// 申し込み詳細情報の型定義
export type ConsultationApplicationDetail = {
	application_id: string;
	consultation_id: string;
	user_id: string;
	is_urgent: boolean;
	is_first_consultation: boolean;
	notes: string | null;
	selection_status: string;
	selected_candidate_id: string | null;
	created_at: string | null;
	updated_at: string | null;
	schedules: {
		schedule_id: string;
		schedule_datetime: string;
		priority: number;
	}[];
	selectedSchedule: {
		schedule_id: string;
		schedule_datetime: string;
		priority: number;
	} | null;
};

// ユーザーが相談に申し込んでいるかをチェックする関数
export async function checkUserApplications(
	consultationIds: string[],
): Promise<Record<string, boolean>> {
	const supabase = createClient();

	// 現在のユーザー情報を取得
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();

	if (userError || !user) {
		console.error('User not authenticated');
		return {};
	}

	// ユーザーが申し込んでいる相談を取得
	const { data, error } = await supabase
		.from('trn_consultation_application')
		.select('consultation_id')
		.eq('user_id', user.id)
		.in('consultation_id', consultationIds)
		.is('deleted_at', null);

	if (error) {
		console.error('Failed to fetch user applications:', error);
		return {};
	}

	// 申し込み状況をマッピング
	const applicationStatus: Record<string, boolean> = {};
	for (const id of consultationIds) {
		applicationStatus[id] = false;
	}

	for (const app of data) {
		applicationStatus[app.consultation_id] = true;
	}

	return applicationStatus;
}

export async function getConsultations(
	instructorName?: string,
	sortOrder: 'asc' | 'desc' = 'asc',
	page?: number,
	pageSize?: number,
): Promise<{ consultations: Consultation[]; totalCount: number }> {
	const supabase = createClient();
	const now = new Date().toISOString();

	// 講師名でフィルタリングする場合、先に講師IDを取得
	let instructorIds: string[] | undefined;
	if (instructorName) {
		const { data: instructorData, error: instructorError } = await supabase
			.from('mst_user')
			.select('user_id')
			.eq('username', instructorName);

		if (instructorError) {
			console.error('Failed to fetch instructor:', instructorError);
			return { consultations: [], totalCount: 0 };
		}

		if (!instructorData || instructorData.length === 0) {
			return { consultations: [], totalCount: 0 };
		}

		instructorIds = instructorData.map((i) => i.user_id);
	}

	// 相談データを取得（公開期間内のもの）
	let consultationQuery = supabase
		.from('mst_consultation')
		.select('*', { count: 'exact' })
		.is('deleted_at', null)
		.eq('is_draft', false);

	// 公開期間のフィルター（publish_start_atとpublish_end_atがnullの場合は常に表示）
	consultationQuery = consultationQuery.or(
		`and(publish_start_at.is.null,publish_end_at.is.null),and(publish_start_at.lte.${now},publish_end_at.gte.${now})`,
	);

	// 講師IDでフィルタリング
	if (instructorIds) {
		consultationQuery = consultationQuery.in('instructor_id', instructorIds);
	}

	// ソート
	consultationQuery = consultationQuery.order('application_start_datetime', {
		ascending: sortOrder === 'asc',
	});

	// ページネーションを適用（Supabaseの.range()を使用）
	if (page !== undefined && pageSize !== undefined) {
		const startIndex = (page - 1) * pageSize;
		const endIndex = startIndex + pageSize - 1;
		consultationQuery = consultationQuery.range(startIndex, endIndex);
	}

	const {
		data: consultationData,
		error: consultationError,
		count,
	} = await consultationQuery;

	if (consultationError) {
		console.error('Supabase error:', consultationError);
		throw new Error('Failed to fetch consultations');
	}

	if (!consultationData || consultationData.length === 0) {
		return { consultations: [], totalCount: count || 0 };
	}

	// 講師情報を取得
	const allInstructorIds = [
		...new Set(consultationData.map((c) => c.instructor_id)),
	];
	const { data: allInstructorData, error: allInstructorError } = await supabase
		.from('mst_user')
		.select('user_id, username, created_at')
		.in('user_id', allInstructorIds);

	if (allInstructorError) {
		console.error('Failed to fetch instructors:', allInstructorError);
	}

	const instructorMap = new Map(
		allInstructorData?.map((instructor) => [instructor.user_id, instructor]) ||
			[],
	);

	// データを結合
	const consultations: Consultation[] = consultationData.map(
		(consultation) => ({
			...consultation,
			instructor: instructorMap.get(consultation.instructor_id) || {
				user_id: consultation.instructor_id,
				username: null,
				created_at: null,
			},
		}),
	);

	return { consultations, totalCount: count || 0 };
}

export async function getConsultationById(
	id: string,
): Promise<ConsultationDetail> {
	const supabase = createClient();

	// デバッグ用：まず全ての相談データを確認
	const { data: allConsultations, error: allError } = await supabase
		.from('mst_consultation')
		.select('consultation_id, title, deleted_at, is_draft')
		.eq('is_draft', false)
		.limit(10);

	console.log('All consultations:', allConsultations);
	console.log('Looking for ID:', id);

	// 相談情報を取得
	const { data: consultationData, error: consultationError } = await supabase
		.from('mst_consultation')
		.select(`
      consultation_id,
      instructor_id,
      image_url,
      title,
      description,
      application_start_datetime,
      application_end_datetime,
      deleted_at,
      is_draft
    `)
		.eq('consultation_id', id)
		.eq('is_draft', false);

	console.log('Consultation query result:', {
		consultationData,
		consultationError,
	});

	if (consultationError) {
		console.error('Supabase error:', consultationError);
		throw new Error('Failed to fetch consultation detail');
	}

	if (!consultationData || consultationData.length === 0) {
		throw new Error(`Consultation with ID ${id} not found`);
	}

	// 削除されていないデータを選択
	const validConsultation = consultationData.find((c) => !c.deleted_at);
	if (!validConsultation) {
		throw new Error(`Consultation with ID ${id} has been deleted`);
	}

	// 講師情報を取得
	const { data: instructorData, error: instructorError } = await supabase
		.from('mst_user')
		.select('user_id, username')
		.eq('user_id', validConsultation.instructor_id)
		.single();

	if (instructorError) {
		console.error('Instructor fetch error:', instructorError);
		throw new Error('Failed to fetch instructor detail');
	}

	// スケジュール情報を取得
	const { data: schedulesData, error: schedulesError } = await supabase
		.from('mst_consultation_schedule')
		.select('schedule_id, schedule_datetime, deleted_at')
		.eq('consultation_id', id)
		.is('deleted_at', null);

	if (schedulesError) {
		console.error('Schedules fetch error:', schedulesError);
		throw new Error('Failed to fetch schedules');
	}

	const data = {
		...validConsultation,
		instructor: instructorData,
		schedules: schedulesData || [],
	};

	// 型変換を安全に行う
	const consultation = {
		...data,
		instructor: data.instructor,
		schedules: data.schedules,
	} as ConsultationDetail;

	return consultation;
}

export async function submitConsultationApplication(
	consultationId: string,
	data: {
		isUrgent: boolean;
		isFirstConsultation: boolean;
		remarks: string;
		selectedDates: string[];
		questionAnswers?: { question_id: string; answer: Json }[];
	},
) {
	const supabase = createClient();

	// 現在のユーザー情報を取得
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();

	if (userError || !user) {
		throw new Error('ユーザーが認証されていません。');
	}

	// 申込情報の作成
	const { data: application, error: applicationError } = await supabase
		.from('trn_consultation_application')
		.insert({
			consultation_id: consultationId,
			user_id: user.id,
			is_urgent: data.isUrgent,
			is_first_consultation: data.isFirstConsultation,
			notes: data.remarks,
			selection_status: 'pending',
		})
		.select()
		.single();

	if (applicationError) {
		console.error('Failed to create application:', applicationError);
		if (applicationError.code === '23505') {
			throw new Error('既に申し込み済みです。');
		}
		if (applicationError.code === '23503') {
			throw new Error('無効な相談IDです。');
		}
		throw new Error('申し込みの送信に失敗しました。もう一度お試しください。');
	}

	// 希望日程の登録
	const scheduleCandidates = data.selectedDates.map((scheduleId, index) => ({
		application_id: application.application_id,
		candidate_id: scheduleId,
		priority: index + 1,
	}));

	const { error: scheduleError } = await supabase
		.from('trn_consultation_schedule_candidate')
		.insert(scheduleCandidates);

	if (scheduleError) {
		console.error('Failed to create schedule candidates:', scheduleError);
		if (scheduleError.code === '23505') {
			throw new Error(
				'選択された日程は既に予約されています。別の日程を選択してください。',
			);
		}
		throw new Error('日程の登録に失敗しました。もう一度お試しください。');
	}

	// 質問回答の保存
	if (data.questionAnswers && data.questionAnswers.length > 0) {
		try {
			await saveConsultationQuestionAnswers(
				application.application_id,
				data.questionAnswers,
			);
		} catch (err) {
			console.error('Failed to save question answers:', err);
			// 質問回答の保存に失敗しても申し込み自体は成功させる
		}
	}

	// 個別相談の情報を取得して通知を作成
	try {
		const { data: consultation, error: consultationError } = await supabase
			.from('mst_consultation')
			.select('title')
			.eq('consultation_id', consultationId)
			.single();

		if (!consultationError && consultation) {
			// 通知を作成
			await fetch('/api/notifications/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: user.id,
					eventId: consultationId,
					eventName: consultation.title,
					notificationType: 'consultation_application',
				}),
			});
		}
	} catch (err) {
		console.error('通知の作成に失敗しました:', err);
		// 通知の作成に失敗しても申し込み自体は成功させる
	}

	return application;
}

// 個別相談の更新機能
export async function updateConsultationApplication(
	consultationId: string,
	data: {
		isUrgent: boolean;
		isFirstConsultation: boolean;
		remarks: string;
		selectedDates: string[];
		questionAnswers?: { question_id: string; answer: Json }[];
	},
) {
	const supabase = createClient();

	// 現在のユーザー情報を取得
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();

	if (userError || !user) {
		throw new Error('ユーザーが認証されていません。');
	}

	// 既存の申込情報を取得
	const { data: application, error: fetchError } = await supabase
		.from('trn_consultation_application')
		.select('application_id')
		.eq('consultation_id', consultationId)
		.eq('user_id', user.id)
		.is('deleted_at', null)
		.single();

	if (fetchError || !application) {
		throw new Error('申込情報が見つかりません。');
	}

	// 申込情報を更新
	const { error: updateError } = await supabase
		.from('trn_consultation_application')
		.update({
			is_urgent: data.isUrgent,
			is_first_consultation: data.isFirstConsultation,
			notes: data.remarks,
			updated_at: new Date().toISOString(),
		})
		.eq('application_id', application.application_id);

	if (updateError) {
		console.error('Failed to update application:', updateError);
		throw new Error(
			'申し込み情報の更新に失敗しました。もう一度お試しください。',
		);
	}

	// 既存の日程候補を削除
	const { error: deleteScheduleError } = await supabase
		.from('trn_consultation_schedule_candidate')
		.delete()
		.eq('application_id', application.application_id);

	if (deleteScheduleError) {
		console.error(
			'Failed to delete existing schedule candidates:',
			deleteScheduleError,
		);
		throw new Error('既存の日程候補の削除に失敗しました。');
	}

	// 新しい希望日程を登録
	if (data.selectedDates.length > 0) {
		const scheduleCandidates = data.selectedDates.map((scheduleId, index) => ({
			application_id: application.application_id,
			candidate_id: scheduleId,
			priority: index + 1,
		}));

		const { error: scheduleError } = await supabase
			.from('trn_consultation_schedule_candidate')
			.insert(scheduleCandidates);

		if (scheduleError) {
			console.error('Failed to create schedule candidates:', scheduleError);
			throw new Error('日程の登録に失敗しました。もう一度お試しください。');
		}
	}

	// 質問回答の更新（常に実行して既存の回答を更新）
	try {
		await saveConsultationQuestionAnswers(
			application.application_id,
			data.questionAnswers || [],
		);
	} catch (err) {
		console.error('Failed to save question answers:', err);
		// 質問回答の保存に失敗した場合はエラーを投げる
		throw new Error(
			`質問回答の保存に失敗しました: ${err instanceof Error ? err.message : 'Unknown error'}`,
		);
	}

	return { success: true };
}

// 個別相談のキャンセル機能
export async function cancelConsultationApplication(consultationId: string) {
	const supabase = createClient();

	// 現在のユーザー情報を取得
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();

	if (userError || !user) {
		throw new Error('ユーザーが認証されていません。');
	}

	// 申込情報を取得
	const { data: application, error: fetchError } = await supabase
		.from('trn_consultation_application')
		.select('application_id')
		.eq('consultation_id', consultationId)
		.eq('user_id', user.id)
		.is('deleted_at', null)
		.single();

	if (fetchError || !application) {
		throw new Error('申込情報が見つかりません。');
	}

	// 申込情報を論理削除
	const { error: deleteError } = await supabase
		.from('trn_consultation_application')
		.update({ deleted_at: new Date().toISOString() })
		.eq('application_id', application.application_id);

	if (deleteError) {
		console.error('Failed to cancel application:', deleteError);
		throw new Error('キャンセルに失敗しました。もう一度お試しください。');
	}

	// 関連する日程候補も削除
	const { error: scheduleError } = await supabase
		.from('trn_consultation_schedule_candidate')
		.delete()
		.eq('application_id', application.application_id);

	if (scheduleError) {
		console.error('Failed to delete schedule candidates:', scheduleError);
		// 日程候補の削除に失敗しても申込自体はキャンセルされているので、エラーは投げない
	}

	return { success: true };
}

// 申し込み詳細情報を取得する関数
export async function getConsultationApplicationDetail(
	consultationId: string,
): Promise<ConsultationApplicationDetail | null> {
	const supabase = createClient();

	// 現在のユーザー情報を取得
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();

	if (userError || !user) {
		console.error('User not authenticated');
		return null;
	}

	// 申し込み情報を取得
	const { data: application, error: applicationError } = await supabase
		.from('trn_consultation_application')
		.select(`
      application_id,
      consultation_id,
      user_id,
      is_urgent,
      is_first_consultation,
      notes,
      selection_status,
      selected_candidate_id,
      created_at,
      updated_at
    `)
		.eq('consultation_id', consultationId)
		.eq('user_id', user.id)
		.is('deleted_at', null)
		.single();

	if (applicationError || !application) {
		console.error('Failed to fetch application:', applicationError);
		return null;
	}

	// 希望日程を取得
	const { data: candidateSchedules, error: scheduleError } = await supabase
		.from('trn_consultation_schedule_candidate')
		.select('candidate_id, priority')
		.eq('application_id', application.application_id)
		.is('deleted_at', null)
		.order('priority', { ascending: true });

	if (scheduleError) {
		console.error('Failed to fetch schedules:', scheduleError);
		return {
			...application,
			schedules: [],
			selectedSchedule: null,
		};
	}

	// 候補日程がある場合、詳細情報を取得
	let schedules: Array<{
		schedule_id: string;
		schedule_datetime: string;
		priority: number;
	}> = [];
	if (candidateSchedules && candidateSchedules.length > 0) {
		const scheduleIds = candidateSchedules.map((c) => c.candidate_id);

		const { data: scheduleDetails, error: detailError } = await supabase
			.from('mst_consultation_schedule')
			.select('schedule_id, schedule_datetime')
			.in('schedule_id', scheduleIds)
			.is('deleted_at', null);

		if (!detailError && scheduleDetails) {
			// priorityと詳細情報をマージ
			schedules = candidateSchedules
				.map((candidate) => {
					const detail = scheduleDetails.find(
						(d) => d.schedule_id === candidate.candidate_id,
					);
					return {
						schedule_id: candidate.candidate_id,
						schedule_datetime: detail?.schedule_datetime || '',
						priority: candidate.priority,
					};
				})
				.filter((s) => s.schedule_datetime); // schedule_datetimeがあるもののみ
		}
	}

	// 確定した日程を取得
	let selectedSchedule = null;
	if (application.selected_candidate_id) {
		// まず通常のスケジュールから探す
		selectedSchedule = schedules.find(
			(s) => s.schedule_id === application.selected_candidate_id,
		);

		// 見つからない場合、候補リストから直接作成
		if (!selectedSchedule && candidateSchedules) {
			const candidate = candidateSchedules.find(
				(c) => c.candidate_id === application.selected_candidate_id,
			);
			if (candidate) {
				selectedSchedule = {
					schedule_id: candidate.candidate_id,
					schedule_datetime: '削除されたスケジュール',
					priority: candidate.priority,
				};
			}
		}
	}

	console.log('Application detail with schedules:', {
		application_id: application.application_id,
		schedules: schedules,
		selectedSchedule: selectedSchedule,
	});

	return {
		...application,
		schedules: schedules,
		selectedSchedule: selectedSchedule || null,
	};
}

// 講師一覧を取得する関数
export async function getInstructors() {
	const supabase = createClient();

	// まず講師グループのIDを取得
	const { data: groupData, error: groupError } = await supabase
		.from('mst_group')
		.select('group_id')
		.eq('title', '講師')
		.is('deleted_at', null);

	if (groupError || !groupData || groupData.length === 0) {
		console.error('Failed to fetch instructor group:', groupError);
		throw new Error('講師グループの取得に失敗しました');
	}

	const instructorGroupId = groupData[0].group_id;

	// 講師グループに所属するユーザーを取得
	const { data, error } = await supabase
		.from('trn_group_user')
		.select(`
      user:mst_user!user_id (
        user_id,
        username,
        email,
        icon,
        bio
      )
    `)
		.eq('group_id', instructorGroupId)
		.is('deleted_at', null);

	if (error) {
		console.error('Supabase error:', error);
		throw new Error('講師一覧の取得に失敗しました');
	}

	// ユーザー情報を抽出
	const instructors = data.map((item) =>
		Array.isArray(item.user) ? item.user[0] : item.user,
	);

	return instructors || [];
}

// 相談質問関連の型定義
export type ConsultationQuestion = {
	question_id: string;
	consultation_id: string;
	title: string;
	question_type: 'text' | 'boolean' | 'select' | 'multiple_select';
	options?: string[] | null;
	is_required: boolean;
	display_order: number;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
};

export type ConsultationQuestionAnswer = {
	answer_id: string;
	question_id: string;
	application_id: string;
	answer: Json; // JSONBフィールド(任意の形式の回答)
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
};

// 相談質問を取得する関数
export async function getConsultationQuestions(
	consultationId: string,
): Promise<ConsultationQuestion[]> {
	const supabase = createClient();

	const { data, error } = await supabase
		.from('trn_consultation_question')
		.select('*')
		.eq('consultation_id', consultationId)
		.is('deleted_at', null)
		.order('display_order', { ascending: true });

	if (error) {
		console.error('Failed to fetch consultation questions:', error);
		throw new Error('相談質問の取得に失敗しました');
	}

	return (data as ConsultationQuestion[]) || [];
}

// 質問回答を保存する関数
export async function saveConsultationQuestionAnswers(
	applicationId: string,
	answers: { question_id: string; answer: Json }[],
) {
	const supabase = createClient();

	console.log('saveConsultationQuestionAnswers called with:', {
		applicationId,
		answers,
	});

	// 既存の回答を削除（論理削除）
	const { error: deleteError } = await supabase
		.from('trn_consultation_question_answer')
		.update({ deleted_at: new Date().toISOString() })
		.eq('application_id', applicationId);

	if (deleteError) {
		console.error('Failed to delete existing answers:', deleteError);
		throw new Error('既存の回答の削除に失敗しました');
	}

	console.log('Existing answers deleted successfully');

	// 新しい回答を保存（回答がある場合のみ）
	if (answers.length > 0) {
		const answersToInsert = answers.map((answer) => ({
			question_id: answer.question_id,
			application_id: applicationId,
			answer: answer.answer,
		}));

		console.log('Inserting new answers:', answersToInsert);

		const { error: insertError } = await supabase
			.from('trn_consultation_question_answer')
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

// 質問回答を取得する関数
export async function getConsultationQuestionAnswers(
	applicationId: string,
): Promise<ConsultationQuestionAnswer[]> {
	const supabase = createClient();

	const { data, error } = await supabase
		.from('trn_consultation_question_answer')
		.select('*')
		.eq('application_id', applicationId)
		.is('deleted_at', null);

	if (error) {
		console.error('Failed to fetch consultation question answers:', error);
		return [];
	}

	return (data as ConsultationQuestionAnswer[]) || [];
}
