'use client';

import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { css } from '@/styled-system/css';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Tab = {
  tab_id: string;
  display_name: string;
  link_type: string;
  link_value: string;
  display_order: number;
  status: string;
  is_visible_to_all: boolean;
  visible_groups: { id: string; group_id: string; group_title: string }[];
};

const LINK_TYPE_LABELS: Record<string, string> = {
  notice: 'お知らせ',
  shibu: '支部',
  event: 'イベント予約',
  external: '外部URL',
  internal: '内部パス',
};

const STATUS_LABELS: Record<string, string> = {
  public: '公開',
  draft: '下書き',
};

export default function TabListPage() {
  const router = useRouter();
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tabToDelete, setTabToDelete] = useState<Tab | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const fetchTabs = async () => {
    try {
      const res = await fetch('/api/tabs');
      if (res.ok) {
        const data = await res.json();
        setTabs(data.tabs || []);
      }
    } catch (error) {
      console.error('タブ一覧取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTabs();
  }, []);

  const handleEdit = (tabId: string) => {
    router.push(`/tab/${tabId}`);
  };

  const handleCreate = () => {
    router.push('/tab/new');
  };

  const handleDeleteClick = (tab: Tab) => {
    setTabToDelete(tab);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!tabToDelete) return;
    try {
      const res = await fetch(`/api/tabs/${tabToDelete.tab_id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchTabs();
      } else {
        const data = await res.json();
        alert(data.error || '削除に失敗しました');
      }
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    } finally {
      setIsDeleteModalOpen(false);
      setTabToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setTabToDelete(null);
  };

  // 並び替え: 上に移動
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newTabs = [...tabs];
    [newTabs[index - 1], newTabs[index]] = [newTabs[index], newTabs[index - 1]];
    // display_order を再割り当て
    newTabs.forEach((tab, i) => {
      tab.display_order = i + 1;
    });
    setTabs(newTabs);
  };

  // 並び替え: 下に移動
  const handleMoveDown = (index: number) => {
    if (index === tabs.length - 1) return;
    const newTabs = [...tabs];
    [newTabs[index], newTabs[index + 1]] = [newTabs[index + 1], newTabs[index]];
    newTabs.forEach((tab, i) => {
      tab.display_order = i + 1;
    });
    setTabs(newTabs);
  };

  // 並び替え保存
  const handleSaveOrder = async () => {
    setIsSavingOrder(true);
    try {
      const res = await fetch('/api/tabs/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tab_orders: tabs.map((tab) => ({
            tab_id: tab.tab_id,
            display_order: tab.display_order,
          })),
        }),
      });
      if (res.ok) {
        alert('並び替えを保存しました');
      } else {
        const data = await res.json();
        alert(data.error || '保存に失敗しました');
      }
    } catch (error) {
      console.error('並び替え保存エラー:', error);
      alert('保存に失敗しました');
    } finally {
      setIsSavingOrder(false);
    }
  };

  if (isLoading) {
    return (
      <div className={css({ p: 8, textAlign: 'center' })}>
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className={css({ p: 8, maxW: '1200px', mx: 'auto' })}>
      {/* ヘッダー */}
      <div
        className={css({
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 6,
        })}
      >
        <h1 className={css({ fontSize: '2xl', fontWeight: 'bold' })}>
          タブ管理
        </h1>
        <div className={css({ display: 'flex', gap: 3 })}>
          <button
            type="button"
            onClick={handleSaveOrder}
            disabled={isSavingOrder}
            className={css({
              px: 4,
              py: 2,
              rounded: 'md',
              bg: 'green.500',
              color: 'white',
              fontWeight: 'bold',
              _hover: { bg: 'green.600' },
              _disabled: { opacity: 0.5, cursor: 'not-allowed' },
            })}
          >
            {isSavingOrder ? '保存中...' : '並び順を保存'}
          </button>
          <button
            type="button"
            onClick={handleCreate}
            className={css({
              px: 4,
              py: 2,
              rounded: 'md',
              bg: 'blue.500',
              color: 'white',
              fontWeight: 'bold',
              _hover: { bg: 'blue.600' },
            })}
          >
            + 新規タブ作成
          </button>
        </div>
      </div>

      {/* タブ数カウント */}
      <p className={css({ mb: 4, color: 'gray.600' })}>
        全 {tabs.length} 件 / 最大 15 件
      </p>

      {/* テーブル */}
      <div
        className={css({
          bg: 'white',
          rounded: 'lg',
          shadow: 'md',
          overflow: 'hidden',
        })}
      >
        <table className={css({ w: 'full', borderCollapse: 'collapse' })}>
          <thead>
            <tr
              className={css({
                bg: 'gray.50',
                borderBottom: '2px solid',
                borderColor: 'gray.200',
              })}
            >
              <th className={css({ p: 3, textAlign: 'center', w: '80px' })}>順序</th>
              <th className={css({ p: 3, textAlign: 'left' })}>表示名</th>
              <th className={css({ p: 3, textAlign: 'left' })}>リンク種別</th>
              <th className={css({ p: 3, textAlign: 'left' })}>リンク先</th>
              <th className={css({ p: 3, textAlign: 'center', w: '80px' })}>状態</th>
              <th className={css({ p: 3, textAlign: 'left' })}>権限</th>
              <th className={css({ p: 3, textAlign: 'center', w: '180px' })}>操作</th>
            </tr>
          </thead>
          <tbody>
            {tabs.map((tab, index) => (
              <tr
                key={tab.tab_id}
                className={css({
                  borderBottom: '1px solid',
                  borderColor: 'gray.100',
                  _hover: { bg: 'gray.50' },
                })}
              >
                <td className={css({ p: 3, textAlign: 'center' })}>
                  <div className={css({ display: 'flex', flexDir: 'column', alignItems: 'center', gap: 1 })}>
                    <button
                      type="button"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className={css({
                        fontSize: 'xs',
                        cursor: 'pointer',
                        _disabled: { opacity: 0.3, cursor: 'not-allowed' },
                      })}
                    >
                      ▲
                    </button>
                    <span className={css({ fontSize: 'sm', fontWeight: 'bold' })}>
                      {tab.display_order}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === tabs.length - 1}
                      className={css({
                        fontSize: 'xs',
                        cursor: 'pointer',
                        _disabled: { opacity: 0.3, cursor: 'not-allowed' },
                      })}
                    >
                      ▼
                    </button>
                  </div>
                </td>
                <td className={css({ p: 3, fontWeight: 'medium' })}>
                  {tab.display_name}
                </td>
                <td className={css({ p: 3 })}>
                  <span
                    className={css({
                      px: 2,
                      py: 0.5,
                      rounded: 'full',
                      fontSize: 'xs',
                      bg: tab.link_type === 'external' ? 'purple.100' : 'blue.100',
                      color: tab.link_type === 'external' ? 'purple.700' : 'blue.700',
                    })}
                  >
                    {LINK_TYPE_LABELS[tab.link_type] || tab.link_type}
                  </span>
                </td>
                <td className={css({ p: 3, fontSize: 'sm', color: 'gray.600' })}>
                  <span className={css({ maxW: '200px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>
                    {tab.link_value}
                  </span>
                </td>
                <td className={css({ p: 3, textAlign: 'center' })}>
                  <span
                    className={css({
                      px: 2,
                      py: 0.5,
                      rounded: 'full',
                      fontSize: 'xs',
                      bg: tab.status === 'public' ? 'green.100' : 'gray.100',
                      color: tab.status === 'public' ? 'green.700' : 'gray.600',
                    })}
                  >
                    {STATUS_LABELS[tab.status] || tab.status}
                  </span>
                </td>
                <td className={css({ p: 3, fontSize: 'sm' })}>
                  {tab.is_visible_to_all ? (
                    <span className={css({ color: 'gray.600' })}>全員</span>
                  ) : (
                    <span className={css({ color: 'orange.600' })}>
                      {tab.visible_groups.map((g) => g.group_title).join(', ') || '未設定'}
                    </span>
                  )}
                </td>
                <td className={css({ p: 3, textAlign: 'center' })}>
                  <div className={css({ display: 'flex', gap: 2, justifyContent: 'center' })}>
                    <button
                      type="button"
                      onClick={() => handleEdit(tab.tab_id)}
                      className={css({
                        px: 3,
                        py: 1,
                        rounded: 'md',
                        bg: 'blue.500',
                        color: 'white',
                        fontSize: 'sm',
                        _hover: { bg: 'blue.600' },
                      })}
                    >
                      編集
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(tab)}
                      className={css({
                        px: 3,
                        py: 1,
                        rounded: 'md',
                        bg: 'red.500',
                        color: 'white',
                        fontSize: 'sm',
                        _hover: { bg: 'red.600' },
                      })}
                    >
                      削除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {tabs.length === 0 && (
          <div className={css({ p: 8, textAlign: 'center', color: 'gray.500' })}>
            タブがありません。「新規タブ作成」ボタンから追加してください。
          </div>
        )}
      </div>

      {/* 削除確認モーダル */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        itemName="タブ"
        targetName={tabToDelete?.display_name}
      />
    </div>
  );
}
