import { createClient } from '@/lib/supabase/server';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // 講師グループのIDを取得（例: "講師"というタイトルのグループを検索）
    const { data: instructorGroup, error: groupError } = await supabase
      .from('mst_group')
      .select('group_id, title, description')
      .eq('title', '講師')
      .is('deleted_at', null)
      .single();

    if (groupError) {
      return NextResponse.json(
        { error: '講師グループの取得に失敗しました', details: groupError },
        { status: 500 },
      );
    }

    if (!instructorGroup) {
      return NextResponse.json(
        { error: '講師グループが見つかりません' },
        { status: 404 },
      );
    }

    // 講師グループに属するユーザーを取得
    const { data: instructors, error: instructorsError } = await supabase
      .from('trn_group_user')
      .select(`
        user_id,
        mst_user:user_id (
          user_id,
          username,
          icon
        )
      `)
      .eq('group_id', instructorGroup.group_id)
      .is('deleted_at', null);

    if (instructorsError) {
      return NextResponse.json(
        { error: '講師情報の取得に失敗しました', details: instructorsError },
        { status: 500 },
      );
    }

    // 整形したデータを返す
    const formattedInstructors = [];

    // 安全に型チェックをしながらデータを変換
    for (const instructor of instructors) {
      try {
        if (
          instructor &&
          typeof instructor === 'object' &&
          'mst_user' in instructor &&
          instructor.mst_user &&
          typeof instructor.mst_user === 'object' &&
          'user_id' in instructor.mst_user &&
          'username' in instructor.mst_user
        ) {
          const mstUser = instructor.mst_user as {
            user_id: string;
            username: string;
            icon?: string | null;
          };

          formattedInstructors.push({
            id: String(mstUser.user_id || ''),
            name: String(mstUser.username || ''),
            icon: mstUser.icon || null,
          });
        }
      } catch (error) {
        console.error('データ形式エラー:', error);
        // エラーが発生しても処理を続行
      }
    }

    return NextResponse.json(formattedInstructors);
  } catch (error) {
    console.error('講師情報取得エラー:', error);
    return NextResponse.json(
      { error: '予期せぬエラーが発生しました' },
      { status: 500 },
    );
  }
}
