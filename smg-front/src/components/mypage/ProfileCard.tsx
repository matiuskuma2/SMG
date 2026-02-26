'use client';

import { useProfile } from '@/components/ProfileContext';
import { css } from '@/styled-system/css';
import { Edit, QrCode } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { QRCodeModal } from './QRCodeModal';

// SNSアイコンの定義
const snsIcons = {
	instagram: '/icons/Instagram.svg',
	x: '/icons/X.svg',
	youtube: '/icons/YouTube.svg',
	facebook: '/icons/facebook.svg',
	tiktok: '/icons/TikTok.svg',
	other: '/icons/Other.svg',
} as const;

type SNSPlatform = keyof typeof snsIcons;

const SNSItem = ({
	platform,
	handle,
}: {
	platform: SNSPlatform;
	handle: string;
}) => {
	const buildSNSUrl = (platform: SNSPlatform, handle: string) => {
		// 既に完全なURLの場合はそのまま返す
		if (handle.startsWith('http://') || handle.startsWith('https://')) {
			return handle;
		}

		// @マークを除去してクリーンなハンドル名を取得
		const cleanHandle = handle.replace('@', '');

		switch (platform) {
			case 'instagram':
				return `https://instagram.com/${cleanHandle}`;
			case 'x':
				return `https://x.com/${cleanHandle}`;
			case 'youtube':
				return `https://www.youtube.com/${cleanHandle}`;
			case 'facebook':
				return `https://facebook.com/${cleanHandle}`;
			case 'tiktok':
				return `https://www.tiktok.com/@${cleanHandle}`;
			case 'other':
				// その他の場合は、完全URLまたはそのまま返す
				return cleanHandle.startsWith('http') ? cleanHandle : `https://${cleanHandle}`;
			default:
				return '#';
		}
	};

	return (
		<a
			href={buildSNSUrl(platform, handle)}
			target="_blank"
			rel="noopener noreferrer"
			className={css({
				display: 'inline-block',
				_hover: { opacity: 0.8 },
				transition: 'opacity 0.2s',
			})}
		>
			<Image
				src={snsIcons[platform]}
				alt={`${platform} icon`}
				width={24}
				height={24}
				quality={100}
				unoptimized={true}
			/>
		</a>
	);
};

