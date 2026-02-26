import type {
  DbAnswer,
  DbQuestion,
} from '@/components/questionlist/QuestionTypes';
import { createClient as createBrowserClient } from '@/lib/supabase/client';

// サーバーサイドでの質問リスト取得 (SEO や初期ロード向け)
export async function getQuestionsServer() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/questions`,
      {
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      throw new Error('Failed to fetch questions');
    }

    const { data } = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching questions:', error);
    return [];
  }
}

// クライアントサイドでの質問リスト取得 (ユーザーインタラクション向け)
export async function getQuestionsClient() {
  try {
    const supabase = createBrowserClient();

    const { data, error } = await supabase
      .from('trn_question')
      .select(`
        *,
        user:mst_user!trn_question_user_id_fkey (
          user_id,
          username
        ),
        instructor:mst_user!trn_question_instructor_id_fkey (
          user_id,
          username
        ),
        answer:trn_answer (
          *,
          instructor:mst_user!trn_answer_instructor_id_fkey (
            user_id,
            username
          )
        )
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching questions:', error);
      return [];
    }

    if (!data) {
      return [];
    }

    // データを整形
    return data.map((item) => {
      const question: DbQuestion = {
        question_id: item.question_id,
        user_id: item.user_id,
        instructor_id: item.instructor_id,
        content: item.content,
        is_anonymous: item.is_anonymous ?? false,
        is_hidden: item.is_hidden ?? false,
        status: item.status as 'pending' | 'answered',
        created_at: item.created_at ?? new Date().toISOString(),
        updated_at: item.updated_at ?? new Date().toISOString(),
        deleted_at: item.deleted_at,
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
              deleted_at: item.answer[0].deleted_at,
              instructor_name: item.answer[0].instructor?.username ?? undefined,
            }
          : null,
      };
      return question;
    });
  } catch (error) {
    console.error('Error in getQuestionsClient:', error);
    return [];
  }
}

// API経由で質問を取得する
export async function getQuestionsFromApi(params?: {
  instructor_id?: string;
  is_answered?: boolean;
  is_hidden?: boolean;
}) {
  const searchParams = new URLSearchParams();

  if (params?.instructor_id) {
    searchParams.append('instructor_id', params.instructor_id);
  }

  if (params?.is_answered !== undefined) {
    searchParams.append('is_answered', params.is_answered.toString());
  }

  if (params?.is_hidden !== undefined) {
    searchParams.append('is_hidden', params.is_hidden.toString());
  }

  const queryString = searchParams.toString()
    ? `?${searchParams.toString()}`
    : '';
  const response = await fetch(`/api/questions${queryString}`);

  if (!response.ok) {
    throw new Error('Failed to fetch questions');
  }

  const { data } = await response.json();
  return data as DbQuestion[];
}

