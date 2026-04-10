'use server';

import { createClient } from '@/lib/supabase/server';

// スレッドの型定義
export type Thread = {
  thread_id: string;
  user: {
    user_id: string;
    username: string;
    email: string | null;
    icon: string | null;
    is_deleted: boolean;
    user_type: string | null;
  };
  labelId: string | null;
  tagIds: string[];
  latestMessage?: {
    is_read: boolean;
    created_at: string;
  };
  allLatestMessageCreatedAt?: string;
  created_at: string;
  is_admin_read: boolean | null;
  last_sent_at: string | null;
};

// スレッドの生データ型
type RawThread = {
  thread_id: string;
  user: {
    user_id: string;
    username: string | null;
    email: string | null;
    icon: string | null;
    deleted_at: string | null;
    user_type: string | null;
  } | null;
  label: { label_id: string } | null;
  created_at: string | null;
  is_admin_read?: boolean | null;
  last_sent_at?: string | null;
};

// スレッド取得用の共通SELECTクエリ
const THREAD_SELECT = `
  thread_id,
  user:user_id (user_id, username, email, icon, deleted_at, user_type),
  label:trn_dm_thread_label!left(label_id),
  created_at,
  last_sent_at,
  is_admin_read
`;

const THREAD_SELECT_INNER = `
  thread_id,
  user:user_id!inner (user_id, username, email, icon, deleted_at, user_type),
  label:trn_dm_thread_label!left(label_id),
  created_at,
  last_sent_at,
  is_admin_read
`;

// スレッドに最新メッセージ情報とタグ情報を付与する共通関数
async function attachLatestMessagesAndTags(
  client: ReturnType<typeof createClient>,
  threads: RawThread[],
): Promise<Thread[]> {
  if (threads.length === 0) return [];

  const threadUserMap = new Map<string, string>();
  for (const thread of threads) {
    if (thread.user?.user_id) {
      threadUserMap.set(thread.thread_id, thread.user.user_id);
    }
  }

  const threadIds = threads.map((t) => t.thread_id);

  // メッセージとタグを並行取得
  const [messagesResult, tagsResult] = await Promise.all([
    client
      .from('trn_dm_message')
      .select('thread_id, user_id, is_read, created_at')
      .in('thread_id', threadIds)
      .order('created_at', { ascending: false }),
    client
      .from('trn_dm_thread_tag')
      .select('thread_id, tag_id')
      .in('thread_id', threadIds)
      .is('deleted_at', null),
  ]);

  const allMessages = messagesResult.data || [];
  const allTags = tagsResult.data || [];

  // タグマップ作成
  const tagMap = new Map<string, string[]>();
  for (const tag of allTags) {
    if (!tagMap.has(tag.thread_id)) {
      tagMap.set(tag.thread_id, []);
    }
    tagMap.get(tag.thread_id)?.push(tag.tag_id);
  }

  const latestMessageMap = new Map<
    string,
    { is_read: boolean; created_at: string }
  >();
  const allLatestMessageMap = new Map<string, { created_at: string }>();

  for (const msg of allMessages) {
    const threadUserId = threadUserMap.get(msg.thread_id);

    if (!allLatestMessageMap.has(msg.thread_id)) {
      allLatestMessageMap.set(msg.thread_id, {
        created_at: msg.created_at ?? '',
      });
    }

    if (msg.user_id === threadUserId && !latestMessageMap.has(msg.thread_id)) {
      latestMessageMap.set(msg.thread_id, {
        is_read: msg.is_read ?? false,
        created_at: msg.created_at ?? '',
      });
    }
  }

  return threads.map((thread) => ({
    thread_id: thread.thread_id,
    user: {
      user_id: thread.user?.user_id ?? '',
      username: thread.user?.username ?? '',
      email: thread.user?.email ?? null,
      icon: thread.user?.icon ?? null,
      is_deleted: thread.user?.deleted_at !== null,
      user_type: thread.user?.user_type ?? null,
    },
    labelId: thread.label?.label_id ?? null,
    tagIds: tagMap.get(thread.thread_id) || [],
    latestMessage: latestMessageMap.get(thread.thread_id),
    allLatestMessageCreatedAt: allLatestMessageMap.get(thread.thread_id)
      ?.created_at,
    created_at: thread.created_at ?? '',
    is_admin_read: thread.is_admin_read ?? true,
    last_sent_at: thread.last_sent_at ?? null,
  }));
}

