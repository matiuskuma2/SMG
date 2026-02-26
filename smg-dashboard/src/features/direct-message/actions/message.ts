'use server';

import { randomUUID } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import dayjs from 'dayjs';

export const postMessage = async (id: string, content = '') => {
  const client = createClient();
  const createdAt = dayjs().toISOString();
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();

  if (!user || authError)
    throw new Error('failed to get user session', { cause: authError });

  const message = {
    thread_id: id,
    user_id: user.id,
    content,
    is_read: true,
    is_sent: true,
    created_at: createdAt,
    updated_at: createdAt,
  };

  const { data, error } = await client
    .from('trn_dm_message')
    .insert(message)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to insert message: ${error.message}`);
  }

  return data;
};

export const postImage = async (
  image: File,
  {
    messageId,
    createdAt,
    order = 0,
  }: { messageId: string; createdAt: string; order: number },
) => {
  const client = createClient();
  const imageId = randomUUID();
  const extension = image.name.split('.').pop() || 'png';

  // upload image to storage
  const bucket = client.storage.from('dm_image');
  const uploadResult = await bucket.upload(
    `message_image/${imageId}.${extension}`,
    image,
  );

  if (uploadResult.error)
    throw new Error(`Failed to upload image: ${uploadResult.error.message}`);

  const {
    data: { publicUrl },
  } = bucket.getPublicUrl(uploadResult.data.path);

  // register record
  const { data, error } = await client.from('trn_dm_message_image').insert({
    image_id: imageId,
    message_id: messageId,
    image_url: publicUrl,
    display_order: order,
    created_at: createdAt,
    updated_at: createdAt,
  });

  if (error) {
    await bucket.remove([uploadResult.data.fullPath]);
    return false;
  }

  return data;
};

export const postImageMessage = async (id: string, formData: FormData) => {
  const client = createClient();
  const files = formData.getAll('file') as File[];

  // upload message for image signature
  const baseMessagePost = await postMessage(id);
  if (!baseMessagePost) return;

  // register image record
  await Promise.allSettled(
    files.map((file, idx) =>
      postImage(file, {
        messageId: baseMessagePost.message_id,
        createdAt: baseMessagePost.created_at ?? new Date().toISOString(),
        order: idx,
      }),
    ),
  );
};

export const updateReadStatus = async (threadId: string, status: boolean) => {
  const client = createClient();

  // スレッドに紐づいているユーザーIDを取得
  const threadResult = await client
    .from('mst_dm_thread')
    .select('user_id')
    .eq('thread_id', threadId)
    .single();

  if (threadResult.error) return false;
  const threadUserId = threadResult.data.user_id;

  // スレッドのユーザーIDと一致する全てのメッセージを更新
  // 注: スレッドに紐づくユーザーのメッセージのみを対象とし、
  // 他のユーザー(管理者など)からのメッセージは対象外
  const { error } = await client
    .from('trn_dm_message')
    .update({
      is_read: status,
      updated_at: dayjs().toISOString(),
    })
    .eq('thread_id', threadId)
    .eq('user_id', threadUserId);

  if (error) return false;

  // スレッドのis_admin_readフラグも更新
  const { error: threadError } = await client
    .from('mst_dm_thread')
    .update({
      is_admin_read: status,
      updated_at: dayjs().toISOString(),
    })
    .eq('thread_id', threadId);

  if (threadError) return false;

  return true;
};

export const fetchMessages = async (
  threadId: string,
  startIdx = 0,
  count = 20,
) => {
  const client = createClient();
  // TODO: support pagenation
  const { data, error } = await client
    .from('trn_dm_message')
    .select(`
      *,
      images:trn_dm_message_image(*),
      thread_user:thread_id(user_id)
    `)
    .eq('thread_id', threadId)
    .order('created_at', { ascending: false })
    .range(startIdx, startIdx + count - 1);

  if (error) throw error;

  return data.toReversed().map(({ thread_user, ...d }) => ({
    ...d,
    isMe: thread_user.user_id !== d.user_id,
  }));
};

export const fetchImagesByMessage = async (messageId: string) => {
  const client = createClient();
  const { data, error } = await client
    .from('trn_dm_message_image')
    .select()
    .eq('message_id', messageId)
    .order('display_order', { ascending: true });

  return error ? [] : data;
};
