import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/auth-helper';
import {
	generateReceiptPDF,
	type ReceiptPDFData,
} from '@/lib/pdf/receipt-template';

export async function POST(request: NextRequest) {
	try {
		// 認証 + Supabaseクライアント取得（Cookie or Bearer 両対応）
		const authResult = await getAuthenticatedClient();
		if (authResult.error) {
			return NextResponse.json(
				{ error: authResult.error },
				{ status: authResult.status },
			);
		}
		const { client: supabase, userId } = authResult;

		const body = await request.json();
		const { eventId, recipientName, receiptNumber } = body;

		if (!eventId || !recipientName || !receiptNumber) {
			return NextResponse.json(
				{ error: '必須パラメータが不足しています' },
				{ status: 400 },
			);
		}

		// 支払い情報を取得（金額はサーバー側で取得して改ざん防止）
		// Bearer経路(RLSバイパス)でも認証ユーザー本人のレコードのみ取得するよう
		// .eq('user_id', userId) で明示的にフィルタ
		const { data, error } = await supabase
			.from('trn_gather_attendee')
			.select(
				`
				event_id,
				payment_amount,
				payment_date,
				mst_event (
					event_name
				)
			`,
			)
			.eq('event_id', eventId)
			.eq('user_id', userId)
			.is('deleted_at', null)
			.single();

		if (error || !data) {
			return NextResponse.json(
				{ error: '支払い情報が見つかりません' },
				{ status: 404 },
			);
		}

		const pdfData: ReceiptPDFData = {
			recipientName,
			receiptDate: data.payment_date || '',
			receiptNumber,
			registrationNumber: 'T4011101093309',
			companyName:
				'株式会社えびラーメンとチョコレートモンブランが食べたい',
			companyAddress: '〒160-0023 東京都新宿区西新宿7−7−25 ３階',
			paymentAmount: data.payment_amount || 0,
			description: 'イベント参加費として',
		};

		const pdfBuffer = await generateReceiptPDF(pdfData);

		const fileName = `領収書_イベント参加費_${new Date().toISOString().split('T')[0]}.pdf`;

		return new Response(new Uint8Array(pdfBuffer), {
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
			},
		});
	} catch (error) {
		console.error('PDF生成エラー:', error);
		return NextResponse.json(
			{ error: 'PDFの生成に失敗しました' },
			{ status: 500 },
		);
	}
}
