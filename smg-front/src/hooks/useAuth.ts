import { createClient } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';

export const useAuth = () => {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const supabase = createClient();

		// 現在のセッションを取得
		const getSession = async () => {
			try {
				const { data: { session } } = await supabase.auth.getSession();
				setUser(session?.user ?? null);
			} catch (error) {
				console.error('セッションの取得に失敗しました:', error);
			} finally {
				setLoading(false);
			}
		};

		getSession();

		// 認証状態の変更を監視
		const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ?? null);
		});

		return () => {
			subscription.unsubscribe();
		};
	}, []);

	return { user, loading };
}; 