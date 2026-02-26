import { Centerize } from '@/components/layout';
import { css } from '@/styled-system/css';
import type { Dayjs } from 'dayjs';
import Link from 'next/link';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import {
	fetchEventCity,
	fetchEventSchedules,
	fetchEventType,
} from '../action/schedule';
import { ScheduleProvider } from '../hooks/use-schedule';
import { ScheduleCalendar } from './schedule';

export const EventSchedulePage = async ({
	selected,
	initialZoom = 100,
	initialViewMode = 'month',
}: {
	selected: Dayjs;
	initialZoom?: number;
	initialViewMode?: 'month' | 'week';
}) => {
	// 週表示の場合は週の範囲を計算
	const dateRange =
		initialViewMode === 'week'
			? { startDate: selected, endDate: selected.add(6, 'day').endOf('day') }
			: undefined;

	const [schedules, eventTypes, cities] = await Promise.all([
		fetchEventSchedules(selected, dateRange),
		fetchEventType(),
		fetchEventCity(),
	]);
	return (
		<ScheduleProvider
			schedules={schedules}
			eventTypes={eventTypes}
			eventCity={cities}
			initialZoom={initialZoom}
			initialViewMode={initialViewMode}
		>
			<div className={css({ pb: '8' })}>
				<Centerize>
					<div
						className={css({
							px: '4',
							py: '2',
							d: 'flex',
							flexDirection: 'column',
							gap: '4',
						})}
					>
						<div
							className={css({
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								position: 'relative',
								mt: '4',
							})}
						>
							<Link
								href="/events"
								className={css({
									display: 'inline-flex',
									alignItems: 'center',
									gap: '1',
									color: 'primary',
									fontSize: 'sm',
									position: 'absolute',
									left: '0',
									_hover: {
										opacity: 0.7,
									},
								})}
							>
								{/* モバイル: 左矢印のみ */}
								<ArrowLeft
									size={20}
									className={css({ display: { base: 'block', md: 'none' } })}
								/>
								{/* デスクトップ: テキスト + 右矢印 */}
								<span className={css({ display: { base: 'none', md: 'inline-flex' }, alignItems: 'center', gap: '1' })}>
									イベント一覧に戻る
									<ChevronRight size={16} />
								</span>
							</Link>
							<h2
								className={css({
									fontSize: 'lg',
									fontWeight: 'medium',
									rounded: 'md',
									px: '8',
									py: '2',
									bg: 'primary',
									color: 'white',
								})}
							>
								イベントカレンダー
							</h2>
						</div>
						<main>
							<ScheduleCalendar defaultValue={selected.format('YYYY-MM-DD')} />
						</main>
					</div>
				</Centerize>
			</div>
		</ScheduleProvider>
	);
};
