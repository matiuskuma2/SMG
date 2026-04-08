import { createClient } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';

// 一時的マイグレーションAPI - 実行後に削除すること
// セキュリティ: SUPABASE_SERVICE_ROLE_KEY による認証 + ワンタイムトークン
const MIGRATION_TOKEN = 'smg-migrate-2026-04-08-show-in-event-list';

export async function POST(request: NextRequest) {
  try {
    // トークン認証
    const { token } = await request.json();
    if (token !== MIGRATION_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase環境変数が未設定' },
        { status: 500 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }),
      },
    });

    const results: { step: string; status: string; detail?: string }[] = [];

    // Step 1: show_in_event_list カラムが存在するか確認
    const { data: checkData, error: checkError } = await supabase
      .from('mst_event_type')
      .select('*')
      .limit(1);

    if (checkError) {
      return NextResponse.json(
        { error: 'テーブル確認失敗', detail: checkError.message },
        { status: 500 },
      );
    }

    const sampleRow = checkData?.[0];
    const hasColumn = sampleRow && 'show_in_event_list' in sampleRow;

    if (hasColumn) {
      results.push({
        step: 'check_column',
        status: 'already_exists',
        detail: 'show_in_event_list カラムは既に存在',
      });
    } else {
      // カラムが存在しない場合 → PostgREST経由ではALTER TABLE不可
      // RPC関数を使って追加する必要がある
      results.push({
        step: 'check_column',
        status: 'missing',
        detail:
          'show_in_event_list カラムが存在しません。Supabase SQL Editorで手動追加が必要です。',
      });

      return NextResponse.json({
        success: false,
        results,
        manual_sql: `
-- Supabase SQL Editor で以下を実行してください:
ALTER TABLE mst_event_type 
ADD COLUMN IF NOT EXISTS show_in_event_list BOOLEAN DEFAULT true;

COMMENT ON COLUMN mst_event_type.show_in_event_list IS '講座・イベント予約一覧での表示制御フラグ';

UPDATE mst_event_type 
SET show_in_event_list = true 
WHERE event_type_name = '簿記講座' AND deleted_at IS NULL;
        `.trim(),
      });
    }

    // Step 2: カラムが既にある場合 → 簿記講座の値を更新
    // まず現在の値を確認
    const { data: bookkeeping, error: bkError } = await supabase
      .from('mst_event_type')
      .select('event_type_id, event_type_name, show_in_event_list')
      .eq('event_type_name', '簿記講座')
      .is('deleted_at', null);

    if (bkError) {
      results.push({
        step: 'find_bookkeeping',
        status: 'error',
        detail: bkError.message,
      });
      return NextResponse.json({ success: false, results }, { status: 500 });
    }

    if (!bookkeeping || bookkeeping.length === 0) {
      results.push({
        step: 'find_bookkeeping',
        status: 'not_found',
        detail: '簿記講座のイベントタイプが見つかりません',
      });
      return NextResponse.json({ success: false, results });
    }

    results.push({
      step: 'find_bookkeeping',
      status: 'found',
      detail: JSON.stringify(bookkeeping),
    });

    // 簿記講座の show_in_event_list を true に更新
    for (const row of bookkeeping) {
      if (row.show_in_event_list === true) {
        results.push({
          step: `update_${row.event_type_id}`,
          status: 'already_true',
          detail: `${row.event_type_name} は既に show_in_event_list = true`,
        });
        continue;
      }

      const { error: updateError } = await supabase
        .from('mst_event_type')
        .update({ show_in_event_list: true })
        .eq('event_type_id', row.event_type_id);

      if (updateError) {
        results.push({
          step: `update_${row.event_type_id}`,
          status: 'error',
          detail: updateError.message,
        });
      } else {
        results.push({
          step: `update_${row.event_type_id}`,
          status: 'updated',
          detail: `${row.event_type_name} の show_in_event_list を true に更新`,
        });
      }
    }

    // Step 3: 全イベントタイプの現在の状態を返す
    const { data: allTypes, error: allError } = await supabase
      .from('mst_event_type')
      .select('event_type_id, event_type_name, show_in_event_list')
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (!allError) {
      results.push({
        step: 'verify_all_types',
        status: 'success',
        detail: JSON.stringify(allTypes),
      });
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('マイグレーションエラー:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'マイグレーション実行失敗',
      },
      { status: 500 },
    );
  }
}
