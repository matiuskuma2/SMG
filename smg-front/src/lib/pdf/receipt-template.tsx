import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import subsetFont from 'subset-font';

// フォントバッファのキャッシュ（初回リクエスト時に遅延読み込み）
let fontCache: { normal: Buffer; bold: Buffer } | null = null;
function getFontBuffers(): { normal: Buffer; bold: Buffer } {
	if (!fontCache) {
		const fontDir = path.join(process.cwd(), 'src/lib/pdf/fonts');
		fontCache = {
			normal: fs.readFileSync(
				path.join(fontDir, 'noto-sans-jp-400.woff'),
			),
			bold: fs.readFileSync(
				path.join(fontDir, 'noto-sans-jp-700.woff'),
			),
		};
		console.log(
			`[PDF] フォント読み込み完了 (normal: ${fontCache.normal.length}B, bold: ${fontCache.bold.length}B)`,
		);
	}
	return fontCache;
}

export interface ReceiptPDFData {
	recipientName: string;
	receiptDate: string;
	receiptNumber: string;
	registrationNumber: string;
	companyName: string;
	companyAddress: string;
	paymentAmount: number;
	description: string;
}

const REGISTRATION_NUMBER = 'T4011101093309';
const COMPANY_NAME = '株式会社えびラーメンとチョコレートモンブランが食べたい';
const COMPANY_ADDRESS = '〒160-0023 東京都新宿区西新宿7−7−25 ３階';

function formatAmount(amount: number): string {
	return amount.toLocaleString();
}

function calculateTax(amount: number): number {
	return Math.floor((amount * 0.1) / 1.1);
}

