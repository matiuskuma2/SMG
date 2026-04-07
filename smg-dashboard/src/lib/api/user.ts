'use server';

import type { UserListItem } from '@/components/userlist/types';
import { createClient } from '@/lib/supabase/server';

export type GetUsersParams = {
  page?: number;
  itemsPerPage?: number;
  searchQuery?: string;
  filterRole?: string;
  sortByJoinedDate?: 'asc' | 'desc' | null;
};

export type GetUsersResult = {
  users: UserListItem[];
  totalCount: number;
  userTypes: string[];
  canViewPaymentStatus: boolean;
};

export async function getUsersAction(
  params: GetUsersParams = {},
): Promise<GetUsersResult> {
  const {
    page = 1,
    itemsPerPage = 50,
    searchQuery = '',
    filterRole = 'all',
    sortByJoinedDate = null,
  } = params;

  const supabase = createClient();

  try {
    // 現在のログインユーザーの権限チェック
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let canViewPaymentStatus = false;

    if (user) {
      const { data: userGroups } = await supabase
        .from('trn_group_user')
        .select(
          `
          mst_group (
            title
          )
        `,
        )
        .eq('user_id', user.id)
        .is('deleted_at', null);

      canViewPaymentStatus =
        userGroups?.some(
          (group) => group.mst_group?.title === '決済情報閲覧',
        ) ?? false;
    }

    // ベースクエリの構築
    let query = supabase
      .from('mst_user')
      .select(
        `
        user_id,
        icon,
        username,
        email,
        phone_number,
        user_type,
        company_name,
        created_at,
        last_login_at,
        updated_at,
        daihyosha_id,
        trn_group_user (
          mst_group (
            title
          )
        )
      `,
        { count: 'exact' },
      )
      .is('deleted_at', null)
      .or('deleted_at.is.null', { foreignTable: 'trn_group_user' });

    // 検索条件の適用（username, email, phone_number）
    if (searchQuery) {
      query = query.or(
        `username.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone_number.ilike.%${searchQuery}%`,
      );
    }

    // ロールフィルターの適用
    if (filterRole && filterRole !== 'all') {
      if (filterRole.startsWith('group:')) {
        // グループ名で絞り込み（例: group:講師, group:パートナー税理士）
        const groupName = filterRole.replace('group:', '');
        const { data: groupData } = await supabase
          .from('mst_group')
          .select('group_id')
          .eq('title', groupName)
          .is('deleted_at', null)
          .single();

        if (groupData) {
          const { data: groupUsers } = await supabase
            .from('trn_group_user')
            .select('user_id')
            .eq('group_id', groupData.group_id)
            .is('deleted_at', null);

          const userIds = (groupUsers || []).map((gu) => gu.user_id).filter(Boolean) as string[];
          if (userIds.length > 0) {
            query = query.in('user_id', userIds);
          } else {
            // グループにユーザーがいない場合は結果を空にする
            query = query.in('user_id', ['__no_match__']);
          }
        } else {
          query = query.in('user_id', ['__no_match__']);
        }
      } else {
        query = query.eq('user_type', filterRole);
      }
    }

    // ソートの適用
    if (sortByJoinedDate) {
      query = query.order('created_at', {
        ascending: sortByJoinedDate === 'asc',
      });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // ページネーションの適用
    const from = (page - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Failed to load users:', error);
      throw error;
    }

    // パートナーの代表者名を取得
    const partnerUserIds = data
      ?.filter((u) => u.daihyosha_id)
      .map((u) => u.daihyosha_id as string) ?? [];
    const uniqueDaihyoshaIds = [...new Set(partnerUserIds)];

    let daihyoshaMap = new Map<string, string>();
    if (uniqueDaihyoshaIds.length > 0) {
      const { data: daihyoshaData } = await supabase
        .from('mst_user')
        .select('user_id, username')
        .in('user_id', uniqueDaihyoshaIds);
      if (daihyoshaData) {
        daihyoshaMap = new Map(
          daihyoshaData.map((d) => [d.user_id, d.username || ''])
        );
      }
    }

    // 日付フォーマットの整形
    const formattedData: UserListItem[] =
      data?.map((user) => ({
        ...user,
        created_at: user.created_at
          ? new Date(user.created_at).toLocaleDateString('ja-JP')
          : '未設定',
        last_login_at: user.last_login_at
          ? new Date(user.last_login_at).toLocaleDateString('ja-JP')
          : '未ログイン',
        username: user.username || '',
        phone_number: user.phone_number || '',
        user_type: user.user_type || '',
        company_name: user.company_name || '',
        icon: user.icon || '',
        daihyosha_id: user.daihyosha_id || null,
        daihyosha_name: user.daihyosha_id
          ? daihyoshaMap.get(user.daihyosha_id) || ''
          : null,
      })) ?? [];

    // user_typeの一覧を取得（別クエリで全体から取得）
    const { data: allUsers } = await supabase
      .from('mst_user')
      .select('user_type')
      .is('deleted_at', null)
      .not('user_type', 'is', null);

    const uniqueUserTypes = Array.from(
      new Set(
        allUsers
          ?.map((user) => user.user_type)
          .filter((type): type is string => Boolean(type)) ?? [],
      ),
    );

    return {
      users: formattedData,
      totalCount: count ?? 0,
      userTypes: uniqueUserTypes,
      canViewPaymentStatus,
    };
  } catch (error) {
    console.error('Error in getUsersAction:', error);
    return {
      users: [],
      totalCount: 0,
      userTypes: [],
      canViewPaymentStatus: false,
    };
  }
}

/**
 * ユーザー一覧をCSV文字列としてエクスポートする
 * 現在の検索・フィルタ条件を適用した全件を取得
 */
export async function exportUsersCSVAction(
  params: Omit<GetUsersParams, 'page' | 'itemsPerPage'> = {},
): Promise<string> {
  const { searchQuery = '', filterRole = 'all', sortByJoinedDate = null } = params;

  const supabase = createClient();

  try {
    let query = supabase
      .from('mst_user')
      .select(
        `
        user_id,
        username,
        email,
        phone_number,
        user_type,
        company_name,
        created_at,
        last_login_at,
        trn_group_user (
          mst_group (
            title
          )
        )
      `,
      )
      .is('deleted_at', null)
      .or('deleted_at.is.null', { foreignTable: 'trn_group_user' });

    if (searchQuery) {
      query = query.or(
        `username.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone_number.ilike.%${searchQuery}%`,
      );
    }

    if (filterRole && filterRole !== 'all') {
      if (filterRole.startsWith('group:')) {
        const groupName = filterRole.replace('group:', '');
        const { data: groupData } = await supabase
          .from('mst_group')
          .select('group_id')
          .eq('title', groupName)
          .is('deleted_at', null)
          .single();

        if (groupData) {
          const { data: groupUsers } = await supabase
            .from('trn_group_user')
            .select('user_id')
            .eq('group_id', groupData.group_id)
            .is('deleted_at', null);

          const userIds = (groupUsers || []).map((gu) => gu.user_id).filter(Boolean) as string[];
          if (userIds.length > 0) {
            query = query.in('user_id', userIds);
          } else {
            query = query.in('user_id', ['__no_match__']);
          }
        } else {
          query = query.in('user_id', ['__no_match__']);
        }
      } else {
        query = query.eq('user_type', filterRole);
      }
    }

    if (sortByJoinedDate) {
      query = query.order('created_at', {
        ascending: sortByJoinedDate === 'asc',
      });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error('CSV export error:', error);
      throw error;
    }

    // CSV ヘッダー
    const headers = ['名前', 'メールアドレス', '電話番号', '属性', '会社名', '所属グループ', '入会日', 'ログイン状況', '最終ログイン日時'];

    // CSV行を生成
    const rows = (data || []).map((user) => {
      const groups = (user.trn_group_user || [])
        .map((gu) => gu.mst_group?.title || '')
        .filter(Boolean)
        .join(' / ');

      const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('ja-JP');
      };

      const formatDateTime = (dateStr: string | null) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return `${d.toLocaleDateString('ja-JP')} ${d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`;
      };

      return [
        user.username || '',
        user.email || '',
        user.phone_number || '',
        user.user_type || '',
        user.company_name || '',
        groups,
        formatDate(user.created_at),
        user.last_login_at ? 'ログイン済み' : '未ログイン',
        formatDateTime(user.last_login_at),
      ];
    });

    // CSVエスケープ処理
    const escapeCSV = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvLines = [
      headers.map(escapeCSV).join(','),
      ...rows.map((row) => row.map(escapeCSV).join(',')),
    ];

    // BOM付きUTF-8（Excelで文字化けしないように）
    return '\uFEFF' + csvLines.join('\n');
  } catch (error) {
    console.error('Error in exportUsersCSVAction:', error);
    throw new Error('CSVエクスポートに失敗しました');
  }
}
