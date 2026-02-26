'use client';

import { css } from '@/styled-system/css';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ForgotPasswordPage() {
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState('');
	const [isError, setIsError] = useState(false);
	const supabase = createClient();

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsLoading(true);
		setMessage('');
		setIsError(false);

		try {
			const { error } = await supabase.auth.resetPasswordForEmail(email, {
				redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password`,
			});

			if (error) {
				setIsError(true);
				setMessage(error.message);
			} else {
				setMessage('パスワードリセットメールを送信しました。メールをご確認ください。');
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
					パスワード再発行
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

				<form onSubmit={handleSubmit} className={css({ spaceY: '6' })}>
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
							{isLoading ? 'メール送信中...' : 'パスワードリセットメールを送信'}
						</button>
					</div>
				</form>

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
