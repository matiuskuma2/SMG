'use client';

import { css } from '@/styled-system/css';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PasswordChangePage() {
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState('');
	const [isError, setIsError] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		
		if (newPassword !== confirmPassword) {
			setIsError(true);
			setMessage('パスワードが一致しません。');
			return;
		}

		if (newPassword.length < 6) {
			setIsError(true);
			setMessage('パスワードは6文字以上で入力してください。');
			return;
		}

		setIsLoading(true);
		setMessage('');
		setIsError(false);

		try {
			const response = await fetch('/api/x7k9m2p/change-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					email,
					newPassword,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				setIsError(true);
				setMessage(data.error || 'エラーが発生しました。');
			} else {
				setIsError(false);
				setMessage('パスワードが正常に更新されました。');
				setEmail('');
				setNewPassword('');
				setConfirmPassword('');
			}
		} catch (error) {
			setIsError(true);
			setMessage('ネットワークエラーが発生しました。');
		} finally {
			setIsLoading(false);
		}
	};

	const handleGoToLogin = () => {
		router.push('/login');
	};

	return (
		<div
			className={css({
				maxW: 'lg',
				mx: 'auto',
				bg: 'white',
				p: '8',
				borderRadius: 'lg',
				shadow: 'md',
			})}
		>
			<h1
				className={css({
					fontSize: '2xl',
					fontWeight: 'bold',
					textAlign: 'center',
					mb: '8',
					color: 'gray.800',
				})}
			>
				パスワード変更
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
						placeholder="user@example.com"
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
								borderColor: 'blue.500',
								outline: 'none',
								ring: '2px',
								ringColor: 'blue.100',
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
						htmlFor="newPassword"
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
						id="newPassword"
						placeholder="新しいパスワード（6文字以上）"
						value={newPassword}
						onChange={(e) => setNewPassword(e.target.value)}
						required
						disabled={isLoading}
						className={css({
							w: 'full',
							border: '1px solid',
							borderColor: 'gray.300',
							borderRadius: 'md',
							p: '3',
							_focus: {
								borderColor: 'blue.500',
								outline: 'none',
								ring: '2px',
								ringColor: 'blue.100',
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
								borderColor: 'blue.500',
								outline: 'none',
								ring: '2px',
								ringColor: 'blue.100',
							},
							_disabled: {
								bg: 'gray.100',
								cursor: 'not-allowed',
							},
						})}
					/>
				</div>

				<div className={css({ pt: '4', spaceY: '3' })}>
					<button
						type="submit"
						disabled={isLoading}
						className={css({
							w: 'full',
							bg: 'red.600',
							color: 'white',
							py: '3',
							px: '4',
							borderRadius: 'md',
							fontWeight: 'medium',
							_hover: {
								bg: 'red.700',
							},
							_disabled: {
								bg: 'gray.400',
								cursor: 'not-allowed',
							},
						})}
					>
						{isLoading ? 'パスワード変更中...' : 'パスワードを変更'}
					</button>
					
					<button
						type="button"
						onClick={handleGoToLogin}
						disabled={isLoading}
						className={css({
							w: 'full',
							bg: 'blue.600',
							color: 'white',
							py: '3',
							px: '4',
							borderRadius: 'md',
							fontWeight: 'medium',
							_hover: {
								bg: 'blue.700',
							},
							_disabled: {
								bg: 'gray.400',
								cursor: 'not-allowed',
							},
						})}
					>
						ログインページへ
					</button>
				</div>
			</form>

			<div
				className={css({
					mt: '8',
					p: '4',
					bg: 'yellow.50',
					border: '1px solid',
					borderColor: 'yellow.200',
					borderRadius: 'md',
				})}
			>
				<p
					className={css({
						fontSize: 'sm',
						color: 'yellow.800',
						fontWeight: 'medium',
					})}
				>
					⚠️ 注意事項
				</p>
				<ul
					className={css({
						mt: '2',
						fontSize: 'sm',
						color: 'yellow.700',
						pl: '4',
						spaceY: '1',
					})}
				>
					<li>• メールアドレスに対応するユーザーのパスワードが変更されます</li>
					<li>• パスワードは6文字以上で設定してください</li>
					<li>• 変更後は新しいパスワードでログインしてください</li>
				</ul>
			</div>
		</div>
	);
}