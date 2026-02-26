// EventHistoryTab.tsx
'use client';

import { css } from '@/styled-system/css';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { ListPagination } from '@/components/ui/ListPagination';

interface GatherEvent {
	id: string;
	name: string;
	date: string;
	payment_amount: number;
	payment_date: string;
	stripe_payment_intent_id: string;
	stripe_payment_status: string;
	receipt_download_count: number;
}

export const EventHistoryTab = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { user } = useAuth();
	const [events, setEvents] = useState<GatherEvent[]>([]);
	const [loading, setLoading] = useState(true);
	const [totalPages, setTotalPages] = useState(1);
	const itemsPerPage = 9;

	// クエリパラメータからページを取得
	const currentPage = parseInt(searchParams.get('page') || '1', 10);

	const handleGenerateReceipt = (eventId: string) => {
		router.push(`/receipts/${eventId}`);
	};

	const handlePageChange = (page: number) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set('page', page.toString());
		router.push(`/mypage?${params.toString()}`, { scroll: false });
	};

	// trn_gather_attendeeテーブルからデータを取得
	useEffect(() => {
		const fetchGatherEvents = async () => {
			if (!user) return;

			try {
				const supabase = createClient();

				// 全件数を取得
				const { count } = await supabase
					.from('trn_gather_attendee')
					.select('event_id', { count: 'exact', head: true })
					.eq('user_id', user.id)
					.is('deleted_at', null);

				// ページネーション計算
				const offset = (currentPage - 1) * itemsPerPage;

				// trn_gather_attendeeテーブルからユーザーの懇親会参加履歴を取得
				const { data: gatherData, error } = await supabase
					.from('trn_gather_attendee')
					.select(`
						event_id,
						stripe_payment_intent_id,
						stripe_payment_status,
						payment_amount,
						payment_date,
						receipt_download_count,
						created_at,
						mst_event (
							event_name,
							event_start_datetime
						)
					`)
					.eq('user_id', user.id)
					.is('deleted_at', null)
					.order('created_at', { ascending: false })
					.range(offset, offset + itemsPerPage - 1);

				if (error) {
					console.error('懇親会履歴の取得に失敗しました:', error);
					return;
				}

				// 総ページ数を設定
				setTotalPages(Math.ceil((count || 0) / itemsPerPage));

				// データを変換
				const formattedEvents = gatherData.map((item) => ({
					id: item.event_id,
					name: item.mst_event?.event_name || 'イベント名不明',
					date: item.payment_date ? 
						new Date(item.payment_date).toLocaleDateString('ja-JP', {
							year: 'numeric',
							month: '2-digit',
							day: '2-digit'
						}).replace(/\//g, '年').replace(/\//g, '月') + '日' :
						'決済日不明',
					payment_amount: item.payment_amount || 0,
					payment_date: item.payment_date || '',
					stripe_payment_intent_id: item.stripe_payment_intent_id || '',
					stripe_payment_status: item.stripe_payment_status || '',
					receipt_download_count: item.receipt_download_count || 0,
				}));

				setEvents(formattedEvents);
			} catch (error) {
				console.error('懇親会履歴の取得中にエラーが発生しました:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchGatherEvents();
	}, [user, currentPage, itemsPerPage]);

	// スタイル定義
	const eventCardStyle = css({
		bg: 'white',
		color: '#000',
		p: '0',
		rounded: 'md',
		mb: '3',
	});

	const eventTitleStyle = css({
		bg: 'gray.100',
		fontSize: 'md',
		fontWeight: 'bold',
		p: '2',
		mb: '2',
		borderBottomWidth: '2.5px',
		borderColor: 'gray.200',
	});

	const eventInfoContainerStyle = css({
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		mt: '2',
	});

	const eventDateStyle = css({
		color: '#000',
		fontSize: 'sm',
		mt: '1',
		mb: '2',
		p: '1.5',
		lineHeight: '1.5',
		margin: '0',
	});

	const buttonContainerStyle = css({
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'flex-end',
		alignItems: 'flex-end',
		pr: '4',
		gap: '2',
		margin: '0',
	});

	const blueButtonStyle = css({
		bg: '#3B82F6',
		color: '#FFF',
		px: '3',
		py: '1',
		rounded: 'md',
		fontSize: 'sm',
		fontWeight: 'bold',
		lineHeight: '1.5',
		transition: 'all 0.2s ease-in-out',
		_hover: {
			bg: '#2563EB',
			cursor: 'pointer',
		},
	});

	const greenButtonStyle = css({
		bg: '#22C55E',
		color: '#fff',
		px: '3',
		py: '1',
		rounded: 'md',
		fontSize: 'sm',
		fontWeight: 'bold',
		lineHeight: '1.5',
		transition: 'all 0.2s ease-in-out',
		_hover: {
			bg: '#16A34A',
			cursor: 'pointer',
		},
	});

	const disabledButtonStyle = css({
		bg: '#9ca3af',
		color: '#6b7280',
		px: '3',
		py: '1',
		rounded: 'md',
		fontSize: 'sm',
		fontWeight: 'bold',
		lineHeight: '1.5',
		cursor: 'not-allowed',
	});

	const downloadCountStyle = css({
		fontSize: 'xs',
		color: 'gray.500',
		mb: '1',
	});

	const maxDownloads = 2;

	// 残りダウンロード回数を計算
	const calculateRemainingDownloads = (downloadCount: number) => {
		return Math.max(0, maxDownloads - downloadCount);
	};

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
				<p>懇親会の参加履歴がありません。</p>
			</div>
		);
	}

	return (
		<div>
			{events.map((event) => {
				const remainingDownloads = calculateRemainingDownloads(event.receipt_download_count);
				const canDownload = remainingDownloads > 0;

				return (
					<div key={event.id} className={eventCardStyle}>
						<h3 className={eventTitleStyle}>{event.name}</h3>
						<div className={eventInfoContainerStyle}>
							<div className={eventDateStyle}>日時：{event.date}</div>
							<div className={buttonContainerStyle}>
								<button
									type="button"
									className={greenButtonStyle}
									onClick={() => handleGenerateReceipt(event.id)}
								>
									{canDownload ? '領収書を発行する' : '領収書を確認する'}
								</button>
							</div>
						</div>
					</div>
				);
			})}

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
