import { styled } from '@/styled-system/jsx';
import * as React from 'react';

interface DialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	children: React.ReactNode;
	onOutSideClick?: () => void;
}

const Dialog = ({
	open,
	onOpenChange,
	children,
	onOutSideClick = () => onOpenChange(false),
}: DialogProps) => {
	React.useEffect(() => {
		if (open) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = 'unset';
		}
		return () => {
			document.body.style.overflow = 'unset';
		};
	}, [open]);

	if (!open) return null;

	return <DialogOverlay onClick={onOutSideClick}>{children}</DialogOverlay>;
};

const DialogOverlay = styled('div', {
	base: {
		position: 'fixed',
		inset: 0,
		zIndex: 50,
		backgroundColor: 'black/80',
		animation: 'fade-in 0.2s ease-out',
	},
});

const DialogContent = styled('div', {
	base: {
		position: 'fixed',
		left: '50%',
		top: '50%',
		zIndex: 50,
		display: 'grid',
		width: 'full',
		maxWidth: 'lg',
		transform: 'translate(-50%, -50%)',
		gap: 4,
		borderWidth: 1,
		backgroundColor: 'background',
		padding: 6,
		boxShadow: 'lg',
		animation:
			'zoom-in 0.2s ease-out, slide-in-from-left-1/2 0.2s ease-out, slide-in-from-top-48 0.2s ease-out',
		'@media (min-width: 640px)': {
			borderRadius: 'lg',
		},
	},
});

const DialogHeader = styled('div', {
	base: {
		display: 'flex',
		flexDirection: 'column',
		gap: 1.5,
		textAlign: 'center',
		'@media (min-width: 640px)': {
			textAlign: 'left',
		},
	},
});

const DialogFooter = styled('div', {
	base: {
		display: 'flex',
		flexDirection: 'column-reverse',
		gap: 2,
	},
});

const DialogTitle = styled('h2', {
	base: {
		fontSize: 'lg',
		fontWeight: 'semibold',
		lineHeight: 'none',
		letterSpacing: 'tight',
	},
});

const DialogDescription = styled('p', {
	base: {
		fontSize: 'sm',
		color: 'muted.foreground',
	},
});

export {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogFooter,
	DialogTitle,
	DialogDescription,
};
