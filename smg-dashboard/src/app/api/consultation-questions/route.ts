import { createClient } from '@/lib/supabase/server';
import type { ConsultationQuestionFormType } from '@/types/individualConsultation';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const consultationId = searchParams.get('consultation_id');

    if (!consultationId) {
      return NextResponse.json(
        { error: '相談会IDが指定されていません' },
        { status: 400 },
      );
    }

    // 質問を取得
    const { data: questions, error } = await supabase
      .from('trn_consultation_question')
      .select('*')
      .eq('consultation_id', consultationId)
      .is('deleted_at', null)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('質問取得エラー:', error);
      return NextResponse.json(
        { error: '質問の取得に失敗しました' },
        { status: 500 },
      );
    }

    return NextResponse.json({ questions }, { status: 200 });
  } catch (error) {
    console.error('予期せぬエラー:', error);
    return NextResponse.json(
      { error: '予期せぬエラーが発生しました' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const {
      consultation_id,
      title,
      question_type,
      is_required,
      display_order,
      options,
    }: ConsultationQuestionFormType & { consultation_id: string } = body;

    if (!consultation_id || !title || !question_type) {
      return NextResponse.json(
        { error: '必須項目が不足しています' },
        { status: 400 },
      );
    }

    // 選択式の場合、選択肢が必要
    if (
      ['select', 'multiple_select'].includes(question_type) &&
      (!options || options.length === 0)
    ) {
      return NextResponse.json(
        { error: '選択式の場合、選択肢が必要です' },
        { status: 400 },
      );
    }

    // display_orderが未設定の場合、既存質問数を取得して設定
    let finalDisplayOrder = display_order;
    if (finalDisplayOrder === undefined || finalDisplayOrder === null) {
      const { data: existingQuestions, error: countError } = await supabase
        .from('trn_consultation_question')
        .select('display_order')
        .eq('consultation_id', consultation_id)
        .is('deleted_at', null);

      if (countError) {
        console.error('既存質問数取得エラー:', countError);
        finalDisplayOrder = 0;
      } else {
        finalDisplayOrder = existingQuestions?.length || 0;
      }
    }

    const { data: question, error } = await supabase
      .from('trn_consultation_question')
      .insert({
        consultation_id,
        title,
        question_type,
        options: ['select', 'multiple_select'].includes(question_type)
          ? options
          : null,
        is_required: is_required || false,
        display_order: finalDisplayOrder,
      })
      .select('*')
      .single();

    if (error) {
      console.error('質問作成エラー:', error);
      return NextResponse.json(
        { error: '質問の作成に失敗しました' },
        { status: 500 },
      );
    }

    return NextResponse.json({ question }, { status: 201 });
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

    const {
      question_id,
      title,
      question_type,
      is_required,
      display_order,
      options,
    }: ConsultationQuestionFormType & { question_id: string } = body;

    if (!question_id || !title || !question_type) {
      return NextResponse.json(
        { error: '必須項目が不足しています' },
        { status: 400 },
      );
    }

    // 選択式の場合、選択肢が必要
    if (
      ['select', 'multiple_select'].includes(question_type) &&
      (!options || options.length === 0)
    ) {
      return NextResponse.json(
        { error: '選択式の場合、選択肢が必要です' },
        { status: 400 },
      );
    }

    const { data: question, error } = await supabase
      .from('trn_consultation_question')
      .update({
        title,
        question_type,
        options: ['select', 'multiple_select'].includes(question_type)
          ? options
          : null,
        is_required: is_required || false,
        display_order: display_order ?? 0,
        updated_at: new Date().toISOString(),
      })
      .eq('question_id', question_id)
      .select('*')
      .single();

    if (error) {
      console.error('質問更新エラー:', error);
      return NextResponse.json(
        { error: '質問の更新に失敗しました' },
        { status: 500 },
      );
    }

    return NextResponse.json({ question }, { status: 200 });
  } catch (error) {
    console.error('予期せぬエラー:', error);
    return NextResponse.json(
      { error: '予期せぬエラーが発生しました' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('question_id');

    if (!questionId) {
      return NextResponse.json(
        { error: '質問IDが指定されていません' },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from('trn_consultation_question')
      .update({ deleted_at: new Date().toISOString() })
      .eq('question_id', questionId);

    if (error) {
      console.error('質問削除エラー:', error);
      return NextResponse.json(
        { error: '質問の削除に失敗しました' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('予期せぬエラー:', error);
    return NextResponse.json(
      { error: '予期せぬエラーが発生しました' },
      { status: 500 },
    );
  }
}
