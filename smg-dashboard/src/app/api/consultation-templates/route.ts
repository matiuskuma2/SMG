import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// 過去の個別相談一覧を取得
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);

    // クエリパラメータ取得
    const search = searchParams.get('search') || '';
    const instructorId = searchParams.get('instructor_id') || '';
    const limit = Number.parseInt(searchParams.get('limit') || '10', 10);
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const offset = (page - 1) * limit;

    // 個別相談検索クエリ（カウント用）
    let countQuery = supabase
      .from('mst_consultation')
      .select('consultation_id', { count: 'exact', head: true })
      .is('deleted_at', null);

    // タイトル検索
    if (search) {
      countQuery = countQuery.ilike('title', `%${search}%`);
    }

    // 講師フィルター
    if (instructorId) {
      countQuery = countQuery.eq('instructor_id', instructorId);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('件数取得エラー:', countError);
    }

    // 個別相談検索クエリ（データ取得用）
    let query = supabase
      .from('mst_consultation')
      .select(
        `
        consultation_id,
        title,
        description,
        application_start_datetime,
        application_end_datetime,
        image_url,
        instructor_id,
        created_at,
        mst_user!inner(username)
      `,
      )
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    // タイトル検索
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    // 講師フィルター
    if (instructorId) {
      query = query.eq('instructor_id', instructorId);
    }

    // ページネーション
    query = query.range(offset, offset + limit - 1);

    const { data: consultations, error } = await query;

    if (error) {
      console.error('個別相談テンプレート取得エラー:', error);
      return NextResponse.json(
        { error: '個別相談の取得に失敗しました' },
        { status: 500 },
      );
    }

    const totalPages = count ? Math.ceil(count / limit) : 0;

    return NextResponse.json(
      {
        consultations,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('予期せぬエラー:', error);
    return NextResponse.json(
      { error: '予期せぬエラーが発生しました' },
      { status: 500 },
    );
  }
}

// 特定の個別相談の詳細を取得（テンプレート用）
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { consultation_id } = await request.json();

    if (!consultation_id) {
      return NextResponse.json(
        { error: '個別相談IDが指定されていません' },
        { status: 400 },
      );
    }

    // 個別相談基本情報取得
    const { data: consultation, error: consultationError } = await supabase
      .from('mst_consultation')
      .select(
        `
        title,
        description,
        application_start_datetime,
        application_end_datetime,
        publish_start_at,
        publish_end_at,
        instructor_id,
        image_url
      `,
      )
      .eq('consultation_id', consultation_id)
      .is('deleted_at', null)
      .single();

    if (consultationError || !consultation) {
      console.error('個別相談取得エラー:', consultationError);
      return NextResponse.json(
        { error: '個別相談が見つかりません' },
        { status: 404 },
      );
    }

    // 個別相談の日程取得
    const { data: schedules, error: schedulesError } = await supabase
      .from('mst_consultation_schedule')
      .select('schedule_datetime')
      .eq('consultation_id', consultation_id)
      .is('deleted_at', null)
      .order('schedule_datetime');

    if (schedulesError) {
      console.error('日程取得エラー:', schedulesError);
    }

    // 質問取得
    const { data: questions, error: questionsError } = await supabase
      .from('trn_consultation_question')
      .select('title, question_type, is_required, display_order, options')
      .eq('consultation_id', consultation_id)
      .is('deleted_at', null)
      .order('display_order');

    if (questionsError) {
      console.error('質問取得エラー:', questionsError);
    }

    return NextResponse.json(
      {
        consultation,
        schedules: schedules || [],
        questions: questions || [],
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('予期せぬエラー:', error);
    return NextResponse.json(
      { error: '予期せぬエラーが発生しました' },
      { status: 500 },
    );
  }
}
