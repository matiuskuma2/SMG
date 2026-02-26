'use client';

import { css } from '@/styled-system/css';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignupPage() {
	const router = useRouter();
	const [formData, setFormData] = useState({
		email: '',
		password: '',
		company_name: '',
		company_name_kana: '',
		company_address: '',
		industry_id: '',
		username: '',
		user_name_kana: '',
		nickname: '',
		birth_date: '',
		phone_number: '',
	});
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState('');
	const [isError, setIsError] = useState(false);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value || ''
		}));
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsLoading(true);
		setMessage('');
		setIsError(false);

		try {
			const response = await fetch('/api/signup', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(formData),
			});

			const data = await response.json();

			if (!response.ok) {
				setIsError(true);
				setMessage(data.error || 'アカウント登録に失敗しました');
			} else {
				setMessage(data.message);
				// 成功時はフォームをリセット
				setFormData({
					email: '',
					password: '',
					company_name: '',
					company_name_kana: '',
					company_address: '',
					industry_id: '',
					username: '',
					user_name_kana: '',
					nickname: '',
					birth_date: '',
					phone_number: '',
				});
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
					アカウント登録
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
							メールアドレス <span className={css({ color: 'red.500' })}>*</span>
						</label>
						<input
							type="email"
							id="email"
							name="email"
							placeholder="メールアドレス"
							value={formData.email}
							onChange={handleInputChange}
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
							htmlFor="password"
							className={css({
								display: 'block',
								mb: '2',
								fontSize: 'sm',
								color: 'gray.700',
								fontWeight: 'medium',
							})}
						>
							パスワード <span className={css({ color: 'red.500' })}>*</span>
						</label>
						<input
							type="password"
							id="password"
							name="password"
							placeholder="パスワード"
							value={formData.password}
							onChange={handleInputChange}
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
							htmlFor="company_name"
							className={css({
								display: 'block',
								mb: '2',
								fontSize: 'sm',
								color: 'gray.700',
								fontWeight: 'medium',
							})}
						>
							会社名 <span className={css({ color: 'red.500' })}>*</span>
						</label>
						<input
							type="text"
							id="company_name"
							name="company_name"
							placeholder="会社名"
							value={formData.company_name}
							onChange={handleInputChange}
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
							htmlFor="company_name_kana"
							className={css({
								display: 'block',
								mb: '2',
								fontSize: 'sm',
								color: 'gray.700',
								fontWeight: 'medium',
							})}
						>
							会社名（フリガナ） <span className={css({ color: 'red.500' })}>*</span>
						</label>
						<input
							type="text"
							id="company_name_kana"
							name="company_name_kana"
							placeholder="会社名（フリガナ）"
							value={formData.company_name_kana}
							onChange={handleInputChange}
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
							htmlFor="company_address"
							className={css({
								display: 'block',
								mb: '2',
								fontSize: 'sm',
								color: 'gray.700',
								fontWeight: 'medium',
							})}
						>
							会社所在地
						</label>
						<input
							type="text"
							id="company_address"
							name="company_address"
							placeholder="会社所在地"
							value={formData.company_address}
							onChange={handleInputChange}
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
							htmlFor="username"
							className={css({
								display: 'block',
								mb: '2',
								fontSize: 'sm',
								color: 'gray.700',
								fontWeight: 'medium',
							})}
						>
							名前 <span className={css({ color: 'red.500' })}>*</span>
						</label>
						<input
							type="text"
							id="username"
							name="username"
							placeholder="名前"
							value={formData.username}
							onChange={handleInputChange}
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
							htmlFor="user_name_kana"
							className={css({
								display: 'block',
								mb: '2',
								fontSize: 'sm',
								color: 'gray.700',
								fontWeight: 'medium',
							})}
						>
							名前（フリガナ） <span className={css({ color: 'red.500' })}>*</span>
						</label>
						<input
							type="text"
							id="user_name_kana"
							name="user_name_kana"
							placeholder="名前（フリガナ）"
							value={formData.user_name_kana}
							onChange={handleInputChange}
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
							htmlFor="nickname"
							className={css({
								display: 'block',
								mb: '2',
								fontSize: 'sm',
								color: 'gray.700',
								fontWeight: 'medium',
							})}
						>
							ユーザー名
						</label>
						<input
							type="text"
							id="nickname"
							name="nickname"
							placeholder="ユーザー名"
							value={formData.nickname}
							onChange={handleInputChange}
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
							htmlFor="birth_date"
							className={css({
								display: 'block',
								mb: '2',
								fontSize: 'sm',
								color: 'gray.700',
								fontWeight: 'medium',
							})}
						>
							生年月日
						</label>
						<input
							type="date"
							id="birth_date"
							name="birth_date"
							value={formData.birth_date}
							onChange={handleInputChange}
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
							htmlFor="phone_number"
							className={css({
								display: 'block',
								mb: '2',
								fontSize: 'sm',
								color: 'gray.700',
								fontWeight: 'medium',
							})}
						>
							電話番号
						</label>
						<input
							type="tel"
							id="phone_number"
							name="phone_number"
							placeholder="電話番号"
							value={formData.phone_number}
							onChange={handleInputChange}
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
							{isLoading ? 'アカウント登録中...' : 'アカウント登録'}
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