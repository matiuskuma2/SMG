import { createAdminClient } from '@/lib/supabase/admin';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const userData = await request.json();

    // 管理者APIを使ってユーザーを作成
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          name: userData.userName,
        },
      });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'ユーザー作成に失敗しました' },
        { status: 500 },
      );
    }

    // ユーザーテーブルにデータを挿入
    const userRecord = {
      user_id: authData.user.id,
      username: userData.userName,
      user_name_kana: userData.userNameKana,
      email: userData.email,
      company_name: userData.companyName,
      company_name_kana: userData.companyNameKana,
      user_type: userData.userType,
      daihyosha_id: userData.daihyoshaId || null,
      birth_date: userData.birthDate || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase
      .from('mst_user')
      .insert([userRecord]);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ user: authData.user });
  } catch (error) {
    console.error('ユーザー作成エラー:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'ユーザー作成に失敗しました',
      },
      { status: 500 },
    );
  }
}
