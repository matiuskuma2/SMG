'use client';

import { createClient } from '@/lib/supabase';
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
	const [isChecking, setIsChecking] = useState(true);
	const [showResendForm, setShowResendForm] = useState(false);
	const [resendEmail, setResendEmail] = useState('');
	const [resendMessage, setResendMessage] = useState('');
	const [isResending, setIsResending] = useState(false);
	const supabase = createClient();

	// パスワードリセットメール再送信
	const handleResend = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsResending(true);
		setResendMessage('');
		try {
			const { error } = await supabase.auth.resetPasswordForEmail(resendEmail, {
				redirectTo: `${window.location.origin}/reset-password`,
			});
			if (error) {
				setResendMessage(`エラー: ${error.message}`);
			} else {
				setResendMessage('パスワードリセットメールを再送信しました。メールをご確認ください。\n※メールのリンクはすぐにタップしてください。');
			}
		} catch {
			setResendMessage('エラーが発生しました。もう一度お試しください。');
		} finally {
			setIsResending(false);
		}
	};

	useEffect(() => {
		const checkSession = async () => {
			try {
				// 0. Supabaseがerrorパラメータ付きでリダイレクトしてきた場合
				//    （例: ?error=access_denied&error_code=otp_expired&error_description=...）
				//    SendGridクリックトラッキング等でOTPが先に消費されると発生
				const errorParam = searchParams.get('error');
				const errorCode = searchParams.get('error_code');
				const errorDescription = searchParams.get('error_description');
				if (errorParam || errorCode) {
					console.error('Supabase redirect error:', { errorParam, errorCode, errorDescription });
					setIsError(true);
					if (errorCode === 'otp_expired') {
						setMessage(
							'パスワードリセットリンクの有効期限が切れています。\nメールのセキュリティスキャン（SendGrid等）によりリンクが先に消費された可能性があります。\n下のフォームからもう一度メールを送信し、届いたらすぐにリンクをタップしてください。',
						);
					} else {
						setMessage(
							`パスワードリセットに失敗しました: ${errorDescription?.replace(/\+/g, ' ') || errorParam || 'Unknown error'}\n下のフォームからもう一度お試しください。`,
						);
					}
					setShowResendForm(true);
					setIsChecking(false);
					return;
				}

				// 1. 既にセッションがある場合（ミドルウェアがcodeを処理済み → リダイレクトでcode削除済み）
				const {
					data: { session },
				} = await supabase.auth.getSession();
				if (session) {
					setIsValidSession(true);
					setIsChecking(false);
					return;
				}

				// 2. PKCEフロー: URLに code パラメータがある場合（ミドルウェアでの処理失敗時のフォールバック）
				const code = searchParams.get('code');
				if (code) {
					const { error } = await supabase.auth.exchangeCodeForSession(code);
					if (!error) {
						setIsValidSession(true);
						setIsChecking(false);
						return;
					}
					console.error('Code exchange error:', error);
					setIsError(true);
					setMessage(
						'リンクの有効期限が切れているか、既に使用済みです。\n下のフォームからパスワードリセットを再度実行してください。',
					);
					setShowResendForm(true);
					setIsChecking(false);
					return;
				}

				// 3. レガシーフロー: URLハッシュフラグメントからトークンを取得
				const hashParams = new URLSearchParams(
					window.location.hash.substring(1),
				);
				const accessToken = hashParams.get('access_token');
				const refreshToken = hashParams.get('refresh_token');
				const type = hashParams.get('type');

				if (accessToken && refreshToken && type === 'recovery') {
					const { error } = await supabase.auth.setSession({
						access_token: accessToken,
						refresh_token: refreshToken,
					});
					if (!error) {
						setIsValidSession(true);
						setIsChecking(false);
						return;
					}
					console.error('Session restore error:', error);
				}

				// 4. クエリパラメータからトークンを取得（旧互換）
				const qAccessToken = searchParams.get('access_token');
				const qRefreshToken = searchParams.get('refresh_token');
				const qType = searchParams.get('type');

				if (qAccessToken && qRefreshToken && qType === 'recovery') {
					const { error } = await supabase.auth.setSession({
						access_token: qAccessToken,
						refresh_token: qRefreshToken,
					});
					if (!error) {
						setIsValidSession(true);
						setIsChecking(false);
						return;
					}
					console.error('Query token session error:', error);
				}

				// どの方法でもセッションが取得できなかった
				setIsError(true);
				setMessage(
					'無効なリンクです。パスワードリセットを再度実行してください。',
				);
				setShowResendForm(true);
			} catch (err) {
				console.error('Session check error:', err);
				setIsError(true);
				setMessage('エラーが発生しました。パスワードリセットを再度実行してください。');
				setShowResendForm(true);
			} finally {
				setIsChecking(false);
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
				setTimeout(async () => {
					// パスワード更新後、ログアウトしてからログインページへ遷移
					await supabase.auth.signOut();
					router.push('/login');
				}, 3000);
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

	if (isChecking) {
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
								whiteSpace: 'pre-line',
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

				{/* パスワードリセット再送信フォーム（エラー時に表示） */}
				{showResendForm && (
					<div className={css({
						mt: '6',
						p: '6',
						bg: 'gray.50',
						borderRadius: 'md',
						border: '1px solid',
						borderColor: 'gray.200',
					})}>
						<h2 className={css({
							fontSize: 'md',
							fontWeight: 'bold',
							mb: '3',
							color: 'gray.700',
						})}>
							パスワードリセットメールを再送信
						</h2>
						<p className={css({
							fontSize: 'xs',
							color: 'gray.500',
							mb: '4',
							whiteSpace: 'pre-line',
						})}>
							{'メールが届いたら、できるだけ早くリンクをタップしてください。\n時間が経つとリンクが無効になる場合があります。'}
						</p>
						<form onSubmit={handleResend} className={css({ spaceY: '3' })}>
							<input
								type="email"
								placeholder="メールアドレス"
								value={resendEmail}
								onChange={(e) => setResendEmail(e.target.value)}
								required
								disabled={isResending}
								className={css({
									w: 'full',
									border: '1px solid',
									borderColor: 'gray.300',
									borderRadius: 'md',
									p: '3',
									fontSize: 'sm',
									_focus: { borderColor: 'blue.500', outline: 'none' },
								})}
							/>
							<button
								type="submit"
								disabled={isResending}
								className={css({
									w: 'full',
									bg: 'blue.500',
									color: 'white',
									py: '2',
									borderRadius: 'md',
									fontSize: 'sm',
									_hover: { bg: 'blue.600' },
									_disabled: { bg: 'gray.400', cursor: 'not-allowed' },
								})}
							>
								{isResending ? '送信中...' : 'リセットメールを再送信'}
							</button>
						</form>
						{resendMessage && (
							<p className={css({
								mt: '3',
								fontSize: 'sm',
								color: resendMessage.startsWith('エラー') ? 'red.600' : 'green.600',
								whiteSpace: 'pre-line',
							})}>
								{resendMessage}
							</p>
						)}
					</div>
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
