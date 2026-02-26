'use server';

import { createClient } from '@/lib/supabase/server';
import type { MstMeetingLink } from '@/lib/supabase/types';

export const fetchMettingLinks = async (): Promise<MstMeetingLink[]> => {
  console.log('meetingリンク一覧取得開始');
  const supabase = createClient();
  const { data, error } = await supabase
    .from('mst_meeting_link')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('meetingリンク一覧取得エラー:', error);
    return [];
  }

  console.log('meetingリンク一覧取得成功:', data?.length || 0, '件');
  return data || [];
};

export const createMettingLink = async (
  meetingLink: Omit<
    MstMeetingLink,
    'meeting_link_id' | 'created_at' | 'updated_at' | 'deleted_at'
  >,
) => {
  console.log('meetingリンク作成開始:', meetingLink);

  const supabase = createClient();
  console.log('Supabaseクライアント作成完了');

  try {
    const insertData = {
      title: meetingLink.title,
      meeting_link: meetingLink.meeting_link,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };

    const { data, error } = await supabase
      .from('mst_meeting_link')
      .insert([insertData])
      .select();

    if (error) {
      return null;
    }

    console.log('meetingリンク作成成功:', data?.[0]);
    return data?.[0] || null;
  } catch (e) {
    console.error('予期せぬエラー:', e);
    return null;
  }
};

export const updateMettingLink = async (
  id: string,
  meetingLink: Partial<
    Omit<
      MstMeetingLink,
      'meeting_link_id' | 'created_at' | 'updated_at' | 'deleted_at'
    >
  >,
) => {
  const supabase = createClient();
  const updateData = { ...meetingLink, updated_at: new Date().toISOString() };
  console.log('送信データ:', updateData);

  const { data, error } = await supabase
    .from('mst_meeting_link')
    .update(updateData)
    .eq('meeting_link_id', id)
    .select();

  if (error) {
    console.error('meetingリンク更新エラー:', error);
    return null;
  }

  console.log('meetingリンク更新成功 - 結果:', data?.[0]);
  return data?.[0] || null;
};

export const deleteMettingLink = async (id: string) => {
  console.log('meetingリンク削除開始 - ID:', id);
  const supabase = createClient();
  const { error } = await supabase
    .from('mst_meeting_link')
    .update({ deleted_at: new Date().toISOString() })
    .eq('meeting_link_id', id);

  if (error) {
    console.error('meetingリンク削除エラー:', error);
    return false;
  }

  console.log('meetingリンク削除成功');
  return true;
};

export const getMettingLinkById = async (
  id: string,
): Promise<MstMeetingLink | null> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('mst_meeting_link')
    .select('*')
    .eq('meeting_link_id', id)
    .is('deleted_at', null)
    .single();

  if (error) {
    console.error('meetingリンク取得エラー:', error);
    return null;
  }

  console.log('meetingリンク取得成功:', data);
  return data;
};
