'use server';

import { createClient } from '@/lib/supabase/server';

export type QuestionManual = {
  question_manual_id: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

// 質問マニュアル取得（1レコードのみ想定）
export async function getQuestionManual(): Promise<QuestionManual | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('mst_question_manual')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (error) {
      // データが存在しない場合はnullを返す
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching question manual:', error);
      return null;
    }

    return data as QuestionManual;
  } catch (error) {
    console.error('Error in getQuestionManual:', error);
    return null;
  }
}

// 質問マニュアル保存（作成または更新）
export async function saveQuestionManual(
  description: string,
  existingId?: string,
): Promise<QuestionManual | null> {
  try {
    const supabase = await createClient();

    if (existingId) {
      // 更新
      const { data, error } = await supabase
        .from('mst_question_manual')
        .update({
          description,
          updated_at: new Date().toISOString(),
        })
        .eq('question_manual_id', existingId)
        .select()
        .single();

      if (error) {
        console.error('Error updating question manual:', error);
        throw error;
      }

      return data as QuestionManual;
    }

    // 新規作成
    const { data, error } = await supabase
      .from('mst_question_manual')
      .insert({
        description,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating question manual:', error);
      throw error;
    }

    return data as QuestionManual;
  } catch (error) {
    console.error('Error in saveQuestionManual:', error);
    throw error;
  }
}
