import type { DbAnswer } from '@/components/questionlist/QuestionTypes';
import { escapeHtml, htmlToSummary } from '@/lib/htmlToText';
import { sendEmail } from '@/lib/sendgrid';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * ユーザーの通知設定を確認する
 * サービスロールクライアントを使用してRLSをバイパスする
 * @param userId 通知先ユーザーID
 * @param notificationType 通知タイプ
 * @returns 通知が有効かどうか（デフォルトはfalse）
 */
async function isNotificationEnabledForUser(
  userId: string,
  notificationType: 'question_answered' | 'question_answer_edited',
): Promise<boolean> {
  const serviceClient = createServiceRoleClient();
  const { data, error } = await serviceClient
    .from('mst_notification_settings')
    .select('is_enabled')
    .eq('user_id', userId)
    .eq('notification_type', notificationType)
    .is('deleted_at', null)
    .single();

  if (error) {
    // レコードが存在しない場合（PGRST116）はデフォルトでOFF
    if (error.code === 'PGRST116') {
      return false;
    }
    console.error('通知設定の確認に失敗:', error);
    return false; // エラー時もデフォルトでOFF
  }

  return data?.is_enabled ?? false;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const { question_id, instructor_id, content, is_draft } = body;

    if (!question_id || !instructor_id || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // 既存の回答を確認
    const { data: existingAnswers } = await supabase
      .from('trn_answer')
      .select('*')
      .eq('question_id', question_id)
      .is('deleted_at', null);

    let result: { id: string } | undefined;
    const isUpdate = existingAnswers && existingAnswers.length > 0;

    // 既存回答があっても、今まで下書きのみで今回初めて公開する場合は新規回答として扱う
    const wasOnlyDraft =
      existingAnswers &&
      existingAnswers.length > 0 &&
      existingAnswers[0].is_draft === true;
    const isFirstPublication = wasOnlyDraft && !is_draft;

    // 既存の回答がある場合は更新、なければ新規作成
    if (isUpdate) {
      const { data, error } = await supabase
        .from('trn_answer')
        .update({
          content,
          is_draft,
          updated_at: new Date().toISOString(),
        })
        .eq('answer_id', existingAnswers[0].answer_id)
        .select();

      if (error) {
        console.error('Error updating answer:', error);
        return NextResponse.json(
          { error: 'Failed to update answer' },
          { status: 500 },
        );
      }

      result = {
        ...data[0],
        id: data[0].answer_id,
      };
    } else {
      const { data, error } = await supabase
        .from('trn_answer')
        .insert([
          {
            question_id,
            instructor_id,
            content,
            is_draft,
          },
        ])
        .select();

      if (error) {
        console.error('Error creating answer:', error);
        return NextResponse.json(
          { error: 'Failed to create answer' },
          { status: 500 },
        );
      }

      result = {
        ...data[0],
        id: data[0].answer_id,
      };
    }

    // 回答が公開されたら、質問のステータスを更新
    if (!is_draft) {
      await supabase
        .from('trn_question')
        .update({ status: 'answered' })
        .eq('question_id', question_id);

      // 通知機能実装: 質問者への通知を作成
      const { data: questionRow, error: questionError } = await supabase
        .from('trn_question')
        .select('user_id, content')
        .eq('question_id', question_id)
        .single();
      if (questionError) {
        console.error(
          'Error fetching question for notification:',
          questionError,
        );
      } else if (questionRow?.user_id) {
        // 新規回答または下書きから初回公開の場合のみ「質問への回答」通知を作成
        if (!isUpdate || isFirstPublication) {
          // ユーザーの通知設定を確認
          const isNotificationEnabled = await isNotificationEnabledForUser(
            questionRow.user_id,
            'question_answered',
          );

          if (isNotificationEnabled) {
            const notificationTitle = '質問への回答';
            const questionSummary = htmlToSummary(questionRow.content);
            const notificationContent = `あなたの質問「${questionSummary}」に回答が投稿されました。`;
            const { data: notifMaster, error: notifMasterError } =
              await supabase
                .from('mst_notification')
                .insert([
                  {
                    title: notificationTitle,
                    content: notificationContent,
                    notification_type: 'question_answered',
                    related_url: `/questions/${question_id}`,
                  },
                ])
                .select();
            if (notifMasterError) {
              console.error(
                'Error creating master notification:',
                notifMasterError,
              );
            } else if (notifMaster?.[0]?.notification_id) {
              const masterNotifId = notifMaster[0].notification_id;
              const { error: userNotifError } = await supabase
                .from('trn_user_notification')
                .insert([
                  {
                    user_id: questionRow.user_id,
                    notification_id: masterNotifId,
                  },
                ]);
              if (userNotifError) {
                console.error(
                  'Error creating user notification:',
                  userNotifError,
                );
              }
            }

            // メール送信
            try {
              const { data: userRow } = await supabase
                .from('mst_user')
                .select('email')
                .eq('user_id', questionRow.user_id)
                .single();
              if (userRow?.email) {
                const frontUrl = process.env.NEXT_PUBLIC_FRONT_URL;
                const questionUrl = `${frontUrl}/questions/${question_id}`;
                const safeQuestionSummary = escapeHtml(questionSummary);
                const htmlNotificationContent = `あなたの質問「${safeQuestionSummary}」に回答が投稿されました。`;
                await sendEmail({
                  to: userRow.email,
                  subject: notificationTitle,
                  text: `${notificationContent}\n\n${questionUrl}`,
                  html: `<p>${htmlNotificationContent}</p><p><a href="${questionUrl}">質問を確認する</a></p>`,
                });
              }
            } catch (mailError) {
              console.error('Failed to send email:', mailError);
            }
          } else {
            console.log(
              '質問への回答通知はユーザー設定によりスキップ:',
              questionRow.user_id,
            );
          }
        }
        // 既に公開済みの回答を編集する場合のみ「質問への回答の編集」通知を作成
        else if (isUpdate && !isFirstPublication) {
          // ユーザーの通知設定を確認
          const isNotificationEnabled = await isNotificationEnabledForUser(
            questionRow.user_id,
            'question_answer_edited',
          );

          if (isNotificationEnabled) {
            const notificationTitle = '質問への回答の編集';
            const questionSummary = htmlToSummary(questionRow.content);
            const notificationContent = `あなたの質問「${questionSummary}」への回答が編集されました。`;
            const { data: notifMaster, error: notifMasterError } =
              await supabase
                .from('mst_notification')
                .insert([
                  {
                    title: notificationTitle,
                    content: notificationContent,
                    notification_type: 'question_answer_edited',
                    related_url: `/questions/${question_id}`,
                  },
                ])
                .select();
            if (notifMasterError) {
              console.error(
                'Error creating master notification:',
                notifMasterError,
              );
            } else if (notifMaster?.[0]?.notification_id) {
              const masterNotifId = notifMaster[0].notification_id;
              const { error: userNotifError } = await supabase
                .from('trn_user_notification')
                .insert([
                  {
                    user_id: questionRow.user_id,
                    notification_id: masterNotifId,
                  },
                ]);
              if (userNotifError) {
                console.error(
                  'Error creating user notification:',
                  userNotifError,
                );
              }
            }

            // メール送信
            try {
              const { data: userRow } = await supabase
                .from('mst_user')
                .select('email')
                .eq('user_id', questionRow.user_id)
                .single();
              if (userRow?.email) {
                const frontUrl = process.env.NEXT_PUBLIC_FRONT_URL;
                const questionUrl = `${frontUrl}/questions/${question_id}`;
                const safeQuestionSummary = escapeHtml(questionSummary);
                const htmlNotificationContent = `あなたの質問「${safeQuestionSummary}」への回答が編集されました。`;
                await sendEmail({
                  to: userRow.email,
                  subject: notificationTitle,
                  text: `${notificationContent}\n\n${questionUrl}`,
                  html: `<p>${htmlNotificationContent}</p><p><a href="${questionUrl}">質問を確認する</a></p>`,
                });
              }
            } catch (mailError) {
              console.error('Failed to send email:', mailError);
            }
          } else {
            console.log(
              '質問への回答の編集通知はユーザー設定によりスキップ:',
              questionRow.user_id,
            );
          }
        }
      }
    } else {
      // 下書き保存の場合、質問の現在のステータスを確認
      const { data: questionData } = await supabase
        .from('trn_question')
        .select('status')
        .eq('question_id', question_id)
        .is('deleted_at', null)
        .single();

      // 回答済み状態だった場合、pendingに戻す
      if (questionData && questionData.status === 'answered') {
        await supabase
          .from('trn_question')
          .update({ status: 'pending' })
          .eq('question_id', question_id);
      }
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // クエリパラメータの取得
    const searchParams = request.nextUrl.searchParams;
    const questionId = searchParams.get('question_id');

    if (!questionId) {
      return NextResponse.json(
        { error: 'Missing question_id parameter' },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('trn_answer')
      .select(`
        *,
        instructor:instructor_id(user_id, username)
      `)
      .eq('question_id', questionId)
      .is('deleted_at', null);

    if (error) {
      console.error('Error fetching answer:', error);
      return NextResponse.json(
        { error: 'Failed to fetch answer' },
        { status: 500 },
      );
    }

    // データを整形
    const formattedData = data.map((item) => {
      const answer: DbAnswer = {
        answer_id: item.answer_id,
        question_id: item.question_id,
        instructor_id: item.instructor_id,
        content: item.content,
        is_draft: item.is_draft ?? false,
        created_at: item.created_at ?? new Date().toISOString(),
        updated_at: item.updated_at ?? new Date().toISOString(),
        deleted_at: item.deleted_at,
        instructor_name: item.instructor?.username ?? undefined,
      };
      return {
        ...answer,
        id: item.answer_id, // answer_idをidとして使用
      };
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
