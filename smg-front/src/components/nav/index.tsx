import Link, { type LinkProps } from 'next/link';
import { usePathname } from 'next/navigation';

import * as style from './styled';

const NavItem = ({
	href,
	children,
}: {
	href: LinkProps['href'];
	children: string;
}) => {
	const pathname = usePathname();
	const hrefString = typeof href === 'string' ? href : href.pathname || '';

	// ルートパス "/" の場合は完全一致、それ以外はパスの開始部分でマッチ
	const isActive =
		hrefString === '/' ? pathname === '/' : pathname.startsWith(hrefString);

	return (
		<li data-active={isActive}>
			<Link href={href} className={style.item}>
				{children}
			</Link>
		</li>
	);
};

const NavRoot = ({ children }: { children: React.ReactNode }) => (
	<nav>
		<ol className={style.root}>{children}</ol>
	</nav>
);

export const NavMenu = () => (
	<NavRoot>
		<NavItem href={'/'}>ホーム</NavItem>
		<NavItem href={'/beginner'}>初めての方へ</NavItem>
		<NavItem href={'/events'}>イベント予約</NavItem>
		<NavItem href={'/notice'}>お知らせ</NavItem>
		<NavItem href={'/consultations'}>個別相談予約</NavItem>
		<NavItem href={'/archive'}>アーカイブ</NavItem>
		<NavItem href={'/radio'}>ラジオ</NavItem>
		<NavItem href={'/questions'}>質問</NavItem>
		<NavItem href={'/faq'}>よくある質問</NavItem>
		<NavItem href={'/bookkeeping'}>簿記講座</NavItem>
		{/* <NavItem href={'/inquiry'}>お問い合わせ</NavItem> */}
	</NavRoot>
);
