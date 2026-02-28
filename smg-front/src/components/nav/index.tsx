'use client';

import Link, { type LinkProps } from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import * as style from './styled';

interface TabItem {
	tab_id: string;
	label: string;
	href: string;
	link_type: string;
}

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

// フォールバック用のデフォルトタブ（API取得失敗時に使用）
const DEFAULT_TABS: TabItem[] = [
	{ tab_id: 'home', label: 'ホーム', href: '/', link_type: 'internal' },
	{ tab_id: 'beginner', label: '初めての方へ', href: '/beginner', link_type: 'internal' },
	{ tab_id: 'events', label: 'イベント予約', href: '/events', link_type: 'event' },
	{ tab_id: 'notice', label: 'お知らせ', href: '/notice', link_type: 'notice' },
	{ tab_id: 'consultations', label: '個別相談予約', href: '/consultations', link_type: 'internal' },
	{ tab_id: 'archive', label: 'アーカイブ', href: '/archive', link_type: 'internal' },
	{ tab_id: 'radio', label: 'ラジオ', href: '/radio', link_type: 'internal' },
	{ tab_id: 'questions', label: '質問', href: '/questions', link_type: 'internal' },
	{ tab_id: 'faq', label: 'よくある質問', href: '/faq', link_type: 'internal' },
	{ tab_id: 'bookkeeping', label: '簿記講座', href: '/bookkeeping', link_type: 'internal' },
];

export const NavMenu = () => {
	const [tabs, setTabs] = useState<TabItem[]>(DEFAULT_TABS);

	useEffect(() => {
		const fetchTabs = async () => {
			try {
				const res = await fetch('/api/tabs');
				if (res.ok) {
					const data = await res.json();
					if (data.tabs && data.tabs.length > 0) {
						setTabs(data.tabs);
					}
				}
			} catch (error) {
				// API取得失敗時はデフォルトタブを使用
				console.error('タブ取得エラー:', error);
			}
		};

		fetchTabs();
	}, []);

	return (
		<NavRoot>
			{tabs.map((tab) => (
				<NavItem key={tab.tab_id} href={tab.href}>
					{tab.label}
				</NavItem>
			))}
		</NavRoot>
	);
};
