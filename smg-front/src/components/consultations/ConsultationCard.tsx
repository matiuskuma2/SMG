import { useIsInstructor } from '@/hooks/useIsInstructor';
import { css } from '@/styled-system/css';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

type ConsultationCardProps = {
	consultation_id: string;
	instructor_id: string;
	image_url: string | null;
	title: string | null;
	description: string | null;
	application_start_datetime: string;
	application_end_datetime: string;
	instructor: {
		user_id: string;
		username: string | null;
	};
	is_applied: boolean;
};

export const ConsultationCard = ({
	consultation_id,
	title,
	description,
	instructor,
	image_url,
	application_start_datetime,
	application_end_datetime,
	is_applied,
}: ConsultationCardProps) => {
	const { isInstructor, loading: isInstructorLoading } = useIsInstructor();
	const [imageError, setImageError] = useState(false);

	const handleEdit = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		const dashboardUrl =
			process.env.NEXT_PUBLIC_DASHBOARD_URL ||
			'https://smg-dashboard.vercel.app';
		window.open(
			`${dashboardUrl}/individualConsultation/edit/${consultation_id}`,
			'_blank',
		);
	};

	// 申し込み期間外かどうかを判定
	const now = new Date();
	const start = new Date(application_start_datetime);
	const end = new Date(application_end_datetime);
	const isOutsideApplicationPeriod = now < start || now > end;
	const cardContent = (
		<div
			className={css({
				backgroundColor: 'white',
				borderRadius: '0.5rem',
				boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
				overflow: 'hidden',
				transition: 'box-shadow 0.3s',
				position: 'relative',
				_hover: {
					boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
				},
				// デスクトップ: 横並びレイアウト
				display: 'flex',
				flexDirection: 'row',
				// モバイル: 縦並び
				'@media (max-width: 640px)': {
					flexDirection: 'column',
					alignItems: 'center',
				},
			})}
		>
			{/* 編集ボタン */}
			{!isInstructorLoading && isInstructor && (
				<button
					type="button"
					onClick={handleEdit}
					className={css({
						position: 'absolute',
						top: '3',
						right: '3',
						px: '3',
						py: '1.5',
						bg: 'blue.600',
						color: 'white',
						borderRadius: 'md',
						fontSize: 'xs',
						fontWeight: 'medium',
						cursor: 'pointer',
						transition: 'all 0.2s',
						zIndex: 10,
						_hover: {
							bg: 'blue.700',
						},
						_active: {
							transform: 'scale(0.98)',
						},
					})}
				>
					編集
				</button>
			)}
			{/* 画像セクション */}
			<div
				className={css({
					// デスクトップ: 固定幅
					width: '400px',
					flexShrink: 0,
					position: 'relative',
					height: '230px',
					// モバイル: 全幅、自動高さ
					'@media (max-width: 640px)': {
						width: '100%',
						height: 'auto',
						aspectRatio: '16/9',
					},
				})}
			>
				{!image_url || imageError ? (
					<div
						className={css({
							position: 'absolute',
							height: '100%',
							width: '100%',
							inset: '0px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							backgroundColor: 'gray.200',
							color: 'gray.500',
							fontSize: 'lg',
							fontWeight: 'medium',
							padding: '10px',
							borderRadius: '0.5rem',
							// デスクトップ: 左角を丸く
							borderTopLeftRadius: '0.5rem',
							borderBottomLeftRadius: '0.5rem',
							// モバイル: 上角を丸く
							'@media (max-width: 640px)': {
								borderTopLeftRadius: '0.5rem',
								borderTopRightRadius: '0.5rem',
								borderBottomLeftRadius: '0',
								borderBottomRightRadius: '0',
							},
						})}
					>
						画像なし
					</div>
				) : (
					<Image
						src={image_url}
						alt={'画像'}
						fill
						sizes="(max-width: 640px) 100vw, 400px"
						quality={100}
						unoptimized={true}
						onError={() => setImageError(true)}
						style={{
							objectFit: 'cover',
							padding: '10px',
							borderRadius: '0.5rem',
						}}
						className={css({
							// デスクトップ: 左角を丸く
							borderTopLeftRadius: '0.5rem',
							borderBottomLeftRadius: '0.5rem',
							// モバイル: 上角を丸く
							'@media (max-width: 640px)': {
								borderTopLeftRadius: '0.5rem',
								borderTopRightRadius: '0.5rem',
								borderBottomLeftRadius: '0',
								borderBottomRightRadius: '0',
							},
						})}
					/>
				)}
			</div>

			{/* 詳細セクション */}
			<div
				className={css({
					// デスクトップ: 可変幅、パディング付き
					padding: '1.5rem',
					flex: '1',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					// モバイル: 全幅、中央揃え
					'@media (max-width: 640px)': {
						width: '100%',
						padding: '1rem 1rem 0.5rem',
						alignItems: 'center',
						textAlign: 'center',
					},
				})}
			>
				<h2
					className={css({
						fontSize: '1.25rem',
						fontWeight: 'semibold',
						marginBottom: '0.5rem',
						// モバイル: 少し小さめのフォント
						'@media (max-width: 640px)': {
							fontSize: '1.125rem',
						},
					})}
				>
					{title || '相談タイトル'}
				</h2>

				{/* 詳細テキスト */}
				<p
					className={css({
						fontSize: '0.875rem',
						color: 'gray.600',
						marginBottom: '0.75rem',
						lineHeight: '1.5',
						// モバイル: 中央揃え
						'@media (max-width: 640px)': {
							textAlign: 'center',
						},
					})}
					style={{
						display: '-webkit-box',
						WebkitLineClamp: 3,
						WebkitBoxOrient: 'vertical',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
						whiteSpace: 'pre-line',
					}}
				>
					{description || '詳細情報はありません'}
				</p>

				{/* 講師名 */}
				<div
					className={css({
						display: 'flex',
						alignItems: 'center',
						gap: '0.5rem',
						fontSize: 'sm',
						color: 'gray.700',
						marginBottom: '0.75rem',
						// モバイル: 中央揃え
						'@media (max-width: 640px)': {
							justifyContent: 'center',
						},
					})}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-label="講師"
					>
						<title>講師</title>
						<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
						<circle cx="12" cy="7" r="4" />
					</svg>
					<span>講師: {instructor.username || '未設定'}</span>
				</div>
			</div>

			{/* ボタンセクション */}
			<div
				className={css({
					// デスクトップ: 固定幅、中央揃え
					padding: '1.5rem',
					width: '200px',
					flexShrink: 0,
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
					borderColor: 'gray.100',
					'@media (max-width: 640px)': {
						padding: '0.5rem 1rem 1rem',
						width: '100%',
						borderRadius: '0.5rem',
						marginTop: '0.5rem',
					},
				})}
			>
				<div
					className={css({
						display: 'flex',
						flexDirection: 'column',
						gap: '0.5rem',
						alignItems: 'center',
						marginBottom: '0.75rem',
						'@media (max-width: 640px)': {
							marginBottom: '0.5rem',
						},
					})}
				>
					<div
						className={css({
							display: 'flex',
							alignItems: 'center',
							gap: '0.5rem',
							fontSize: 'sm',
							color: 'gray.800',
							fontWeight: 'medium',
						})}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-label="申込期間"
						>
							<title>申込期間</title>
							<rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
							<line x1="16" x2="16" y1="2" y2="6" />
							<line x1="8" x2="8" y1="2" y2="6" />
							<line x1="3" x2="21" y1="10" y2="10" />
						</svg>
						<span>申込期間</span>
					</div>
					<div
						className={css({
							fontSize: 'lg',
							fontWeight: 'bold',
							color: 'gray.900',
							'@media (max-width: 640px)': {
								fontSize: 'xl',
							},
						})}
					>
						<div
							className={css({
								display: 'flex',
								flexDirection: 'row',
								alignItems: 'center',
								gap: '1rem',
							})}
						>
							<div
								className={css({
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									gap: '0.25rem',
								})}
							>
								<div
									className={css({
										fontSize: 'xl',
										fontWeight: 'bold',
									})}
								>
									{new Date(application_start_datetime).toLocaleDateString(
										'ja-JP',
										{ month: 'numeric', day: 'numeric' },
									)}
								</div>
								<div
									className={css({
										fontSize: 'sm',
										color: 'gray.600',
									})}
								>
									{new Date(application_start_datetime).toLocaleTimeString(
										'ja-JP',
										{ hour: '2-digit', minute: '2-digit' },
									)}
								</div>
							</div>

							<div
								className={css({
									color: 'gray.600',
									fontSize: 'lg',
								})}
							>
								〜
							</div>

							<div
								className={css({
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									gap: '0.25rem',
								})}
							>
								<div
									className={css({
										fontSize: 'xl',
										fontWeight: 'bold',
									})}
								>
									{new Date(application_end_datetime).toLocaleDateString(
										'ja-JP',
										{ month: 'numeric', day: 'numeric' },
									)}
								</div>
								<div
									className={css({
										fontSize: 'sm',
										color: 'gray.600',
									})}
								>
									{new Date(application_end_datetime).toLocaleTimeString(
										'ja-JP',
										{ hour: '2-digit', minute: '2-digit' },
									)}
								</div>
							</div>
						</div>
					</div>
					<div
						className={css({
							fontSize: 'sm',
							color: 'gray.800',
							fontWeight: 'medium',
						})}
					/>
				</div>
				{isOutsideApplicationPeriod ? (
					<button
						type="button"
						disabled
						className={css({
							backgroundColor: 'gray.400',
							color: 'white',
							padding: '0.75rem 2rem',
							borderRadius: '0.5rem',
							fontWeight: 'bold',
							fontSize: 'md',
							width: '100%',
							maxWidth: '200px',
							cursor: 'pointer',
							whiteSpace: 'nowrap',
							'@media (max-width: 640px)': {
								padding: '1rem 2rem',
								fontSize: 'lg',
							},
						})}
					>
						期間外
					</button>
				) : (
					<button
						type="button"
						className={css({
							backgroundColor: is_applied ? 'red.600' : 'blue.600',
							color: 'white',
							padding: '0.75rem 2rem',
							borderRadius: '0.5rem',
							fontWeight: 'bold',
							fontSize: 'md',
							transition: 'background-color 0.2s',
							width: '100%',
							maxWidth: '200px',
							cursor: 'pointer',
							_hover: {
								backgroundColor: is_applied ? 'red.700' : 'blue.700',
							},
							'@media (max-width: 640px)': {
								padding: '1rem 2rem',
								fontSize: 'lg',
							},
						})}
					>
						{is_applied ? 'キャンセル' : '詳細'}
					</button>
				)}
			</div>
		</div>
	);

	return (
		<Link
			href={`/consultations/${consultation_id}`}
			className={css({
				display: 'block',
				cursor: 'pointer',
			})}
		>
			{cardContent}
		</Link>
	);
};
