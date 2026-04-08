'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { css } from '@/styled-system/css';

interface SeatInfo {
	table_number: number;
	is_fixed: boolean;
	is_accessible_seat: boolean;
	created_at: string;
}

interface MySeatingData {
	eventId: string;
	userId: string;
	round1: SeatInfo | null;
	round2: SeatInfo | null;
}

export default function MySeatingPage() {
	const params = useParams();
	const eventId = params.id as string;

	const [seatingData, setSeatingData] = useState<MySeatingData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (eventId) {
			loadMySeating();
		}
	}, [eventId]);

	const loadMySeating = async () => {
		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch(`/api/seating/my-seat/${eventId}`, {
				method: 'GET',
				credentials: 'include',
			});

			if (response.ok) {
				const result = await response.json();
				setSeatingData(result.data);
			} else if (response.status === 404) {
				setError('配席情報がまだ生成されていません');
			} else {
				const errorData = await response.json();
				setError(errorData.error || '配席情報の取得に失敗しました');
			}
		} catch (err) {
			console.error('Error loading my seating:', err);
			setError('配席情報の取得中にエラーが発生しました');
		} finally {
			setIsLoading(false);
		}
	};

	const getTableLabel = (tableNumber: number): string => {
		// テーブル番号をA, B, C...に変換
		return String.fromCharCode(64 + tableNumber);
	};

	if (isLoading) {
		return (
			<div className={css({ p: 6, textAlign: 'center' })}>
				<p className={css({ fontSize: 'lg', color: 'gray.600' })}>
					配席情報を読み込み中...
				</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className={css({ p: 6, maxW: '600px', mx: 'auto' })}>
				<div
					className={css({
						bg: 'yellow.50',
						border: '1px solid',
						borderColor: 'yellow.300',
						color: 'yellow.800',
						p: 6,
						rounded: 'lg',
						textAlign: 'center',
					})}
				>
					<p className={css({ fontSize: 'lg', fontWeight: 'medium' })}>{error}</p>
					<p className={css({ mt: 2, fontSize: 'sm', color: 'gray.600' })}>
						配席は懇親会開始前に決定されます。しばらくお待ちください。
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className={css({ p: 6, maxW: '800px', mx: 'auto' })}>
			<h1
				className={css({
					fontSize: '2xl',
					fontWeight: 'bold',
					mb: 6,
					textAlign: 'center',
					color: 'gray.800',
				})}
			>
				あなたの席
			</h1>

			{/* 前半の席 */}
			{seatingData?.round1 && (
				<div
					className={css({
						bg: 'white',
						p: 8,
						rounded: 'xl',
						shadow: 'lg',
						mb: 6,
						border: '2px solid',
						borderColor: 'blue.200',
					})}
				>
					<h2
						className={css({
							fontSize: 'xl',
							fontWeight: 'bold',
							mb: 4,
							color: 'blue.700',
							textAlign: 'center',
						})}
					>
						前半の席
					</h2>

					<div className={css({ textAlign: 'center' })}>
						<p className={css({ fontSize: '4xl', fontWeight: 'bold', color: 'blue.600', mb: 2 })}>
							{getTableLabel(seatingData.round1.table_number)}卓
						</p>
						<p className={css({ fontSize: 'sm', color: 'gray.600' })}>
							テーブル番号: {seatingData.round1.table_number}
						</p>

						{seatingData.round1.is_fixed && (
							<p
								className={css({
									mt: 4,
									px: 4,
									py: 2,
									bg: 'blue.100',
									color: 'blue.700',
									rounded: 'md',
									fontSize: 'sm',
									display: 'inline-block',
								})}
							>
								固定席（前半・後半とも同じ席です）
							</p>
						)}

						{seatingData.round1.is_accessible_seat && (
							<p
								className={css({
									mt: 4,
									px: 4,
									py: 2,
									bg: 'green.100',
									color: 'green.700',
									rounded: 'md',
									fontSize: 'sm',
									display: 'inline-block',
								})}
							>
								入口近くの席です
							</p>
						)}
					</div>
				</div>
			)}

			{/* 後半の席 */}
			{seatingData?.round2 && (
				<div
					className={css({
						bg: 'white',
						p: 8,
						rounded: 'xl',
						shadow: 'lg',
						mb: 6,
						border: '2px solid',
						borderColor: 'orange.200',
					})}
				>
					<h2
						className={css({
							fontSize: 'xl',
							fontWeight: 'bold',
							mb: 4,
							color: 'orange.700',
							textAlign: 'center',
						})}
					>
						後半の席
					</h2>

					<div className={css({ textAlign: 'center' })}>
						<p className={css({ fontSize: '4xl', fontWeight: 'bold', color: 'orange.600', mb: 2 })}>
							{getTableLabel(seatingData.round2.table_number)}卓
						</p>
						<p className={css({ fontSize: 'sm', color: 'gray.600' })}>
							テーブル番号: {seatingData.round2.table_number}
						</p>

						{seatingData.round2.is_fixed && (
							<p
								className={css({
									mt: 4,
									px: 4,
									py: 2,
									bg: 'blue.100',
									color: 'blue.700',
									rounded: 'md',
									fontSize: 'sm',
									display: 'inline-block',
								})}
							>
								固定席（前半・後半とも同じ席です）
							</p>
						)}

						{seatingData.round2.is_accessible_seat && (
							<p
								className={css({
									mt: 4,
									px: 4,
									py: 2,
									bg: 'green.100',
									color: 'green.700',
									rounded: 'md',
									fontSize: 'sm',
									display: 'inline-block',
								})}
							>
								入口近くの席です
							</p>
						)}
					</div>
				</div>
			)}

			{/* 注意事項 */}
			<div
				className={css({
					bg: 'gray.50',
					p: 6,
					rounded: 'lg',
					border: '1px solid',
					borderColor: 'gray.200',
				})}
			>
				<h3 className={css({ fontSize: 'lg', fontWeight: 'bold', mb: 3, color: 'gray.800' })}>
					ご案内
				</h3>
				<ul className={css({ listStyle: 'disc', pl: 6, color: 'gray.700', fontSize: 'sm' })}>
					<li className={css({ mb: 2 })}>
						前半と後半でテーブルが変わります。各ラウンドの開始時刻をご確認ください。
					</li>
					<li className={css({ mb: 2 })}>
						「固定席」と表示されている方は、前半・後半とも同じテーブルです。
					</li>
					<li className={css({ mb: 2 })}>
						配席は決済済みの参加者を対象に、自動で割り当てられています。
					</li>
					<li>
						ご不明な点がありましたら、会場のスタッフにお声がけください。
					</li>
				</ul>
			</div>
		</div>
	);
}
