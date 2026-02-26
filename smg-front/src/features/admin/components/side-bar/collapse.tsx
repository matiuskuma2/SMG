import { createContext } from '@/features/admin/lib/create-context';
import { css, cx } from '@/styled-system/css';
import Link, { type LinkProps } from 'next/link';
import { usePathname } from 'next/navigation';
import type React from 'react';
import { Children, type HTMLProps, useState } from 'react';
import { FaChevronDown } from 'react-icons/fa6';
import { getAutoHeightDuration } from './utils';

const [collapseContext, useCollapseContext] = createContext<{
	disabled: boolean;
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
}>({
	disabled: false,
	isOpen: false,
	setIsOpen: () => {},
});

const ITEM_HEIGHT = 48;
const itemStyle = css({
	display: 'flex',
	gap: '20px',
	alignItems: 'center',
	px: '1rem',
	py: '0.5rem',
	h: `${ITEM_HEIGHT}px`,
	w: 'full',
	_hover: {
		bg: {
			base: 'rgba(255, 255, 255, .08)',
			_currentPage: 'rgba(255, 255, 255, .2)',
		},
	},
	_currentPage: {
		bg: 'rgba(255, 255, 255, .2)',
	},
});

const Root = ({
	children,
	disabled = false,
	open = undefined,
	onOpenChange = () => {},
}: React.PropsWithChildren<{
	disabled?: boolean;
	open?: boolean;
	onOpenChange?: (boolean: boolean) => void;
}>) => {
	const [isOpen, setIsOpen] = useState(open ?? false);
	const isControlled = open !== undefined;

	return (
		<collapseContext.Provider
			value={{
				disabled,
				isOpen: isControlled ? open : isOpen,
				setIsOpen: isControlled ? onOpenChange : setIsOpen,
			}}
		>
			{children}
		</collapseContext.Provider>
	);
};

const Trigger = ({
	children,
	...props
}: Omit<
	React.HTMLProps<HTMLButtonElement>,
	'onClick' | 'className' | 'type'
>) => {
	const { isOpen, setIsOpen, disabled } = useCollapseContext();
	return (
		<button
			type="button"
			className={cx(itemStyle)}
			onClick={() => !disabled && setIsOpen(!isOpen)}
			{...props}
		>
			{children}
		</button>
	);
};

const Content = ({
	children,
	className,
	style,
	...props
}: React.HTMLProps<HTMLDivElement>) => {
	const { isOpen } = useCollapseContext();

	const count = Children.count(children);
	const height = ITEM_HEIGHT * count;

	return (
		<div
			{...props}
			className={cx(
				className,
				css({
					overflow: 'hidden',
					transition: 'all 300ms',
				}),
			)}
			style={{
				...style,
				transitionDuration: `${getAutoHeightDuration(height)}ms`,
				height: isOpen ? `${height}px` : '0',
				opacity: isOpen ? 1 : 0,
			}}
			aria-expanded={isOpen}
		>
			{children}
		</div>
	);
};

const Indicator = ({ children, ...props }: React.HTMLProps<HTMLDivElement>) => {
	const { isOpen } = useCollapseContext();
	return (
		<div
			className={cx(
				css({
					ml: 'auto',
					transition: 'all 0.3s',
					rotate: { base: '0deg', _expanded: '180deg' },
				}),
				props.className ?? '',
			)}
			aria-expanded={isOpen}
			{...props}
		>
			{children ?? <FaChevronDown size={16} />}
		</div>
	);
};

const ItemStyle = cx(
	itemStyle,
	css({
		textWrap: 'wrap',
		paddingLeft: '56px',
		fontWeight: 'normal',
	}),
);

type ItemProps = Omit<
	React.HTMLProps<HTMLLIElement>,
	'className' | 'onClick'
> & { href?: LinkProps['href'] };
const Item = ({ children, href, ...props }: ItemProps) => {
	const { isOpen } = useCollapseContext();
	const pathname = usePathname();
	const isCurrentPage = pathname === href;

	const mergedProps: Pick<
		HTMLProps<HTMLButtonElement>,
		'aria-current' | 'className'
	> = {
		className: cx(ItemStyle),
		'aria-current': isCurrentPage ? 'page' : undefined,
	};

	return (
		<li {...props}>
			{href ? (
				<Link href={href} {...mergedProps}>
					{isOpen && children}
				</Link>
			) : (
				<button type="button" {...mergedProps}>
					{isOpen && children}
				</button>
			)}
		</li>
	);
};

export { Root, Trigger, Content, Item, Indicator, itemStyle };
