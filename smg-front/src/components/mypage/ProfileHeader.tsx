import { useProfile } from '@/components/ProfileContext';
import { createClient } from '@/lib/supabase';
import { css } from '@/styled-system/css';
import { LogOut, Settings } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export const ProfileHeader = () => {
	const { profileData } = useProfile();
	const router = useRouter();
	const handleLogout = async () => {
		try {
			const supabase = createClient();

			// Supabaseからサインアウト
			const { error } = await supabase.auth.signOut();

			if (error) {
				console.error('ログアウトエラー:', error);
			}

			// ログインページにリダイレクト
			router.push('/login');
			router.refresh();
		} catch (err) {
			console.error('ログアウト処理中にエラーが発生:', err);
			// エラーが発生してもログインページにリダイレクト
			router.push('/login');
		}
	};

	return (
		<div
			className={css({
				bg: 'white',
				rounded: 'lg',
				shadow: 'md',
				mb: '4',
				position: 'relative',
			})}
		>
			<div
				className={css({
					position: 'absolute',
					top: '4',
					right: '4',
					display: 'flex',
					gap: '2',
				})}
			>
				<button
					type="button"
					onClick={handleLogout}
					className={css({
						p: '2',
						rounded: 'md',
						transition: 'colors',
						_hover: { bg: 'red.50' },
					})}
					aria-label="ログアウト"
				>
					<LogOut
						className={css({ h: '6', w: '6', color: 'red.500' })}
						strokeWidth={2.5}
					/>
				</button>
			</div>
			<div
				className={css({
					py: '8',
					px: '4',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
				})}
			>
				<div
					className={css({
						w: '16',
						h: '16',
						rounded: 'full',
						bg: 'black',
						overflow: 'hidden',
						mb: '4',
					})}
				>
					<Image
						src={profileData.profileImage || '/profile-icon.jpg'}
						alt="プロフィール画像"
						width={96}
						height={96}
						quality={100}
						unoptimized={true}
						className={css({ w: 'full', h: 'full', objectFit: 'cover' })}
					/>
				</div>
				<div
					className={css({
						display: 'flex',
						alignItems: 'center',
						gap: '1',
						justifyContent: 'center',
					})}
				>
					<h1 className={css({ fontWeight: 'bold', fontSize: 'lg' })}>
						{profileData.name || '名前未設定'}
					</h1>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className={css({ h: '5', w: '5', color: 'blue.500' })}
						viewBox="0 0 24 24"
						fill="currentColor"
						role="img"
						aria-label="認証済みアカウント"
					>
						<path
							clipRule="evenodd"
							fillRule="evenodd"
							d="M15.6738 3.13076L12 0L8.32624 3.13076L3.51472 3.51472L3.13076 8.32624L0 12L3.13076 15.6738L3.51472 20.4853L8.32624 20.8692L12 24L15.6738 20.8692L20.4853 20.4853L20.8692 15.6738L24 12L20.8692 8.32624L20.4853 3.51472L15.6738 3.13076ZM11.3177 15.9284C11.3265 15.9196 11.335 15.9107 11.3434 15.9018L17.7009 9.5443C18.0997 9.14547 18.0997 8.49883 17.7009 8.1C17.302 7.70117 16.6554 7.70117 16.2566 8.1L10.5951 13.7615L7.74326 10.9096C7.34443 10.5108 6.6978 10.5108 6.29897 10.9096C5.90014 11.3085 5.90014 11.9551 6.29897 12.3539L9.87341 15.9284C10.2722 16.3272 10.9189 16.3272 11.3177 15.9284Z"
						/>
					</svg>
				</div>
			</div>
		</div>
	);
};
