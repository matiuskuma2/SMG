import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient();

    // 現在のユーザーの認証状態と権限をチェック
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 代表者情報を取得
    const { data, error } = await supabase
      .from('mst_user')
      .select('user_id, username, email, company_name')
      .eq('user_type', '代表者')
      .is('deleted_at', null);

    if (error) {
      console.error('代表者情報取得エラー:', error);
      return NextResponse.json(
        { error: '代表者情報の取得に失敗しました' },
        { status: 500 },
      );
    }

    return NextResponse.json({ representatives: data || [] });
  } catch (error) {
    console.error('API エラー:', error);
    return NextResponse.json(
      { error: '内部サーバーエラーが発生しました' },
      { status: 500 },
    );
  }
}
