'use client';

import { createClient } from '@/lib/supabase';
import { css } from '@/styled-system/css';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

/**
 * reset-password ページ
 *
 * このページは以下のケースで使用される:
 * 1. 旧リンク式: メールのリンクをクリック → ?code=xxx でリダイレクト → PKCE交換でセッション確立
 * 2. 旧リンク式エラー: Supabaseが ?error=access_denied&error_code=otp_expired でリダイレクト
 * 3. OTPコード入力式のフォールバック: forgotPasswordページが使えない場合の代替
 *
 * メインの新フローは forgotPassword ページで完結する。
 */
export default function ResetPasswordPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const supabase = createClient();

	const [step, setStep] = useState<'checking' | 'otp' | 'newPassword' | 'error'>('checking');
	const [email, setEmail] = useState('');
	const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '', '', '']);
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState('');
	const [isError, setIsError] = useState(false);

	const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

	useEffect(() => {
		const checkSession = async () => {
			try {
				// Supabaseがerrorパラメータ付きでリダイレクトしてきた場合
				const errorCode = searchParams.get('error_code');
				const errorDescription = searchParams.get('error_description');
				if (errorCode) {
					setStep('otp');
					setIsError(true);
					if (errorCode === 'otp_expired') {
						setMessage(
							'リンクの有効期限が切れています。\nメールアドレスを入力し、新しい確認コードを取得してください。',
						);
					} else {
						setMessage(
							`エラーが発生しました: ${errorDescription?.replace(/\+/g, ' ') || 'Unknown error'}\nメールアドレスを入力し、再度お試しください。`,
						);
					}
					return;
				}

				// 既にセッションがある場合（ミドルウェアがcodeを処理済み）
				const {
					data: { session },
				} = await supabase.auth.getSession();
				if (session) {
					setStep('newPassword');
					return;
				}

				// PKCEフロー: URLに code パラメータがある場合
				const code = searchParams.get('code');
				if (code) {
					const { error } = await supabase.auth.exchangeCodeForSession(code);
					if (!error) {
						setStep('newPassword');
						return;
					}
					console.error('Code exchange error:', error);
				}

				// セッションもcodeもない → OTPコード入力フォームを表示
				setStep('otp');
				setMessage('メールアドレスと確認コードを入力してパスワードを再設定してください。');
			} catch (err) {
				console.error('Session check error:', err);
				setStep('otp');
				setIsError(true);
				setMessage('エラーが発生しました。メールアドレスと確認コードで再度お試しください。');
			}
		};
		checkSession();
	}, [searchParams, supabase.auth]);

	// OTP入力ハンドラー
	const handleOtpChange = (index: number, value: string) => {
		if (value.length > 1) {
			const digits = value.replace(/\D/g, '').slice(0, 8).split('');
			const newOtp = [...otpDigits];
			digits.forEach((d, i) => {
				if (index + i < 8) newOtp[index + i] = d;
			});
			setOtpDigits(newOtp);
			const nextIndex = Math.min(index + digits.length, 7);
			otpRefs.current[nextIndex]?.focus();
			return;
		}
		if (!/^\d?$/.test(value)) return;
		const newOtp = [...otpDigits];
		newOtp[index] = value;
		setOtpDigits(newOtp);
		if (value && index < 7) {
			otpRefs.current[index + 1]?.focus();
		}
	};

	const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
			otpRefs.current[index - 1]?.focus();
		}
	};

	// OTPコード検証
	const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const token = otpDigits.join('');
		if (token.length !== 8 || !email) {
			setIsError(true);
			setMessage('メールアドレスと8桁のコードを入力してください。');
			return;
		}

		setIsLoading(true);
		setMessage('');
		setIsError(false);

		try {
			const { error } = await supabase.auth.verifyOtp({
				email,
				token,
				type: 'recovery',
			});
			if (error) {
				setIsError(true);
				setMessage('コードが無効または有効期限切れです。\n確認コードを再送信してお試しください。');
			} else {
				setStep('newPassword');
				setMessage('');
			}
		} catch {
			setIsError(true);
			setMessage('エラーが発生しました。もう一度お試しください。');
		} finally {
			setIsLoading(false);
		}
	};

	// 確認コード再送信
	const handleResendOtp = async () => {
		if (!email) {
			setIsError(true);
			setMessage('まずメールアドレスを入力してください。');
			return;
		}
		setIsLoading(true);
		setMessage('');
		setIsError(false);
		setOtpDigits(['', '', '', '', '', '', '', '']);

		try {
			const { error } = await supabase.auth.resetPasswordForEmail(email);
			if (error) {
				setIsError(true);
				setMessage(error.message);
			} else {
				setMessage('確認コードを再送信しました。メールをご確認ください。');
			}
		} catch {
			setIsError(true);
			setMessage('エラーが発生しました。もう一度お試しください。');
		} finally {
			setIsLoading(false);
		}
	};

	// パスワード変更
	const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (password.length < 6) {
			setIsError(true);
			setMessage('パスワードは6文字以上で入力してください。');
			return;
		}
		if (password !== confirmPassword) {
			setIsError(true);
			setMessage('パスワードが一致しません。');
			return;
		}

		setIsLoading(true);
		setMessage('');
		setIsError(false);

		try {
			const { error } = await supabase.auth.updateUser({ password });
			if (error) {
				setIsError(true);
				setMessage(error.message);
			} else {
				setMessage('パスワードが正常に更新されました。ログインページに移動します...');
				await supabase.auth.signOut();
				setTimeout(() => router.push('/login'), 3000);
			}
		} catch {
			setIsError(true);
			setMessage('エラーが発生しました。もう一度お試しください。');
		} finally {
			setIsLoading(false);
		}
	};

	const handleBackToLogin = () => router.push('/login');

	// ローディング画面
	if (step === 'checking') {
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
				<p>確認中...</p>
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
					{step === 'newPassword' ? '新しいパスワード設定' : 'パスワード再設定'}
				</h1>

				{/* メッセージ表示 */}
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

				{/* OTPコード入力フォーム */}
				{step === 'otp' && (
					<form onSubmit={handleVerifyOtp} className={css({ spaceY: '6' })}>
						<div>
							<label
								htmlFor="reset-email"
								className={css({
									display: 'block',
									mb: '2',
									fontSize: 'sm',
									color: 'gray.700',
									fontWeight: 'medium',
								})}
							>
								メールアドレス
							</label>
							<input
								type="email"
								id="reset-email"
								placeholder="メールアドレス"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								disabled={isLoading}
								className={css({
									w: 'full',
									border: '1px solid',
									borderColor: 'gray.300',
									borderRadius: 'md',
									p: '3',
									_focus: { borderColor: 'gray.500', outline: 'none' },
									_disabled: { bg: 'gray.100', cursor: 'not-allowed' },
								})}
							/>
						</div>
						<div>
							<label
								className={css({
									display: 'block',
									mb: '2',
									fontSize: 'sm',
									color: 'gray.700',
									fontWeight: 'medium',
									textAlign: 'center',
								})}
							>
								8桁の確認コード
							</label>
							<div
								className={css({
									display: 'flex',
									justifyContent: 'center',
									gap: '2',
								})}
							>
								{otpDigits.map((digit, i) => (
									<input
										key={i}
										ref={(el) => { otpRefs.current[i] = el; }}
										type="text"
										inputMode="numeric"
										maxLength={8}
										value={digit}
										onChange={(e) => handleOtpChange(i, e.target.value)}
										onKeyDown={(e) => handleOtpKeyDown(i, e)}
										disabled={isLoading}
										className={css({
											w: '10',
											h: '12',
											textAlign: 'center',
											fontSize: 'lg',
											fontWeight: 'bold',
											border: '2px solid',
											borderColor: 'gray.300',
											borderRadius: 'md',
											_focus: { borderColor: 'blue.500', outline: 'none' },
											_disabled: { bg: 'gray.100', cursor: 'not-allowed' },
										})}
									/>
								))}
							</div>
						</div>
						<div className={css({ textAlign: 'center' })}>
							<button
								type="submit"
								disabled={isLoading || otpDigits.join('').length !== 8 || !email}
								className={css({
									bg: 'blue.500',
									color: 'white',
									py: '3',
									px: '8',
									borderRadius: 'md',
									_hover: { bg: 'blue.600' },
									_disabled: { bg: 'gray.400', cursor: 'not-allowed' },
								})}
							>
								{isLoading ? '確認中...' : 'コードを確認'}
							</button>
						</div>
						<div className={css({ textAlign: 'center' })}>
							<button
								type="button"
								onClick={handleResendOtp}
								disabled={isLoading || !email}
								className={css({
									color: 'blue.500',
									fontSize: 'sm',
									textDecoration: 'underline',
									_hover: { color: 'blue.600' },
									_disabled: { color: 'gray.400', cursor: 'not-allowed' },
								})}
							>
								確認コードを再送信
							</button>
						</div>
					</form>
				)}

				{/* パスワード変更フォーム */}
				{step === 'newPassword' && (
					<form onSubmit={handleChangePassword} className={css({ spaceY: '6' })}>
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
								placeholder="新しいパスワード（6文字以上）"
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
									_focus: { borderColor: 'gray.500', outline: 'none' },
									_disabled: { bg: 'gray.100', cursor: 'not-allowed' },
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
									_focus: { borderColor: 'gray.500', outline: 'none' },
									_disabled: { bg: 'gray.100', cursor: 'not-allowed' },
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
									_hover: { bg: 'blue.600' },
									_disabled: { bg: 'gray.400', cursor: 'not-allowed' },
								})}
							>
								{isLoading ? 'パスワード更新中...' : 'パスワードを更新'}
							</button>
						</div>
					</form>
				)}

				{/* ログイン画面に戻る */}
				<div className={css({ textAlign: 'center', mt: '4' })}>
					<button
						type="button"
						onClick={handleBackToLogin}
						disabled={isLoading}
						className={css({
							color: 'gray.500',
							textDecoration: 'underline',
							fontSize: 'xs',
							_hover: { color: 'gray.600' },
							_disabled: { cursor: 'not-allowed' },
						})}
					>
						ログイン画面に戻る
					</button>
				</div>
			</div>
		</div>
	);
}