// 単一質問の詳細を取得する
export async function getQuestionById(questionId: string) {
  try {
    const supabase = createBrowserClient();

    const { data, error } = await supabase
      .from('trn_question')
      .select(`
        *,
        user:mst_user!trn_question_user_id_fkey (
          user_id,
          username
        ),
        instructor:mst_user!trn_question_instructor_id_fkey (
          user_id,
          username
        ),
        answer:trn_answer (
          *,
          instructor:mst_user!trn_answer_instructor_id_fkey (
            user_id,
            username
          )
        )
      `)
      .eq('question_id', questionId)
      .is('deleted_at', null)
      .single();

    if (error) {
      console.error('Error fetching question:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    // データを整形
    const question: DbQuestion = {
      question_id: data.question_id,
      user_id: data.user_id,
      instructor_id: data.instructor_id,
      content: data.content,
      is_anonymous: data.is_anonymous ?? false,
      is_hidden: data.is_hidden ?? false,
      status: data.status as 'pending' | 'answered',
      created_at: data.created_at ?? new Date().toISOString(),
      updated_at: data.updated_at ?? new Date().toISOString(),
      deleted_at: data.deleted_at,
      user_name: data.user?.username ?? undefined,
      instructor_name: data.instructor?.username ?? undefined,
      answer: data.answer?.[0]
        ? {
            answer_id: data.answer[0].answer_id,
            question_id: data.answer[0].question_id,
            instructor_id: data.answer[0].instructor_id,
            content: data.answer[0].content,
            is_draft: data.answer[0].is_draft ?? false,
            created_at: data.answer[0].created_at ?? new Date().toISOString(),
            updated_at: data.answer[0].updated_at ?? new Date().toISOString(),
            deleted_at: data.answer[0].deleted_at,
            instructor_name: data.answer[0].instructor?.username ?? undefined,
          }
        : null,
    };

    return question;
  } catch (error) {
    console.error('Error in getQuestionById:', error);
    return null;
  }
}

// 質問の表示/非表示を切り替える (Supabase直接)
export async function toggleQuestionVisibility(
  questionId: string,
  isHidden: boolean,
) {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from('trn_question')
    .update({ is_hidden: isHidden })
    .eq('question_id', questionId)
    .select();

  if (error) {
    console.error('Error updating question visibility:', error);
    return null;
  }

  return data[0];
}

// 質問の表示/非表示を切り替える (API経由)
export async function toggleQuestionVisibilityApi(
  questionId: string,
  isHidden: boolean,
) {
  const response = await fetch('/api/questions/visibility', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question_id: questionId,
      is_hidden: isHidden,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to update question visibility');
  }

  const { data } = await response.json();
  return data;
}

// 回答を保存する（下書き保存または公開）(Supabase直接)
export async function saveAnswer(answer: {
  question_id: string;
  instructor_id: string;
  content: string;
  is_draft: boolean;
}) {
  const supabase = createBrowserClient();

  // 既存の回答を確認
  const { data: existingAnswers } = await supabase
    .from('trn_answer')
    .select('*')
    .eq('question_id', answer.question_id)
    .is('deleted_at', null);

  let result: { id: string } | undefined;

  // 既存の回答がある場合は更新、なければ新規作成
  if (existingAnswers && existingAnswers.length > 0) {
    const { data, error } = await supabase
      .from('trn_answer')
      .update({
        content: answer.content,
        is_draft: answer.is_draft,
        updated_at: new Date().toISOString(),
      })
      .eq('answer_id', existingAnswers[0].answer_id)
      .select();

    if (error) {
      console.error('Error updating answer:', error);
      return null;
    }

    result = {
      ...data[0],
      id: data[0].answer_id,
    };
  } else {
    const { data, error } = await supabase
      .from('trn_answer')
      .insert([answer])
      .select();

    if (error) {
      console.error('Error creating answer:', error);
      return null;
    }

    result = {
      ...data[0],
      id: data[0].answer_id,
    };
  }

  // 回答が公開されたら、質問のステータスを更新
  if (!answer.is_draft) {
    await supabase
      .from('trn_question')
      .update({ status: 'answered' })
      .eq('question_id', answer.question_id);
  } else {
    // 下書き保存の場合、質問の現在のステータスを確認
    const { data: questionData } = await supabase
      .from('trn_question')
      .select('status')
      .eq('question_id', answer.question_id)
      .is('deleted_at', null)
      .single();

    // 回答済み状態だった場合、pendingに戻す
    if (questionData && questionData.status === 'answered') {
      await supabase
        .from('trn_question')
        .update({ status: 'pending' })
        .eq('question_id', answer.question_id);
    }
  }

  return result;
}

// 回答を保存する（API経由）
export async function saveAnswerApi(answer: {
  question_id: string;
  instructor_id: string;
  content: string;
  is_draft: boolean;
}) {
  const response = await fetch('/api/questions/answers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(answer),
  });

  if (!response.ok) {
    throw new Error('Failed to save answer');
  }

  const { data } = await response.json();
  return data;
}

// 質問の回答を取得する（API経由）
export async function getAnswerForQuestion(questionId: string) {
  const response = await fetch(
    `/api/questions/answers?question_id=${questionId}`,
  );

  if (!response.ok) {
    throw new Error('Failed to fetch answer');
  }

  const { data } = await response.json();
  return data as DbAnswer[];
}
