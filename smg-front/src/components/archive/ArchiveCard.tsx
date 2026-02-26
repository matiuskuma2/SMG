import { css } from '@/styled-system/css';
import { Calendar } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import '../ui/EventCard.css';
import { useIsInstructor } from '@/hooks/useIsInstructor';
import type { Archive } from './types';

type ArchiveCardProps = {
	archive: Archive;
	isOthers?: boolean;
};

export default function ArchiveCard({
	archive,
	isOthers = false,
}: ArchiveCardProps) {
	const { isInstructor, loading: isInstructorLoading } = useIsInstructor();

	const handleEdit = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		const dashboardUrl =
			process.env.NEXT_PUBLIC_DASHBOARD_URL ||
			'https://smg-dashboard.vercel.app';

		// 写真またはニュースレターの場合は専用のURLにリダイレクト
		if (
			archive.event_type_name === '写真' ||
			archive.event_type_name === 'ニュースレター'
		) {
			window.open(
				`${dashboardUrl}/archive/edit/${archive.archive_id}`,
				'_blank',
			);
		} else {
			// その他のアーカイブはeventIdを含むURLにリダイレクト
			if (archive.event_id) {
				window.open(
					`${dashboardUrl}/event/archive/${archive.event_id}?archiveId=${archive.archive_id}`,
					'_blank',
				);
			}
		}
	};

	// イベント日時はmst_eventのevent_start_datetimeのみを使用
	let eventDate: Date | null = null;
	if (archive.event_start_datetime) {
		eventDate = new Date(archive.event_start_datetime);
	}

	const formattedDate = eventDate
		? eventDate.toLocaleDateString('ja-JP', {
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
			})
		: '未設定';

	const imageUrl = archive.archive_image_url || archive.image_url || null;

	// 「その他」タブでのアーカイブタイプに応じた色を設定
	const getOthersTypeStyles = (typeName: string) => {
		if (!isOthers) return {};

		switch (typeName) {
			case '写真':
				return {
					backgroundColor: '#10B981', // emerald-500
					color: 'white',
				};
			case 'ニュースレター':
				return {
					backgroundColor: '#3B82F6', // blue-500
					color: 'white',
				};
			default:
				return {};
		}
	};

	const typeStyles = getOthersTypeStyles(archive.event_type_name);
	const typeClassName = `eventType eventType-${archive.event_type_name}`;

	return (
		<div
			className={css({
				bg: 'white',
				p: '6',
				rounded: 'sm',
				shadow: 'sm',
				mb: '4',
				overflow: 'hidden',
				margin: '0 auto',
				w: '100%',
				minW: 0,
				transition: 'all 0.2s',
				position: 'relative',
				_hover: {
					shadow: 'md',
					transform: 'translateY(-2px)',
				},
			})}
		>
			{/* 編集ボタン */}
			{!isInstructorLoading && isInstructor && (
				<button
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
			<Link href={`/archive/detail/${archive.archive_id}`}>
				<div
					className={css({
						display: 'grid',
						gridTemplateColumns: isOthers
							? { base: '1fr', md: 'minmax(320px, 1fr) minmax(0, 2fr)' }
							: { base: '1fr', md: 'minmax(320px, 1.5fr) minmax(0, 2fr) 200px' },
						gap: '4',
						alignItems: 'center',
					})}
				>
					{/* 左側：画像 */}
					<div
						className={css({
							w: 'full',
							h: { base: '180px', md: 'auto' },
							aspectRatio: { md: '16/9' },
							bg: 'gray.100',
							rounded: 'md',
							overflow: 'hidden',
							position: 'relative',
							justifySelf: 'center',
						})}
					>
						{imageUrl ? (
							<Image
								src={imageUrl}
								alt={archive.title}
								fill
								quality={100}
								unoptimized={true}
								style={{ objectFit: 'cover' }}
							/>
						) : (
							<div
								className={css({
									w: 'full',
									h: 'full',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									color: 'gray.400',
								})}
							>
								<Calendar size={48} />
							</div>
						)}
					</div>

					{/* 中央：タイトルと詳細 */}
					<div
						className={css({
							display: 'flex',
							flexDirection: 'column',
							gap: '2',
							textAlign: { base: 'center', md: 'left' },
							minW: 0,
							overflow: 'hidden',
						})}
					>
						<div
							className={css({
								display: 'flex',
								alignItems: 'center',
								gap: '2',
								justifyContent: { base: 'center', md: 'flex-start' },
							})}
						>
							<span
								className={
									isOthers && Object.keys(typeStyles).length > 0
										? css({
												px: '3',
												py: '1',
												rounded: 'full',
												fontSize: 'sm',
												fontWeight: 'medium',
											})
										: typeClassName
								}
								style={typeStyles}
							>
								{archive.event_type_name}
							</span>
						</div>
						<h3
							className={css({
								fontWeight: 'bold',
								fontSize: { base: 'lg', md: 'xl' },
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap',
							})}
						>
							{archive.title}
						</h3>
						{!isOthers && (
							<p
								className={css({
									fontSize: 'sm',
									color: 'gray.600',
									whiteSpace: 'pre-line',
									overflow: 'hidden',
									display: '-webkit-box',
									WebkitLineClamp: 5,
								})}
								style={{ WebkitBoxOrient: 'vertical' as any }}
							>
								{archive.description}
							</p>
						)}
						<div
							className={css({
								display: 'flex',
								gap: '2',
								fontSize: 'sm',
								color: 'gray.500',
								justifyContent: { base: 'center', md: 'flex-start' },
							})}
						>
							{archive.files.length > 0 && (
								<span>ファイル: {archive.files.length}件</span>
							)}
							{archive.videos.length > 0 && (
								<span>動画: {archive.videos.length}件</span>
							)}
						</div>
					</div>

					{/* 右側：開催日時（その他タブでは非表示） */}
					{!isOthers && (
						<div
							className={css({
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								gap: '3',
								mt: { base: '2', md: '0' },
								w: { md: '200px' },
								minW: { md: '200px' },
								justifySelf: { md: 'center' },
							})}
						>
							<div
								className={css({
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									gap: '1',
									fontSize: 'lg',
									fontWeight: 'bold',
									p: '3',
									rounded: 'md',
									w: 'full',
								})}
							>
								<div
									className={css({
										display: 'flex',
										alignItems: 'center',
										gap: '2',
									})}
								>
									<Calendar size={20} />
									<span>イベント日時</span>
								</div>
								<span
									className={css({
										display: 'flex',
										flexDirection: 'column',
										alignItems: 'center',
										gap: '1',
										mt: '1',
									})}
								>
									<span
										className={css({
											fontSize: 'xl',
											fontWeight: 'bold',
										})}
									>
										{formattedDate}
									</span>
								</span>
							</div>
						</div>
					)}
				</div>
			</Link>
		</div>
	);
}
