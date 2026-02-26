import { convertToUserFormData, parseCSVContent } from '@/lib/csvParser';
import { createAdminClient } from '@/lib/supabase/admin';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('バルクユーザー作成API呼び出し開始');

  try {
    console.log('Supabaseクライアント作成中...');
    const supabase = createAdminClient();

    console.log('フォームデータ解析中...');
    const formData = await request.formData();

    const csvFile = formData.get('csvFile') as File;
    console.log('受信したデータ:', {
      csvFileName: csvFile?.name,
      csvFileSize: csvFile?.size,
    });

    if (!csvFile) {
      console.error('CSVファイルが選択されていません');
      return NextResponse.json(
        { error: 'CSVファイルが選択されていません' },
        { status: 400 },
      );
    }

    const csvContent = await csvFile.text();
    const parsedUsers = parseCSVContent(csvContent);

    const validUsers = parsedUsers.filter((user) => user.isValid);
    const invalidUsers = parsedUsers.filter((user) => !user.isValid);

    if (validUsers.length === 0) {
      return NextResponse.json(
        {
          error: '有効なユーザーデータがありません',
          invalidUsers,
        },
        { status: 400 },
      );
    }

    const results = {
      successful: [] as Array<{
        userName: string;
        email: string;
        user_id: string;
        password: string;
      }>,
      failed: [] as Array<{
        userName: string;
        email: string;
        error: string;
      }>,
      invalid: invalidUsers,
    };

    for (const parsedUser of validUsers) {
      try {
        const userData = convertToUserFormData(parsedUser);

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
          results.failed.push({
            ...parsedUser,
            error: authError.message,
          });
          continue;
        }

        if (!authData.user) {
          results.failed.push({
            ...parsedUser,
            error: 'ユーザー作成に失敗しました',
          });
          continue;
        }

        const userRecord = {
          user_id: authData.user.id,
          username: userData.userName,
          user_name_kana: userData.userNameKana,
          email: userData.email,
          company_name: userData.companyName,
          company_name_kana: userData.companyNameKana,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: insertError } = await supabase
          .from('mst_user')
          .insert([userRecord]);

        if (insertError) {
          await supabase.auth.admin.deleteUser(authData.user.id);
          results.failed.push({
            ...parsedUser,
            error: insertError.message,
          });
          continue;
        }

        results.successful.push({
          ...parsedUser,
          user_id: authData.user.id,
          password: userData.password || '',
        });
      } catch (error) {
        results.failed.push({
          ...parsedUser,
          error:
            error instanceof Error
              ? error.message
              : '予期しないエラーが発生しました',
        });
      }
    }

    return NextResponse.json({
      message: `${results.successful.length}件のユーザーを作成しました`,
      results,
    });
  } catch (error) {
    console.error('バルクユーザー作成エラー:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'ユーザー一括作成に失敗しました',
      },
      { status: 500 },
    );
  }
}
