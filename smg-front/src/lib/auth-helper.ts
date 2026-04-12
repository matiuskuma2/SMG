import { createClient as createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { headers } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * FlutterFlow / モバイルアプリ向け Bearer JWT 認証ヘルパー
 *
 * - 既存Web (Cookie認証) を完全に維持しつつ、Bearerヘッダーが存在する場合のみ
 *   Supabase Admin Client の auth.getUser(jwt) で署名・有効期限を検証する。
 * - supabase-server.ts / supabase-admin.ts は一切変更しない。
 * - 本ファイルは新規追加。既存ファイルのインポート先のみ使用する。
 */

interface AuthSuccess {
	userId: string;
	email: string | undefined;
	error?: never;
	status?: never;
}

interface AuthError {
	userId?: never;
	email?: never;
	error: string;
	status: number;
}

export type AuthResult = AuthSuccess | AuthError;

/**
 * リクエストからユーザーIDを取得する（カテゴリB用）
 *
 * 優先順位:
 *  1. Authorization: Bearer <JWT>         → admin.auth.getUser(jwt) でJWT検証
 *  2. Cookie セッション（既存Web）        → supabase-server 経由で既存動作を維持
 */
export async function getAuthenticatedUser(): Promise<AuthResult> {
	const headerList = await headers();
	const authorization = headerList.get('authorization');

	// パターン1: Bearer トークン（FlutterFlow / モバイルアプリ）
	if (authorization?.startsWith('Bearer ')) {
		const jwt = authorization.slice(7);

		try {
			const admin = createAdminClient();
			const {
				data: { user },
				error,
			} = await admin.auth.getUser(jwt);

			if (error || !user) {
				console.error('Bearer認証失敗:', error?.message);
				return { error: '認証トークンが無効です', status: 401 };
			}

			return { userId: user.id, email: user.email };
		} catch (e) {
			console.error('Bearer認証エラー:', e);
			return { error: '認証処理に失敗しました', status: 500 };
		}
	}

	// パターン2: Cookie セッション（既存Web - 動作を完全維持）
	try {
		const supabase = await createServerClient();
		const {
			data: { user },
			error,
		} = await supabase.auth.getUser();

		if (error || !user) {
			return { error: '認証が必要です', status: 401 };
		}

		return { userId: user.id, email: user.email };
	} catch (e) {
		console.error('Cookie認証エラー:', e);
		return { error: '認証が必要です', status: 401 };
	}
}

interface ClientSuccess {
	client: SupabaseClient;
	userId: string;
	email: string | undefined;
	isBearer: boolean;
	error?: never;
	status?: never;
}

interface ClientError {
	client?: never;
	userId?: never;
	email?: never;
	isBearer?: never;
	error: string;
	status: number;
}

export type ClientResult = ClientSuccess | ClientError;

/**
 * 認証済みユーザーのSupabaseクライアントを取得する（カテゴリC用）
 *
 * - Bearer経路: admin client を返す（RLSバイパス）
 *   → 呼び出し側で必ず `.eq('user_id', userId)` 等のRLS相当フィルタを付けること
 * - Cookie経路: 既存のserver client を返す（RLS自動適用）
 *   → 既存動作を100%維持
 */
export async function getAuthenticatedClient(): Promise<ClientResult> {
	const headerList = await headers();
	const authorization = headerList.get('authorization');

	// パターン1: Bearer トークン
	if (authorization?.startsWith('Bearer ')) {
		const jwt = authorization.slice(7);

		try {
			const admin = createAdminClient();
			const {
				data: { user },
				error,
			} = await admin.auth.getUser(jwt);

			if (error || !user) {
				console.error('Bearer認証失敗:', error?.message);
				return { error: '認証トークンが無効です', status: 401 };
			}

			// Bearer経路では admin client を返す。
			// ⚠️ RLSバイパスされるため、呼び出し側で user_id 等のフィルタ必須。
			return {
				client: admin as unknown as SupabaseClient,
				userId: user.id,
				email: user.email,
				isBearer: true,
			};
		} catch (e) {
			console.error('Bearer認証エラー:', e);
			return { error: '認証処理に失敗しました', status: 500 };
		}
	}

	// パターン2: Cookie セッション（既存動作を完全維持）
	try {
		const supabase = await createServerClient();
		const {
			data: { user },
			error,
		} = await supabase.auth.getUser();

		if (error || !user) {
			return { error: '認証が必要です', status: 401 };
		}

		// Cookie経路では既存のserver clientをそのまま返す（RLSが自動適用）
		return {
			client: supabase as unknown as SupabaseClient,
			userId: user.id,
			email: user.email,
			isBearer: false,
		};
	} catch (e) {
		console.error('Cookie認証エラー:', e);
		return { error: '認証が必要です', status: 401 };
	}
}
