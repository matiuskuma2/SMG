'use client';

import { createClient } from '@/lib/supabase';
import { useEffect, useState } from 'react';

/**
 * ログインユーザーが所属するグループのタイトル一覧を取得するフック
 */
export const useUserGroups = () => {
	const [groupTitles, setGroupTitles] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchUserGroups = async () => {
			try {
				const supabase = createClient();
				const {
					data: { user },
				} = await supabase.auth.getUser();

				if (!user) {
					setGroupTitles([]);
					setIsLoading(false);
					return;
				}

				const { data, error } = await supabase
					.from('trn_group_user')
					.select(`
						mst_group!inner(title)
					`)
					.eq('user_id', user.id)
					.is('deleted_at', null);

				if (error) {
					console.error('グループ取得エラー:', error);
					setGroupTitles([]);
				} else {
					const titles = (data || []).map(
						(row: any) => row.mst_group.title as string,
					);
					setGroupTitles(titles);
				}
			} catch (error) {
				console.error('グループ取得エラー:', error);
				setGroupTitles([]);
			} finally {
				setIsLoading(false);
			}
		};

		fetchUserGroups();
	}, []);

	return { groupTitles, isLoading };
};
