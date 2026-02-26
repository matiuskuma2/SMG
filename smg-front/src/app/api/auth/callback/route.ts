import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  
  if (code) {
    const supabase = createClient();
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      // メール確認が完了したユーザーの場合、mst_userテーブルに挿入
      if (data.user.email_confirmed_at && data.user.email) {
        const userData = data.user.user_metadata;
        
        // 既にmst_userテーブルに存在するかチェック
        const { data: existingUser } = await supabase
          .from('mst_user')
          .select('user_id')
          .eq('user_id', data.user.id)
          .single();
          
        if (!existingUser) {
          // mst_userテーブルに挿入
          const { error: insertError } = await supabase
            .from('mst_user')
            .insert({
              user_id: data.user.id,
              email: data.user.email,
              username: userData?.username || null,
              company_name: userData?.company_name || null,
              company_name_kana: userData?.company_name_kana || null,
              company_address: userData?.company_address || null,
              industry_id: userData?.industry_id || null,
              user_name_kana: userData?.user_name_kana || null,
              nickname: userData?.nickname || null,
              birth_date: userData?.birth_date || null,
              phone_number: userData?.phone_number || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
          if (insertError) {
            console.error('mst_userテーブルへの挿入エラー:', insertError);
          } else {
            // 新規ユーザー登録完了のログイン成功メールを送信
            try {
              await fetch(`${origin}/api/auth/login-success`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: data.user.id,
                }),
              });
              console.log('新規登録完了のログイン成功メールが送信されました');
            } catch (emailError) {
              console.error('新規登録完了のログイン成功メール送信に失敗しました:', emailError);
              // メール送信に失敗しても認証自体は成功しているので、処理は継続
            }
          }
        }
      }
      
      // 認証完了後、適切なページにリダイレクト
      return NextResponse.redirect(`${origin}/login?message=email-confirmed`);
    }
  }

  // エラーの場合
  return NextResponse.redirect(`${origin}/login?error=auth-callback-error`);
} 