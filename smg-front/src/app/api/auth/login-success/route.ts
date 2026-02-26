import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import sgMail from '@sendgrid/mail';

// SendGrid 設定
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');
const SENDER_EMAIL = process.env.SENDGRID_SENDER_EMAIL || '';

async function sendLoginSuccessEmail(
  userEmail: string,
  username?: string
) {
  try {
    const subject = 'ログインが完了しました - SMG経営塾';
    const displayName = username || userEmail;
    
    const plainText = `${displayName}様

SMG経営塾へのログインが完了しました。
`;

    // HTML ではなくテキストのみを送信したいため、plainText のみ利用
    
    console.log('SendGrid login success email payload:', {
      to: userEmail,
      from: SENDER_EMAIL,
      subject,
    });

    await sgMail.send({
      to: userEmail,
      from: SENDER_EMAIL,
      subject,
      text: plainText,
    });

    console.log('ログイン成功メール送信完了:', userEmail);
    return true;
  } catch (err) {
    console.error('ログイン成功メール送信失敗:', err);
    return false;
  }
}

// 新規ユーザー登録完了時のみ使用されるAPI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    // 必須パラメータの検証
    if (!userId) {
      return NextResponse.json(
        { error: 'ユーザーIDが必要です' },
        { status: 400 }
      );
    }

    // ユーザー情報を取得
    const supabase = createClient();
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

    // メール送信
    const success = await sendLoginSuccessEmail(
      userData.email,
      userData.username ?? undefined
    );

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'ログイン成功メールが送信されました',
      });
    } else {
      return NextResponse.json(
        { error: 'メール送信に失敗しました' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('ログイン成功メール送信APIエラー:', error);
    return NextResponse.json(
      { error: 'メール送信処理に失敗しました' },
      { status: 500 }
    );
  }
} 