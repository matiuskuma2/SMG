import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import sgMail from '@sendgrid/mail';
import {
  generateReceiptPDF,
  type ReceiptPDFData,
} from '@/lib/pdf/receipt-template';

// SendGrid 設定
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');
const SENDER_EMAIL = process.env.SENDGRID_SENDER_EMAIL || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, userId, recipientName, receiptNumber, fileName } = body;

    // 必須パラメータの検証
    if (!eventId || !userId || !recipientName || !receiptNumber || !fileName) {
      return NextResponse.json(
        { error: '必須パラメータが不足しています' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // ユーザー情報を取得
    const { data: userData, error: userError } = await supabase
      .from('mst_user')
      .select('email, username')
      .eq('user_id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'ユーザー情報の取得に失敗しました' },
        { status: 404 }
      );
    }

    // 支払い情報を取得
    const { data: attendeeData, error: attendeeError } = await supabase
      .from('trn_gather_attendee')
      .select(`
        payment_amount,
        payment_date,
        mst_event (
          event_name
        )
      `)
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (attendeeError || !attendeeData) {
      return NextResponse.json(
        { error: '支払い情報が見つかりません' },
        { status: 404 }
      );
    }

    // サーバーサイドでPDFを生成
    const pdfData: ReceiptPDFData = {
      recipientName,
      receiptDate: attendeeData.payment_date || '',
      receiptNumber,
      registrationNumber: 'T4011101093309',
      companyName: '株式会社えびラーメンとチョコレートモンブランが食べたい',
      companyAddress: '〒160-0023 東京都新宿区西新宿7−7−25 ３階',
      paymentAmount: attendeeData.payment_amount || 0,
      description: 'イベント参加費として',
    };

    const pdfBuffer = await generateReceiptPDF(pdfData);
    const pdfBase64 = pdfBuffer.toString('base64');

    // メール送信
    const subject = `【SMG経営塾】イベント参加費 領収書`;
    const plainText = `${recipientName}様

いつもSMG経営塾をご利用いただき、ありがとうございます。

「イベント参加費」の領収書を添付いたします。
`;

    await sgMail.send({
      to: userData.email,
      from: SENDER_EMAIL,
      subject,
      text: plainText,
      attachments: [
        {
          content: pdfBase64,
          filename: fileName,
          type: 'application/pdf',
          disposition: 'attachment',
        },
      ],
    });

    console.log('領収書メール送信完了:', userData.email);

    return NextResponse.json({
      success: true,
      message: '領収書をメールで送信しました',
    });

  } catch (error) {
    console.error('領収書メール送信エラー:', error);
    return NextResponse.json(
      { error: '領収書の送信に失敗しました' },
      { status: 500 }
    );
  }
}