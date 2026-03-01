import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'ユーザーIDが指定されていません' },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    // service_role キーでグループ情報を取得（RLSをバイパス）
    const { data: userData, error: userError } = await supabase
      .from('mst_user')
      .select(`
        user_id,
        trn_group_user!inner (
          mst_group:group_id (
            title
          )
        )
      `)
      .eq('user_id', userId)
      .is('trn_group_user.deleted_at', null);

    if (userError) {
      console.error('グループ情報取得エラー:', userError);
      return NextResponse.json(
        { error: 'グループ情報の取得に失敗しました' },
        { status: 500 },
      );
    }

    if (!userData || userData.length === 0) {
      return NextResponse.json(
        {
          authorized: false,
          reason: 'no_group',
          message: 'メールアドレスまたはパスワードが正しくありません',
        },
        { status: 200 },
      );
    }

    // ユーザーのグループをチェック
    const userGroups = userData[0].trn_group_user;
    let isBlocked = false;
    let blockReason: string | null = null;
    let isAuthorized = false;

    for (const groupUser of userGroups) {
      // @ts-ignore
      const groupTitle = groupUser.mst_group?.title;

      if (groupTitle === '未決済') {
        isBlocked = true;
        blockReason = 'unpaid';
        break;
      }
      if (groupTitle === '退会') {
        isBlocked = true;
        blockReason = 'withdrawn';
        break;
      }
      if (groupTitle === '講師' || groupTitle === '運営') {
        isAuthorized = true;
      }
    }

    if (isBlocked) {
      if (blockReason === 'unpaid') {
        return NextResponse.json({
          authorized: false,
          reason: 'unpaid',
          message: '決済エラーのためログインを制限させていただいております',
        });
      }
      return NextResponse.json({
        authorized: false,
        reason: 'withdrawn',
        message: '退会済みのユーザーのためログインを制限させていただいております',
      });
    }

    if (!isAuthorized) {
      return NextResponse.json({
        authorized: false,
        reason: 'not_authorized',
        message: '講師または運営スタッフのみログインが許可されています',
      });
    }

    return NextResponse.json({
      authorized: true,
      reason: null,
      message: null,
    });
  } catch (error) {
    console.error('認証チェックエラー:', error);
    return NextResponse.json(
      { error: '認証チェック中にエラーが発生しました' },
      { status: 500 },
    );
  }
}
