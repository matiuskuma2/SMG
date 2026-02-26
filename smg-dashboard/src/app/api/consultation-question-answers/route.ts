import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('application_id');

    if (!applicationId) {
      return NextResponse.json(
        { error: 'application_id is required' },
        { status: 400 },
      );
    }

    console.log('API called with application_id:', applicationId);

    // まずapplication_idが存在するかを確認
    const { data: applicationCheck, error: appError } = await supabase
      .from('trn_consultation_application')
      .select('application_id, consultation_id')
      .eq('application_id', applicationId);

    console.log('Application check result:', { applicationCheck, appError });

    // 該当するconsultation_idに質問があるかチェック
    if (applicationCheck && applicationCheck.length > 0) {
      const consultationId = applicationCheck[0].consultation_id;
      const { data: questionsCheck, error: questionsError } = await supabase
        .from('trn_consultation_question')
        .select('question_id, title')
        .eq('consultation_id', consultationId)
        .is('deleted_at', null);

      console.log('Questions check result:', {
        consultationId,
        questionsCheck,
        questionsError,
        questionsCount: questionsCheck?.length || 0,
      });
    }

    if (!applicationId) {
      return NextResponse.json(
        { error: 'application_idが指定されていません' },
        { status: 400 },
      );
    }

    // 回答テーブルに該当するapplication_idのデータがあるかチェック
    const { data: directAnswerCheck, error: directAnswerError } = await supabase
      .from('trn_consultation_question_answer')
      .select('answer_id, question_id, application_id, answer')
      .eq('application_id', applicationId)
      .is('deleted_at', null);

    console.log('Direct answer check result:', {
      directAnswerCheck,
      directAnswerError,
      directAnswerCount: directAnswerCheck?.length || 0,
    });

    // 回答データを取得（JOINは後で）
    console.log('=== CONSULTATION QUESTION ANSWERS DEBUG ===');
    console.log('Querying database for application_id:', applicationId);
    console.log('Application ID type:', typeof applicationId);
    const { data: answersOnly, error: answersError } = await supabase
      .from('trn_consultation_question_answer')
      .select('*')
      .eq('application_id', applicationId)
      .is('deleted_at', null);

    console.log('Answers only query result:', {
      answersOnly,
      answersError,
      answersCount: answersOnly?.length || 0,
      applicationIdUsed: applicationId,
    });

    if (answersError) {
      console.error('Answers query error:', answersError);
      return NextResponse.json(
        { error: `回答取得エラー: ${answersError.message}` },
        { status: 500 },
      );
    }

    const consultationId = applicationCheck?.[0]?.consultation_id;
    if (!consultationId) {
      return NextResponse.json({ answers: [] }, { status: 200 });
    }

    const { data: questions, error: questionsError } = await supabase
      .from('trn_consultation_question')
      .select(
        'question_id, title, question_type, options, is_required, display_order',
      )
      .eq('consultation_id', consultationId)
      .is('deleted_at', null)
      .order('display_order', { ascending: true });

    if (questionsError) {
      console.error('Questions query error:', questionsError);
      return NextResponse.json(
        { error: `質問取得エラー: ${questionsError.message}` },
        { status: 500 },
      );
    }

    const answerMap = new Map(
      (answersOnly || []).map((answer) => [answer.question_id, answer]),
    );

    const combinedAnswers = (questions || []).map((question) => {
      const answer = answerMap.get(question.question_id);
      return {
        answer_id: answer?.answer_id ?? null,
        question_id: question.question_id,
        application_id: applicationId,
        answer: answer?.answer ?? null,
        created_at: answer?.created_at ?? null,
        updated_at: answer?.updated_at ?? null,
        deleted_at: answer?.deleted_at ?? null,
        trn_consultation_question: question,
      };
    });

    console.log('Final answers with questions:', {
      combinedAnswers,
      answersCount: combinedAnswers?.length || 0,
      sampleAnswer: combinedAnswers?.[0]
        ? {
            answer_id: combinedAnswers[0].answer_id,
            answer: combinedAnswers[0].answer,
            answerType: typeof combinedAnswers[0].answer,
            question_title: combinedAnswers[0].trn_consultation_question?.title,
          }
        : null,
    });

    console.log('Database query result:', {
      combinedAnswers,

      answersCount: combinedAnswers?.length || 0,
      sampleAnswer: combinedAnswers?.[0]
        ? {
            answer_id: combinedAnswers[0].answer_id,
            answer: combinedAnswers[0].answer,
            answerType: typeof combinedAnswers[0].answer,
            question: combinedAnswers[0].trn_consultation_question,
          }
        : null,
    });

    return NextResponse.json({ answers: combinedAnswers }, { status: 200 });
  } catch (error) {
    console.error('予期せぬエラー:', error);
    return NextResponse.json(
      { error: '予期せぬエラーが発生しました' },
      { status: 500 },
    );
  }
}
