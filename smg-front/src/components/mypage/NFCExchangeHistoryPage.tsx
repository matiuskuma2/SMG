'use client';

import { css } from '@/styled-system/css';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { fetchUserProfile, UserProfile } from '@/lib/api/userProfile';

const InfoItem = ({
	label,
	value,
}: { label: string; value: React.ReactNode }) => (
	<div className={css({ display: 'flex', flexDirection: 'column', gap: '1' })}>
		<span
			className={css({
				fontSize: 'xs',
				fontWeight: 'medium',
				color: 'gray.500',
			})}
		>
			{label}
		</span>
		<span
			className={css({
				fontSize: 'sm',
				fontWeight: 'semibold',
				color: 'gray.800',
			})}
		>
			{value}
		</span>
	</div>
);

const snsIcons: Record<string, string> = {
	instagram: '/icons/Instagram.svg',
	x: '/icons/X.svg',
	youtube: '/icons/YouTube.svg',
	facebook: '/icons/facebook.svg',
	tiktok: '/icons/TikTok.svg',
	other: '/icons/link.svg', // otherの場合は汎用リンクアイコンを使用
	// 大文字版も対応（念のため）
	Instagram: '/icons/Instagram.svg',
	X: '/icons/X.svg',
	YouTube: '/icons/YouTube.svg',
	Facebook: '/icons/facebook.svg',
	TikTok: '/icons/TikTok.svg',
};

const buildSNSUrl = (platform: string, handle: string) => {
	// URLが既に含まれている場合はそのまま返す
	if (handle.startsWith('http://') || handle.startsWith('https://')) {
		return handle;
	}
	
	// ハンドル名の場合は従来の処理
	const base: Record<string, string> = {
		instagram: `https://instagram.com/${handle}`,
		x: `https://x.com/${handle}`,
		youtube: `https://youtube.com/${handle}`,
		facebook: `https://facebook.com/${handle}`,
		tiktok: `https://tiktok.com/@${handle}`,
		// 大文字版も対応
		Instagram: `https://instagram.com/${handle}`,
		X: `https://x.com/${handle}`,
		YouTube: `https://youtube.com/${handle}`,
		Facebook: `https://facebook.com/${handle}`,
		TikTok: `https://tiktok.com/@${handle}`,
	};
	return base[platform] || handle;
};

// 共通カードスタイル
const cardBaseStyle = {
	bg: 'gray.50',
	rounded: 'xl',
	shadow: 'md',
	p: '6',
	mx: 'auto',
};

