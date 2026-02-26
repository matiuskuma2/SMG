import { createAdminClient } from '@/lib/supabase/admin';
import { type NextRequest, NextResponse } from 'next/server';

// キャッシュを無効化し、常に動的にデータを取得する
export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = params.id;
    const userData = await request.json();
    const supabase = createAdminClient();

    // 管理者APIを使用してユーザー情報を更新
    const { data: authData, error: authError } =
      await supabase.auth.admin.updateUserById(userId, {
        email: userData.email,
        password: userData.password || undefined,
        user_metadata: {
          name: userData.userName,
        },
      });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'ユーザー更新に失敗しました' },
        { status: 500 },
      );
    }

    // ユーザーテーブルの情報も更新
    const userRecord = {
      username: userData.userName,
      user_name_kana: userData.userNameKana,
      email: userData.email,
      company_name: userData.companyName,
      company_name_kana: userData.companyNameKana,
      user_type: userData.userType,
      daihyosha_id: userData.daihyoshaId || null,
      birth_date: userData.birthDate || null,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('mst_user')
      .update(userRecord)
      .eq('user_id', userId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ user: authData.user });
  } catch (error) {
    console.error('ユーザー更新エラー:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'ユーザー更新に失敗しました',
      },
      { status: 500 },
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = params.id;
    const supabase = createAdminClient();

    console.log('Fetching user data for ID:', userId);

    // ユーザーテーブルからデータを取得
    const { data: userData, error: userError } = await supabase
      .from('mst_user')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('Raw user data from database:', userData);
    console.log('Database error if any:', userError);

    if (userError) {
      console.error('Database error:', userError);
      return NextResponse.json({ error: userError.message }, { status: 404 });
    }

    if (!userData) {
      console.error('No user data found');
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 },
      );
    }

    console.log('Sending response with user data:', userData);
    return NextResponse.json(
      { user: userData },
      {
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      },
    );
  } catch (error) {
    console.error('ユーザー取得エラー:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'ユーザー取得に失敗しました',
      },
      { status: 500 },
    );
  }
}
