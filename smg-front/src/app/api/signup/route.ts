import { createClient } from '@/lib/supabase-server';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const userData = await request.json();

    // クライアント側でのユーザー作成（メール認証が必要）
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        // リダイレクト先は環境変数から動的に組み立てる
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback`,
        data: {
          username: userData.username,
          // メール認証完了後に使用するための一時的なユーザー情報を保存
          company_name: userData.company_name,
          company_name_kana: userData.company_name_kana,
          company_address: userData.company_address,
          industry_id: userData.industry_id || null,
          user_name_kana: userData.user_name_kana,
          nickname: userData.nickname,
          birth_date: userData.birth_date,
          phone_number: userData.phone_number,
        }
      }
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // 重複登録チェック：identitiesが空の場合、メールアドレスは既に存在し確認済み
    if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
      console.log('重複登録検知: 確認済みユーザー', { 
        email: userData.email, 
        user_id: authData.user.id,
        identities_count: authData.user.identities.length 
      });
      return NextResponse.json({ 
        error: 'このメールアドレスは既に登録されています。ログインしてください。' 
      }, { status: 400 });
    }

    // 未確認ユーザーの場合の処理
    if (authData.user && authData.user.identities && authData.user.identities.length > 0) {
      // 既存の未確認ユーザーかどうかをチェック
      const existingUser = authData.user.created_at;
      const now = new Date();
      const createdAt = new Date(existingUser);
      const timeDiff = now.getTime() - createdAt.getTime();
      
      console.log('ユーザー作成時間チェック', { 
        email: userData.email, 
        user_id: authData.user.id,
        created_at: existingUser,
        time_diff_ms: timeDiff,
        identities_count: authData.user.identities.length 
      });
      
      // 作成から1分以上経っている場合は、既存の未確認ユーザーの可能性
      if (timeDiff > 60000) { // 1分 = 60,000ms
        console.log('未確認ユーザーの再登録検知:', { 
          email: userData.email, 
          user_id: authData.user.id 
        });
        return NextResponse.json({ 
          message: 'このメールアドレスとパスワードは既に登録されていますが、メール認証が完了していません。メールを確認して認証を完了してください。新しい認証メールが送信されました。',
          user: authData.user 
        });
      }
    }

    // 注意: mst_userテーブルへの挿入は認証完了後に/api/auth/callbackで行う
    // 認証が完了すると、Supabaseのauth.users.confirmed_atが更新される
    // この時点では、ユーザーはメール認証待ちの状態

    return NextResponse.json({ 
      message: '認証メールを送信しました。メールを確認して認証を完了してください。',
      user: authData.user 
    });
  } catch (error) {
    console.error('ユーザー登録エラー:', error);
    return NextResponse.json(
      { error: 'ユーザー登録に失敗しました' },
      { status: 500 }
    );
  }
} 