import { createClient } from '@/lib/supabase/server';
import type { TrnEventQuestion } from '@/lib/supabase/types';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const eventId = searchParams.get('event_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 },
      );
    }

    console.log('API called with user_id:', userId, 'event_id:', eventId);

    // まずuser_idが存在するかを確認
    const { data: userCheck, error: userError } = await supabase
      .from('mst_user')
      .select('user_id')
      .eq('user_id', userId);

    console.log('User check result:', { userCheck, userError });

    // 該当するevent_idに質問があるかチェック
    if (eventId && userCheck && userCheck.length > 0) {
      const { data: questionsCheck, error: questionsError } = await supabase
        .from('trn_event_question')
        .select('question_id, title')
        .eq('event_id', eventId)
        .is('deleted_at', null);

      console.log('Questions check result:', {
        eventId,
        questionsCheck,
        questionsError,
        questionsCount: questionsCheck?.length || 0,
      });
    }

    // 回答テーブルに該当するuser_idのデータがあるかチェック
    const { data: directAnswerCheck, error: directAnswerError } = await supabase
      .from('trn_event_question_answer')
      .select('answer_id, question_id, user_id, answer')
      .eq('user_id', userId)
      .is('deleted_at', null);

    console.log('Direct answer check result:', {
      directAnswerCheck,
      directAnswerError,
      directAnswerCount: directAnswerCheck?.length || 0,
    });

    // 回答データを取得
    console.log('=== EVENT QUESTION ANSWERS DEBUG ===');
    console.log('Querying database for user_id:', userId);
    console.log('User ID type:', typeof userId);

    let answersQuery = supabase
      .from('trn_event_question_answer')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null);

    // event_idが指定されている場合は、そのイベントの質問に関する回答のみを取得
    if (eventId) {
      // まず該当するevent_idの質問IDを取得
      const { data: eventQuestions, error: eventQuestionsError } =
        await supabase
          .from('trn_event_question')
          .select('question_id')
          .eq('event_id', eventId)
          .is('deleted_at', null);

      if (eventQuestionsError) {
        console.error('Event questions query error:', eventQuestionsError);
        return NextResponse.json(
          { error: `イベント質問取得エラー: ${eventQuestionsError.message}` },
          { status: 500 },
        );
      }

      const questionIds =
        eventQuestions?.map((q: { question_id: string }) => q.question_id) ||
        [];
      if (questionIds.length > 0) {
        answersQuery = answersQuery.in('question_id', questionIds);
      } else {
        // 該当するイベントに質問がない場合は空の結果を返す
        return NextResponse.json({ answers: [] }, { status: 200 });
      }
    }

    const { data: answersOnly, error: answersError } = await answersQuery;

    console.log('Answers only query result:', {
      answersOnly,
      answersError,
      answersCount: answersOnly?.length || 0,
      userIdUsed: userId,
    });

    if (answersError) {
      console.error('Answers query error:', answersError);
      return NextResponse.json(
        { error: `回答取得エラー: ${answersError.message}` },
        { status: 500 },
      );
    }

    if (!answersOnly || answersOnly.length === 0) {
      console.log('=== NO ANSWERS FOUND ===');
      console.log('No answers found for user_id:', userId);

      // データベースに該当テーブルにデータがあるかも確認
      const { data: allAnswers, error: allAnswersError } = await supabase
        .from('trn_event_question_answer')
        .select('user_id, answer_id, question_id')
        .limit(10);

      console.log('Sample data from trn_event_question_answer table:', {
        allAnswers,
        allAnswersError,
        totalSampleCount: allAnswers?.length || 0,
      });

      return NextResponse.json({ answers: [] }, { status: 200 });
    }

    // 各回答に対して質問情報を取得
    const answers = await Promise.all(
      answersOnly.map(async (answer) => {
        const { data: question, error: questionError } = await supabase
          .from('trn_event_question')
          .select(
            'question_id, title, question_type, options, is_required, display_order',
          )
          .eq('question_id', answer.question_id)
          .is('deleted_at', null)
          .single();

        if (questionError) {
          console.error(
            'Question query error for question_id:',
            answer.question_id,
            questionError,
          );
          return {
            ...answer,
            trn_event_question: null,
          };
        }

        return {
          ...answer,
          trn_event_question: question,
        };
      }),
    );

    // display_orderでソート
    const sortedAnswers = answers
      .filter((a) => a.trn_event_question !== null)
      .sort((a, b) => {
        const orderA = a.trn_event_question?.display_order || 0;
        const orderB = b.trn_event_question?.display_order || 0;
        return orderA - orderB;
      });

    console.log('Final answers with questions:', {
      sortedAnswers,
      answersCount: sortedAnswers?.length || 0,
      sampleAnswer: sortedAnswers?.[0]
        ? {
            answer_id: sortedAnswers[0].answer_id,
            answer: sortedAnswers[0].answer,
            answerType: typeof sortedAnswers[0].answer,
            question_title: sortedAnswers[0].trn_event_question?.title,
          }
        : null,
    });

    return NextResponse.json({ answers: sortedAnswers }, { status: 200 });
  } catch (error) {
    console.error('予期せぬエラー:', error);
    return NextResponse.json(
      { error: '予期せぬエラーが発生しました' },
      { status: 500 },
    );
  }
}
