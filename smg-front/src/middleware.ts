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

	// ユーザーがログインしている場合、所属グループのステータスをチェック
	if (user) {
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

	if (user) {
		if (anonymousRoutes.includes(request.nextUrl.pathname)) {
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
			!anonymousRoutes.includes(request.nextUrl.pathname)
		) {
			const url = request.nextUrl.clone();
			url.pathname = '/login';
			return NextResponse.redirect(url);
		}

		if (
			!anonymousRoutes.includes(request.nextUrl.pathname) &&
			!request.nextUrl.pathname.startsWith('/api/')
		) {
			const url = request.nextUrl.clone();
			url.pathname = '/login';
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