export const NFCExchangeHistoryPage = ({ userId }: { userId: string }) => {
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [showIntro, setShowIntro] = useState(false);

	useEffect(() => {
		const loadUserProfile = async () => {
			setIsLoading(true);
			try {
				const userProfile = await fetchUserProfile(userId);
				console.log('取得したユーザープロフィール:', userProfile);
				console.log('SNSデータ:', userProfile?.social_media_links);
				setProfile(userProfile);
			} catch (error) {
				console.error('ユーザープロフィールの取得に失敗しました:', error);
			} finally {
				setIsLoading(false);
			}
		};

		loadUserProfile();
	}, [userId]);

	if (isLoading) {
		return (
			<div
				className={css({
					minH: '100vh',
					bg: 'gray.50',
					flex: '1',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				})}
			>
				<p className={css({ color: 'gray.600', fontSize: 'lg' })}>
					データを読み込み中...
				</p>
			</div>
		);
	}

	if (!profile) {
		return (
			<div
				className={css({
					minH: '100vh',
					bg: 'gray.50',
					flex: '1',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				})}
			>
				<p className={css({ color: 'gray.600', fontSize: 'lg' })}>
					データが見つかりませんでした
				</p>
			</div>
		);
	}

	return (
		<div
			className={css({
				height: '100%',
				px: { base: '4', md: '8' },
				py: { base: '8', md: '4' },
			})}
		>
			<div
				className={css({
					height: '100%',
					maxW: '4xl',
					mx: 'auto',
					bg: 'white',
					rounded: '2xl',
					shadow: '2xl',
					overflow: 'hidden',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'space-between',
					alignItems: 'center',
					padding: { base: '8', md: '10' },
				})}
			>
				<div
					className={css({
						display: 'flex',
						flexDirection: { base: 'column', md: 'row' },
						alignItems: 'stretch',
						justifyContent: 'center',
						gap: { base: '2', md: '0' },
						mb: '3',
					})}
				>
					<div
						className={css({
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'flex-start',
							minW: { md: '200px' },
							maxW: { md: '240px' },
							flex: 'none',
							py: { base: '0', md: '12' },
							bg: 'transparent',
						})}
					>
						<div
							className={css({
								w: '36',
								h: '36',
								rounded: 'full',
								border: '4px solid',
								borderColor: 'white',
								overflow: 'hidden',
								shadow: 'xl',
								mb: '4',
							})}
						>
							<Image
								src={profile.icon || '/profile-icon.jpg'}
								alt={profile.is_username_visible ? (profile.username ?? 'ユーザー') : 'ユーザー'}
								width={144}
								height={144}
								quality={100}
								unoptimized={true}
								className={css({ w: 'full', h: 'full', objectFit: 'cover' })}
							/>
						</div>
						{profile.is_username_visible && profile.username && (
							<h1
								className={css({
									fontSize: { base: 'xl', md: '2xl' },
									fontWeight: 'bold',
									color: 'gray.800',
									mb: '1',
									textAlign: 'center',
								})}
							>
								{profile.username}
							</h1>
						)}
						{profile.is_user_name_kana_visible && profile.user_name_kana && (
							<p
								className={css({
									fontSize: 'sm',
									color: 'gray.500',
									textAlign: 'center',
								})}
							>
								{profile.user_name_kana}
							</p>
						)}
					</div>
					<div
						className={css({
							flex: 1,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							py: { base: '0', md: '8' },
						})}
					>
						{profile.is_bio_visible && profile.bio && (
							<div
								className={css({
									...cardBaseStyle,
									fontSize: 'sm',
									color: 'gray.700',
									textAlign: 'center',
									position: 'relative',
									w: { base: '100%', md: '512px' },
									mb: '6',
									display: 'flex',
									flexDirection: 'column',
									justifyContent: 'flex-start',
								})}
							>
								<h2
									className={css({
										fontSize: 'lg',
										fontWeight: 'semibold',
										mb: '4',
										color: 'gray.700',
										textAlign: 'center',
									})}
								>
									自己紹介
								</h2>
								<div
									className={css({
										lineHeight: 'tall',
										overflow: 'hidden',
										maxH: showIntro ? 'none' : '60px',
										position: 'relative',
										textAlign: 'center',
										mx: 'auto',
										flex: '1',
										display: 'flex',
										alignItems: 'flex-start',
									})}
								>
									<div className={css({ width: '100%' })}>
										{profile.bio}
										{!showIntro && profile.bio.length > 80 && (
											<div
												className={css({
													position: 'absolute',
													bottom: 0,
													left: 0,
													right: 0,
													height: '30px',
													bgGradient: 'linear(to-t, white, transparent)',
												})}
											/>
										)}
									</div>
								</div>
								{profile.bio.length > 80 && (
									<button
										type="button"
										onClick={() => setShowIntro((v) => !v)}
										className={css({
											mt: '2',
											color: 'blue.500',
											fontSize: 'xs',
											fontWeight: 'bold',
											bg: 'transparent',
											border: 'none',
											cursor: 'pointer',
										})}
									>
										{showIntro ? '閉じる' : 'もっと見る'}
									</button>
								)}
							</div>
						)}
					</div>
				</div>
				<div
					className={css({
						...cardBaseStyle,
						width: '100%',
						maxW: { base: '100%', md: '3xl' },
						display: 'grid',
						gridTemplateColumns: { base: '1fr', md: 'repeat(2, 1fr)' },
						gap: '6',
					})}
				>
					{profile.is_nickname_visible && profile.nickname && (
						<InfoItem label="ユーザー名" value={profile.nickname} />
					)}
					{profile.is_user_position_visible && profile.user_position && (
					<InfoItem label="肩書" value={profile.user_position} />
					)}
					{profile.is_birth_date_visible && profile.birth_date && (
						<InfoItem 
							label="生年月日" 
							value={new Date(profile.birth_date).toLocaleDateString('ja-JP', {
								year: 'numeric',
								month: 'long',
								day: 'numeric'
							})}
						/>
					)}
					{profile.is_company_name_visible && profile.company_name && (
						<InfoItem label="会社名" value={profile.company_name} />
					)}
					{profile.is_company_name_kana_visible && profile.company_name_kana && (
						<InfoItem
							label="会社名（ふりがな）"
							value={profile.company_name_kana}
						/>
					)}
					{profile.is_company_address_visible && profile.company_address && (
						<InfoItem label="所在地" value={profile.company_address} />
					)}
					{profile.is_industry_id_visible && profile.industry_name && (
						<InfoItem label="業種" value={profile.industry_name} />
					)}
					{profile.is_email_visible && profile.email && (
					<InfoItem
						label="メール"
						value={<a href={`mailto:${profile.email}`}>{profile.email}</a>}
					/>
					)}
					{profile.is_phone_number_visible && profile.phone_number && (
						<InfoItem label="電話番号" value={profile.phone_number} />
					)}
					{profile.is_website_url_visible && profile.website_url && (
						<InfoItem
							label="HP"
							value={
								<a
									href={profile.website_url}
									target="_blank"
									rel="noopener noreferrer"
								>
									{profile.website_url}
								</a>
							}
						/>
					)}
					{(() => {
						if (!profile.is_sns_visible || !profile.social_media_links) {
							return false;
						}
						
						// 実際にハンドルが入力されているSNSをフィルタリング
						const validSNSEntries = Object.entries(profile.social_media_links)
							.filter(([plat, handle]) => handle && handle.trim() !== '');
						
						console.log('SNS表示チェック:', {
							is_sns_visible: profile.is_sns_visible,
							social_media_links: profile.social_media_links,
							valid_entries_length: validSNSEntries.length
						});
						
						return validSNSEntries.length > 0;
					})() && (
						<InfoItem
							label="SNS"
							value={Object.entries(profile.social_media_links)
								.filter(([plat, handle]) => {
									console.log(`SNSプラットフォーム: ${plat}, ハンドル: ${handle}`);
									// ハンドルが空文字列または空白のみの場合は除外
									return handle && handle.trim() !== '';
								})
								.sort(([platA], [platB]) => {
									// 'other'を最後に配置
									if (platA === 'other') return 1;
									if (platB === 'other') return -1;
									// その他は元の順序を維持
									return 0;
								})
								.map(([plat, handle]) => (
									<a
										key={plat}
										href={buildSNSUrl(plat, handle)}
										target="_blank"
										rel="noopener noreferrer"
										className={css({
											display: 'inline-block',
											transition: 'transform 0.2s',
											_hover: { scale: '110%' },
											mr: '2'
										})}
									>
										<Image
											src={snsIcons[plat] || snsIcons[plat.toLowerCase()] || '/icons/link.svg'}
											alt={plat}
											width={28}
											height={28}
											quality={100}
											unoptimized={true}
											className={css({
												w: '7',
												h: '7',
												objectFit: 'contain',
											})}
											onError={(e) => {
												console.log(`アイコン読み込みエラー: ${plat}`, e);
												// エラー時はデフォルトアイコンを表示
												e.currentTarget.src = '/icons/link.svg';
											}}
										/>
									</a>
								))}
						/>
					)}
				</div>
			</div>
		</div>
	);
};
