import { createAdminClient } from '@/lib/supabase/admin';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ユーザーの参加記録一覧を取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = params.id;
    const supabase = createAdminClient();

    // イベント参加記録を取得
    const { data: eventAttendances, error: eventError } = await supabase
      .from('trn_event_attendee')
      .select(`
        event_id,
        is_offline,
        created_at,
        deleted_at,
        event:event_id(
          event_name,
          event_start_datetime,
          event_type:mst_event_type(event_type_name)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (eventError) {
      console.error('イベント参加記録取得エラー:', eventError);
      return NextResponse.json({ error: eventError.message }, { status: 500 });
    }

    // 懇親会参加記録を取得
    const { data: gatherAttendances, error: gatherError } = await supabase
      .from('trn_gather_attendee')
      .select(`
        event_id,
        stripe_payment_status,
        payment_amount,
        created_at,
        deleted_at,
        event:event_id(
          event_name,
          event_start_datetime,
          event_type:mst_event_type(event_type_name)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (gatherError) {
      console.error('懇親会参加記録取得エラー:', gatherError);
      return NextResponse.json({ error: gatherError.message }, { status: 500 });
    }

    // 個別相談参加記録を取得
    const { data: consultationAttendances, error: consultationError } = await supabase
      .from('trn_consultation_attendee')
      .select(`
        event_id,
        is_urgent,
        is_first_consultation,
        notes,
        created_at,
        deleted_at,
        event:event_id(
          event_name,
          event_start_datetime,
          event_type:mst_event_type(event_type_name)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (consultationError) {
      console.error('個別相談参加記録取得エラー:', consultationError);
      return NextResponse.json({ error: consultationError.message }, { status: 500 });
    }

    return NextResponse.json({
      eventAttendances: eventAttendances || [],
      gatherAttendances: gatherAttendances || [],
      consultationAttendances: consultationAttendances || [],
    });
  } catch (error) {
    console.error('参加記録取得エラー:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '参加記録の取得に失敗しました' },
      { status: 500 },
    );
  }
}

// 参加記録を追加
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = params.id;
    const body = await request.json();
    const { type, eventId, isOffline } = body;
    const supabase = createAdminClient();

    if (!type || !eventId) {
      return NextResponse.json(
        { error: 'タイプとイベントIDは必須です' },
        { status: 400 },
      );
    }

    if (type === 'event') {
      const { error } = await supabase
        .from('trn_event_attendee')
        .upsert({
          event_id: eventId,
          user_id: userId,
          is_offline: isOffline !== false,
          deleted_at: null,
        });

      if (error) {
        console.error('イベント参加記録追加エラー:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else if (type === 'gather') {
      const { error } = await supabase
        .from('trn_gather_attendee')
        .upsert({
          event_id: eventId,
          user_id: userId,
          stripe_payment_intent_id: `manual_${Date.now()}`,
          stripe_payment_status: 'manual',
          payment_amount: 0,
          payment_date: new Date().toISOString(),
          deleted_at: null,
        });

      if (error) {
        console.error('懇親会参加記録追加エラー:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else if (type === 'consultation') {
      const { error } = await supabase
        .from('trn_consultation_attendee')
        .upsert({
          event_id: eventId,
          user_id: userId,
          is_urgent: body.isUrgent || false,
          is_first_consultation: body.isFirstConsultation || false,
          notes: body.notes || null,
          deleted_at: null,
        });

      if (error) {
        console.error('個別相談参加記録追加エラー:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: '無効なタイプです' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('参加記録追加エラー:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '参加記録の追加に失敗しました' },
      { status: 500 },
    );
  }
}

// 参加記録を削除（論理削除）
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = params.id;
    const body = await request.json();
    const { type, eventId } = body;
    const supabase = createAdminClient();

    if (!type || !eventId) {
      return NextResponse.json(
        { error: 'タイプとイベントIDは必須です' },
        { status: 400 },
      );
    }

    const tableName = type === 'event'
      ? 'trn_event_attendee'
      : type === 'gather'
        ? 'trn_gather_attendee'
        : type === 'consultation'
          ? 'trn_consultation_attendee'
          : null;

    if (!tableName) {
      return NextResponse.json({ error: '無効なタイプです' }, { status: 400 });
    }

    const { error } = await supabase
      .from(tableName)
      .update({ deleted_at: new Date().toISOString() })
      .eq('event_id', eventId)
      .eq('user_id', userId);

    if (error) {
      console.error('参加記録削除エラー:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('参加記録削除エラー:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '参加記録の削除に失敗しました' },
      { status: 500 },
    );
  }
}

// 参加記録を復元（論理削除の解除）
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = params.id;
    const body = await request.json();
    const { type, eventId } = body;
    const supabase = createAdminClient();

    if (!type || !eventId) {
      return NextResponse.json(
        { error: 'タイプとイベントIDは必須です' },
        { status: 400 },
      );
    }

    const tableName = type === 'event'
      ? 'trn_event_attendee'
      : type === 'gather'
        ? 'trn_gather_attendee'
        : type === 'consultation'
          ? 'trn_consultation_attendee'
          : null;

    if (!tableName) {
      return NextResponse.json({ error: '無効なタイプです' }, { status: 400 });
    }

    const { error } = await supabase
      .from(tableName)
      .update({ deleted_at: null })
      .eq('event_id', eventId)
      .eq('user_id', userId);

    if (error) {
      console.error('参加記録復元エラー:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('参加記録復元エラー:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '参加記録の復元に失敗しました' },
      { status: 500 },
    );
  }
}
