'use client';

import { BroadcastHistoryCards } from '@/components/broadcast/BroadcastHistoryCards';
import { BroadcastHistoryHeader } from '@/components/broadcast/BroadcastHistoryHeader';
import { BroadcastHistoryTable } from '@/components/broadcast/BroadcastHistoryTable';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { deleteBroadcast, getBroadcastHistory } from '@/lib/api/broadcast';
import { css } from '@/styled-system/css';
import type { BroadcastHistoryWithTargets } from '@/types/broadcast';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function BroadcastHistoryPage() {
  const router = useRouter();
  const [broadcasts, setBroadcasts] = useState<BroadcastHistoryWithTargets[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [broadcastToDelete, setBroadcastToDelete] = useState<string | null>(
    null,
  );

  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getBroadcastHistory();
        setBroadcasts(data);
      } catch (error) {
        console.error('配信履歴の取得エラー:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // 新規配信ページへ遷移
  const handleCreateBroadcast = () => {
    router.push('/broadcast');
  };

  // 削除ボタンハンドラー
  const handleDelete = (broadcastId: string) => {
    setBroadcastToDelete(broadcastId);
    setIsDeleteModalOpen(true);
  };

  // 削除確認
  const confirmDelete = async () => {
    if (broadcastToDelete) {
      try {
        await deleteBroadcast(broadcastToDelete);
        setBroadcasts(
          broadcasts.filter((b) => b.broadcast_id !== broadcastToDelete),
        );
        setIsDeleteModalOpen(false);
        setBroadcastToDelete(null);
      } catch (error) {
        console.error('削除エラー:', error);
        alert('削除に失敗しました');
      }
    }
  };

  // 削除キャンセル
  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setBroadcastToDelete(null);
  };

  if (isLoading) {
    return (
      <div
        className={css({
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minH: 'calc(100vh - 64px)',
        })}
      >
        読み込み中...
      </div>
    );
  }

  return (
    <>
      <div
        className={css({
          p: { base: '2', xl: '8' },
          pt: { base: '4', xl: '20' },
          minH: 'calc(100vh - 64px)',
        })}
      >
        <div
          className={css({
            bg: 'white',
            rounded: 'lg',
            shadow: 'sm',
            overflow: 'hidden',
          })}
        >
          <BroadcastHistoryHeader
            handleCreateBroadcast={handleCreateBroadcast}
          />
          <BroadcastHistoryTable
            broadcasts={broadcasts}
            onDelete={handleDelete}
          />
          <BroadcastHistoryCards
            broadcasts={broadcasts}
            onDelete={handleDelete}
          />
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        itemName="配信履歴"
        targetName={broadcasts
          .find((b) => b.broadcast_id === broadcastToDelete)
          ?.content?.slice(0, 30)}
      />
    </>
  );
}
