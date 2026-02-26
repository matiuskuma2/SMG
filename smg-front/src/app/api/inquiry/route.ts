import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
	try {
		const supabase = createClient();

		// ユーザー認証チェック
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
		}

		// リクエストボディから内容を取得
		const { content } = await request.json();

		if (!content || !content.trim()) {
			return NextResponse.json(
				{ error: 'お問い合わせ内容を入力してください。' },
				{ status: 400 },
			);
		}

		// ユーザーのスレッドを取得または作成
		let threadId: string;

		// 既存のスレッドを確認
		const { data: existingThread } = await supabase
			.from('mst_dm_thread')
			.select('thread_id')
			.eq('user_id', user.id)
			.is('deleted_at', null)
			.order('created_at', { ascending: false })
			.limit(1)
			.single();

		if (existingThread) {
			threadId = existingThread.thread_id;
		} else {
			// スレッドが存在しない場合は新規作成
			const { data: newThread, error: threadError } = await supabase
				.from('mst_dm_thread')
				.insert([{ user_id: user.id }])
				.select('thread_id')
				.single();

			if (threadError || !newThread) {
				console.error('スレッド作成エラー:', threadError);
				return NextResponse.json(
					{ error: 'スレッドの作成に失敗しました。' },
					{ status: 500 },
				);
			}

			threadId = newThread.thread_id;
		}

		// お問い合わせメッセージを作成
		const { data: message, error: messageError } = await supabase
			.from('trn_dm_message')
			.insert([
				{
					thread_id: threadId,
					user_id: user.id,
					content: content.trim(),
					is_sent: true,
					is_inquiry: true, // お問い合わせフラグをtrueに設定
				},
			])
			.select()
			.single();

		if (messageError || !message) {
			console.error('メッセージ作成エラー:', messageError);
			return NextResponse.json(
				{ error: 'お問い合わせの送信に失敗しました。' },
				{ status: 500 },
			);
		}

		return NextResponse.json(
			{
				success: true,
				message: 'お問い合わせを送信しました。',
				data: message,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error('お問い合わせAPIエラー:', error);
		return NextResponse.json(
			{ error: 'サーバーエラーが発生しました。' },
			{ status: 500 },
		);
	}
}
