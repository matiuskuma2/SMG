'use client';

import { css } from '@/styled-system/css';
import { Settings } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function GroupConfirmationPage() {
	const params = useParams();
	const eventId = params.eventId as string;

	// イベントIDに基づいてイベント名を設定
	const eventName =
		eventId === 'abc-event'
			? 'ABCイベントの懇親会'
			: eventId === 'bcd-event'
				? 'BCDイベント'
				: eventId === 'z-event'
					? 'Zイベント'
					: eventId === 'x-event'
						? 'Xイベント'
						: eventId === 'y-event'
							? 'Yイベント'
							: eventId === 'k-event'
								? 'Kイベント'
								: 'イベント';

	// ダミーメンバーデータ
	const members = [
		{
			id: 1,
			name: '田中太郎',
			username: 'tanaka_taro',
			email: 'tanaka@example.com',
			profile: 'マーケティング担当。趣味は読書と旅行。',
			isPublic: true,
			avatarUrl: '/profile-icon.jpg',
		},
		{
			id: 2,
			name: '佐藤花子',
			username: 'sato_hanako',
			email: 'hanako@example.com',
			profile: 'デザイナー。UIUXに興味があります。',
			isPublic: false,
			avatarUrl: '/profile-icon.jpg',
		},
		{
			id: 3,
			name: '鈴木一郎',
			username: 'suzuki_ichiro',
			email: 'suzuki@example.com',
			profile: 'エンジニア。AI開発に携わっています。',
			isPublic: true,
			avatarUrl: '/profile-icon.jpg',
		},
	];

	// ヘッダースタイル
	const headerStyle = css({
		py: '4',
		px: '6',
		borderBottomWidth: '1px',
		borderColor: 'gray.200',
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		position: 'relative',
		bg: 'white',
	});

	// ページコンテナスタイル
	const pageContainerStyle = css({
		maxWidth: '1200px',
		mx: 'auto',
		my: '6',
		pb: '3',
		bg: 'gray.100',
		minHeight: '100%',
	});

	// コンテンツエリアスタイル
	const contentAreaStyle = css({
		bg: 'white',
		mx: { base: '4', md: '8' },
		my: '6',
		rounded: 'md',
		shadow: 'md',
		overflow: 'hidden',
	});

	// ページタイトルスタイル
	const pageTitleStyle = css({
		fontSize: 'xl',
		fontWeight: 'bold',
		textAlign: 'center',
		p: '4',
		borderBottomWidth: '1px',
		borderColor: 'gray.200',
		bg: 'white',
	});

	// セクションタイトルスタイル
	const sectionTitleStyle = css({
		fontSize: 'lg',
		fontWeight: 'bold',
		p: '4',
		borderBottomWidth: '1px',
		borderColor: 'gray.200',
	});

	// メンバーリストスタイル
	const memberListStyle = css({
		p: '4',
	});

	// メンバーカードスタイル
	const memberCardStyle = css({
		bg: 'white',
		borderWidth: '1px',
		borderColor: 'gray.200',
		rounded: 'md',
		p: '4',
		mb: '4',
		shadow: 'sm',
	});

	// メンバー情報スタイル
	const memberInfoStyle = css({
		color: 'gray.800',
		lineHeight: '1.6',
		px: '2',
	});

	// ラベルスタイル
	const labelStyle = css({
		fontWeight: 'bold',
		color: 'gray.600',
		mr: '2',
	});

	// ボタンコンテナスタイル
	const buttonContainerStyle = css({
		display: 'flex',
		justifyContent: 'center',
		p: '6',
	});

	// ボタンスタイル
	const buttonStyle = css({
		bg: 'blue.500',
		color: 'white',
		px: '6',
		py: '2',
		rounded: 'md',
		fontWeight: 'medium',
		textAlign: 'center',
		transition: 'all 0.2s ease-in-out',
		_hover: {
			bg: 'blue.600',
			transform: 'translateY(-2px)',
			boxShadow: 'md',
		},
	});

	// プライベート情報スタイル
	const privateInfoStyle = css({
		fontStyle: 'italic',
		color: 'gray.500',
	});

	return (
		<div className={pageContainerStyle}>
			{/* ヘッダー */}
			<div className={headerStyle}>
				<h1 className={css({ fontSize: 'xl', fontWeight: 'bold' })}>
					グループ確認：{eventName}
				</h1>
			</div>

			{/* コンテンツエリア */}
			<div className={contentAreaStyle}>
				{/* セクションタイトル */}
				<h2 className={sectionTitleStyle}>グループメンバー</h2>

				{/* メンバーリスト */}
				<div className={memberListStyle}>
					{members.map((member) => (
						<div key={member.id} className={memberCardStyle}>
							<div className={css({ display: 'flex', gap: '4' })}>
								{/* アバター */}
								<div
									className={css({
										width: '16',
										height: '16',
										rounded: 'full',
										overflow: 'hidden',
										flexShrink: 0,
										border: '1px solid',
										borderColor: 'gray.200',
									})}
								>
									<Image
										src={member.avatarUrl}
										alt={`${member.name}のアイコン`}
										width={64}
										height={64}
										quality={100}
										unoptimized={true}
										className={css({
											w: 'full',
											h: 'full',
											objectFit: 'cover',
										})}
									/>
								</div>

								{/* メンバー情報 */}
								<div className={memberInfoStyle}>
									<p className={css({ mb: '2' })}>
										<span className={labelStyle}>氏名：</span>
										{member.name}
									</p>
									<p className={css({ mb: '2' })}>
										<span className={labelStyle}>ユーザー名：</span>
										{member.username}
									</p>
									<p className={css({ mb: '2' })}>
										<span className={labelStyle}>メールアドレス：</span>
										{member.email}
									</p>
									<p>
										<span className={labelStyle}>その他プロフィール：</span>
										{member.isPublic ? (
											member.profile
										) : (
											<span className={privateInfoStyle}>
												※非公開の項目は空欄で表示する
											</span>
										)}
									</p>
								</div>
							</div>
						</div>
					))}
				</div>

				{/* ボタンコンテナ */}
				<div className={buttonContainerStyle}>
					<Link href="/mypage">
						<div className={buttonStyle}>マイページに戻る</div>
					</Link>
				</div>
			</div>
		</div>
	);
}
