'use server';

import { createClient } from '@/lib/supabase/server';

// スレッドの型定義
export type Thread = {
  thread_id: string;
  user: {
    user_id: string;
    username: string;
    icon: string | null;
  };
  labelId: string | null;
  latestMessage?: {
    is_read: boolean;
    created_at: string;
  };
  allLatestMessageCreatedAt?: string;
  created_at: string;
  is_admin_read: boolean | null;
  last_sent_at: string | null;
};

// スレッドに最新メッセージ情報を付与する共通関数
async function attachLatestMessages(
  client: ReturnType<typeof createClient>,
  threads: Array<{
    thread_id: string;
    user: {
      user_id: string;
      username: string | null;
      icon: string | null;
    } | null;
    label: { label_id: string } | null;
    created_at: string | null;
    is_admin_read?: boolean | null;
    last_sent_at?: string | null;
  }>,
): Promise<Thread[]> {
  if (threads.length === 0) return [];

  // 各スレッドのスレッドユーザーIDをマップ化
  const threadUserMap = new Map<string, string>();
  for (const thread of threads) {
    if (thread.user?.user_id) {
      threadUserMap.set(thread.thread_id, thread.user.user_id);
    }
  }

  // 全スレッドのメッセージを取得（created_at降順）
  const threadIds = threads.map((t) => t.thread_id);
  const { data: allMessages } = await client
    .from('trn_dm_message')
    .select('thread_id, user_id, is_read, created_at')
    .in('thread_id', threadIds)
    .order('created_at', { ascending: false });

  // 各スレッドの最新メッセージを取得（スレッドユーザーのメッセージのみ、既読フラグ用）
  const latestMessageMap = new Map<
    string,
    { is_read: boolean; created_at: string }
  >();
  // 各スレッドの最新メッセージを取得（全メッセージ、ソート用）
  const allLatestMessageMap = new Map<string, { created_at: string }>();

  for (const msg of allMessages || []) {
    const threadUserId = threadUserMap.get(msg.thread_id);

    // 全メッセージから最新のものを取得（ソート用）
    if (!allLatestMessageMap.has(msg.thread_id)) {
      allLatestMessageMap.set(msg.thread_id, {
        created_at: msg.created_at ?? '',
      });
    }

    // スレッドユーザーのメッセージのみ（既読フラグ用）
    if (msg.user_id === threadUserId && !latestMessageMap.has(msg.thread_id)) {
      latestMessageMap.set(msg.thread_id, {
        is_read: msg.is_read ?? false,
        created_at: msg.created_at ?? '',
      });
    }
  }

  // スレッドデータに最新メッセージを付与
  return threads.map((thread) => ({
    thread_id: thread.thread_id,
    user: {
      user_id: thread.user?.user_id ?? '',
      username: thread.user?.username ?? '',
      icon: thread.user?.icon ?? null,
    },
    labelId: thread.label?.label_id ?? null,
    latestMessage: latestMessageMap.get(thread.thread_id),
    allLatestMessageCreatedAt: allLatestMessageMap.get(thread.thread_id)
      ?.created_at,
    created_at: thread.created_at ?? '',
    is_admin_read: thread.is_admin_read ?? true,
    last_sent_at: thread.last_sent_at ?? null,
  }));
}

// DMページの初期データを取得（30件）
export async function fetchDmPageData() {
  const client = createClient();

  // 現在のユーザーIDを取得
  const {
    data: { user },
  } = await client.auth.getUser();
  const currentUserId = user?.id ?? '';

  // fetchMoreThreadsを使用して最初の30件を取得
  const { threads, total } = await fetchMoreThreads(0, 30);

  // ラベル一覧を取得
  const { data: labelsData } = await client
    .from('mst_dm_label')
    .select('label_id, name, color, created_at, updated_at, deleted_at')
    .is('deleted_at', null);

  // タグ一覧を取得
  const { data: tagsData } = await client
    .from('mst_dm_tag')
    .select('tag_id, name, created_at, updated_at, deleted_at')
    .is('deleted_at', null);

  // 管理者グループID(運営と講師)を取得
  const { data: adminGroupData } = await client
    .from('mst_group')
    .select('group_id, title')
    .in('title', ['運営', '講師'])
    .is('deleted_at', null);

  const adminGroupIds = (adminGroupData || []).map((g) => g.group_id);
  const adminGroupMap = new Map(
    (adminGroupData || []).map((g) => [g.group_id, g.title]),
  );

  // 全ユーザーを取得
  const { data: allUsersData } = await client
    .from('mst_user')
    .select('user_id, username, icon')
    .is('deleted_at', null);

  // 管理者ユーザーのグループ情報を取得（JOINを使用）
  const { data: adminUsersWithGroups } = await client
    .from('trn_group_user')
    .select(
      `
      user_id,
      group_id
    `,
    )
    .in('group_id', adminGroupIds)
    .is('deleted_at', null);

  // ユーザーIDごとにグループ情報をマッピング
  const groupsByUser = new Map<string, Array<{ id: string; title: string }>>();

  for (const record of adminUsersWithGroups || []) {
    if (!record.user_id || !record.group_id) continue;

    const groupTitle = adminGroupMap.get(record.group_id);
    if (!groupTitle) continue;

    // グループ情報を追加
    if (!groupsByUser.has(record.user_id)) {
      groupsByUser.set(record.user_id, []);
    }
    groupsByUser.get(record.user_id)?.push({
      id: record.group_id,
      title: groupTitle,
    });
  }

  // 全ユーザーデータとグループ情報を結合
  const usersWithGroups = (allUsersData || []).map((u) => ({
    id: u.user_id,
    username: u.username,
    icon: u.icon,
    groups: groupsByUser.get(u.user_id) || [],
  }));

  return {
    threads,
    labels: labelsData || [],
    tags: tagsData || [],
    users: usersWithGroups,
    currentUserId,
    hasMore: total > 30,
    total,
  };
}

