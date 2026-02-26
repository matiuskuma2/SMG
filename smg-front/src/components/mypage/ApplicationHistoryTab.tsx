'use client';

import { ListPagination } from '@/components/ui/ListPagination';
import { css } from '@/styled-system/css';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ApplicationEvent {
	eventId: string;
	name: string;
	date: string;
	location: string;
	isOffline: boolean;
	hasEvent: boolean;
	hasGather: boolean;
	hasConsultation: boolean;
	isEnded: boolean;
}

export const ApplicationHistoryTab = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [events, setEvents] = useState<ApplicationEvent[]>([]);
	const [loading, setLoading] = useState(true);
	const [totalPages, setTotalPages] = useState(1);
	const itemsPerPage = 10;

	// クエリパラメータからページを取得
	const currentPage = Number.parseInt(searchParams.get('page') || '1', 10);

	const handleEventClick = (eventId: string) => {
		router.push(`/events/${eventId}`);
	};

	const handlePageChange = (page: number) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set('page', page.toString());
		router.push(`/mypage?${params.toString()}`, { scroll: false });
	};

	// サーバーサイドAPIから申し込み履歴を取得
	useEffect(() => {
		const fetchApplicationEvents = async () => {
			setLoading(true);
			try {
				const response = await fetch(
					`/api/mypage/applications?page=${currentPage}&limit=${itemsPerPage}`,
				);

				if (!response.ok) {
					throw new Error('申し込み履歴の取得に失敗しました');
				}

				const data = await response.json();
				setEvents(data.events);
				setTotalPages(data.totalPages);
			} catch (error) {
				console.error('申し込み履歴の取得中にエラーが発生しました:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchApplicationEvents();
	}, [currentPage]);

	// スタイル定義
	const eventCardStyle = css({
		bg: 'white',
		color: '#000',
		p: '0',
		w: 'full',
		textAlign: 'left',
		border: 'none',
		rounded: 'md',
		mb: '3',
		cursor: 'pointer',
		transition: 'all 0.2s ease-in-out',
		_hover: {
			shadow: 'lg',
			transform: 'translateY(-2px)',
		},
	});

	const eventTitleStyle = css({
		bg: 'gray.100',
		fontSize: 'md',
		fontWeight: 'bold',
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		gap: '2',
		p: '2',
		mb: '2',
		borderBottomWidth: '2.5px',
		borderColor: 'gray.200',
	});

	const eventInfoContainerStyle = css({
		display: 'flex',
		flexDirection: 'column',
		gap: '1',
		p: '3',
	});

	const eventInfoStyle = css({
		color: '#000',
		fontSize: 'sm',
		lineHeight: '1.5',
	});

	const participationContainerStyle = css({
		display: 'flex',
		alignItems: 'center',
		gap: '2',
		flexWrap: 'wrap',
	});

	const badgeBase = {
		display: 'inline-block',
		px: '2',
		py: '0.5',
		rounded: 'md',
		fontSize: 'xs',
		fontWeight: 'bold',
	} as const;

	const eventBadgeStyle = css({
		...badgeBase,
		bg: 'purple.100',
		color: 'purple.800',
	});

	const gatherBadgeStyle = css({
		...badgeBase,
		bg: 'orange.100',
		color: 'orange.800',
	});

	const consultationBadgeStyle = css({
		...badgeBase,
		bg: 'teal.100',
		color: 'teal.800',
	});

	const offlineBadgeStyle = css({
		...badgeBase,
		bg: 'blue.100',
		color: 'blue.800',
		ml: '2',
	});

	const onlineBadgeStyle = css({
		...badgeBase,
		bg: 'green.100',
		color: 'green.800',
		ml: '2',
	});

	const endedBadgeStyle = css({
		...badgeBase,
		bg: 'red.100',
		color: 'red.800',
		fontSize: '2xs',
	});

	if (loading) {
		return (
			<div className={css({ textAlign: 'center', py: '8' })}>
				<p>データを読み込み中...</p>
			</div>
		);
	}

	if (events.length === 0) {
		return (
			<div className={css({ textAlign: 'center', py: '8' })}>
				<p>申し込み履歴がありません。</p>
			</div>
		);
	}

	return (
		<div>
			{events.map((event) => (
				<button
					type="button"
					key={event.eventId}
					className={eventCardStyle}
					onClick={() => handleEventClick(event.eventId)}
				>
					<h3 className={eventTitleStyle}>
						<span>{event.name}</span>
						{event.isEnded && <span className={endedBadgeStyle}>終了済み</span>}
					</h3>
					<div className={eventInfoContainerStyle}>
						<div className={eventInfoStyle}>
							<strong>日時：</strong>
							{event.date}
						</div>
						<div className={eventInfoStyle}>
							<strong>場所：</strong>
							{event.location}
							{event.isOffline ? (
								<span className={offlineBadgeStyle}>オフライン</span>
							) : (
								<span className={onlineBadgeStyle}>オンライン</span>
							)}
						</div>
						<div className={participationContainerStyle}>
							<strong className={eventInfoStyle}>参加：</strong>
							{event.hasEvent && (
								<span className={eventBadgeStyle}>イベント</span>
							)}
							{event.hasGather && (
								<span className={gatherBadgeStyle}>懇親会</span>
							)}
							{event.hasConsultation && (
								<span className={consultationBadgeStyle}>個別相談</span>
							)}
						</div>
					</div>
				</button>
			))}

			{/* ページネーション */}
			{totalPages > 1 && (
				<ListPagination
					currentPage={currentPage}
					totalPages={totalPages}
					onPageChange={handlePageChange}
				/>
			)}
		</div>
	);
};
