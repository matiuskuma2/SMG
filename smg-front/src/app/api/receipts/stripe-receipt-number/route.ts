import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: '2020-08-27' as any,
});

export async function POST(request: NextRequest) {
	console.log('=== Stripe領収書番号取得API (POST) 開始 ===');
	
	try {
		const { stripe_payment_intent_id } = await request.json();
		console.log('受信したPayment Intent ID:', stripe_payment_intent_id);

		if (!stripe_payment_intent_id) {
			console.log('❌ Payment Intent IDが未提供');
			return NextResponse.json(
				{ error: 'Stripe Payment Intent IDが必要です' },
				{ status: 400 }
			);
		}

		console.log('🔄 Stripe APIから領収書番号を取得中...');
		const result = await getReceiptNumber(stripe_payment_intent_id);
		console.log('✅ 領収書番号取得完了');
		
		return result;
	} catch (error) {
		console.error('❌ Stripe領収書番号取得エラー:', error);
		return NextResponse.json(
			{ error: 'Stripe APIエラーが発生しました' },
			{ status: 500 }
		);
	}
}

// 領収書番号を確定させる関数
async function ensureReceiptNumber(paymentIntentId: string, charge: Stripe.Charge): Promise<string | null> {
	console.log('🔄 領収書番号確定処理開始');
	
	// 既に領収書番号がある場合は一度確認
	if (charge.receipt_number) {
		console.log('領収書番号が既に存在:', charge.receipt_number);
		return charge.receipt_number;
	}
	
	// receipt_urlがある場合は番号確定のためにアクセス
	if (charge.receipt_url) {
		console.log('🔄 領収書URLにアクセスして番号を確定中...', charge.receipt_url);
		
		try {
			// 領収書URLに軽いリクエストを送信（番号確定のため）
			const response = await fetch(charge.receipt_url, {
				method: 'HEAD',
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
				}
			});
			
			console.log('領収書URLアクセス結果:', response.status);
			
			// 少し待機してから再取得
			await new Promise(resolve => setTimeout(resolve, 1000));
			
		} catch (error) {
			console.log('⚠️ 領収書URLアクセス中にエラー:', error);
			// エラーが発生してもそのまま処理を続行
		}
	}
	
	// 領収書番号を確定させるために再度Chargeを取得
	console.log('🔄 番号確定のため再度Chargeを取得中...');
	try {
		const updatedCharge = await stripe.charges.retrieve(charge.id);
		
		console.log('更新されたCharge情報:', {
			id: updatedCharge.id,
			receipt_number: updatedCharge.receipt_number,
			receipt_url: updatedCharge.receipt_url
		});
		
		if (updatedCharge.receipt_number) {
			console.log('✅ 領収書番号確定成功:', updatedCharge.receipt_number);
			return updatedCharge.receipt_number;
		}
	} catch (error) {
		console.error('❌ Charge再取得中にエラー:', error);
	}
	
	// 最後の手段として、chargesを再度取得
	console.log('🔄 Chargesを再度取得して領収書番号を確認中...');
	try {
		const finalCharges = await stripe.charges.list({
			payment_intent: paymentIntentId,
			limit: 1,
		});
		
		const updatedCharge = finalCharges.data[0];
		
		if (updatedCharge?.receipt_number) {
			console.log('✅ Charges再取得で領収書番号確定:', updatedCharge.receipt_number);
			return updatedCharge.receipt_number;
		}
	} catch (error) {
		console.error('❌ Charges再取得中にエラー:', error);
	}
	
	console.log('❌ 領収書番号の確定に失敗');
	return null;
}

// フォールバック領収書番号生成関数
function generateFallbackReceiptNumber(charge: Stripe.Charge, paymentIntent: Stripe.PaymentIntent): string {
	// ChargeIDの最後の8文字を取得
	const chargeId = charge.id.slice(-8).toUpperCase();
	
	// 作成日時を取得
	const createdDate = new Date(paymentIntent.created * 1000);
	const year = createdDate.getFullYear().toString().slice(-2);
	const month = String(createdDate.getMonth() + 1).padStart(2, '0');
	const day = String(createdDate.getDate()).padStart(2, '0');
	
	// 領収書番号を生成 (例: FB-241225-ABC12345)
	return `FB-${year}${month}${day}-${chargeId}`;
}



// 領収書番号取得の共通関数
async function getReceiptNumber(paymentIntentId: string) {
	console.log('--- getReceiptNumber 関数開始 ---');
	console.log('取得するPayment Intent ID:', paymentIntentId);
	
	try {
		// Stripe Payment Intentを取得（chargesを展開）
		console.log('🔄 Stripe Payment Intentを取得中...');
		const paymentIntent = await stripe.paymentIntents.retrieve(
			paymentIntentId,
			{
				expand: ['charges.data'],
			}
		);

		console.log('✅ Payment Intent取得成功');
		console.log('Payment Intent情報:', {
			id: paymentIntent.id,
			amount: paymentIntent.amount,
			currency: paymentIntent.currency,
			status: paymentIntent.status,
			created: paymentIntent.created
		});

		if (!paymentIntent) {
			console.log('❌ Payment Intentが見つかりません');
			return NextResponse.json(
				{ error: 'Payment Intentが見つかりません' },
				{ status: 404 }
			);
		}

		// chargesを直接取得
		console.log('🔄 Payment IntentのchargesをAPIから取得中...');
		const charges = await stripe.charges.list({
			payment_intent: paymentIntentId,
			limit: 1,
		});
		
		console.log('Charges list結果:', {
			count: charges.data.length,
			first_charge: charges.data[0]?.id
		});
		
		const charge = charges.data[0];

		console.log('Charge情報:', {
			id: charge?.id,
			status: charge?.status,
			amount: charge?.amount,
			receipt_number: charge?.receipt_number,
			receipt_url: charge?.receipt_url
		});
		
		if (!charge) {
			console.log('❌ Chargeが見つかりません');
			return NextResponse.json(
				{ error: 'Chargeが見つかりません' },
				{ status: 404 }
			);
		}

		// 領収書番号を確定させる処理
		const confirmedReceiptNumber = await ensureReceiptNumber(paymentIntentId, charge);
		
		if (confirmedReceiptNumber) {
			console.log('✅ 領収書番号取得成功:', confirmedReceiptNumber);
			const response = {
				receipt_number: confirmedReceiptNumber,
				payment_intent_id: paymentIntent.id,
				charge_id: charge.id,
				created: paymentIntent.created,
			};
			console.log('レスポンス:', response);
			return NextResponse.json(response);
		} else {
			console.log('❌ 領収書番号が見つかりません (charge.receipt_number is null/undefined)');
			console.log('🔄 フォールバック: ChargeIDベースの領収書番号を生成');
			
			// ChargeIDベースのフォールバック領収書番号を生成
			const fallbackReceiptNumber = generateFallbackReceiptNumber(charge, paymentIntent);
			console.log('フォールバック領収書番号:', fallbackReceiptNumber);
			
			const response = {
				receipt_number: fallbackReceiptNumber,
				payment_intent_id: paymentIntent.id,
				charge_id: charge.id,
				created: paymentIntent.created,
				is_fallback: true,
			};
			console.log('フォールバックレスポンス:', response);
			return NextResponse.json(response);
		}
	} catch (error) {
		console.error('❌ getReceiptNumber内でエラー:', error);
		throw error;
	}
} 