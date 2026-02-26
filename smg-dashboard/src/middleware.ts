import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// 型定義
type GroupUserData = {
  user_id: string;
  mst_group: {
    title: string;
  } | null;
}[];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // パス情報をヘッダーに追加
  response.headers.set('x-pathname', request.nextUrl.pathname);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              request.cookies.set({ name, value, ...options });
            }
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 認証が不要なパス
  const publicPaths = [
    '/login',
    '/signup',
    '/forgot-password',
    '/forgotPassword',
    '/reset-password',
  ];
  const isPublicPath = publicPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  // 静的ファイルへのアクセスは常に許可
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/static') ||
    request.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|gif|svg)$/)
  ) {
    return response;
  }

  // 未認証ユーザーの処理
  if (!user && !isPublicPath) {
    const redirectUrl = new URL('/login', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // 認証済みユーザーが講師または運営グループに所属しているか確認
  if (user && !isPublicPath) {
    const { data: authorizedUser, error } = (await supabase
      .from('trn_group_user')
      .select(`
        user_id,
        mst_group:group_id (
          title
        )
      `)
      .eq('user_id', user.id)
      .is('deleted_at', null)) as {
      data: GroupUserData | null;
      error: Error | null;
    };

    // まず未決済・退会ユーザーをチェック
    if (authorizedUser && authorizedUser.length > 0) {
      for (const userGroup of authorizedUser) {
        const groupTitle = userGroup.mst_group?.title;
        // 未決済または退会ユーザーはログアウト
        if (groupTitle === '未決済' || groupTitle === '退会') {
          await supabase.auth.signOut();

          // レスポンスを作成してクッキーを削除
          const redirectUrl = new URL('/login', request.url);
          redirectUrl.searchParams.set('auto-logout', 'true');
          const logoutResponse = NextResponse.redirect(redirectUrl);

          // 全てのSupabase関連クッキーを削除
          const allCookies = request.cookies.getAll();
          for (const cookie of allCookies) {
            if (cookie.name.startsWith('sb-')) {
              logoutResponse.cookies.delete(cookie.name);
            }
          }

          return logoutResponse;
        }
      }
    }

    // 講師または運営グループに所属しているかチェック
    let isAuthorized = false;
    if (authorizedUser && authorizedUser.length > 0) {
      for (const userGroup of authorizedUser) {
        const groupTitle = userGroup.mst_group?.title;
        if (groupTitle === '講師' || groupTitle === '運営') {
          isAuthorized = true;
          break;
        }
      }
    }

    // 講師または運営グループに所属していない場合はログイン画面にリダイレクト
    if (
      error ||
      !authorizedUser ||
      authorizedUser.length === 0 ||
      !isAuthorized
    ) {
      // Supabaseの認証情報をクリア
      await supabase.auth.signOut();

      // アクセス先のパスを保存して、ログイン後にリダイレクトできるようにする
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('auto-logout', 'true');
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 認証済みユーザーの処理
  if (user && isPublicPath) {
    const redirectUrl = new URL('/', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|api/|favicon.ico|.*\\.(?:jpg|jpeg|gif|png|svg|ico)$).*)',
  ],
};