function formatReceiptDate(paymentDate: string): string {
	if (!paymentDate) {
		const now = new Date();
		return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
	}
	const date = new Date(paymentDate);
	return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

/**
 * PDFに描画される全テキストからユニーク文字を抽出し、
 * サブセット化したフォントバッファを返す
 */
async function getSubsetFonts(data: ReceiptPDFData): Promise<{
	normal: Buffer;
	bold: Buffer;
}> {
	const receiptDate = formatReceiptDate(data.receiptDate);
	const tax = calculateTax(data.paymentAmount);

	const allText = [
		'領収書',
		`${data.recipientName || '　'} 様`,
		`発行日 ${receiptDate}`,
		`領収番号 ${data.receiptNumber}`,
		COMPANY_NAME,
		COMPANY_ADDRESS,
		`登録番号 ${REGISTRATION_NUMBER}`,
		'下記金額を領収いたしました。',
		`¥${formatAmount(data.paymentAmount)}-`,
		'金額(税込)',
		`領収日 ${receiptDate}`,
		`但し${data.description}`,
		'単位: 円',
		'内容',
		'金額',
		'イベント参加費',
		formatAmount(data.paymentAmount),
		`合計 ${formatAmount(data.paymentAmount)}`,
		`(内消費税額10% ${formatAmount(tax)})`,
	].join('');
	const uniqueChars = [...new Set(allText)].join('');

	const fonts = getFontBuffers();
	const [normalSubset, boldSubset] = await Promise.all([
		subsetFont(fonts.normal, uniqueChars, { targetFormat: 'woff' }),
		subsetFont(fonts.bold, uniqueChars, { targetFormat: 'woff' }),
	]);
	console.log(
		`[PDF] サブセット化完了 (normal: ${normalSubset.byteLength}B, bold: ${boldSubset.byteLength}B)`,
	);

	return {
		normal: Buffer.from(normalSubset),
		bold: Buffer.from(boldSubset),
	};
}

// ─── レイアウト定数 ─────────────────────────────
const PAGE_W = 595.28; // A4 width in pt
const MARGIN_H = 50;
const MARGIN_V = 40;
const CONTENT_W = PAGE_W - MARGIN_H * 2;

export async function generateReceiptPDF(
	data: ReceiptPDFData,
): Promise<Buffer> {
	const fonts = await getSubsetFonts(data);
	const receiptDate = formatReceiptDate(data.receiptDate);
	const tax = calculateTax(data.paymentAmount);

	const doc = new PDFDocument({
		size: 'A4',
		margins: { top: MARGIN_V, bottom: MARGIN_V, left: MARGIN_H, right: MARGIN_H },
		info: { Title: '領収書', Author: COMPANY_NAME },
	});

	// フォント登録
	doc.registerFont('NotoSansJP', fonts.normal);
	doc.registerFont('NotoSansJP-Bold', fonts.bold);

	// ─── タイトル ───
	doc.font('NotoSansJP-Bold').fontSize(22);
	doc.text('領収書', MARGIN_H, MARGIN_V, {
		width: CONTENT_W,
		align: 'center',
	});
	doc.moveDown(1);

	// ─── 宛名と会社情報 ───
	const headerY = doc.y;

	// 宛名（左側）
	const recipientBoxW = 230;
	const recipientBoxPad = 9;
	doc
		.save()
		.rect(MARGIN_H, headerY, recipientBoxW, 30)
		.fill('#f2f2f2')
		.restore();
	doc
		.font('NotoSansJP')
		.fontSize(11)
		.fillColor('#000000')
		.text(
			`${data.recipientName || '　'} 様`,
			MARGIN_H + recipientBoxPad,
			headerY + recipientBoxPad,
			{ width: recipientBoxW - recipientBoxPad * 2 },
		);

	// 会社情報（右側）
	const rightX = MARGIN_H;
	const rightW = CONTENT_W;
	let ry = headerY;
	doc.font('NotoSansJP').fontSize(9);
	doc.text(`発行日 ${receiptDate}`, rightX, ry, {
		width: rightW,
		align: 'right',
	});
	ry += 14;
	doc.text(`領収番号 ${data.receiptNumber}`, rightX, ry, {
		width: rightW,
		align: 'right',
	});
	ry += 14;
	doc.font('NotoSansJP-Bold').fontSize(9);
	doc.text(COMPANY_NAME, rightX, ry, { width: rightW, align: 'right' });
	ry += 14;
	doc.font('NotoSansJP').fontSize(9);
	doc.text(COMPANY_ADDRESS, rightX, ry, { width: rightW, align: 'right' });
	ry += 14;
	doc.text(`登録番号 ${REGISTRATION_NUMBER}`, rightX, ry, {
		width: rightW,
		align: 'right',
	});
	ry += 14;

	// ─── 金額セクション ───
	const amountY = Math.max(doc.y, ry) + 24;
	doc.font('NotoSansJP').fontSize(10);
	doc.text('下記金額を領収いたしました。', MARGIN_H, amountY, {
		width: CONTENT_W,
		align: 'center',
	});
	doc.moveDown(1);
	doc.font('NotoSansJP-Bold').fontSize(22);
	doc.text(`¥${formatAmount(data.paymentAmount)}-`, MARGIN_H, doc.y, {
		width: CONTENT_W,
		align: 'center',
	});
	doc.moveDown(1);

	// ─── 明細行（金額・領収日・但し書き）───
	const detailY = doc.y;
	doc.font('NotoSansJP-Bold').fontSize(9);
	doc.text('金額(税込)', MARGIN_H, detailY);
	doc.font('NotoSansJP').fontSize(9);
	doc.text(`領収日 ${receiptDate}`, MARGIN_H + CONTENT_W * 0.35, detailY);
	doc.text(
		`但し${data.description}`,
		MARGIN_H + CONTENT_W * 0.65,
		detailY,
	);
	const detailBottomY = doc.y + 9;
	doc
		.moveTo(MARGIN_H, detailBottomY)
		.lineTo(MARGIN_H + CONTENT_W, detailBottomY)
		.strokeColor('#eaeaea')
		.stroke();

	// ─── テーブル ───
	const tableY = detailBottomY + 18;
	doc.font('NotoSansJP').fontSize(9);
	doc.text('単位: 円', MARGIN_H, tableY, {
		width: CONTENT_W,
		align: 'right',
	});

	const thY = doc.y + 4;
	// ヘッダー罫線（上）
	doc
		.moveTo(MARGIN_H, thY)
		.lineTo(MARGIN_H + CONTENT_W, thY)
		.strokeColor('#eaeaea')
		.stroke();
	const thTextY = thY + 9;
	doc.font('NotoSansJP-Bold').fontSize(10);
	doc.text('内容', MARGIN_H + 9, thTextY, { width: CONTENT_W / 2 - 9 });
	doc.text('金額', MARGIN_H + CONTENT_W / 2, thTextY, {
		width: CONTENT_W / 2 - 9,
		align: 'right',
	});
	const thBottomY = thTextY + 18;
	// ヘッダー罫線（下）
	doc
		.moveTo(MARGIN_H, thBottomY)
		.lineTo(MARGIN_H + CONTENT_W, thBottomY)
		.strokeColor('#eaeaea')
		.stroke();

	// データ行
	const trTextY = thBottomY + 9;
	doc.font('NotoSansJP').fontSize(10);
	doc.text('イベント参加費', MARGIN_H + 9, trTextY, {
		width: CONTENT_W / 2 - 9,
	});
	doc.text(formatAmount(data.paymentAmount), MARGIN_H + CONTENT_W / 2, trTextY, {
		width: CONTENT_W / 2 - 9,
		align: 'right',
	});
	const trBottomY = trTextY + 18;
	doc
		.moveTo(MARGIN_H, trBottomY)
		.lineTo(MARGIN_H + CONTENT_W, trBottomY)
		.strokeColor('#eaeaea')
		.stroke();

	// ─── 合計金額 ───
	const totalY = trBottomY + 10;
	doc.font('NotoSansJP-Bold').fontSize(11);
	doc.text(`合計 ${formatAmount(data.paymentAmount)}`, MARGIN_H, totalY, {
		width: CONTENT_W,
		align: 'right',
	});
	doc.font('NotoSansJP').fontSize(9).fillColor('#6b7280');
	doc.text(`(内消費税額10% ${formatAmount(tax)})`, MARGIN_H, doc.y + 3, {
		width: CONTENT_W,
		align: 'right',
	});

	// ─── PDF出力 ───
	doc.end();

	const chunks: Buffer[] = [];
	for await (const chunk of doc) {
		chunks.push(
			typeof chunk === 'string' ? Buffer.from(chunk) : Buffer.from(chunk),
		);
	}
	const result = Buffer.concat(chunks);
	console.log(`[PDF] 生成完了 サイズ: ${(result.length / 1024).toFixed(0)}KB`);
	return result;
}

export { REGISTRATION_NUMBER, COMPANY_NAME, COMPANY_ADDRESS };
