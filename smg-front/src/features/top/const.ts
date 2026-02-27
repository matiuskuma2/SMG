export type RouteDefinition = {
	label: string;
	href: string;
	/** 指定した場合、そのグループ名に所属するユーザーにのみ表示される */
	requiredGroup?: string;
	/** リンク種別: external の場合は新しいタブで開く */
	linkType?: string;
};

export const ROUTE_DEFINITION: RouteDefinition[] = [
	{ label: 'TOP', href: '/' },
	{ label: '講座・イベント予約', href: '/events' },
	{ label: 'ご利用ガイド', href: '/beginner' },
	{ label: 'お知らせ', href: '/notice' },
	{ label: '個別相談予約', href: '/consultations' },
	{ label: '動画・写真', href: '/archive' },
	{ label: 'SMGラジオ', href: '/radio' },
	{ label: '講師に質問', href: '/questions' },
	{ label: 'よくある質問', href: '/faq' },
	{ label: '簿記3期', href: '/bookkeeping', requiredGroup: '簿記3期' },
	{ label: '支部', href: '/shibu', requiredGroup: '支部' },
	{ label: 'マスター講座', href: '/master-course', requiredGroup: 'マスター講座' },
];

export const DEFAULT_LOCALE = 'Asia/Tokyo';

export const START_HERE_ITEM_IDS = {
	GUIDE: '297eeaa8-73db-4fa0-9926-2d4cd25dbd42',
	PHILOSOPHY: '406c686f-90f6-4223-b7a9-6b96d2180a80',
};
