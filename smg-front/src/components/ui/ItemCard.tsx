import { useIsInstructor } from '@/hooks/useIsInstructor';
import type { Event } from '@/types/event';
import dayjs from 'dayjs';
import { Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { css } from '../../../styled-system/css';
import './EventCard.css'; // CSSファイルをインポート

interface ItemCardProps extends Event {
	basePath: string; // /events または /bookkeeping など
	is_applied?: boolean;
}

const ItemCard: React.FC<ItemCardProps> = ({
	event_id,
	event_name,
	event_start_datetime,
	event_end_datetime,
	event_location,
	event_description,
	event_capacity,
	event_type,
	event_type_name,
	image_url,
	is_applied = false,
	basePath,
	registration_start_datetime,
	registration_end_datetime,
	participants_count,
}) => {
	const router = useRouter();
	const { isInstructor, loading: isInstructorLoading } = useIsInstructor();

	const handleEdit = (e: React.MouseEvent) => {
		e.stopPropagation();
		const dashboardUrl =
			process.env.NEXT_PUBLIC_DASHBOARD_URL ||
			'https://smg-dashboard.vercel.app';
		window.open(`${dashboardUrl}/event/edit/${event_id}`, '_blank');
	};

	// 日付と時間のフォーマット
	const startDate = dayjs(event_start_datetime);
	const endDate = dayjs(event_end_datetime);
	const dateStr = startDate.format('M/D');
	const startTimeStr = startDate.format('HH:mm');
	const endTimeStr = endDate.format('HH:mm');
	const timeStr = `${startTimeStr}-${endTimeStr}`;

	// 申し込み期間のフォーマット
	const formatRegistrationPeriod = () => {
		if (!registration_start_datetime || !registration_end_datetime) {
			return null;
		}

		const regStartDate = dayjs(registration_start_datetime);
		const regEndDate = dayjs(registration_end_datetime);

		return `${regStartDate.format('M/D HH:mm')} 〜 ${regEndDate.format('M/D HH:mm')}`;
	};

	// 場所から会場名を抽出
	const address = event_location.split(' ')[0] || event_location;

	// 正規化されたタイプ名をCSSクラス名に使用
	const getNormalizedTypeName = (type: string): string => {
		const cleanType = type.trim();
		return [
			'定例会',
			'PDCA実践会議',
			'5大都市グループ相談会&交流会',
			'簿記講座',
			'オンラインセミナー',
			'特別セミナー',
		].includes(cleanType)
			? cleanType
			: 'default';
	};

	const typeClassName = `eventType eventType-${getNormalizedTypeName(event_type_name || '')}`;

	const handleClick = () => {
		router.push(`${basePath}/${event_id}`);
	};

	const now = dayjs();
	const isWithinPeriod =
		registration_start_datetime && registration_end_datetime
			? now.isAfter(dayjs(registration_start_datetime)) &&
				now.isBefore(dayjs(registration_end_datetime))
			: false;
	const isBeforeStart = registration_start_datetime
		? now.isBefore(dayjs(registration_start_datetime))
		: false;
	const canInteract = is_applied || isWithinPeriod; // 申し込み済みまたは期間内の場合はクリック可能

	return (
		<button
			type="button"
			className={css({
				bg: 'white',
				p: '6',
				rounded: 'sm',
				shadow: 'sm',
				mb: '4',
				overflow: 'hidden',
				margin: '0 auto',
				cursor: 'pointer',
				position: 'relative',
				border: 'none',
				width: '100%',
				textAlign: 'left',
				_hover: {
					shadow: 'md',
				},
			})}
			onClick={handleClick}
		>
			{!isInstructorLoading && isInstructor && (
				<button
					type="button"
					onClick={handleEdit}
					className={css({
						position: 'absolute',
						top: '2',
						right: '2',
						px: '3',
						py: '1',
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
			<div
				className={css({
					display: 'grid',
					gridTemplateColumns: { base: '1fr', md: '1.5fr 2fr 1fr' },
					gap: '4',
					alignItems: 'center',
				})}
			>
				{/* 左側：画像 */}
				<div
					className={css({
						w: 'full',
						h: { base: '180px', md: '200px' },
						bg: 'white',
						rounded: 'md',
						overflow: 'hidden',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					})}
				>
					{image_url ? (
						<img
							src={image_url}
							alt={event_name}
							className={css({
								w: '100%',
								h: '100%',
								objectFit: 'contain',
								objectPosition: 'center',
							})}
						/>
					) : (
						<div
							className={css({
								w: 'full',
								h: { base: '180px', md: '200px' },
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								color: 'gray.400',
								bg: 'gray.100',
								rounded: 'md',
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
						<span className={typeClassName}>{event_type_name}</span>
					</div>
					<h3
						className={css({
							fontWeight: 'bold',
							fontSize: { base: 'lg', md: 'xl' },
						})}
					>
						{event_name}
					</h3>
					<div
						className={css({
							fontSize: 'sm',
							color: 'gray.600',
						})}
					>
						<div className={css({ mb: '1' })}>会場: {address}</div>
						<div>
							<span className={css({ fontWeight: '900', color: 'black' })}>
								定員: {event_capacity}名 / 参加人数: {participants_count ?? 0}名
							</span>
						</div>
						{/* 申し込み期間の表示 */}
						{formatRegistrationPeriod() && (
							<div className={css({ mt: '2' })}>
								<span className={css({ fontWeight: '900', color: 'black' })}>
									申し込み期間：
								</span>
								<span className={css({ fontSize: 'sm', color: 'gray.600' })}>
									{formatRegistrationPeriod()}
								</span>
							</div>
						)}
					</div>
				</div>

				{/* 右側：日付と申し込みボタン */}
				<div
					className={css({
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						gap: '3',
						mt: { base: '2', md: '0' },
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
							<span>開催日時</span>
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
								{dateStr}
							</span>
							<span
								className={css({
									fontSize: 'md',
									fontWeight: 'medium',
								})}
							>
								{timeStr}
							</span>
						</span>
					</div>
					<div
						className={css({
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							gap: '2',
							w: { base: 'full', md: 'auto' },
						})}
					>
						<button
							type="button"
							className={css({
								bg: is_applied
									? 'red.500'
									: !isWithinPeriod
										? 'gray.300'
										: '#9D7636',
								color: 'white',
								rounded: 'md',
								fontSize: 'sm',
								px: '4',
								py: '2',
								w: { base: 'full', md: 'auto' },
								cursor: canInteract ? 'pointer' : 'not-allowed',
								_hover: {
									bg: is_applied
										? 'red.600'
										: !isWithinPeriod
											? 'gray.300'
											: '#8A6A2F',
								},
							})}
							disabled={!canInteract}
							onClick={(e) => {
								e.stopPropagation();
								if (canInteract) {
									router.push(`${basePath}/${event_id}`);
								}
							}}
						>
							{is_applied
								? 'キャンセル'
								: isBeforeStart
									? '申し込み前'
									: !isWithinPeriod
										? '申し込み期間終了'
										: '申し込む'}
						</button>
					</div>
				</div>
			</div>
		</button>
	);
};

export default ItemCard;
