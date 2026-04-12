import { getAuthenticatedUser } from '@/lib/auth-helper';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface SmoothInAPIResponse {
	success: boolean;
	data?: {
		qr_token: string;
		qr_image_mime: string;
		qr_image: string;
	};
	message: string;
}

export async function GET() {
	try {
		// 認証（Cookie or Bearer 両対応）
		const authResult = await getAuthenticatedUser();
		if (authResult.error) {
			return NextResponse.json(
				{ error: authResult.error },
				{ status: authResult.status }
			);
		}

		// ユーザーのメールアドレスを取得
		const email = authResult.email;
		if (!email) {
			return NextResponse.json(
				{ error: 'メールアドレスが見つかりません' },
				{ status: 400 }
			);
		}

		// 環境変数からAPIトークンを取得
		const apiToken = process.env.SMOOTHIN_API_TOKEN;
		if (!apiToken) {
			console.error('SMOOTHIN_API_TOKEN is not configured');
			return NextResponse.json(
				{ error: 'サーバー設定エラー' },
				{ status: 500 }
			);
		}

		// 外部APIにリクエスト
		const apiUrl = `https://smoothin.tech/api/get_qr_by_email.php?email=${encodeURIComponent(email)}&include_image=1`;

		const response = await fetch(apiUrl, {
			method: 'GET',
			headers: {
				'X-API-TOKEN': apiToken,
			},
		});

		const data: SmoothInAPIResponse = await response.json();

		if (!response.ok) {
			// 404: 該当する会員が見つからない
			if (response.status === 404) {
				return NextResponse.json(
					{
						success: false,
						error: 'QRコードが見つかりません',
						message: data.message || '該当する参加予定が見つかりません'
					},
					{ status: 404 }
				);
			}

			// 401: 認証エラー
			if (response.status === 401) {
				console.error('SmoothIn API authentication error:', data.message);
				return NextResponse.json(
					{
						success: false,
						error: 'APIの認証に失敗しました'
					},
					{ status: 500 }
				);
			}

			// その他のエラー
			return NextResponse.json(
				{
					success: false,
					error: 'QRコードの取得に失敗しました',
					message: data.message
				},
				{ status: response.status }
			);
		}

		// 成功レスポンス
		if (data.success && data.data) {
			return NextResponse.json({
				success: true,
				qrImage: data.data.qr_image,
				qrToken: data.data.qr_token,
			});
		}

		return NextResponse.json(
			{
				success: false,
				error: 'QRコードの取得に失敗しました'
			},
			{ status: 500 }
		);

	} catch (error) {
		console.error('QR Code API error:', error);
		return NextResponse.json(
			{ error: 'サーバーエラーが発生しました' },
			{ status: 500 }
		);
	}
}
