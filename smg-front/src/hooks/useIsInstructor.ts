import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

/**
 * ログインユーザーが講師グループに所属しているかチェックするフック
 */
export const useIsInstructor = () => {
  const [isInstructor, setIsInstructor] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkInstructorStatus = async () => {
      try {
        const supabase = createClient();

        // ログインユーザーのIDを取得
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsInstructor(false);
          setLoading(false);
          return;
        }

        // 講師グループのIDを取得
        const { data: groupData, error: groupError } = await supabase
          .from('mst_group')
          .select('group_id')
          .eq('title', '運営')
          .is('deleted_at', null)
          .single();

        if (groupError || !groupData) {
          console.error('講師グループの取得に失敗:', groupError);
          setIsInstructor(false);
          setLoading(false);
          return;
        }

        // ユーザーが講師グループに所属しているかチェック
        const { data: userGroupData, error: userGroupError } = await supabase
          .from('trn_group_user')
          .select('group_id')
          .eq('user_id', user.id)
          .eq('group_id', groupData.group_id)
          .is('deleted_at', null)
          .maybeSingle();

        if (userGroupError) {
          console.error('ユーザーグループの取得に失敗:', userGroupError);
          setIsInstructor(false);
        } else {
          setIsInstructor(!!userGroupData);
        }
      } catch (error) {
        console.error('講師判定エラー:', error);
        setIsInstructor(false);
      } finally {
        setLoading(false);
      }
    };

    checkInstructorStatus();
  }, []);

  return { isInstructor, loading };
};
