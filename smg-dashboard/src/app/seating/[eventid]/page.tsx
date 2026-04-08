'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { css } from '@/styled-system/css';

interface SeatingConfig {
	totalTables: number;
	seatsPerTable: number;
	roundNumber: 1 | 2;
}

interface Participant {
	user_id: string;
	username: string;
	nickname: string;
	icon: string | null;
	is_fixed: boolean;
	is_accessible_seat: boolean;
	is_partner_tax_accountant: boolean;
	has_mobility_issues: boolean;
}

interface Table {
	table_number: number;
	participants: Participant[];
}

interface SeatingData {
	eventId: string;
	roundNumber: number;
	totalTables: number;
	totalParticipants: number;
	tables: Table[];
}

export default function SeatingManagementPage() {
	const params = useParams();
	const router = useRouter();
	const eventId = params.eventid as string;

	const [config, setConfig] = useState<SeatingConfig>({
		totalTables: 17,
		seatsPerTable: 9,
		roundNumber: 1,
	});

	const [seatingData, setSeatingData] = useState<SeatingData | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingData, setIsLoadingData] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// 既存の配席データを読み込み
	useEffect(() => {
		if (eventId) {
			loadSeatingData(config.roundNumber);
		}
	}, [eventId, config.roundNumber]);

	const loadSeatingData = async (roundNumber: number) => {
		setIsLoadingData(true);
		setError(null);
		try {
			const response = await fetch(
				`https://www.smgkeieijuku.com/api/seating/assignments/${eventId}?roundNumber=${roundNumber}`,
				{
					method: 'GET',
					credentials: 'include',
				}
			);

			if (response.ok) {
				const result = await response.json();
				setSeatingData(result.data);
			} else if (response.status === 404) {
				setSeatingData(null);
			} else {
				const errorData = await response.json();
				setError(errorData.error || '配席データの取得に失敗しました');
			}
		} catch (err) {
			console.error('Error loading seating data:', err);
			setError('配席データの取得中にエラーが発生しました');
		} finally {
			setIsLoadingData(false);
		}
	};

	const handleGenerateSeating = async () => {
		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch('https://www.smgkeieijuku.com/api/seating/generate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({
					eventId,
					totalTables: config.totalTables,
					seatsPerTable: config.seatsPerTable,
					roundNumber: config.roundNumber,
				}),
			});

			if (response.ok) {
				const result = await response.json();
				alert('席替えくじを生成しました!');
				// 生成後、配席データを再読み込み
				await loadSeatingData(config.roundNumber);
			} else {
				const errorData = await response.json();
				setError(errorData.error || '席替えくじの生成に失敗しました');
			}
		} catch (err) {
			console.error('Error generating seating:', err);
			setError('席替えくじの生成中にエラーが発生しました');
		} finally {
			setIsLoading(false);
		}
	};

	const handleRegenerate = () => {
		if (confirm('配席を再生成しますか? 現在の配席は削除されます。')) {
			handleGenerateSeating();
		}
	};

	const getTableLabel = (tableNumber: number): string => {
		// テーブル番号をA, B, C...に変換
		return String.fromCharCode(64 + tableNumber);
	};

	return (
		<div className={css({ p: 6, maxW: '1200px', mx: 'auto' })}>
			<h1 className={css({ fontSize: '2xl', fontWeight: 'bold', mb: 6 })}>
				懇親会 席替えくじ管理
			</h1>

			{/* 設定パネル */}
			<div className={css({ bg: 'white', p: 6, rounded: 'lg', shadow: 'md', mb: 6 })}>
				<h2 className={css({ fontSize: 'xl', fontWeight: 'bold', mb: 4 })}>
					席替え設定
				</h2>

				<div className={css({ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 })}>
					<div>
						<label className={css({ display: 'block', mb: 2, fontWeight: 'medium' })}>
							テーブル数
						</label>
						<input
							type="number"
							value={config.totalTables}
							onChange={(e) =>
								setConfig({ ...config, totalTables: Number(e.target.value) })
							}
							className={css({
								w: 'full',
								p: 2,
								border: '1px solid',
								borderColor: 'gray.300',
								rounded: 'md',
							})}
							min="1"
						/>
					</div>

					<div>
						<label className={css({ display: 'block', mb: 2, fontWeight: 'medium' })}>
							1テーブル人数
						</label>
						<input
							type="number"
							value={config.seatsPerTable}
							onChange={(e) =>
								setConfig({ ...config, seatsPerTable: Number(e.target.value) })
							}
							className={css({
								w: 'full',
								p: 2,
								border: '1px solid',
								borderColor: 'gray.300',
								rounded: 'md',
							})}
							min="1"
						/>
					</div>
				</div>

				<div className={css({ mt: 4 })}>
					<label className={css({ display: 'block', mb: 2, fontWeight: 'medium' })}>
						ラウンド
					</label>
					<div className={css({ display: 'flex', gap: 4 })}>
						<button
							type="button"
							onClick={() => setConfig({ ...config, roundNumber: 1 })}
							className={css({
								px: 4,
								py: 2,
								rounded: 'md',
								bg: config.roundNumber === 1 ? 'blue.600' : 'gray.200',
								color: config.roundNumber === 1 ? 'white' : 'gray.700',
								fontWeight: 'medium',
								cursor: 'pointer',
								_hover: {
									bg: config.roundNumber === 1 ? 'blue.700' : 'gray.300',
								},
							})}
						>
							前半
						</button>
						<button
							type="button"
							onClick={() => setConfig({ ...config, roundNumber: 2 })}
							className={css({
								px: 4,
								py: 2,
								rounded: 'md',
								bg: config.roundNumber === 2 ? 'blue.600' : 'gray.200',
								color: config.roundNumber === 2 ? 'white' : 'gray.700',
								fontWeight: 'medium',
								cursor: 'pointer',
								_hover: {
									bg: config.roundNumber === 2 ? 'blue.700' : 'gray.300',
								},
							})}
						>
							後半
						</button>
					</div>
				</div>

				<div className={css({ mt: 6, display: 'flex', gap: 4 })}>
					<button
						type="button"
						onClick={handleGenerateSeating}
						disabled={isLoading}
						className={css({
							px: 6,
							py: 3,
							bg: 'blue.600',
							color: 'white',
							rounded: 'md',
							fontWeight: 'bold',
							cursor: isLoading ? 'not-allowed' : 'pointer',
							opacity: isLoading ? 0.6 : 1,
							_hover: { bg: 'blue.700' },
						})}
					>
						{isLoading ? '生成中...' : seatingData ? '席替えを再生成' : '席替えを生成'}
					</button>

					{seatingData && (
						<button
							type="button"
							onClick={handleRegenerate}
							disabled={isLoading}
							className={css({
								px: 6,
								py: 3,
								bg: 'orange.600',
								color: 'white',
								rounded: 'md',
								fontWeight: 'bold',
								cursor: isLoading ? 'not-allowed' : 'pointer',
								opacity: isLoading ? 0.6 : 1,
								_hover: { bg: 'orange.700' },
							})}
						>
							再シャッフル
						</button>
					)}
				</div>
			</div>

			{/* エラーメッセージ */}
			{error && (
				<div
					className={css({
						bg: 'red.100',
						border: '1px solid',
						borderColor: 'red.400',
						color: 'red.700',
						p: 4,
						rounded: 'md',
						mb: 6,
					})}
				>
					{error}
				</div>
			)}

			{/* 配席結果表示 */}
			{isLoadingData && (
				<div className={css({ textAlign: 'center', py: 8 })}>
					<p>配席データを読み込み中...</p>
				</div>
			)}

			{!isLoadingData && seatingData && (
				<div className={css({ bg: 'white', p: 6, rounded: 'lg', shadow: 'md' })}>
					<h2 className={css({ fontSize: 'xl', fontWeight: 'bold', mb: 4 })}>
						配席結果（{config.roundNumber === 1 ? '前半' : '後半'}）
					</h2>

					<div className={css({ mb: 4, color: 'gray.600' })}>
						<p>総参加者数: {seatingData.totalParticipants}人</p>
						<p>テーブル数: {seatingData.totalTables}卓</p>
					</div>

					<div
						className={css({
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
							gap: 4,
						})}
					>
						{seatingData.tables.map((table) => (
							<div
								key={table.table_number}
								className={css({
									p: 4,
									bg: 'gray.50',
									rounded: 'lg',
									border: '1px solid',
									borderColor: 'gray.200',
								})}
							>
								<h3 className={css({ fontSize: 'lg', fontWeight: 'bold', mb: 3 })}>
									{getTableLabel(table.table_number)}卓 ({table.participants.length}人)
								</h3>

								<ul className={css({ listStyle: 'none', p: 0 })}>
									{table.participants.map((participant) => (
										<li
											key={participant.user_id}
											className={css({
												py: 2,
												borderBottom: '1px solid',
												borderColor: 'gray.200',
												fontSize: 'sm',
											})}
										>
											<div className={css({ display: 'flex', alignItems: 'center', gap: 2 })}>
												<span>
													{participant.nickname || participant.username || '名前なし'}
												</span>
												{participant.is_partner_tax_accountant && (
													<span
														className={css({
															px: 2,
															py: 1,
															bg: 'blue.100',
															color: 'blue.700',
															fontSize: 'xs',
															rounded: 'md',
														})}
													>
														税理士
													</span>
												)}
												{participant.has_mobility_issues && (
													<span
														className={css({
															px: 2,
															py: 1,
															bg: 'green.100',
															color: 'green.700',
															fontSize: 'xs',
															rounded: 'md',
														})}
													>
														配慮
													</span>
												)}
											</div>
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</div>
			)}

			{!isLoadingData && !seatingData && !error && (
				<div className={css({ textAlign: 'center', py: 8, color: 'gray.500' })}>
					<p>配席データがありません。「席替えを生成」ボタンから生成してください。</p>
				</div>
			)}
		</div>
	);
}
