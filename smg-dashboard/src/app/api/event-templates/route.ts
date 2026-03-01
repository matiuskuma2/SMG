import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);

    // クエリパラメータ取得
    const search = searchParams.get('search') || '';
    const eventType = searchParams.get('event_type') || '';
    const limit = Number.parseInt(searchParams.get('limit') || '10', 10);
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const offset = (page - 1) * limit;

    // イベント検索クエリ（カウント用）
    let countQuery = supabase
      .from('mst_event')
      .select('event_id', { count: 'exact', head: true })
      .is('deleted_at', null);

    // イベント名検索
    if (search) {
      countQuery = countQuery.ilike('event_name', `%${search}%`);
    }

    // 開催区分フィルター
    if (eventType) {
      countQuery = countQuery.eq('event_type', eventType);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('件数取得エラー:', countError);
    }

    // イベント検索クエリ（データ取得用）
    let query = supabase
      .from('mst_event')
      .select(
        `
        event_id,
        event_name,
        event_type,
        event_start_datetime,
        event_end_datetime,
        event_location,
        event_city,
        image_url,
        mst_event_type!inner(event_type_name)
      `,
      )
      .is('deleted_at', null)
      .order('event_start_datetime', { ascending: false });

    // イベント名検索
    if (search) {
      query = query.ilike('event_name', `%${search}%`);
    }

    // 開催区分フィルター
    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    // ページネーション
    query = query.range(offset, offset + limit - 1);

    const { data: events, error } = await query;

    if (error) {
      console.error('イベントテンプレート取得エラー:', error);
      return NextResponse.json(
        { error: 'イベントの取得に失敗しました' },
        { status: 500 },
      );
    }

    const totalPages = count ? Math.ceil(count / limit) : 0;

    return NextResponse.json(
      {
        events,
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

// 特定のイベントの詳細を取得（テンプレート用）
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { event_id } = await request.json();

    if (!event_id) {
      return NextResponse.json(
        { error: 'イベントIDが指定されていません' },
        { status: 400 },
      );
    }

    // イベント基本情報取得
    const { data: event, error: eventError } = await supabase
      .from('mst_event')
      .select(
        `
        event_name,
        event_location,
        event_city,
        event_capacity,
        event_type,
        event_description,
        image_url,
        event_start_datetime,
        event_end_datetime,
        registration_start_datetime,
        registration_end_datetime,
        publish_start_at,
        publish_end_at,
        gather_start_time,
        gather_end_time,
        gather_location,
        gather_price,
        gather_capacity,
        gather_registration_end_datetime,
        has_gather,
        consultation_capacity,
        has_consultation
      `,
      )
      .eq('event_id', event_id)
      .is('deleted_at', null)
      .single();

    if (eventError || !event) {
      console.error('イベント取得エラー:', eventError);
      return NextResponse.json(
        { error: 'イベントが見つかりません' },
        { status: 404 },
      );
    }

    // イベントファイル取得
    const { data: files, error: filesError } = await supabase
      .from('mst_event_file')
      .select('file_description, file_name, file_url, display_order')
      .eq('event_id', event_id)
      .is('deleted_at', null)
      .order('display_order');

    if (filesError) {
      console.error('ファイル取得エラー:', filesError);
    }

    // イベント質問取得
    const { data: questions, error: questionsError } = await supabase
      .from('trn_event_question')
      .select('title, question_type, is_required, display_order, options')
      .eq('event_id', event_id)
      .is('deleted_at', null)
      .order('display_order');

    if (questionsError) {
      console.error('質問取得エラー:', questionsError);
    }

    // グループ取得
    const { data: groups, error: groupsError } = await supabase
      .from('trn_event_visible_group')
      .select('group_id')
      .eq('event_id', event_id)
      .is('deleted_at', null);

    if (groupsError) {
      console.error('グループ取得エラー:', groupsError);
    }

    return NextResponse.json(
      {
        event,
        files: files || [],
        questions: questions || [],
        groups: groups || [],
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