// 追加のスレッドを取得（ページネーション用）
export async function fetchMoreThreads(offset: number, limit = 30) {
  const client = createClient();

  // is_admin_read = false のスレッド数を取得
  const { count: unreadCount } = await client
    .from('mst_dm_thread')
    .select('*', { count: 'exact', head: true })
    .eq('is_admin_read', false);

  const totalUnread = unreadCount ?? 0;

  // 総スレッド数を取得
  const { count: totalCount } = await client
    .from('mst_dm_thread')
    .select('*', { count: 'exact', head: true });

  const total = totalCount ?? 0;

  // offset位置に応じてクエリを切り替え
  let threadsData: Array<{
    thread_id: string;
    user: {
      user_id: string;
      username: string | null;
      icon: string | null;
    } | null;
    label: { label_id: string } | null;
    created_at: string | null;
    last_sent_at: string | null;
  }> = [];

  if (offset < totalUnread) {
    // 未読スレッドの範囲から開始
    const { data: unreadData } = await client
      .from('mst_dm_thread')
      .select(
        `
        thread_id,
        user:user_id (user_id, username, icon),
        label:trn_dm_thread_label!left(label_id),
        created_at,
        last_sent_at,
        is_admin_read
      `,
      )
      .eq('is_admin_read', false)
      .order('last_sent_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    threadsData = unreadData || [];

    // 未読だけでlimit件に満たない場合、既読から追加取得
    const remainingCount = limit - threadsData.length;
    if (remainingCount > 0 && offset + threadsData.length >= totalUnread) {
      const { data: readData } = await client
        .from('mst_dm_thread')
        .select(
          `
          thread_id,
          user:user_id (user_id, username, icon),
          label:trn_dm_thread_label!left(label_id),
          created_at,
          last_sent_at,
          is_admin_read
        `,
        )
        .eq('is_admin_read', true)
        .order('last_sent_at', { ascending: false, nullsFirst: false })
        .range(0, remainingCount - 1);

      threadsData = [...threadsData, ...(readData || [])];
    }
  } else if (offset < total) {
    // 完全に既読スレッドの範囲
    const readOffset = offset - totalUnread;
    const { data } = await client
      .from('mst_dm_thread')
      .select(
        `
        thread_id,
        user:user_id (user_id, username, icon),
        label:trn_dm_thread_label!left(label_id),
        created_at,
        last_sent_at,
        is_admin_read
      `,
      )
      .eq('is_admin_read', true)
      .order('last_sent_at', { ascending: false, nullsFirst: false })
      .range(readOffset, readOffset + limit - 1);

    threadsData = data || [];
  }

  // スレッドに最新メッセージを付与
  const threads = await attachLatestMessages(client, threadsData);

  return {
    threads,
    hasMore: offset + limit < total,
    total,
  };
}

// ユーザー名で検索して全てのスレッドを取得
export async function searchThreadsByUsername(username: string) {
  const client = createClient();

  // 検索文字列が空の場合は最初のページを返す
  if (!username.trim()) {
    return fetchMoreThreads(0, 30);
  }

  const searchLower = username.toLowerCase();

  // 未読スレッド(is_admin_read=false)を検索
  const { data: unreadThreadsData, error: unreadError } = await client
    .from('mst_dm_thread')
    .select(
      `
      thread_id,
      user:user_id!inner (user_id, username, icon),
      label:trn_dm_thread_label!left(label_id),
      created_at,
      last_sent_at,
      is_admin_read
    `,
    )
    .eq('is_admin_read', false)
    .ilike('user_id.username', `%${searchLower}%`)
    .order('last_sent_at', { ascending: false, nullsFirst: false });

  // 既読スレッド(is_admin_read=true)を検索
  const { data: readThreadsData, error: readError } = await client
    .from('mst_dm_thread')
    .select(
      `
      thread_id,
      user:user_id!inner (user_id, username, icon),
      label:trn_dm_thread_label!left(label_id),
      created_at,
      last_sent_at,
      is_admin_read
    `,
    )
    .eq('is_admin_read', true)
    .ilike('user_id.username', `%${searchLower}%`)
    .order('last_sent_at', { ascending: false, nullsFirst: false });

  // 未読 + 既読を結合
  const allThreadsData = [
    ...(unreadThreadsData || []),
    ...(readThreadsData || []),
  ];

  // スレッドに最新メッセージを付与
  const threads = await attachLatestMessages(client, allThreadsData);

  return {
    threads,
    hasMore: false,
    total: threads.length,
  };
}

// 個別のスレッドを取得
export async function fetchThreadById(threadId: string) {
  const client = createClient();

  const { data: threadData } = await client
    .from('mst_dm_thread')
    .select(
      `
      thread_id,
      user:user_id!inner (user_id, username, icon),
      label:trn_dm_thread_label!left(label_id),
      created_at,
      last_sent_at,
      is_admin_read
    `,
    )
    .eq('thread_id', threadId)
    .single();

  if (!threadData) return null;

  const threads = await attachLatestMessages(client, [threadData]);
  return threads[0] || null;
}

// 既存のgetCurrentUserも残しておく（他で使われている可能性があるため）
export const getCurrentUser = async () => {
  const client = createClient();
  const { data } = await client.auth.getUser();
  return data.user?.id ?? '';
};
