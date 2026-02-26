'use client';

import { createClient } from '@/lib/supabase/client';
import { css } from '@/styled-system/css';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // URLからセッション情報を確認
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setIsValidSession(true);
      } else {
        // トークンをチェック
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const type = searchParams.get('type');

        if (accessToken && refreshToken && type === 'recovery') {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!error) {
            setIsValidSession(true);
          } else {
            setIsError(true);
            setMessage('セッションの復元に失敗しました。');
          }
        } else {
          setIsError(true);
          setMessage(
            '無効なリンクです。パスワードリセットを再度実行してください。',
          );
        }
      }
    };

    checkSession();
  }, [searchParams, supabase.auth]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setIsError(true);
      setMessage('パスワードが一致しません。');
      return;
    }

    if (password.length < 6) {
      setIsError(true);
      setMessage('パスワードは6文字以上で入力してください。');
      return;
    }

    setIsLoading(true);
    setMessage('');
    setIsError(false);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setIsError(true);
        setMessage(error.message);
      } else {
        setMessage(
          'パスワードが正常に更新されました。ログインページにリダイレクトします。',
        );
        // パスワード更新後、サインアウトしてからログインページへ遷移
        await supabase.auth.signOut();
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (error) {
      setIsError(true);
      setMessage('エラーが発生しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push('/login');
  };

  if (!isValidSession && !isError) {
    return (
      <div
        className={css({
          minH: 'screen',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: '4',
          bg: 'white',
        })}
      >
        <div className={css({ textAlign: 'center' })}>
          <p>セッションを確認中...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={css({
        minH: 'screen',
        display: 'flex',
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
          bg: 'white',
          p: '8',
          borderRadius: 'lg',
        })}
      >
        <h1
          className={css({
            fontSize: '2xl',
            fontWeight: 'bold',
            textAlign: 'center',
            mb: '8',
          })}
        >
          新しいパスワード設定
        </h1>

        {message && (
          <div
            className={css({
              mb: '6',
              p: '4',
              borderRadius: 'md',
              bg: isError ? 'red.50' : 'green.50',
              border: '1px solid',
              borderColor: isError ? 'red.200' : 'green.200',
            })}
          >
            <p
              className={css({
                fontSize: 'sm',
                color: isError ? 'red.700' : 'green.700',
              })}
            >
              {message}
            </p>
          </div>
        )}

        {isValidSession && (
          <form onSubmit={handleSubmit} className={css({ spaceY: '6' })}>
            <div>
              <label
                htmlFor="password"
                className={css({
                  display: 'block',
                  mb: '2',
                  fontSize: 'sm',
                  color: 'gray.700',
                  fontWeight: 'medium',
                })}
              >
                新しいパスワード
              </label>
              <input
                type="password"
                id="password"
                placeholder="新しいパスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className={css({
                  w: 'full',
                  border: '1px solid',
                  borderColor: 'gray.300',
                  borderRadius: 'md',
                  p: '3',
                  _focus: {
                    borderColor: 'gray.500',
                    outline: 'none',
                  },
                  _disabled: {
                    bg: 'gray.100',
                    cursor: 'not-allowed',
                  },
                })}
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className={css({
                  display: 'block',
                  mb: '2',
                  fontSize: 'sm',
                  color: 'gray.700',
                  fontWeight: 'medium',
                })}
              >
                パスワード確認
              </label>
              <input
                type="password"
                id="confirmPassword"
                placeholder="パスワードを再入力"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                className={css({
                  w: 'full',
                  border: '1px solid',
                  borderColor: 'gray.300',
                  borderRadius: 'md',
                  p: '3',
                  _focus: {
                    borderColor: 'gray.500',
                    outline: 'none',
                  },
                  _disabled: {
                    bg: 'gray.100',
                    cursor: 'not-allowed',
                  },
                })}
              />
            </div>

            <div className={css({ textAlign: 'center' })}>
              <button
                type="submit"
                disabled={isLoading}
                className={css({
                  bg: 'blue.500',
                  color: 'white',
                  py: '3',
                  px: '8',
                  borderRadius: 'md',
                  _hover: {
                    bg: 'blue.600',
                  },
                  _disabled: {
                    bg: 'gray.400',
                    cursor: 'not-allowed',
                  },
                })}
              >
                {isLoading ? 'パスワード更新中...' : 'パスワードを更新'}
              </button>
            </div>
          </form>
        )}

        <div className={css({ textAlign: 'center', mt: '4' })}>
          <button
            type="button"
            onClick={handleBackToLogin}
            disabled={isLoading}
            className={css({
              color: 'gray.500',
              textDecoration: 'underline',
              fontSize: 'xs',
              _hover: {
                color: 'gray.600',
              },
              _disabled: {
                cursor: 'not-allowed',
              },
            })}
          >
            ログイン画面に戻る
          </button>
        </div>
      </div>
    </div>
  );
}
