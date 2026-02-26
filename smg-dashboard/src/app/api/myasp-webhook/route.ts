import { createAdminClient } from '@/lib/supabase/admin';
import { type NextRequest, NextResponse } from 'next/server';

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

interface MyaspUserData {
  username: string | null;
  user_name_kana: string | null;
  company_name: string | null;
  phone_number: string | null;
  postal_code: string | null;
  prefecture: string | null;
  city_address: string | null;
  building_name: string | null;
  my_asp_user_id: string | null;
}

/**
 * メールアドレスでユーザーを検索し、存在しなければ新規作成する
 * 既存ユーザーの場合はプロフィールデータを上書き更新する
 */
async function findOrCreateUser(
  supabase: SupabaseAdmin,
  email: string,
  password: string | null,
  userData: MyaspUserData,
): Promise<{ userId: string; created: boolean }> {
  // mst_user でメール検索
  const { data: existingUser, error: lookupError } = await supabase
    .from('mst_user')
    .select('user_id')
    .eq('email', email)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`ユーザー検索エラー: ${lookupError.message}`);
  }

  if (existingUser) {
    // 既存ユーザー: null以外のフィールドのみ上書き更新
    const updateData: Record<string, string> = {};
    for (const [key, value] of Object.entries(userData)) {
      if (value !== null) {
        updateData[key] = value;
      }
    }
    updateData.updated_at = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('mst_user')
      .update(updateData)
      .eq('user_id', existingUser.user_id);

    if (updateError) {
      throw new Error(`ユーザー更新エラー: ${updateError.message}`);
    }

    return { userId: existingUser.user_id, created: false };
  }

  // パスワードのバリデーション
  if (!password) {
    throw new Error('パスワードが必要です');
  }

  // Supabase Auth ユーザー作成（MyASPのパスワードを使用）
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
    });

  if (authError) {
    throw new Error(`認証ユーザー作成エラー: ${authError.message}`);
  }

  if (!authData.user) {
    throw new Error('ユーザー作成に失敗しました');
  }

  // mst_user にレコード挿入
  const { error: insertError } = await supabase.from('mst_user').insert([
    {
      user_id: authData.user.id,
      email: email,
      ...userData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);

  if (insertError) {
    // ロールバック: mst_user insert失敗時はauth userを削除
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw new Error(`ユーザーデータ登録エラー: ${insertError.message}`);
  }

  return { userId: authData.user.id, created: true };
}

/**
 * ユーザーをグループに追加する（ソフトデリートパターン）
 * - 既にアクティブな場合はno-op（冪等）
 * - ソフトデリート済みの場合は復活
 * - レコードがない場合は新規insert
 */
async function addUserToGroup(
  supabase: SupabaseAdmin,
  userId: string,
  groupId: string,
): Promise<void> {
  const { data: existing, error: checkError } = await supabase
    .from('trn_group_user')
    .select('user_id, deleted_at')
    .eq('user_id', userId)
    .eq('group_id', groupId)
    .maybeSingle();

  if (checkError) {
    throw new Error(`グループユーザー確認エラー: ${checkError.message}`);
  }

  if (existing && existing.deleted_at !== null) {
    // ソフトデリート済み → 復活
    const { error: reactivateError } = await supabase
      .from('trn_group_user')
      .update({
        deleted_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (reactivateError) {
      throw new Error(`グループユーザー復活エラー: ${reactivateError.message}`);
    }
  } else if (!existing) {
    // 新規追加
    const { error: insertError } = await supabase
      .from('trn_group_user')
      .insert({
        group_id: groupId,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (insertError) {
      throw new Error(`グループユーザー追加エラー: ${insertError.message}`);
    }
  }
  // existing && deleted_at === null → 既にアクティブ、何もしない
}

/**
 * ユーザーをグループから削除する（ソフトデリート）
 * - グループに所属していない場合はno-op（冪等）
 */
async function removeUserFromGroup(
  supabase: SupabaseAdmin,
  userId: string,
  groupId: string,
): Promise<void> {
  const { error: removeError } = await supabase
    .from('trn_group_user')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .is('deleted_at', null);

  if (removeError) {
    throw new Error(`グループユーザー削除エラー: ${removeError.message}`);
  }
}

/**
 * グループ名からgroup_idを取得する
 */
async function getGroupIdByTitle(
  supabase: SupabaseAdmin,
  title: string,
): Promise<string> {
  const { data: group, error: groupError } = await supabase
    .from('mst_group')
    .select('group_id')
    .eq('title', title)
    .is('deleted_at', null)
    .single();

  if (groupError || !group) {
    throw new Error(`${title}グループが見つかりません`);
  }

  return group.group_id;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // 受信データをそのままログ出力
    const rawEntries: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      rawEntries[key] = String(value);
    }
    console.log('MyASP webhook received:', JSON.stringify(rawEntries, null, 2));

    // フォームデータ取得
    // const secretKey = formData.get('secret_key') as string | null;
    const rawEmail = formData.get('data[User][mail]') as string | null;
    const statusRaw = formData.get('data[User][status]') as string | null;
    const status = statusRaw ? Number.parseInt(statusRaw, 10) : null;
    const name1 = formData.get('data[User][name1]') as string | null;
    const name2 = formData.get('data[User][name2]') as string | null;
    const password = formData.get('data[User][password]') as string | null;
    const company = formData.get('data[User][company]') as string | null;
    const kana = formData.get('data[User][kana]') as string | null;
    const tel = formData.get('data[User][tel]') as string | null;
    const zipcode = formData.get('data[User][zipcode]') as string | null;
    const pref = formData.get('data[User][pref]') as string | null;
    const zip = formData.get('data[User][zip]') as string | null;
    const free1 = formData.get('data[User][free1]') as string | null;
    const myaspUserId = formData.get('data[User][user_id]') as string | null;

    // // 認証
    // const webhookSecret = process.env.MYASP_WEBHOOK_SECRET;
    // if (!webhookSecret) {
    //   console.error('MYASP_WEBHOOK_SECRET environment variable is not set');
    //   return NextResponse.json(
    //     { error: 'Server configuration error' },
    //     { status: 500 },
    //   );
    // }

    // if (!secretKey || secretKey !== webhookSecret) {
    //   console.warn('MyASP webhook: Invalid secret_key received');
    //   return NextResponse.json(
    //     { error: '認証に失敗しました' },
    //     { status: 401 },
    //   );
    // }

    // バリデーション
    if (!rawEmail) {
      return NextResponse.json(
        { error: 'メールアドレスが必要です' },
        { status: 400 },
      );
    }

    if (!status || ![1, 2, 3, 4].includes(status)) {
      return NextResponse.json(
        { error: '無効なステータスです' },
        { status: 400 },
      );
    }

    const email = rawEmail.toLowerCase().trim();
    const supabase = createAdminClient();

    // 姓+名をスペースで結合
    const username =
      name1 || name2 ? [name1, name2].filter(Boolean).join(' ') : null;

    const userData: MyaspUserData = {
      username,
      user_name_kana: kana,
      company_name: company,
      phone_number: tel,
      postal_code: zipcode,
      prefecture: pref,
      city_address: zip,
      building_name: free1,
      my_asp_user_id: myaspUserId,
    };

    // Status 1: 登録
    if (status === 1) {
      const { created } = await findOrCreateUser(
        supabase,
        email,
        password,
        userData,
      );

      return NextResponse.json({
        success: true,
        message: created
          ? 'ユーザーを作成しました'
          : 'ユーザーデータを更新しました',
        action: created ? 'created' : 'updated',
      });
    }

    // Status 2: 課金失敗 → 未決済グループに追加
    if (status === 2) {
      const { userId } = await findOrCreateUser(
        supabase,
        email,
        password,
        userData,
      );
      const groupId = await getGroupIdByTitle(supabase, '未決済');
      await addUserToGroup(supabase, userId, groupId);

      return NextResponse.json({
        success: true,
        message: '未決済グループに追加しました',
        action: 'added_to_mikessai',
      });
    }

    // Status 3: 課金復活 → 未決済グループから削除
    if (status === 3) {
      const { userId } = await findOrCreateUser(
        supabase,
        email,
        password,
        userData,
      );
      const groupId = await getGroupIdByTitle(supabase, '未決済');
      await removeUserFromGroup(supabase, userId, groupId);

      return NextResponse.json({
        success: true,
        message: '未決済グループから削除しました',
        action: 'removed_from_mikessai',
      });
    }

    // Status 4: 解約 → 退会グループに追加
    if (status === 4) {
      const { userId } = await findOrCreateUser(
        supabase,
        email,
        password,
        userData,
      );
      const groupId = await getGroupIdByTitle(supabase, '退会');
      await addUserToGroup(supabase, userId, groupId);

      return NextResponse.json({
        success: true,
        message: '退会グループに追加しました',
        action: 'added_to_taikai',
      });
    }

    return NextResponse.json(
      { error: '無効なステータスです' },
      { status: 400 },
    );
  } catch (error) {
    console.error('MyASP webhook error:', error);
    return NextResponse.json(
      {
        error: '予期せぬエラーが発生しました',
        details: error instanceof Error ? error.message : '不明なエラー',
      },
      { status: 500 },
    );
  }
}
