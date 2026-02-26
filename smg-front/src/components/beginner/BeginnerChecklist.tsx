import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { css } from '@/styled-system/css';
import { GuideItemType, GuideVideoType, GuideFileType } from './types';
import { ChecklistItem } from './ChecklistItem';
import { ChecklistFilter } from './ChecklistFilter';
import { ChecklistHeader } from './ChecklistHeader';
import { createClient } from '@/lib/supabase';

export const BeginnerChecklist: React.FC = () => {
  const searchParams = useSearchParams();
  const itemParam = searchParams.get('item');

  // チェックリストのデータ
  const [guideItems, setGuideItems] = useState<GuideItemType[]>([]);
  const [guideVideos, setGuideVideos] = useState<Record<string, GuideVideoType[]>>({});
  const [guideFiles, setGuideFiles] = useState<Record<string, GuideFileType[]>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // フィルター状態
  const [showUncompletedOnly, setShowUncompletedOnly] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // アコーディオンの開閉状態
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  // データの取得
  useEffect(() => {
    const fetchGuideData = async () => {
      try {
        setIsLoading(true);
        const supabase = createClient();
        
        // ログイン中のユーザー情報を取得
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.error('ユーザーがログインしていません');
          setIsLoading(false);
          return;
        }
        
        // ガイド項目を取得
        const { data: items, error: itemsError } = await supabase
          .from('mst_beginner_guide_item')
          .select('*')
          .is('deleted_at', null)
          .eq('is_draft', false)
          .order('created_at', { ascending: true });
          
        if (itemsError) {
          console.error('ガイド項目の取得に失敗しました:', itemsError);
          setIsLoading(false);
          return;
        }
        
        // ユーザーの進捗状況を取得
        const { data: progress, error: progressError } = await supabase
          .from('trn_user_guide_progress')
          .select('*')
          .eq('user_id', user.id)
          .is('deleted_at', null);
          
        if (progressError) {
          console.error('進捗状況の取得に失敗しました:', progressError);
        }
        
        // 進捗状況をガイド項目にマージ
        const progressMap: Record<string, boolean> = {};
        if (progress) {
          progress.forEach(p => {
            if (p.guide_item_id && p.is_completed !== null) {
              progressMap[p.guide_item_id] = p.is_completed;
            }
          });
        }
        
        const itemsWithProgress = items.map(item => ({
          ...item,
          is_completed: progressMap[item.guide_item_id] || false
        }));
        
        setGuideItems(itemsWithProgress);
        
        // ガイド動画の取得
        const { data: videos, error: videosError } = await supabase
          .from('mst_beginner_guide_video')
          .select('*')
          .is('deleted_at', null);
          
        if (videosError) {
          console.error('ガイド動画の取得に失敗しました:', videosError);
        } else if (videos) {
          const videosByGuideItem: Record<string, GuideVideoType[]> = {};
          videos.forEach(video => {
            if (video.guide_item_id) {
              if (!videosByGuideItem[video.guide_item_id]) {
                videosByGuideItem[video.guide_item_id] = [];
              }
              videosByGuideItem[video.guide_item_id].push(video);
            }
          });
          setGuideVideos(videosByGuideItem);
        }
        
        // ガイドファイルの取得
        const { data: files, error: filesError } = await supabase
          .from('mst_beginner_guide_file')
          .select('*')
          .is('deleted_at', null);
          
        if (filesError) {
          console.error('ガイドファイルの取得に失敗しました:', filesError);
        } else if (files) {
          const filesByGuideItem: Record<string, GuideFileType[]> = {};
          files.forEach(file => {
            if (file.guide_item_id) {
              if (!filesByGuideItem[file.guide_item_id]) {
                filesByGuideItem[file.guide_item_id] = [];
              }
              filesByGuideItem[file.guide_item_id].push(file);
            }
          });
          setGuideFiles(filesByGuideItem);
        }
      } catch (error) {
        console.error('データの取得中にエラーが発生しました:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGuideData();
  }, []);

  // URLパラメータで指定された項目を開く
  useEffect(() => {
    if (itemParam && guideItems.length > 0) {
      const targetItem = guideItems.find(item => item.guide_item_id === itemParam);
      if (targetItem) {
        setOpenItems(prev => ({ ...prev, [itemParam]: true }));
      }
    }
  }, [itemParam, guideItems]);

  // チェックボックスの状態変更（楽観的更新）
  const handleCheckboxChange = async (guideItemId: string) => {
    // 現在の項目を探す
    const currentItem = guideItems.find(item => item.guide_item_id === guideItemId);
    if (!currentItem) return;
    
    const newCompletedState = !currentItem.is_completed;
    const previousState = currentItem.is_completed;
    
    // 1. 先にUIを更新（楽観的更新）
    setGuideItems(prev => 
      prev.map(item => 
        item.guide_item_id === guideItemId ? { ...item, is_completed: newCompletedState } : item
      )
    );
    
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('ユーザーがログインしていません');
        // エラーの場合、元の状態に戻す
        setGuideItems(prev => 
          prev.map(item => 
            item.guide_item_id === guideItemId ? { ...item, is_completed: previousState } : item
          )
        );
        return;
      }
      
      // 2. 既存データを確認して更新または作成
      const { data: existingProgress, error: checkError } = await supabase
        .from('trn_user_guide_progress')
        .select('progress_id')
        .eq('user_id', user.id)
        .eq('guide_item_id', guideItemId)
        .is('deleted_at', null)
        .maybeSingle();
        
      let upsertError = null;
      
      if (checkError) {
        upsertError = checkError;
      } else if (existingProgress) {
        // 既存の進捗を更新
        const { error: updateError } = await supabase
          .from('trn_user_guide_progress')
          .update({ 
            is_completed: newCompletedState, 
            updated_at: new Date().toISOString() 
          })
          .eq('progress_id', existingProgress.progress_id);
        upsertError = updateError;
      } else {
        // 新しい進捗を作成
        const { error: insertError } = await supabase
          .from('trn_user_guide_progress')
          .insert({
            user_id: user.id,
            guide_item_id: guideItemId,
            is_completed: newCompletedState,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        upsertError = insertError;
      }
        
      if (upsertError) {
        console.error('進捗状況の更新に失敗しました:', upsertError);
        // エラーの場合、元の状態に戻す
        setGuideItems(prev => 
          prev.map(item => 
            item.guide_item_id === guideItemId ? { ...item, is_completed: previousState } : item
          )
        );
        return;
      }
      
    } catch (error) {
      console.error('チェックボックスの更新中にエラーが発生しました:', error);
      // エラーの場合、元の状態に戻す
      setGuideItems(prev => 
        prev.map(item => 
          item.guide_item_id === guideItemId ? { ...item, is_completed: previousState } : item
        )
      );
    }
  };

  // アコーディオンの開閉
  const toggleAccordion = (id: string) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // フィルタリングされたアイテム
  const filteredItems = guideItems.filter(item => {
    if (showUncompletedOnly && item.is_completed) return false;
    if (showFavoritesOnly) {
      return false;
    }
    return true;
  });

  if (isLoading) {
    return <div className={css({ p: 6, textAlign: 'center' })}>読み込み中...</div>;
  }

  return (
    <div className={css({ 
      bg: 'white',
      borderRadius: 'lg',
      boxShadow: 'md',
      p: 6,
      mb: 6 
    })}>
      <ChecklistFilter
        showUncompletedOnly={showUncompletedOnly}
        setShowUncompletedOnly={setShowUncompletedOnly}
        showFavoritesOnly={showFavoritesOnly}
        setShowFavoritesOnly={setShowFavoritesOnly}
      />

      <ChecklistHeader />

      <div>
        {filteredItems.map(item => (
          <ChecklistItem
            key={item.guide_item_id}
            item={item}
            videos={guideVideos[item.guide_item_id] || []}
            files={guideFiles[item.guide_item_id] || []}
            isOpen={!!openItems[item.guide_item_id]}
            toggleAccordion={toggleAccordion}
            handleCheckboxChange={handleCheckboxChange}
          />
        ))}
      </div>        
    </div>
  );
}; 