import { css } from '@/styled-system/css';

const AdminSecureLayout = ({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) => {

	return (
		<div
			className={css({
				minH: 'screen',
				bg: '#f5f5f5',
				fontFamily: 'system-ui, sans-serif',
				p: '6',
			})}
		>
			{children}
		</div>
	);
};

export default AdminSecureLayout;