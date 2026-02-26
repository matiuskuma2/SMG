import type { DbQuestion } from '@/components/questionlist/QuestionTypes';
import { sendEmail } from '@/lib/sendgrid';
import { createClient } from '@/lib/supabase/server';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // クエリパラメータの取得
    const searchParams = request.nextUrl.searchParams;
    const instructorId = searchParams.get('instructor_id');
    const isAnswered = searchParams.get('is_answered');
    const isHidden = searchParams.get('is_hidden');

    // 基本的なクエリを構築
    let query = supabase
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
      .is('deleted_at', null);

    // フィルタリング条件を追加
    if (instructorId) {
      query = query.eq('instructor_id', instructorId);
    }

    if (isAnswered === 'true') {
      query = query.eq('status', 'answered');
    } else if (isAnswered === 'false') {
      query = query.eq('status', 'pending');
    }

    if (isHidden === 'true') {
      query = query.eq('is_hidden', true);
    } else if (isHidden === 'false') {
      query = query.eq('is_hidden', false);
    }

    // データを取得
    const { data, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      console.error('Error fetching questions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch questions' },
        { status: 500 },
      );
    }

    // データを整形
    const formattedData = data.map((item) => {
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

    return NextResponse.json({ data: formattedData });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const { content, user_id, instructor_id, is_anonymous } = body;

    if (!content || !user_id || !instructor_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // 新しい質問を作成
    const { data, error } = await supabase
      .from('trn_question')
      .insert([
        {
          content,
          user_id,
          instructor_id,
          is_anonymous: is_anonymous || false,
          status: 'pending',
        },
      ])
      .select();

    if (error) {
      console.error('Error creating question:', error);
      return NextResponse.json(
        { error: 'Failed to create question' },
        { status: 500 },
      );
    }

    const newQuestion = data[0];

    // 通知作成（質問を受け取る講師向け）
    try {
      const notificationTitle = '新しい質問';
      const notificationContent = `新しい質問が投稿されました: 「${content}」`;

      const { data: notifMaster, error: notifMasterError } = await supabase
        .from('mst_notification')
        .insert([
          {
            title: notificationTitle,
            content: notificationContent,
            notification_type: 'question_posted',
            related_url: `/questions/${newQuestion.question_id}`,
          },
        ])
        .select();

      if (!notifMasterError && notifMaster?.[0]?.notification_id) {
        await supabase.from('trn_user_notification').insert([
          {
            user_id: instructor_id,
            notification_id: notifMaster[0].notification_id,
          },
        ]);
      }

      // メール送信
      const { data: instructorRow } = await supabase
        .from('mst_user')
        .select('email')
        .eq('user_id', instructor_id)
        .single();

      if (instructorRow?.email) {
        const frontUrl = process.env.NEXT_PUBLIC_FRONT_URL;
        const questionUrl = `${frontUrl}/questions/${newQuestion.question_id}`;
        await sendEmail({
          to: instructorRow.email,
          subject: notificationTitle,
          text: `${notificationContent}\n\n${questionUrl}`,
          html: `<p>${notificationContent}</p><p><a href="${questionUrl}">質問を確認する</a></p>`,
        });
      }
    } catch (notifyError) {
      console.error(
        'Failed to create notification or send email:',
        notifyError,
      );
    }

    return NextResponse.json({ data: newQuestion });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
