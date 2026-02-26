import { createClient } from '@/lib/supabase/client';
import type {
  BroadcastHistory,
  BroadcastHistoryWithTargets,
  BroadcastInput,
} from '@/types/broadcast';

// メッセージ内の置き換え文字を実際の値に置換する
function replaceMessagePlaceholders(
  message: string,
  user: {
    username: string | null;
    email: string;
    user_name_kana: string | null;
    phone_number: string | null;
    company_name: string | null;
    created_at: string | null;
  },
): string {
  const now = new Date();
  const formattedNow = now.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Tokyo',
  });

  // 入会日のフォーマット（YYYY年MM月DD日形式）
  const formattedJoinDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return message
    .replace(/%name%/g, user.username || '')
    .replace(/%mail%/g, user.email || '')
    .replace(/%kana%/g, user.user_name_kana || '')
    .replace(/%phone%/g, user.phone_number || '')
    .replace(/%company%/g, user.company_name || '')
    .replace(/%joinDate%/g, formattedJoinDate)
    .replace(/%now%/g, formattedNow);
}

// 一斉配信の作成（各ユーザーにDMを送信）
export async function createBroadcast(input: BroadcastInput) {
  try {
    const supabase = createClient();

    // 配信履歴を作成
    const { data: broadcast, error: broadcastError } = await supabase
      .from('trn_broadcast_history')
      .insert({
        content: input.content,
        is_sent: false, // 最初はfalse、全て送信完了後にtrueに更新
      })
      .select()
      .single();

    if (broadcastError) {
      console.error('Error creating broadcast:', broadcastError);
      throw broadcastError;
    }

    const broadcastId = broadcast.broadcast_id;
    const createdAt = new Date().toISOString();

    // 各ユーザーにDMを送信
    if (input.user_ids.length > 0) {
      const dmResults = await Promise.allSettled(
        input.user_ids.map(async (userId) => {
          // 0. ユーザー情報を取得して置き換え文字を処理
          const { data: userData, error: userError } = await supabase
            .from('mst_user')
            .select(
              'username, email, user_name_kana, phone_number, company_name, created_at',
            )
            .eq('user_id', userId)
            .single();

          if (userError || !userData) {
            throw new Error(
              `Failed to fetch user data for ${userId}: ${userError?.message}`,
            );
          }

          // メッセージ内の置き換え文字を実際の値に置換
          const personalizedContent = replaceMessagePlaceholders(
            input.content,
            userData,
          );

          // 1. 既存のスレッドを確認
          const { data: existingThread, error: threadCheckError } =
            await supabase
              .from('mst_dm_thread')
              .select('thread_id')
              .eq('user_id', userId)
              .maybeSingle();

          let threadId: string;

          if (existingThread && !threadCheckError) {
            threadId = existingThread.thread_id;
          } else {
            // 2. スレッドが存在しない場合は新規作成
            const { data: newThread, error: threadError } = await supabase
              .from('mst_dm_thread')
              .insert({
                user_id: userId,
                created_at: createdAt,
                updated_at: createdAt,
              })
              .select('thread_id')
              .single();

            if (threadError) {
              throw new Error(
                `Failed to create thread for user ${userId}: ${threadError.message}`,
              );
            }

            threadId = newThread.thread_id;
          }

          // 3. DMメッセージを送信（置き換え済みのメッセージを使用）
          const { error: messageError } = await supabase
            .from('trn_dm_message')
            .insert({
              thread_id: threadId,
              user_id: userId,
              content: personalizedContent,
              is_read: false, // 未読
              is_sent: true,
              created_at: createdAt,
              updated_at: createdAt,
            });

          if (messageError) {
            throw new Error(
              `Failed to send message to user ${userId}: ${messageError.message}`,
            );
          }

          return { userId, success: true };
        }),
      );

      // 送信結果を記録
      const targetUsersWithResults = input.user_ids.map((userId, index) => {
        const result = dmResults[index];
        return {
          broadcast_id: broadcastId,
          user_id: userId,
          is_sent: result.status === 'fulfilled',
        };
      });

      const { error: targetError } = await supabase
        .from('trn_broadcast_target_user')
        .insert(targetUsersWithResults);

      if (targetError) {
        console.error('Error recording target users:', targetError);
        throw targetError;
      }

      // 送信結果を確認
      const failedSends = dmResults.filter(
        (result) => result.status === 'rejected',
      );

      if (failedSends.length > 0) {
        console.error('Some messages failed to send:', failedSends);
      }

      // 全て送信完了したらis_sentをtrueに更新
      await supabase
        .from('trn_broadcast_history')
        .update({ is_sent: true })
        .eq('broadcast_id', broadcastId);
    }

    return broadcast;
  } catch (error) {
    console.error('Error in createBroadcast:', error);
    throw error;
  }
}

// 一斉配信履歴の取得
export async function getBroadcastHistory(): Promise<
  BroadcastHistoryWithTargets[]
> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('trn_broadcast_history')
      .select(
        `
        *,
        trn_broadcast_target_user (
          user_id,
          mst_user (
            user_id,
            username,
            email
          )
        )
      `,
      )
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching broadcast history:', error);
      throw error;
    }

    // データを整形
    interface BroadcastResponse {
      broadcast_id: string;
      is_sent: boolean;
      content: string;
      created_at: string;
      updated_at: string;
      deleted_at: string | null;
      trn_broadcast_target_user?: Array<{
        user_id: string;
        mst_user?: {
          user_id: string;
          username: string;
          email: string;
        };
      }>;
    }

    const formatted = (data as BroadcastResponse[]).map((item) => ({
      broadcast_id: item.broadcast_id,
      is_sent: item.is_sent,
      content: item.content,
      created_at: item.created_at,
      updated_at: item.updated_at,
      deleted_at: item.deleted_at,
      target_count: item.trn_broadcast_target_user?.length || 0,
      target_users: item.trn_broadcast_target_user?.map((target) => ({
        user_id: target.mst_user?.user_id || '',
        name: target.mst_user?.username || '',
        email: target.mst_user?.email || '',
      })),
    }));

    return formatted;
  } catch (error) {
    console.error('Error in getBroadcastHistory:', error);
    throw error;
  }
}

// グループ一覧の取得
export async function getGroups() {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('mst_group')
      .select('group_id, title, description')
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching groups:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getGroups:', error);
    throw error;
  }
}

// グループに所属するユーザーの取得
export async function getUsersByGroupIds(groupIds: string[]) {
  try {
    const supabase = createClient();

    if (groupIds.length === 0) {
      // グループが選択されていない場合は全ユーザーを取得
      const { data, error } = await supabase
        .from('mst_user')
        .select('user_id, username, email, company_name')
        .is('deleted_at', null)
        .order('username', { ascending: true });

      if (error) {
        console.error('Error fetching all users:', error);
        throw error;
      }

      return data || [];
    }

    // 選択されたグループに所属するユーザーを取得
    const { data, error } = await supabase
      .from('trn_group_user')
      .select(
        `
        user_id,
        mst_user!inner (
          user_id,
          username,
          email,
          company_name
        )
      `,
      )
      .in('group_id', groupIds)
      .is('deleted_at', null);

    if (error) {
      console.error('Error fetching users by groups:', error);
      throw error;
    }

    // 重複を除去してフラット化
    interface GroupUserResponse {
      user_id: string;
      mst_user: {
        user_id: string;
        username: string;
        email: string;
        company_name: string | null;
      };
    }

    const uniqueUsers = Array.from(
      new Map(
        (data as GroupUserResponse[]).map((item) => [
          item.mst_user.user_id,
          {
            user_id: item.mst_user.user_id,
            username: item.mst_user.username,
            email: item.mst_user.email,
            company_name: item.mst_user.company_name,
          },
        ]),
      ).values(),
    );

    return uniqueUsers;
  } catch (error) {
    console.error('Error in getUsersByGroupIds:', error);
    throw error;
  }
}

// 一斉配信履歴の詳細取得
export async function getBroadcastDetail(broadcastId: string) {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('trn_broadcast_history')
      .select(
        `
        *,
        trn_broadcast_target_user (
          user_id,
          is_sent,
          mst_user (
            user_id,
            username,
            email,
            company_name
          )
        )
      `,
      )
      .eq('broadcast_id', broadcastId)
      .is('deleted_at', null)
      .single();

    if (error) {
      console.error('Error fetching broadcast detail:', error);
      throw error;
    }

    interface BroadcastDetailResponse {
      broadcast_id: string;
      is_sent: boolean;
      content: string;
      created_at: string;
      updated_at: string;
      deleted_at: string | null;
      trn_broadcast_target_user?: Array<{
        user_id: string;
        is_sent: boolean;
        mst_user?: {
          user_id: string;
          username: string;
          email: string;
          company_name: string | null;
        };
      }>;
    }

    const detail = data as BroadcastDetailResponse;

    const targetUsers =
      detail.trn_broadcast_target_user?.map((target) => ({
        user_id: target.user_id,
        username: target.mst_user?.username || '',
        email: target.mst_user?.email || '',
        company_name: target.mst_user?.company_name || null,
        is_sent: target.is_sent,
      })) || [];

    const successCount = targetUsers.filter((u) => u.is_sent).length;
    const failureCount = targetUsers.filter((u) => !u.is_sent).length;

    return {
      broadcast_id: detail.broadcast_id,
      is_sent: detail.is_sent,
      content: detail.content,
      created_at: detail.created_at,
      updated_at: detail.updated_at,
      deleted_at: detail.deleted_at,
      target_users: targetUsers,
      success_count: successCount,
      failure_count: failureCount,
    };
  } catch (error) {
    console.error('Error in getBroadcastDetail:', error);
    throw error;
  }
}

// 一斉配信履歴の削除（論理削除）
export async function deleteBroadcast(broadcastId: string) {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from('trn_broadcast_history')
      .update({ deleted_at: new Date().toISOString() })
      .eq('broadcast_id', broadcastId);

    if (error) {
      console.error('Error deleting broadcast:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteBroadcast:', error);
    throw error;
  }
}
