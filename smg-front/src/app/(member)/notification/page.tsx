'use client';

import { useNotification } from '@/components/NotificationContext';
import type { Notification } from '@/lib/api/notification';
import {
	getNotifications,
	markAllNotificationsAsRead,
} from '@/lib/api/notification';
import { css } from '@/styled-system/css';
import { ChevronLeft, Settings } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function NoticePage() {
	const router = useRouter();
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const { setUnreadCount } = useNotification();

	const handleNotificationClick = (url: string) => {
		const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
		if (url.startsWith('http://') || url.startsWith('https://')) {
			router.push(url);
			return;
		}
		const fullUrl = new URL(url, baseUrl).toString();
		router.push(fullUrl);
	};

	useEffect(() => {
		const fetchNotifications = async () => {
			// 未読通知を既読に更新し、アイコンの数字をクリア
			try {
				await markAllNotificationsAsRead();
				setUnreadCount(0);
			} catch (errorMark) {
				console.error('通知の既読更新に失敗しました:', errorMark);
			}
			// 通知を取得
			try {
				const data = await getNotifications();
				setNotifications(data);
			} catch (error) {
				console.error('通知の取得に失敗しました:', error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchNotifications();
	}, [setUnreadCount]);

	return (
		<div
			className={css({ display: 'flex', flexDirection: 'column', h: 'full' })}
		>
			<div
				className={css({
					flex: '1',
					overflowY: 'auto',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
				})}
			>
				<div
					className={css({
						maxW: 'lg',
						w: '90%',
						mx: 'auto',
						border: '1px solid',
						borderColor: 'gray.200',
						bg: 'white',
						mb: '4',
						mt: '4',
					})}
				>
					<div
						className={css({
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							px: '3',
							py: '2',
							borderBottom: '1px solid',
							borderColor: 'gray.200',
						})}
					>
						<button type="button" onClick={() => router.back()}>
							<ChevronLeft size={24} strokeWidth={2.5} />
						</button>
						<h1
							className={css({ fontSize: 'xl', fontWeight: 'bold', py: '2' })}
						>
							通知
						</h1>
						<Link
							href="/notification/settings"
							className={css({
								display: 'grid',
								placeItems: 'center',
								color: 'gray.600',
								_hover: { color: 'gray.900' },
							})}
						>
							<Settings size={22} strokeWidth={2} />
						</Link>
					</div>

					{isLoading ? (
						<div className={css({ py: '8', textAlign: 'center' })}>
							読み込み中...
						</div>
					) : notifications.length === 0 ? (
						<div className={css({ py: '8', textAlign: 'center' })}>
							通知はありません
						</div>
					) : (
						notifications.map((notice, index) => (
							<button
								type="button"
								key={notice.id}
								onClick={() => handleNotificationClick(notice.url)}
								className={css({
									display: 'block',
									w: '100%',
									textAlign: 'left',
									py: '4',
									px: '4',
									borderBottom:
										index < notifications.length - 1 ? '1px solid' : 'none',
									borderColor: 'gray.200',
									cursor: 'pointer',
									bg: 'transparent',
									_hover: {
										bg: 'gray.50',
									},
								})}
							>
								<div
									className={css({
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'start',
									})}
								>
									<div className={css({ flex: '1', pr: '2' })}>
										<div
											className={css({ fontSize: 'sm', fontWeight: 'normal' })}
										>
											{notice.title}
										</div>
									</div>
									<div
										className={css({
											fontSize: 'xs',
											color: 'gray.500',
											ml: '2',
											pt: '0.5',
											whiteSpace: 'nowrap',
										})}
									>
										{notice.time}
									</div>
								</div>
							</button>
						))
					)}
				</div>
			</div>
		</div>
	);
}