function sortThreadsForDisplay(threads: Thread[]): Thread[] {
  return [...threads].sort((a, b) => {
    const aUnread = a.is_admin_read === false;
    const bUnread = b.is_admin_read === false;

    if (aUnread !== bUnread) {
      return aUnread ? -1 : 1;
    }

    const aLatest =
      a.last_sent_at || a.allLatestMessageCreatedAt || a.created_at || '';
    const bLatest =
      b.last_sent_at || b.allLatestMessageCreatedAt || b.created_at || '';

    return bLatest.localeCompare(aLatest);
  });
}

// DMページの初期データを取得（30件）
export async function fetchDmPageData() {
  const client = createClient();

  const {
    data: { user },
  } = await client.auth.getUser();
  const currentUserId = user?.id ?? '';

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

  // 全ユーザーを取得（退会者含む、deleted_atも取得）
  const { data: allUsersData } = await client
    .from('mst_user')
    .select('user_id, username, email, icon, deleted_at, user_type');

  // 管理者ユーザーのグループ情報を取得
  const { data: adminUsersWithGroups } = await client
    .from('trn_group_user')
    .select('user_id, group_id')
    .in('group_id', adminGroupIds)
    .is('deleted_at', null);

  const groupsByUser = new Map<string, Array<{ id: string; title: string }>>();
  for (const record of adminUsersWithGroups || []) {
    if (!record.user_id || !record.group_id) continue;
    const groupTitle = adminGroupMap.get(record.group_id);
    if (!groupTitle) continue;
    if (!groupsByUser.has(record.user_id)) {
      groupsByUser.set(record.user_id, []);
    }
    groupsByUser.get(record.user_id)?.push({
      id: record.group_id,
      title: groupTitle,
    });
  }

  const usersWithGroups = (allUsersData || []).map((u) => ({
    id: u.user_id,
    username: u.username,
    email: u.email,
    icon: u.icon,
    is_deleted: u.deleted_at !== null,
    user_type: u.user_type || null,
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

  const { count: unreadCount } = await client
    .from('mst_dm_thread')
    .select('*', { count: 'exact', head: true })
    .eq('is_admin_read', false);

  const totalUnread = unreadCount ?? 0;

  const { count: totalCount } = await client
    .from('mst_dm_thread')
    .select('*', { count: 'exact', head: true });

  const total = totalCount ?? 0;

  let threadsData: RawThread[] = [];

  if (offset < totalUnread) {
    const { data: unreadData } = await client
      .from('mst_dm_thread')
      .select(THREAD_SELECT)
      .eq('is_admin_read', false)
      .order('last_sent_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    threadsData = (unreadData || []) as unknown as RawThread[];

    const remainingCount = limit - threadsData.length;
    if (remainingCount > 0 && offset + threadsData.length >= totalUnread) {
      const { data: readData } = await client
        .from('mst_dm_thread')
        .select(THREAD_SELECT)
        .eq('is_admin_read', true)
        .order('last_sent_at', { ascending: false, nullsFirst: false })
        .range(0, remainingCount - 1);

      threadsData = [
        ...threadsData,
        ...((readData || []) as unknown as RawThread[]),
      ];
    }
  } else if (offset < total) {
    const readOffset = offset - totalUnread;
    const { data } = await client
      .from('mst_dm_thread')
      .select(THREAD_SELECT)
      .eq('is_admin_read', true)
      .order('last_sent_at', { ascending: false, nullsFirst: false })
      .range(readOffset, readOffset + limit - 1);

    threadsData = (data || []) as unknown as RawThread[];
  }

  const threads = await attachLatestMessagesAndTags(client, threadsData);

  return {
    threads: sortThreadsForDisplay(threads),
    hasMore: offset + limit < total,
    total,
  };
}

// ユーザー名またはメールアドレスで検索して全てのスレッドを取得
export async function searchThreadsByUsername(query: string) {
  const client = createClient();

  if (!query.trim()) {
    return fetchMoreThreads(0, 30);
  }

  const searchLower = query.toLowerCase();

  // ユーザー名 OR メールアドレスで検索
  // Supabaseのilike は一つのカラムにしか使えないので、まずユーザー名で検索し、次にメールで検索して結合
  const [unreadByName, readByName, unreadByEmail, readByEmail] =
    await Promise.all([
      client
        .from('mst_dm_thread')
        .select(THREAD_SELECT_INNER)
        .eq('is_admin_read', false)
        .ilike('user_id.username', `%${searchLower}%`)
        .order('last_sent_at', { ascending: false, nullsFirst: false }),
      client
        .from('mst_dm_thread')
        .select(THREAD_SELECT_INNER)
        .eq('is_admin_read', true)
        .ilike('user_id.username', `%${searchLower}%`)
        .order('last_sent_at', { ascending: false, nullsFirst: false }),
      client
        .from('mst_dm_thread')
        .select(THREAD_SELECT_INNER)
        .eq('is_admin_read', false)
        .ilike('user_id.email', `%${searchLower}%`)
        .order('last_sent_at', { ascending: false, nullsFirst: false }),
      client
        .from('mst_dm_thread')
        .select(THREAD_SELECT_INNER)
        .eq('is_admin_read', true)
        .ilike('user_id.email', `%${searchLower}%`)
        .order('last_sent_at', { ascending: false, nullsFirst: false }),
    ]);

  // 重複排除して結合（未読優先）
  const seen = new Set<string>();
  const allThreadsData: RawThread[] = [];

  for (const data of [
    unreadByName.data,
    unreadByEmail.data,
    readByName.data,
    readByEmail.data,
  ]) {
    for (const thread of (data || []) as unknown as RawThread[]) {
      if (!seen.has(thread.thread_id)) {
        seen.add(thread.thread_id);
        allThreadsData.push(thread);
      }
    }
  }

  const threads = await attachLatestMessagesAndTags(client, allThreadsData);
  const sortedThreads = sortThreadsForDisplay(threads);

  return {
    threads: sortedThreads,
    hasMore: false,
    total: sortedThreads.length,
  };
}

// タグIDでスレッドを絞り込み検索
export async function searchThreadsByTagId(tagId: string) {
  const client = createClient();

  // タグに紐づくスレッドIDを取得
  const { data: tagThreads } = await client
    .from('trn_dm_thread_tag')
    .select('thread_id')
    .eq('tag_id', tagId)
    .is('deleted_at', null);

  const threadIds = (tagThreads || []).map((t) => t.thread_id);
  if (threadIds.length === 0) {
    return { threads: [], hasMore: false, total: 0 };
  }

  // 未読 + 既読を取得
  const [unreadResult, readResult] = await Promise.all([
    client
      .from('mst_dm_thread')
      .select(THREAD_SELECT)
      .eq('is_admin_read', false)
      .in('thread_id', threadIds)
      .order('last_sent_at', { ascending: false, nullsFirst: false }),
    client
      .from('mst_dm_thread')
      .select(THREAD_SELECT)
      .eq('is_admin_read', true)
      .in('thread_id', threadIds)
      .order('last_sent_at', { ascending: false, nullsFirst: false }),
  ]);

  const allThreadsData = [
    ...((unreadResult.data || []) as unknown as RawThread[]),
    ...((readResult.data || []) as unknown as RawThread[]),
  ];

  const threads = await attachLatestMessagesAndTags(client, allThreadsData);
  const sortedThreads = sortThreadsForDisplay(threads);

  return {
    threads: sortedThreads,
    hasMore: false,
    total: sortedThreads.length,
  };
}

// ステータス（ラベルID）でスレッドを絞り込み検索
// labelIds: 選択されたラベルIDの配列。'0'は「ステータスなし」（ラベルレコードが存在しないスレッド）
export async function searchThreadsByLabelIds(labelIds: string[]) {
  const client = createClient();

  if (labelIds.length === 0) {
    return fetchMoreThreads(0, 30);
  }

  const includeNoStatus = labelIds.includes('0');
  const actualLabelIds = labelIds.filter((id) => id !== '0');

  let allThreadsData: RawThread[] = [];

  // 実際のラベルIDでの絞り込み
  if (actualLabelIds.length > 0) {
    // trn_dm_thread_labelにラベルIDが含まれるスレッドを取得
    const { data: labelThreads } = await client
      .from('trn_dm_thread_label')
      .select('thread_id')
      .in('label_id', actualLabelIds);

    const threadIdsWithLabel = (labelThreads || []).map((t) => t.thread_id);

    if (threadIdsWithLabel.length > 0) {
      const [unreadResult, readResult] = await Promise.all([
        client
          .from('mst_dm_thread')
          .select(THREAD_SELECT)
          .eq('is_admin_read', false)
          .in('thread_id', threadIdsWithLabel)
          .order('last_sent_at', { ascending: false, nullsFirst: false }),
        client
          .from('mst_dm_thread')
          .select(THREAD_SELECT)
          .eq('is_admin_read', true)
          .in('thread_id', threadIdsWithLabel)
          .order('last_sent_at', { ascending: false, nullsFirst: false }),
      ]);

      allThreadsData = [
        ...((unreadResult.data || []) as unknown as RawThread[]),
        ...((readResult.data || []) as unknown as RawThread[]),
      ];
    }
  }

  // 「ステータスなし」が選択されている場合：trn_dm_thread_labelにレコードがないスレッドを取得
  if (includeNoStatus) {
    // ラベルが割り当てられているスレッドIDの一覧を取得
    const { data: allLabeledThreads } = await client
      .from('trn_dm_thread_label')
      .select('thread_id');

    const labeledThreadIds = (allLabeledThreads || []).map((t) => t.thread_id);

    // ラベルが割り当てられていないスレッドを取得
    const noStatusQuery = client
      .from('mst_dm_thread')
      .select(THREAD_SELECT)
      .order('last_sent_at', { ascending: false, nullsFirst: false });

    if (labeledThreadIds.length > 0) {
      // Supabaseのnot.in演算子を使う
      const [unreadNoStatus, readNoStatus] = await Promise.all([
        client
          .from('mst_dm_thread')
          .select(THREAD_SELECT)
          .eq('is_admin_read', false)
          .not('thread_id', 'in', `(${labeledThreadIds.join(',')})`)
          .order('last_sent_at', { ascending: false, nullsFirst: false }),
        client
          .from('mst_dm_thread')
          .select(THREAD_SELECT)
          .eq('is_admin_read', true)
          .not('thread_id', 'in', `(${labeledThreadIds.join(',')})`)
          .order('last_sent_at', { ascending: false, nullsFirst: false }),
      ]);

      allThreadsData = [
        ...allThreadsData,
        ...((unreadNoStatus.data || []) as unknown as RawThread[]),
        ...((readNoStatus.data || []) as unknown as RawThread[]),
      ];
    } else {
      // 全てのスレッドがラベルなし
      const [unreadAll, readAll] = await Promise.all([
        client
          .from('mst_dm_thread')
          .select(THREAD_SELECT)
          .eq('is_admin_read', false)
          .order('last_sent_at', { ascending: false, nullsFirst: false }),
        client
          .from('mst_dm_thread')
          .select(THREAD_SELECT)
          .eq('is_admin_read', true)
          .order('last_sent_at', { ascending: false, nullsFirst: false }),
      ]);

      allThreadsData = [
        ...allThreadsData,
        ...((unreadAll.data || []) as unknown as RawThread[]),
        ...((readAll.data || []) as unknown as RawThread[]),
      ];
    }
  }

  // 重複排除
  const seen = new Set<string>();
  const uniqueThreads: RawThread[] = [];
  for (const thread of allThreadsData) {
    if (!seen.has(thread.thread_id)) {
      seen.add(thread.thread_id);
      uniqueThreads.push(thread);
    }
  }

  const threads = await attachLatestMessagesAndTags(client, uniqueThreads);
  const sortedThreads = sortThreadsForDisplay(threads);

  return {
    threads: sortedThreads,
    hasMore: false,
    total: sortedThreads.length,
  };
}

// 個別のスレッドを取得
export async function fetchThreadById(threadId: string) {
  const client = createClient();

  const { data: threadData } = await client
    .from('mst_dm_thread')
    .select(THREAD_SELECT_INNER)
    .eq('thread_id', threadId)
    .single();

  if (!threadData) return null;

  const threads = await attachLatestMessagesAndTags(client, [
    threadData as unknown as RawThread,
  ]);
  return threads[0] || null;
}

// 既存のgetCurrentUserも残しておく
export const getCurrentUser = async () => {
  const client = createClient();
  const { data } = await client.auth.getUser();
  return data.user?.id ?? '';
};