export const ProfileCard = () => {
	const { profileData } = useProfile();
	const [isQRModalOpen, setIsQRModalOpen] = useState(false);

	// カードスタイル
	const cardStyle = css({
		bg: 'white',
		rounded: 'lg',
		shadow: 'md',
		mb: '4',
	});

	// カードヘッダースタイル
	const cardHeaderStyle = css({
		p: '4',
		display: 'flex',
		justifyContent: 'between',
		alignItems: 'center',
		borderBottomWidth: '1px',
	});

	return (
		<div className={cardStyle}>
			<div className={cardHeaderStyle}>
				<h2 className={css({ fontWeight: 'bold' })}>プロフィール</h2>
				<div className={css({ marginLeft: 'auto', display: 'flex', gap: '1' })}>
					<button
						type="button"
						onClick={() => setIsQRModalOpen(true)}
						className={css({
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							p: '2',
							borderRadius: 'md',
							_hover: { bg: 'gray.100' },
							transition: 'background-color 0.2s',
						})}
						title="QRコードを表示"
					>
						<QrCode className={css({ h: '4', w: '4', color: 'gray.500' })} />
					</button>
					<Link href="/mypage/profile/edit">
						<button
							type="button"
							className={css({
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								p: '2',
								borderRadius: 'md',
								_hover: { bg: 'gray.100' },
								transition: 'background-color 0.2s',
							})}
						>
							<Edit className={css({ h: '4', w: '4', color: 'gray.500' })} />
						</button>
					</Link>
				</div>
			</div>
			<div className={css({ p: '4', spaceY: '4' })}>
				{/* アイコン */}
				<div>
					<div
						className={css({
							w: '16',
							h: '16',
							rounded: 'full',
							bg: 'black',
							overflow: 'hidden',
						})}
					>
											<Image
						src={profileData.profileImage || "/profile-icon.jpg"}
						alt="アイコン"
						width={64}
						height={64}
						quality={100}
						unoptimized={true}
						className={css({ w: 'full', h: 'full', objectFit: 'cover' })}
					/>
					</div>
				</div>

				{/* 名前 */}
				<div>
					<p className={css({ fontSize: 'xs', color: 'gray.500', mb: '1' })}>
						名前
					</p>
					<p>{profileData.name}</p>
				</div>

				{/* ふりがな */}
				<div>
					<p className={css({ fontSize: 'xs', color: 'gray.500', mb: '1' })}>
						ふりがな
					</p>
					<p>{profileData.nameKana}</p>
				</div>

				{/* ユーザー名 */}
				{profileData.nickname && (
					<div>
						<p className={css({ fontSize: 'xs', color: 'gray.500', mb: '1' })}>
							ユーザー名
						</p>
						<p>{profileData.nickname}</p>
					</div>
				)}

				{/* メールアドレス */}
				{profileData.email && (
					<div>
						<p className={css({ fontSize: 'xs', color: 'gray.500', mb: '1' })}>
							メールアドレス
						</p>
						<p>{profileData.email}</p>
					</div>
				)}

				{/* 携帯番号 */}
				{profileData.phoneNumber && (
					<div>
						<p className={css({ fontSize: 'xs', color: 'gray.500', mb: '1' })}>
							携帯番号
						</p>
						<p>{profileData.phoneNumber}</p>
					</div>
				)}

				{/* 肩書 */}
				{profileData.userPosition && (
					<div>
						<p className={css({ fontSize: 'xs', color: 'gray.500', mb: '1' })}>
							肩書
						</p>
						<p>{profileData.userPosition}</p>
					</div>
				)}

				{/* 生年月日 */}
				{profileData.birthday && (
					<div>
						<p className={css({ fontSize: 'xs', color: 'gray.500', mb: '1' })}>
							生年月日
						</p>
						<p>{profileData.birthday}</p>
					</div>
				)}

				{/* 会社名 */}
				<div>
					<p className={css({ fontSize: 'xs', color: 'gray.500', mb: '1' })}>
						会社名
					</p>
					<p>{profileData.companyName}</p>
				</div>

				{/* 会社名ふりがな */}
				<div>
					<p className={css({ fontSize: 'xs', color: 'gray.500', mb: '1' })}>
						会社名ふりがな
					</p>
					<p>{profileData.companyNameKana}</p>
				</div>

				{/* 会社所在地 */}
				{profileData.companyAddress && (
					<div>
						<p className={css({ fontSize: 'xs', color: 'gray.500', mb: '1' })}>
							会社所在地
						</p>
						<p>{profileData.companyAddress}</p>
					</div>
				)}

				{/* 業種 */}
				{profileData.industry && (
					<div>
						<p className={css({ fontSize: 'xs', color: 'gray.500', mb: '1' })}>
							業種
						</p>
						<p>
							{profileData.customIndustry
								? `${profileData.customIndustry}`
								: profileData.industry}
						</p>
					</div>
				)}

				{/* 自己紹介文 */}
				{profileData.introduction && (
					<div>
						<p className={css({ fontSize: 'xs', color: 'gray.500', mb: '1' })}>
							自己紹介文
						</p>
						<p>{profileData.introduction}</p>
					</div>
				)}

				{/* HP */}
				{profileData.website && (
					<div>
						<p className={css({ fontSize: 'xs', color: 'gray.500', mb: '1' })}>
							HP
						</p>
						<a
							href={profileData.website}
							className={css({
								color: 'blue.500',
								textDecoration: 'underline',
							})}
						>
							{profileData.website}
						</a>
					</div>
				)}

				{/* SNS */}
				{(profileData.sns.instagram || profileData.sns.facebook || profileData.sns.tiktok || profileData.sns.x || profileData.sns.youtube || profileData.sns.other) && (
					<div>
						<p className={css({ fontSize: 'xs', color: 'gray.500', mb: '1' })}>
							SNS
						</p>
						<div
							className={css({
								display: 'flex',
								gap: '3',
								alignItems: 'center',
							})}
						>
							{profileData.sns.instagram && (
								<SNSItem
									platform="instagram"
									handle={profileData.sns.instagram}
								/>
							)}
							{profileData.sns.facebook && (
								<SNSItem
									platform="facebook"
									handle={profileData.sns.facebook}
								/>
							)}
							{profileData.sns.tiktok && (
								<SNSItem platform="tiktok" handle={profileData.sns.tiktok} />
							)}
							{profileData.sns.x && (
								<SNSItem platform="x" handle={profileData.sns.x} />
							)}
							{profileData.sns.youtube && (
								<SNSItem platform="youtube" handle={profileData.sns.youtube} />
							)}
							{profileData.sns.other && (
								<SNSItem platform="other" handle={profileData.sns.other} />
							)}
						</div>
						<p className={css({ fontSize: 'xs', color: 'gray.500', mt: '1' })}>
							（Instagram、Facebook、TikTok、X、YouTube、その他）
						</p>
					</div>
				)}
			</div>

			<QRCodeModal
				isOpen={isQRModalOpen}
				onClose={() => setIsQRModalOpen(false)}
			/>
		</div>
	);
};
