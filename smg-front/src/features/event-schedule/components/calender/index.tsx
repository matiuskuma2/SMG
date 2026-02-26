'use client';

import {
	type CalendarDate,
	GregorianCalendar,
	isToday,
} from '@internationalized/date';

import { css, cva, cx } from '@/styled-system/css';
import { composeRefs } from '@radix-ui/react-compose-refs';
import {
	type AriaCalendarGridProps,
	type AriaCalendarProps,
	type DateValue,
	useCalendar,
	useCalendarCell,
	useCalendarGrid,
} from '@react-aria/calendar';
import { useCalendarState } from '@react-stately/calendar';
import type React from 'react';
import { Fragment, forwardRef, useRef } from 'react';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md';
import {
	CalendarContext,
	useCalendarContext,
} from '../../hooks/use-calendar-context';
import { ActionButton } from './item';

/**
 *
 */
const CalendarRoot = <T extends DateValue>({
	children,
	...props
}: AriaCalendarProps<T> & {
	children: React.ReactNode;
}) => {
	const state = useCalendarState({
		...props,
		createCalendar: () => new GregorianCalendar(),
		locale: 'ja-JP',
	});

	const { calendarProps, title, prevButtonProps, nextButtonProps } =
		useCalendar(props, state);

	return (
		<CalendarContext.Provider
			value={{ title, prevButtonProps, nextButtonProps, state }}
		>
			<div {...calendarProps}>{children}</div>
		</CalendarContext.Provider>
	);
};

const CalendarPrevButton = () => {
	const { prevButtonProps } = useCalendarContext();
	return (
		<ActionButton {...prevButtonProps}>
			<MdKeyboardArrowLeft size={24} />
		</ActionButton>
	);
};

const CalendarNextButton = () => {
	const { nextButtonProps } = useCalendarContext();
	return (
		<ActionButton {...nextButtonProps}>
			<MdKeyboardArrowRight size={24} />
		</ActionButton>
	);
};

const CalendarTitle = (props: React.HtmlHTMLAttributes<HTMLHeadingElement>) => {
	const { title } = useCalendarContext();
	return <h3 {...props}>{title}</h3>;
};

/**
 *
 */
type CalendarGridProps = AriaCalendarGridProps & {
	children?: (date: CalendarDate) => React.ReactNode | React.ReactNode;
	className?: string;
};
const CalendarGrid = ({ children, className, ...props }: CalendarGridProps) => {
	const { state } = useCalendarContext();
	const { gridProps, headerProps, weekDays, weeksInMonth } = useCalendarGrid(
		props,
		state,
	);

	return (
		<table
			{...gridProps}
			className={cx(css({ w: 'full', tableLayout: 'fixed' }), className)}
		>
			<thead {...headerProps} className={css({ w: 'full' })}>
				<tr className={css({ w: 'full', bg: 'gray.100', borderBottom: '1px solid', borderColor: 'gray.300', '& th': { py: '2' } })}>
					{weekDays.map((day, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
						<th key={i} className={cellStyle({ text: 'date' })}>
							{day}
						</th>
					))}
				</tr>
			</thead>
			<tbody>
				{[...new Array(weeksInMonth).keys()].map((weekIndex) => (
					<tr key={weekIndex}>
						{state.getDatesInWeek(weekIndex).map((date, i) =>
							date ? (
								<Fragment key={date.toString()}>
									{typeof children === 'function' ? children(date) : children}
								</Fragment>
							) : (
								// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
								<td key={i} />
							),
						)}
					</tr>
				))}
			</tbody>
		</table>
	);
};

type CalendarCellProps = React.PropsWithChildren<{
	date: CalendarDate;
	onClick?: () => void;
	className?: string;
}> &
	React.HTMLProps<HTMLTableCellElement>;
const CalendarCell = forwardRef<HTMLElement | null, CalendarCellProps>(
	({ children, date, className, onClick, ...props }, ref) => {
		const { state } = useCalendarContext();
		const btnRef = useRef<HTMLButtonElement>(null);

		const { cellProps, formattedDate, isOutsideVisibleRange, buttonProps, isSelected } =
			useCalendarCell({ date }, state, btnRef);

		const isTodayDate = isToday(date, 'Asia/Tokyo');

		const refs = composeRefs(ref, btnRef);

		const onClickDate: React.MouseEventHandler<HTMLButtonElement> = (e) => {
			buttonProps.onClick?.(e);
			onClick?.();
		};

		return (
			<td
				{...cellProps}
				className={cx(cellStyle(), cellProps.className)}
				{...props}
			>
				<div
					className={css({
						h: { base: '56px', md: '120px' },
						display: 'flex',
						flexDir: 'column',
						gap: '0.5',
						py: '1',
					})}
					hidden={isOutsideVisibleRange}
					onClick={onClick}
				>
					<button
						{...buttonProps}
						ref={refs}
						aria-selected={isSelected}
						data-today={isTodayDate || undefined}
						onClick={onClickDate}
						type="button"
						className={dateLabelStyle}
					>
						{formattedDate}
					</button>
					<div className={className}>{children}</div>
				</div>
			</td>
		);
	},
);

const cellStyle = cva({
	base: {
		border: '1px solid lightgray',
		px: '2',
		maxW: '150px',
	},
	variants: {
		text: {
			default: { color: 'inherit' },
			date: {
				color: { base: 'inherit', _first: 'red.400', _last: 'blue.400' },
			},
		},
	},
	defaultVariants: {
		text: 'default',
	},
});

const dateLabelStyle = css({
	textAlign: 'center',
	mr: 'auto',
	rounded: 'full',
	w: '6',
	h: '6',
	userSelect: 'none',
	outline: 'none',
	_selected: {
		bg: 'blue.500',
		color: 'white',
	},
	'&[data-today]': {
		bg: 'red.500',
		color: 'white',
	},
});

export const Root = CalendarRoot;
export const Grid = CalendarGrid;
export const Cell = CalendarCell;
export const PrevButton = CalendarPrevButton;
export const NextButton = CalendarNextButton;
export const Title = CalendarTitle;
