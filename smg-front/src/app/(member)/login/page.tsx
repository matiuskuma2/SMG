'use client';

import { createClient } from '@/lib/supabase';
import { css } from '@/styled-system/css';
import { Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

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

	// Supabaseエラーメッセージを日本語に変換
	const translateErrorMessage = (errorMessage: string): string => {
		const errorMap: { [key: string]: string } = {
			'Invalid login credentials': 'メールアドレスまたはパスワードが正しくありません',
			'Email not confirmed': 'メールアドレスが確認されていません',
			'Too many requests': 'ログイン試行回数が上限に達しました。しばらく待ってから再試行してください',
			'User not found': 'ユーザーが見つかりません',
			'Invalid email': 'メールアドレスの形式が正しくありません',
			'Password is too short': 'パスワードが短すぎます',
			'Signup requires a valid password': '有効なパスワードが必要です',
			'Email already registered': 'このメールアドレスは既に登録されています',
		};

		return errorMap[errorMessage] || errorMessage;
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
					trn_group_user (
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
			const userGroups = userData[0].trn_group_user || [];
			let isBlocked = false;
			let blockReason = null;

			// 除外グループのチェック（グループがある場合のみ）
			for (const groupUser of userGroups) {
				// @ts-ignore
				const groupTitle = groupUser.mst_group?.title;
				
				if (groupTitle === '未決済') {
					isBlocked = true;
					blockReason = 'unpaid';
					break;
				} else if (groupTitle === '退会') {
					isBlocked = true;
					blockReason = 'withdrawn';
					break;
				}
			}

			// ブロック対象の場合、ログインを実行せずにエラーを表示
			if (isBlocked) {
				if (blockReason === 'unpaid') {
					throw new Error('決済エラーのためログインを制限させていただいております');
				} else if (blockReason === 'withdrawn') {
					throw new Error('退会済みのユーザーのためログインを制限させていただいております');
				}
			}



			// 権限チェックが通った場合のみログインを実行
			const { error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});

			if (error) {
				throw error;
			}

			// ログイン成功時にlast_login_atを更新
			const {
				data: { user },
				error: getUserError,
			} = await supabase.auth.getUser();
			
			if (getUserError) {
				throw getUserError;
			}

			if (user) {
				const { data: updateData, error: updateError } = await supabase
					.from('mst_user')
					.update({ last_login_at: new Date().toISOString() })
					.eq('user_id', user.id)
					.select('user_id, last_login_at, email, username');

				if (updateError) {
					console.error('ユーザーの最終ログイン日時の更新に失敗:', updateError);
				} else {
					console.log(
						'ユーザーの最終ログイン日時が更新されました:',
						updateData?.[0],
					);
				}
			}

			router.refresh();
			window.location.href = '/';
		} catch (err: any) {
			console.error('ログインエラー:', err);
			const translatedMessage = translateErrorMessage(err.message || 'ログイン中にエラーが発生しました');
			setLoginError(translatedMessage);
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
						quality={100}
						unoptimized={true}
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
				</form>
				<div className={css({ textAlign: 'center', mt: '4', spaceY: '2' })}>
					<div>
						<Link href="/forgotPassword">
							<span
								className={css({
									fontSize: 'xs',
									color: 'gray.500',
									textDecoration: 'underline',
									cursor: 'pointer',
								})}
							>
								パスワードを忘れた場合
							</span>
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
