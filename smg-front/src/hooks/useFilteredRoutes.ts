'use client';

import { ROUTE_DEFINITION, type RouteDefinition } from '@/features/top/const';
import { useUserGroups } from '@/hooks/useUserGroups';
import { useMemo } from 'react';

/**
 * ユーザーの所属グループに基づいてフィルタリングされたルート定義を返すフック
 * - requiredGroup が未指定のルートは常に表示
 * - requiredGroup が指定されたルートは、ユーザーがそのグループ or 「運営」or「講師」に所属している場合のみ表示
 */
export const useFilteredRoutes = (): {
	routes: RouteDefinition[];
	isLoading: boolean;
} => {
	const { groupTitles, isLoading } = useUserGroups();

	const routes = useMemo(() => {
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
	}, [groupTitles, isLoading]);

	return { routes, isLoading };
};
