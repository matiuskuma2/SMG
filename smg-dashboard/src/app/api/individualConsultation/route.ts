import { createClient } from '@/lib/supabase/server';
import type { ConsultationQuestionFormType } from '@/types/individualConsultation';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const body = await request.json();

    console.log('受信したデータ:', body);

    const {
      title,
      description,
      application_start_datetime,
      application_end_datetime,
      publish_start_at,
      publish_end_at,
      schedule_datetime,
      instructor_id,
      image_url,
      is_draft = false,
      questions = [], // 質問データを追加
    } = body;

    // image_urlの型チェックと処理
    let finalImageUrl = null;
    if (typeof image_url === 'string') {
      finalImageUrl = image_url;
    } else if (image_url instanceof File) {
      console.error(
        'Fileオブジェクトが直接送信されました。画像は事前にアップロードする必要があります。',
      );
      return NextResponse.json(
        { error: '画像の処理に失敗しました' },
        { status: 400 },
      );
    }

    console.log('処理後のimage_url:', finalImageUrl);

    // 相談会レコードの作成
    const { data: consultationData, error: consultationError } = await supabase
      .from('mst_consultation')
      .insert({
        title,
        description,
        application_start_datetime,
        application_end_datetime,
        publish_start_at: publish_start_at || null,
        publish_end_at: publish_end_at || null,
        instructor_id,
        image_url: finalImageUrl,
        is_draft,
      })
      .select('consultation_id')
      .single();

    if (consultationError) {
      console.error('相談会作成エラー:', consultationError);
      return NextResponse.json(
        { error: '相談会の作成に失敗しました' },
        { status: 500 },
      );
    }

    const consultation_id = consultationData.consultation_id;

    // 候補日時の登録（複数）
    if (schedule_datetime && schedule_datetime.length > 0) {
      const scheduleRecords = schedule_datetime.map((dateTime: string) => ({
        consultation_id,
        schedule_datetime: dateTime,
      }));

      const { error: scheduleError } = await supabase
        .from('mst_consultation_schedule')
        .insert(scheduleRecords);

      if (scheduleError) {
        console.error('スケジュール登録エラー:', scheduleError);
        return NextResponse.json(
          { error: 'スケジュールの登録に失敗しました' },
          { status: 500 },
        );
      }
    }

    // 質問データの登録
    if (questions && questions.length > 0) {
      const questionRecords = questions.map(
        (question: ConsultationQuestionFormType) => ({
          consultation_id,
          title: question.title,
          question_type: question.question_type,
          options: ['select', 'multiple_select'].includes(
            question.question_type,
          )
            ? question.options
            : null,
          is_required: question.is_required || false,
          display_order: question.display_order || 0,
        }),
      );

      const { error: questionError } = await supabase
        .from('trn_consultation_question')
        .insert(questionRecords);

      if (questionError) {
        console.error('質問登録エラー:', questionError);
        return NextResponse.json(
          { error: '質問の登録に失敗しました' },
          { status: 500 },
        );
      }
    }

    return NextResponse.json(
      { success: true, consultation_id },
      { status: 201 },
    );
  } catch (error) {
    console.error('予期せぬエラー:', error);
    return NextResponse.json(
      { error: '予期せぬエラーが発生しました' },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createClient();
    const body = await request.json();

    console.log('PUTリクエスト受信 - リクエストボディ:', body);

    const {
      consultationId,
      title,
      description,
      application_start_datetime,
      application_end_datetime,
      publish_start_at,
      publish_end_at,
      schedule_datetime,
      instructor_id,
      image_url,
      is_draft = false,
      questions = [], // 質問データを追加
    } = body;

    console.log('候補日時の情報:', {
      schedule_datetime,
      type: typeof schedule_datetime,
      isArray: Array.isArray(schedule_datetime),
      length: schedule_datetime?.length,
    });

    if (!consultationId) {
      console.error('相談会IDが指定されていません');
      return NextResponse.json(
        { error: '相談会IDが指定されていません' },
        { status: 400 },
      );
    }

    // image_urlの型チェックと処理
    let finalImageUrl = null;
    if (typeof image_url === 'string') {
      finalImageUrl = image_url;
      console.log('既存の画像URLを使用:', finalImageUrl);
    } else if (image_url instanceof File) {
      console.error(
        'Fileオブジェクトが直接送信されました。画像は事前にアップロードする必要があります。',
      );
      return NextResponse.json(
        { error: '画像の処理に失敗しました' },
        { status: 400 },
      );
    }

    console.log('更新データ:', {
      consultationId,
      title,
      description,
      application_start_datetime,
      application_end_datetime,
      publish_start_at,
      publish_end_at,
      instructor_id,
      image_url: finalImageUrl,
      schedule_datetime,
    });

    // 相談会レコードの更新
    const { error: consultationError } = await supabase
      .from('mst_consultation')
      .update({
        title,
        description,
        application_start_datetime,
        application_end_datetime,
        publish_start_at: publish_start_at || null,
        publish_end_at: publish_end_at || null,
        instructor_id,
        image_url: finalImageUrl,
        is_draft,
        updated_at: new Date().toISOString(),
      })
      .eq('consultation_id', consultationId);

    if (consultationError) {
      console.error('相談会更新エラー:', {
        error: consultationError,
        consultationId,
        updateData: {
          title,
          description,
          application_start_datetime,
          application_end_datetime,
          publish_start_at,
          publish_end_at,
          instructor_id,
          image_url: finalImageUrl,
        },
      });
      return NextResponse.json(
        { error: '相談会の更新に失敗しました' },
        { status: 500 },
      );
    }

    // 既存のスケジュールを取得
    const { data: existingSchedules, error: fetchScheduleError } =
      await supabase
        .from('mst_consultation_schedule')
        .select('schedule_id, schedule_datetime')
        .eq('consultation_id', consultationId)
        .is('deleted_at', null);

    if (fetchScheduleError) {
      console.error('スケジュール取得エラー:', {
        error: fetchScheduleError,
        consultationId,
      });
      return NextResponse.json(
        { error: 'スケジュールの取得に失敗しました' },
        { status: 500 },
      );
    }

    console.log('既存のスケジュール:', existingSchedules);

    // スケジュールの更新処理
    if (schedule_datetime && schedule_datetime.length > 0) {
      // 日時文字列を正規化（ISO形式に統一）
      const normalizeDateTime = (dateTime: string) => {
        try {
          return new Date(dateTime).toISOString();
        } catch {
          return dateTime;
        }
      };

      const newScheduleTimes = schedule_datetime.map((dt: string) =>
        normalizeDateTime(dt),
      );
      const existingScheduleTimes =
        existingSchedules?.map((s) => normalizeDateTime(s.schedule_datetime)) ||
        [];

      console.log('=== スケジュール比較デバッグ ===');
      console.log('新しいスケジュール (正規化後):', newScheduleTimes);
      console.log('既存のスケジュール (正規化後):', existingScheduleTimes);
      console.log('元の新しいスケジュール:', schedule_datetime);
      console.log(
        '元の既存スケジュール:',
        existingSchedules?.map((s) => s.schedule_datetime),
      );

      // 削除対象：既存にあるが新しいデータにないもの
      const schedulesToDelete =
        existingSchedules?.filter((existing) => {
          const normalizedExisting = normalizeDateTime(
            existing.schedule_datetime,
          );
          const isIncluded = newScheduleTimes.includes(normalizedExisting);
          console.log(
            `既存スケジュール ${existing.schedule_datetime} (正規化: ${normalizedExisting}) は新しいデータに含まれる: ${isIncluded}`,
          );
          return !isIncluded;
        }) || [];

      // 追加対象：新しいデータにあるが既存にないもの
      const schedulesToAdd = newScheduleTimes.filter(
        (newTime: string) => !existingScheduleTimes.includes(newTime),
      );

      console.log('削除対象:', schedulesToDelete);
      console.log('追加対象:', schedulesToAdd);

      // 削除処理（論理削除）
      if (schedulesToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('mst_consultation_schedule')
          .update({ deleted_at: new Date().toISOString() })
          .in(
            'schedule_id',
            schedulesToDelete.map((s) => s.schedule_id),
          );

        if (deleteError) {
          console.error('スケジュール削除エラー:', deleteError);
          return NextResponse.json(
            { error: '既存のスケジュールの削除に失敗しました' },
            { status: 500 },
          );
        }
        console.log('削除したスケジュール:', schedulesToDelete.length, '件');
      }

      // 追加処理
      if (schedulesToAdd.length > 0) {
        const scheduleRecords = schedulesToAdd.map((dateTime: string) => ({
          consultation_id: consultationId,
          schedule_datetime: dateTime,
        }));

        const { error: scheduleError } = await supabase
          .from('mst_consultation_schedule')
          .insert(scheduleRecords);

        if (scheduleError) {
          console.error('スケジュール登録エラー:', scheduleError);
          return NextResponse.json(
            { error: 'スケジュールの登録に失敗しました' },
            { status: 500 },
          );
        }
        console.log('追加したスケジュール:', schedulesToAdd.length, '件');
      }

      console.log('スケジュール更新完了:', {
        削除: schedulesToDelete.length,
        追加: schedulesToAdd.length,
        維持: existingScheduleTimes.filter((existing) =>
          newScheduleTimes.includes(existing),
        ).length,
      });
    } else {
      // 新しいスケジュールが空の場合、既存のスケジュールをすべて論理削除
      if (existingSchedules && existingSchedules.length > 0) {
        const { error: deleteError } = await supabase
          .from('mst_consultation_schedule')
          .update({ deleted_at: new Date().toISOString() })
          .eq('consultation_id', consultationId)
          .is('deleted_at', null);

        if (deleteError) {
          console.error('全スケジュール削除エラー:', deleteError);
          return NextResponse.json(
            { error: '既存のスケジュールの削除に失敗しました' },
            { status: 500 },
          );
        }
        console.log('全スケジュールを削除しました');
      }
    }

    // 質問データの更新（編集時は既存の質問を削除してから新しく追加）
    if (questions && questions.length > 0) {
      // 既存の質問を論理削除
      const { error: deleteQuestionError } = await supabase
        .from('trn_consultation_question')
        .update({ deleted_at: new Date().toISOString() })
        .eq('consultation_id', consultationId)
        .is('deleted_at', null);

      if (deleteQuestionError) {
        console.error('既存質問削除エラー:', deleteQuestionError);
        return NextResponse.json(
          { error: '既存の質問の削除に失敗しました' },
          { status: 500 },
        );
      }

      // 新しい質問を登録
      const questionRecords = questions.map(
        (question: ConsultationQuestionFormType) => ({
          consultation_id: consultationId,
          title: question.title,
          question_type: question.question_type,
          options: ['select', 'multiple_select'].includes(
            question.question_type,
          )
            ? question.options
            : null,
          is_required: question.is_required || false,
          display_order: question.display_order || 0,
        }),
      );

      const { error: questionError } = await supabase
        .from('trn_consultation_question')
        .insert(questionRecords);

      if (questionError) {
        console.error('質問更新エラー:', questionError);
        return NextResponse.json(
          { error: '質問の更新に失敗しました' },
          { status: 500 },
        );
      }
    }

    return NextResponse.json(
      { success: true, consultation_id: consultationId },
      { status: 200 },
    );
  } catch (error) {
    console.error('予期せぬエラー:', {
      error,
      message: error instanceof Error ? error.message : '不明なエラー',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: '予期せぬエラーが発生しました' },
      { status: 500 },
    );
  }
}
