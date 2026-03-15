import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
	return await updateSession(request);
}

export async function updateSession(request: NextRequest) {
	// .well-known配下のパスを認証対象から除外（Universal Link検証用）
	if (
		request.nextUrl.pathname.startsWith('/.well-known/') ||
		request.nextUrl.pathname === '/apple-app-site-association' ||
		request.nextUrl.pathname === '/assetlinks.json'
	) {
		return NextResponse.next();
	}

	let supabaseResponse = NextResponse.next({
		request,
	});
	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet) {
					cookiesToSet.forEach(({ name, value }) =>
						request.cookies.set(name, value),
					);
					supabaseResponse = NextResponse.next({
						request,
					});
					cookiesToSet.forEach(({ name, value, options }) =>
						supabaseResponse.cookies.set(name, value, options),
					);
				},
			},
		},
	);
	const {
		data: { user },
	} = await supabase.auth.getUser();

	// PKCEフロー: URLに code パラメータがある場合はセッションを確立
	const code = request.nextUrl.searchParams.get('code');
	if (code) {
		// ログイン済みでもcodeがある場合は交換を試みる（パスワードリセット等）
		// まず既存セッションがある場合はサインアウトしてからcode交換
		if (user) {
			await supabase.auth.signOut();
		}
		const { data: exchangeData, error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error && exchangeData.session) {
			// code交換成功 → codeパラメータを除いた同じパスにリダイレクト
			// これによりページ側でcodeを再度交換する問題を防ぐ
			const url = request.nextUrl.clone();
			url.searchParams.delete('code');
			const redirectResponse = NextResponse.redirect(url);
			// supabaseResponseに設定されたセッションcookieをリダイレクトレスポンスに転送
			supabaseResponse.cookies.getAll().forEach((cookie) => {
				redirectResponse.cookies.set(cookie.name, cookie.value, {
					...cookie,
				});
			});
			return redirectResponse;
		}
		// code交換失敗 → そのままページに進む（ページ側でエラー表示）
	}

	// ユーザーがログインしている場合、所属グループのステータスをチェック
	// ただし、/reset-passwordの場合はスキップ（パスワード変更を優先）
	if (user && request.nextUrl.pathname !== '/reset-password') {
		// RLSをバイパスするためservice_roleキーでDBクエリ用クライアントを作成
		const supabaseAdmin = createClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.SUPABASE_SERVICE_ROLE_KEY!,
		);

		const { data: userGroups, error } = await supabaseAdmin
			.from('trn_group_user')
			.select(`
				mst_group!inner(title)
			`)
			.eq('user_id', user.id)
			.is('deleted_at', null);

		if (!error && userGroups && userGroups.length > 0) {
			// いずれかのグループタイトルが「未決済」または「退会」の場合はログアウト
			const hasRestrictedGroup = userGroups.some((userGroup: any) => 
				userGroup.mst_group.title === '未決済' || userGroup.mst_group.title === '退会'
			);
			
			if (hasRestrictedGroup) {
				await supabase.auth.signOut();
				const url = request.nextUrl.clone();
				url.pathname = '/login';
				url.searchParams.set('auto-logout', 'true');
				return NextResponse.redirect(url);
			}
		}
	}

	const anonymousRoutes = ['/login', '/member/login', '/forgotPassword', '/reset-password', '/signup', '/x7k9m2p'];
	// プレフィックスマッチが必要なパブリックルート（動的パス対応）
	// 注意: /nfc-profile/ はログイン必須に変更（2026-03-15）
	const anonymousRoutePrefixes: string[] = [];

	const isAnonymousRoute = (pathname: string) => {
		if (anonymousRoutes.includes(pathname)) return true;
		return anonymousRoutePrefixes.some(prefix => pathname.startsWith(prefix));
	};

	if (user) {
		// /reset-password はログイン済みでもアクセスを許可する（パスワード変更のため）
		const allowedWhenLoggedIn = ['/reset-password'];
		if (anonymousRoutes.includes(request.nextUrl.pathname) && !allowedWhenLoggedIn.includes(request.nextUrl.pathname)) {
			const url = request.nextUrl.clone();
			url.pathname = '/';
			return NextResponse.redirect(url);
		}
	} else {
		if (request.nextUrl.pathname === '/') {
			const url = request.nextUrl.clone();
			url.pathname = '/login';
			return NextResponse.redirect(url);
		}

		if (
			request.nextUrl.pathname.startsWith('/member') &&
			!isAnonymousRoute(request.nextUrl.pathname)
		) {
			const url = request.nextUrl.clone();
			url.pathname = '/login';
			return NextResponse.redirect(url);
		}

		if (
			!isAnonymousRoute(request.nextUrl.pathname) &&
			!request.nextUrl.pathname.startsWith('/api/')
		) {
			const url = request.nextUrl.clone();
			url.pathname = '/login';
			// NFCプロフィール等のページからリダイレクトされた場合、ログイン後に元のページに戻れるようにする
			if (request.nextUrl.pathname.startsWith('/nfc-profile/')) {
				url.searchParams.set('redirectTo', request.nextUrl.pathname);
			}
			return NextResponse.redirect(url);
		}
	}

	return supabaseResponse;
}

export const config = {
	matcher: [
		'/((?!_next/static|_next/image|api/|favicon.ico|.*\\.(?:jpg|jpeg|gif|png|svg|ico)$).*)',
	],
};
