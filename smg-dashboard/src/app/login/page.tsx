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

      // まずメールアドレスからユーザー情報とグループを確認
      const { data: userData, error: userError } = await supabase
        .from('mst_user')
        .select(`
          user_id,
          trn_group_user!inner (
            mst_group:group_id (
              title
            )
          )
        `)
        .eq('email', email)
        .is('trn_group_user.deleted_at', null);

      if (userError) {
        console.error('ユーザー情報取得エラー:', userError);
        throw new Error('メールアドレスまたはパスワードが正しくありません');
      }

      if (!userData || userData.length === 0) {
        throw new Error('メールアドレスまたはパスワードが正しくありません');
      }

      // ユーザーのグループをチェック（ログイン前）
      const userGroups = userData[0].trn_group_user;
      let isBlocked = false;
      let blockReason = null;
      let isAuthorized = false;

      // 除外グループのチェック
      for (const groupUser of userGroups) {
        // @ts-ignore
        const groupTitle = groupUser.mst_group?.title;

        if (groupTitle === '未決済') {
          isBlocked = true;
          blockReason = 'unpaid';
          break;
        }
        if (groupTitle === '退会') {
          isBlocked = true;
          blockReason = 'withdrawn';
          break;
        }
        if (groupTitle === 'ユーザー') {
          isBlocked = true;
          blockReason = 'user';
        }
      }

      // ブロック対象の場合、ログインを実行せずにエラーを表示
      if (isBlocked) {
        if (blockReason === 'unpaid') {
          throw new Error(
            '決済エラーのためログインを制限させていただいております',
          );
        }
        if (blockReason === 'withdrawn') {
          throw new Error(
            '退会済みのユーザーのためログインを制限させていただいております',
          );
        }
        if (blockReason === 'user') {
          throw new Error('ユーザーアカウントではログインできません');
        }
      }

      // 許可グループのチェック
      for (const groupUser of userGroups) {
        // @ts-ignore
        const groupTitle = groupUser.mst_group?.title;

        if (groupTitle === '講師' || groupTitle === '運営') {
          isAuthorized = true;
          break;
        }
      }

      if (!isAuthorized) {
        throw new Error('講師または運営スタッフのみログインが許可されています');
      }

      // 権限チェックが通った場合のみログインを実行
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
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
