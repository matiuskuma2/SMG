'use client';

import { ROUTE_DEFINITION, type RouteDefinition } from '@/features/top/const';
import { useUserGroups } from '@/hooks/useUserGroups';
import { useEffect, useMemo, useState } from 'react';

type TabFromDB = {
	tab_id: string;
	label: string;
	href: string;
	link_type: string;
};

/**
 * ユーザーの所属グループに基づいてフィルタリングされたルート定義を返すフック
 * - DBからタブデータを取得し、取得失敗時は静的定義にフォールバック
 * - requiredGroup が未指定のルートは常に表示
 * - requiredGroup が指定されたルートは、ユーザーがそのグループ or 「運営」or「講師」に所属している場合のみ表示
 */
export const useFilteredRoutes = (): {
	routes: RouteDefinition[];
	isLoading: boolean;
} => {
	const { groupTitles, isLoading: isGroupLoading } = useUserGroups();
	const [dbTabs, setDbTabs] = useState<TabFromDB[] | null>(null);
	const [isDbLoading, setIsDbLoading] = useState(true);

	// DBからタブデータを取得
	useEffect(() => {
		const fetchTabs = async () => {
			try {
				const res = await fetch('/api/tabs');
				if (res.ok) {
					const data = await res.json();
					setDbTabs(data.tabs || null);
				} else {
					console.warn('タブAPIエラー、静的定義にフォールバック');
					setDbTabs(null);
				}
			} catch (error) {
				console.warn('タブ取得エラー、静的定義にフォールバック:', error);
				setDbTabs(null);
			} finally {
				setIsDbLoading(false);
			}
		};

		fetchTabs();
	}, []);

	const isLoading = isGroupLoading || isDbLoading;

	const routes = useMemo(() => {
		// DBタブが取得できた場合はそれを使用
		if (dbTabs !== null && dbTabs.length > 0) {
			return dbTabs.map((tab) => ({
				label: tab.label,
				href: tab.href,
				linkType: tab.link_type,
			}));
		}

		// フォールバック: 静的定義を使用
		if (isLoading) {
			// ロード中はグループ制限付きルートを非表示にする
			return ROUTE_DEFINITION.filter((route) => !route.requiredGroup);
		}

		return ROUTE_DEFINITION.filter((route) => {
			if (!route.requiredGroup) return true;

			// 指定グループ、運営、講師のいずれかに所属していれば表示
			return (
				groupTitles.includes(route.requiredGroup) ||
				groupTitles.includes('運営') ||
				groupTitles.includes('講師')
			);
		});
	}, [dbTabs, groupTitles, isLoading]);

	return { routes, isLoading };
};
