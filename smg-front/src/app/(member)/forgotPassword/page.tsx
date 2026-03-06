'use client';

import { css } from '@/styled-system/css';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

type Step = 'email' | 'otp' | 'newPassword' | 'done';

export default function ForgotPasswordPage() {
	const router = useRouter();
	const supabase = createClient();

	const [step, setStep] = useState<Step>('email');
	const [email, setEmail] = useState('');
	const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState('');
	const [isError, setIsError] = useState(false);

	const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

	// ステップ1: メール送信
	const handleSendEmail = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsLoading(true);
		setMessage('');
		setIsError(false);

		try {
			const { error } = await supabase.auth.resetPasswordForEmail(email);
			if (error) {
				setIsError(true);
				setMessage(error.message);
			} else {
				setStep('otp');
				setMessage('確認コードをメールで送信しました。メールに記載された6桁のコードを入力してください。');
			}
		} catch {
			setIsError(true);
			setMessage('エラーが発生しました。もう一度お試しください。');
		} finally {
			setIsLoading(false);
		}
	};

	// OTP入力ハンドラー（6桁の各入力欄）
	const handleOtpChange = (index: number, value: string) => {
		if (value.length > 1) {
			// ペースト対応: 6桁まとめて貼り付け
			const digits = value.replace(/\D/g, '').slice(0, 6).split('');
			const newOtp = [...otpDigits];
			digits.forEach((d, i) => {
				if (index + i < 6) newOtp[index + i] = d;
			});
			setOtpDigits(newOtp);
			const nextIndex = Math.min(index + digits.length, 5);
			otpRefs.current[nextIndex]?.focus();
			return;
		}

		if (!/^\d?$/.test(value)) return;
		const newOtp = [...otpDigits];
		newOtp[index] = value;
		setOtpDigits(newOtp);

		if (value && index < 5) {
			otpRefs.current[index + 1]?.focus();
		}
	};

	const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
			otpRefs.current[index - 1]?.focus();
		}
	};

	// ステップ2: OTPコード検証
	const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const token = otpDigits.join('');
		if (token.length !== 6) {
			setIsError(true);
			setMessage('6桁のコードを入力してください。');
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
				if (error.message.includes('expired') || error.message.includes('invalid')) {
					setMessage('コードが無効または有効期限切れです。「コードを再送信」してください。');
				} else {
					setMessage(error.message);
				}
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

	// OTPコード再送信
	const handleResendOtp = async () => {
		setIsLoading(true);
		setMessage('');
		setIsError(false);
		setOtpDigits(['', '', '', '', '', '']);

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

	// ステップ3: パスワード変更
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
				setStep('done');
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
					{step === 'newPassword' ? '新しいパスワード設定' : step === 'done' ? 'パスワード更新完了' : 'パスワード再発行'}
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

				{/* ステップ1: メールアドレス入力 */}
				{step === 'email' && (
					<form onSubmit={handleSendEmail} className={css({ spaceY: '6' })}>
						<div>
							<label
								htmlFor="email"
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
								id="email"
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
								{isLoading ? 'メール送信中...' : '確認コードを送信'}
							</button>
						</div>
					</form>
				)}

				{/* ステップ2: OTPコード入力 */}
				{step === 'otp' && (
					<form onSubmit={handleVerifyOtp} className={css({ spaceY: '6' })}>
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
								メールに届いた6桁の確認コード
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
										maxLength={6}
										value={digit}
										onChange={(e) => handleOtpChange(i, e.target.value)}
										onKeyDown={(e) => handleOtpKeyDown(i, e)}
										disabled={isLoading}
										className={css({
											w: '12',
											h: '14',
											textAlign: 'center',
											fontSize: 'xl',
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
							<p
								className={css({
									mt: '3',
									fontSize: 'xs',
									color: 'gray.500',
									textAlign: 'center',
								})}
							>
								{email} にコードを送信しました
							</p>
						</div>
						<div className={css({ textAlign: 'center' })}>
							<button
								type="submit"
								disabled={isLoading || otpDigits.join('').length !== 6}
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
								disabled={isLoading}
								className={css({
									color: 'blue.500',
									fontSize: 'sm',
									textDecoration: 'underline',
									_hover: { color: 'blue.600' },
									_disabled: { color: 'gray.400', cursor: 'not-allowed' },
								})}
							>
								コードを再送信
							</button>
						</div>
					</form>
				)}

				{/* ステップ3: 新しいパスワード入力 */}
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
