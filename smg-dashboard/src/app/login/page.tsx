'use client';

import { createClient } from '@/lib/supabase/client';
import { css } from '@/styled-system/css';
import { Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

// 英語エラーメッセージを日本語に変換する関数を追加
function translateLoginError(message: string): string {
  if (!message) return 'ログイン中にエラーが発生しました';
  if (message.includes('Invalid login credentials'))
    return 'メールアドレスまたはパスワードが正しくありません';
  if (message.includes('Email not confirmed'))
    return 'メールアドレスが確認されていません。確認メールをご確認ください';
  if (
    message.includes('email rate limit exceeded') ||
    message.includes('over_email_send_rate_limit')
  )
    return 'メールの送信制限を超えました。しばらく待ってから再試行してください。';
  if (message.includes('Password should be at least 6 characters'))
    return 'パスワードは6文字以上である必要があります';
  return message;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // 自動ログアウト時のページリロード処理
  useEffect(() => {
    const autoLogout = searchParams.get('auto-logout');
    if (autoLogout === 'true') {
      // クエリパラメータをクリアして完全リロード
      window.history.replaceState({}, '', '/login');
      window.location.reload();
    }
  }, [searchParams]);

  const handlePasswordReset = () => {
    router.push('/forgotPassword');
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();

      // まずログインを実行（RLSにより未認証状態ではmst_userを読めないため）
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // ログイン成功後、ユーザーのグループを確認
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('ユーザー情報の取得に失敗しました');
      }

      // サーバーサイドAPIでグループチェック（service_roleキーでRLSをバイパス）
      const checkResponse = await fetch('/api/auth/check-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const checkResult = await checkResponse.json();

      if (!checkResponse.ok) {
        await supabase.auth.signOut();
        throw new Error(checkResult.error || 'グループ情報の取得に失敗しました');
      }

      if (!checkResult.authorized) {
        await supabase.auth.signOut();
        throw new Error(checkResult.message);
      }

      router.refresh();
      window.location.href = '/userlist';
    } catch (err: unknown) {
      console.error('ログインエラー:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'ログイン中にエラーが発生しました';
      setLoginError(
        translateLoginError(errorMessage) || 'ログイン中にエラーが発生しました',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={css({
        minH: 'screen',
        display: 'flex',
        flexDir: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: '4',
        bg: 'white',
      })}
    >
      <div
        className={css({
          w: 'full',
          maxW: 'md',
        })}
      >
        <div
          className={css({
            display: 'flex',
            justifyContent: 'center',
            mb: '8',
          })}
        >
          <Image
            src="/smg-logo-login.png"
            alt="SMG経営塾"
            width={400}
            height={100}
            className={css({
              h: 'auto',
            })}
          />
        </div>

        <h1
          className={css({
            fontSize: '2xl',
            fontWeight: 'bold',
            textAlign: 'center',
            mb: '8',
          })}
        >
          ログイン
        </h1>

        <form onSubmit={handleLogin} className={css({ spaceY: '6' })}>
          {loginError && (
            <div
              className={css({
                bg: 'red.50',
                color: 'red.600',
                p: '3',
                borderRadius: 'md',
                fontSize: 'sm',
              })}
            >
              {loginError}
            </div>
          )}

          <div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="メールアドレス"
              className={css({
                w: 'full',
                borderBottom: '1px solid',
                borderColor: 'gray.300',
                py: '2',
                _focus: {
                  outline: 'none',
                  borderColor: 'gray.500',
                },
              })}
              required
            />
          </div>

          <div>
            <div className={css({ position: 'relative' })}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワード"
                className={css({
                  w: 'full',
                  borderBottom: '1px solid',
                  borderColor: 'gray.300',
                  py: '2',
                  _focus: {
                    outline: 'none',
                    borderColor: 'gray.500',
                  },
                })}
                required
              />
              <button
                type="button"
                className={css({
                  position: 'absolute',
                  right: '2',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'gray.500',
                })}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className={css({ display: 'flex', justifyContent: 'center' })}>
            <button
              type="submit"
              className={css({
                w: '4/5',
                bg: 'gray.500',
                color: 'white',
                py: '3',
                borderRadius: 'md',
                _hover: {
                  bg: 'gray.600',
                },
                _disabled: {
                  opacity: 0.6,
                  cursor: 'not-allowed',
                },
              })}
              disabled={isLoading}
            >
              {isLoading ? 'ログイン中...' : 'メールでログイン'}
            </button>
          </div>

          <div className={css({ textAlign: 'center' })}>
            <button
              type="button"
              onClick={handlePasswordReset}
              className={css({
                fontSize: 'xs',
                color: 'gray.500',
                textDecoration: 'underline',
                cursor: 'pointer',
                bg: 'transparent',
                border: 'none',
                _hover: {
                  color: 'gray.700',
                },
              })}
            >
              パスワードを忘れた場合
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
