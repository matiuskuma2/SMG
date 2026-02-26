import { NotificationProvider } from '@/components/NotificationContext';
import { QueryProvider } from '@/components/QueryProvider';
import { SPFooter } from '@/features/top/components/layout/footer';
import { Header } from '@/features/top/components/layout/header';
import { createClient } from '@/lib/supabase-server';
import { css } from '@/styled-system/css';

const MemberLayout = async ({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) => {
	const supabase = createClient();

	// ミドルウェアですでに認証チェックが完了しているため、ここでは最小限の処理のみ行う
	// user情報のみ必要な場合はgetSessionを使用
	const {
		data: { session },
	} = await supabase.auth.getSession();

	// ユーザーのアイコン情報を取得（論理削除されていない場合のみ）
	let userIconUrl: string | undefined;
	if (session?.user) {
		const { data: profile } = await supabase
			.from('mst_user')
			.select('icon')
			.eq('user_id', session.user.id)
			.is('deleted_at', null)
			.single();

		userIconUrl = profile?.icon || undefined;
	}

	// Fetch unread notifications count
	let unreadCount = 0;
	if (session?.user) {
		const { count, error: notifError } = await supabase
			.from('trn_user_notification')
			.select('*', { count: 'exact', head: true })
			.eq('user_id', session.user.id)
			.is('read_at', null);
		if (notifError) {
			console.error('Error fetching unread notifications count:', notifError);
		} else {
			unreadCount = count ?? 0;
		}
	}

	return (
		<QueryProvider>
			<div
				className={css({
					minH: '100vh',
					d: 'flex',
					flexDir: 'column',
					fontSize: '14px',
				})}
			>
				<NotificationProvider initialCount={unreadCount}>
					{session?.user && <Header />}
					<main className={css({ flex: 1 })}>{children}</main>
					<SPFooter />
				</NotificationProvider>
			</div>
		</QueryProvider>
	);
};

export default MemberLayout;
