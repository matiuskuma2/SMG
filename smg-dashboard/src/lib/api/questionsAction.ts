'use server';

import type {
  DbQuestion,
  FilterType,
  SortKey,
} from '@/components/questionlist/QuestionTypes';
import { createClient } from '@/lib/supabase/server';

export type GetQuestionsParams = {
  page?: number;
  itemsPerPage?: number;
  searchQuery?: string;
  sortBy?: SortKey;
  sortOrder?: 'asc' | 'desc';
  filterType?: FilterType;
  instructorId?: string;
  isAnsweredOnly?: boolean;
  isVisibleOnly?: boolean;
};

export type GetQuestionsResult = {
  questions: DbQuestion[];
  totalCount: number;
  instructors: { id: string; name: string }[];
};

export async function getQuestionsAction(
  params: GetQuestionsParams = {},
): Promise<GetQuestionsResult> {
  const {
    page = 1,
    itemsPerPage = 5,
    searchQuery = '',
    sortBy = 'questionDate',
    sortOrder = 'desc',
    filterType = 'public',
    instructorId = '',
    isAnsweredOnly = false,
    isVisibleOnly = false,
  } = params;

  const supabase = createClient();

  try {
    // ベースクエリの構築（必要なカラムのみ明示的に指定）
    let query = supabase
      .from('trn_question')
      .select(
        `
        question_id,
        user_id,
        instructor_id,
        content,
        is_anonymous,
        is_hidden,
        status,
        created_at,
        updated_at,
        user:mst_user!trn_question_user_id_fkey (
          username
        ),
        instructor:mst_user!trn_question_instructor_id_fkey (
          username
        ),
        answer:trn_answer (
          answer_id,
          question_id,
          instructor_id,
          content,
          is_draft,
          created_at,
          updated_at,
          instructor:mst_user!trn_answer_instructor_id_fkey (
            username
          )
        )
      `,
        { count: 'exact' },
      )
      .is('deleted_at', null);

    // フィルタリング条件を適用

    // 1. 匿名/公開フィルター
    if (filterType === 'public') {
      query = query.eq('is_anonymous', false);
    } else if (filterType === 'anonymous') {
      query = query.eq('is_anonymous', true);
    }

    // 2. 講師フィルター
    if (instructorId) {
      query = query.eq('instructor_id', instructorId);
    }

    // 3. 回答済みフィルター
    if (isAnsweredOnly) {
      query = query.eq('status', 'answered');
    }

    // 4. 表示中のみフィルター
    if (isVisibleOnly) {
      query = query.eq('is_hidden', false);
    }

    // 5. 検索クエリ
    if (searchQuery) {
      query = query.ilike('content', `%${searchQuery}%`);
    }

    // ソートの適用
    if (sortBy === 'questionDate') {
      query = query.order('created_at', { ascending: sortOrder === 'asc' });
    } else if (sortBy === 'answerDate') {
      // answerDateでのソートはSupabaseの制限で直接できないため、created_atでソート
      query = query.order('created_at', { ascending: sortOrder === 'asc' });
    }

    // ページネーションの適用
    const from = (page - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Failed to load questions:', error);
      throw error;
    }

    // データを整形（必要なフィールドのみ）
    let questions: DbQuestion[] = (data || []).map((item) => ({
      question_id: item.question_id,
      user_id: item.user_id,
      instructor_id: item.instructor_id,
      content: item.content,
      is_anonymous: item.is_anonymous ?? false,
      is_hidden: item.is_hidden ?? false,
      status: item.status as 'pending' | 'answered',
      created_at: item.created_at ?? new Date().toISOString(),
      updated_at: item.updated_at ?? new Date().toISOString(),
      deleted_at: null,
      user_name: item.user?.username ?? undefined,
      instructor_name: item.instructor?.username ?? undefined,
      answer: item.answer?.[0]
        ? {
            answer_id: item.answer[0].answer_id,
            question_id: item.answer[0].question_id,
            instructor_id: item.answer[0].instructor_id,
            content: item.answer[0].content,
            is_draft: item.answer[0].is_draft ?? false,
            created_at: item.answer[0].created_at ?? new Date().toISOString(),
            updated_at: item.answer[0].updated_at ?? new Date().toISOString(),
            deleted_at: null,
            instructor_name: item.answer[0].instructor?.username ?? undefined,
          }
        : null,
    }));

    // 回答済み＆非ドラフトのフィルタリング（isAnsweredOnly の場合）
    if (isAnsweredOnly) {
      questions = questions.filter((q) => q.answer && !q.answer.is_draft);
    }

    // 講師一覧を取得（「講師_質問受付グループ」に所属するユーザー）
    const { data: instructorGroup } = await supabase
      .from('mst_group')
      .select('group_id')
      .eq('title', '講師_質問受付グループ')
      .is('deleted_at', null)
      .single();

    const instructors: { id: string; name: string }[] = [];
    if (instructorGroup?.group_id) {
      const { data: instructorData } = await supabase
        .from('trn_group_user')
        .select(
          `
          user_id,
          mst_user!inner (
            user_id,
            username
          )
        `,
        )
        .eq('group_id', instructorGroup.group_id)
        .is('deleted_at', null)
        .is('mst_user.deleted_at', null);

      const uniqueUsers = Array.from(
        new Map(
          (instructorData || []).map((item) => [
            item.mst_user?.user_id,
            item.mst_user,
          ]),
        ).values(),
      ).filter((user) => user?.user_id && user.username !== null);

      for (const user of uniqueUsers) {
        instructors.push({
          id: user.user_id,
          name: user.username as string,
        });
      }
    }

    return {
      questions,
      totalCount: count ?? 0,
      instructors,
    };
  } catch (error) {
    console.error('Error in getQuestionsAction:', error);
    return {
      questions: [],
      totalCount: 0,
      instructors: [],
    };
  }
}
