import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { email, newPassword } = body;

		if (!email || !newPassword) {
			return NextResponse.json(
				{ error: 'メールアドレスと新しいパスワードが必要です' },
				{ status: 400 }
			);
		}

		if (newPassword.length < 6) {
			return NextResponse.json(
				{ error: 'パスワードは6文字以上である必要があります' },
				{ status: 400 }
			);
		}

		// Admin用Supabaseクライアントを作成
		const adminSupabase = createAdminClient();

		// 対象ユーザーを検索（ページネーションで全ユーザー取得）
		console.log('検索対象メール:', email);
		
		let allUsers: any[] = [];
		let page = 1;
		const perPage = 100; // 1ページあたりの取得数を増やす
		
		while (true) {
			const { data: userData, error: userError } = await adminSupabase.auth.admin.listUsers({
				page: page,
				perPage: perPage
			});
			
			if (userError) {
				console.error('ユーザー検索エラー:', userError);
				return NextResponse.json(
					{ error: 'ユーザー検索エラー', details: userError.message },
					{ status: 500 }
				);
			}
			
			allUsers = allUsers.concat(userData.users);
			
			// 取得したユーザー数がperPageより少ない場合は最後のページ
			if (userData.users.length < perPage) {
				break;
			}
			
			page++;
		}

		console.log('全取得ユーザー数:', allUsers.length);
		
		const targetUser = allUsers.find(user => user.email === email);
		
		if (!targetUser) {
			return NextResponse.json(
				{ 
					error: '指定されたユーザーが見つかりません',
					searchedEmail: email,
					totalUsers: allUsers.length
				},
				{ status: 404 }
			);
		}

		// パスワードを更新
		console.log('ユーザーID:', targetUser.id, 'メール:', targetUser.email);
		
		const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
			targetUser.id,
			{ password: newPassword }
		);

		if (updateError) {
			console.error('パスワード更新エラー:', updateError);
			return NextResponse.json(
				{ error: 'パスワード更新に失敗しました', details: updateError.message },
				{ status: 500 }
			);
		}

		return NextResponse.json(
			{ message: 'パスワードが正常に更新されました' },
			{ status: 200 }
		);

	} catch (error) {
		console.error('パスワード変更エラー:', error);
		return NextResponse.json(
			{ error: 'サーバーエラーが発生しました' },
			{ status: 500 }
		);
	}
}