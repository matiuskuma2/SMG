import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
	try {
		const supabase = createClient();

		// 認証されたユーザーを取得
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json(
				{ error: '認証が必要です' },
				{ status: 401 }
			);
		}

		// フォームデータを取得
		const formData = await request.formData();
		const file = formData.get('file') as File;

		if (!file) {
			return NextResponse.json(
				{ error: 'ファイルが選択されていません' },
				{ status: 400 }
			);
		}

		// ファイルサイズチェック（5MB以下）
		if (file.size > 5 * 1024 * 1024) {
			return NextResponse.json(
				{ error: 'ファイルサイズは5MB以下にしてください' },
				{ status: 400 }
			);
		}

		// ファイル形式チェック
		if (!file.type.startsWith('image/')) {
			return NextResponse.json(
				{ error: '画像ファイルを選択してください' },
				{ status: 400 }
			);
		}

		// ファイル名を生成（ユーザーIDとタイムスタンプを使用）
		const timestamp = Date.now();
		const fileExtension = file.name.split('.').pop();
		const fileName = `${user.id}_${timestamp}.${fileExtension}`;
		const filePath = `icon_image/${fileName}`;

		// 既存のアイコンを削除（もしあれば）
		const { data: existingUser } = await supabase
			.from('mst_user')
			.select('icon')
			.eq('user_id', user.id)
			.single();

		if (existingUser?.icon) {
			// URLからファイルパスを抽出
			const existingIconUrl = existingUser.icon;
			const urlParts = existingIconUrl.split('/');
			const existingFileName = urlParts[urlParts.length - 1];
			const existingFilePath = `icon_image/${existingFileName}`;
			
			// 既存ファイルを削除（エラーは無視）
			await supabase.storage
				.from('user_icon')
				.remove([existingFilePath]);
		}

		// ファイルをArrayBufferに変換
		const arrayBuffer = await file.arrayBuffer();
		const uint8Array = new Uint8Array(arrayBuffer);

		// Supabaseストレージにアップロード
		const { data: uploadData, error: uploadError } = await supabase.storage
			.from('user_icon')
			.upload(filePath, uint8Array, {
				contentType: file.type,
				upsert: true,
			});

		if (uploadError) {
			console.error('ファイルアップロードエラー:', uploadError);
			return NextResponse.json(
				{ error: 'ファイルのアップロードに失敗しました' },
				{ status: 500 }
			);
		}

		// 公開URLを取得
		const { data: urlData } = supabase.storage
			.from('user_icon')
			.getPublicUrl(filePath);

		const publicUrl = urlData.publicUrl;

		// データベースのiconフィールドを更新
		const { error: updateError } = await supabase
			.from('mst_user')
			.update({
				icon: publicUrl,
				updated_at: new Date().toISOString(),
			})
			.eq('user_id', user.id);

		if (updateError) {
			console.error('アイコンURL更新エラー:', updateError);
			return NextResponse.json(
				{ error: 'アイコンURLの更新に失敗しました' },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			message: 'プロフィール画像をアップロードしました',
			iconUrl: publicUrl,
			success: true,
		});

	} catch (error) {
		console.error('API エラー:', error);
		return NextResponse.json(
			{ error: 'サーバーエラーが発生しました' },
			{ status: 500 }
		);
	}
} 