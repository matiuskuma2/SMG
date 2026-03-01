'use client';

import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { css } from '@/styled-system/css';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Banner = {
  banner_id: string;
  title: string;
  image_url: string;
  href: string;
  sort_order: number;
  is_active: boolean;
};

export default function BannerListPage() {
  const router = useRouter();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/banners');
      if (res.ok) {
        const data = await res.json();
        setBanners(data.banners || []);
      }
    } catch (error) {
      console.error('バナー一覧取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleEdit = (bannerId: string) => {
    router.push(`/banner/${bannerId}`);
  };

  const handleCreate = () => {
    router.push('/banner/new');
  };

  const handleDeleteClick = (banner: Banner) => {
    setBannerToDelete(banner);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!bannerToDelete) return;
    try {
      const res = await fetch(`/api/banners/${bannerToDelete.banner_id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchBanners();
      } else {
        const data = await res.json();
        alert(data.error || '削除に失敗しました');
      }
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    } finally {
      setIsDeleteModalOpen(false);
      setBannerToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setBannerToDelete(null);
  };

  // 並び替え: 上に移動
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newBanners = [...banners];
    [newBanners[index - 1], newBanners[index]] = [newBanners[index], newBanners[index - 1]];
    newBanners.forEach((banner, i) => {
      banner.sort_order = i + 1;
    });
    setBanners(newBanners);
  };

  // 並び替え: 下に移動
  const handleMoveDown = (index: number) => {
    if (index === banners.length - 1) return;
    const newBanners = [...banners];
    [newBanners[index], newBanners[index + 1]] = [newBanners[index + 1], newBanners[index]];
    newBanners.forEach((banner, i) => {
      banner.sort_order = i + 1;
    });
    setBanners(newBanners);
  };

  // 並び替え保存
  const handleSaveOrder = async () => {
    setIsSavingOrder(true);
    try {
      const res = await fetch('/api/banners/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          banner_orders: banners.map((banner) => ({
            banner_id: banner.banner_id,
            sort_order: banner.sort_order,
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
          バナー管理
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
            + 新規バナー作成
          </button>
        </div>
      </div>

      {/* バナー数カウント */}
      <p className={css({ mb: 4, color: 'gray.600' })}>
        全 {banners.length} 件
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
              <th className={css({ p: 3, textAlign: 'center', w: '200px' })}>プレビュー</th>
              <th className={css({ p: 3, textAlign: 'left' })}>タイトル</th>
              <th className={css({ p: 3, textAlign: 'left' })}>リンク先</th>
              <th className={css({ p: 3, textAlign: 'center', w: '80px' })}>状態</th>
              <th className={css({ p: 3, textAlign: 'center', w: '180px' })}>操作</th>
            </tr>
          </thead>
          <tbody>
            {banners.map((banner, index) => (
              <tr
                key={banner.banner_id}
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
                      {banner.sort_order}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === banners.length - 1}
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
                <td className={css({ p: 3, textAlign: 'center' })}>
                  <div className={css({ position: 'relative', w: '180px', h: '51px', mx: 'auto', overflow: 'hidden', rounded: 'md' })}>
                    {banner.image_url.startsWith('http') ? (
                      <img
                        src={banner.image_url}
                        alt={banner.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <Image
                        src={banner.image_url}
                        alt={banner.title}
                        width={180}
                        height={51}
                        style={{ objectFit: 'cover' }}
                      />
                    )}
                  </div>
                </td>
                <td className={css({ p: 3, fontWeight: 'medium' })}>
                  {banner.title}
                </td>
                <td className={css({ p: 3, fontSize: 'sm', color: 'gray.600' })}>
                  <span className={css({ maxW: '250px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>
                    {banner.href}
                  </span>
                </td>
                <td className={css({ p: 3, textAlign: 'center' })}>
                  <span
                    className={css({
                      px: 2,
                      py: 0.5,
                      rounded: 'full',
                      fontSize: 'xs',
                      bg: banner.is_active ? 'green.100' : 'gray.100',
                      color: banner.is_active ? 'green.700' : 'gray.600',
                    })}
                  >
                    {banner.is_active ? '有効' : '無効'}
                  </span>
                </td>
                <td className={css({ p: 3, textAlign: 'center' })}>
                  <div className={css({ display: 'flex', gap: 2, justifyContent: 'center' })}>
                    <button
                      type="button"
                      onClick={() => handleEdit(banner.banner_id)}
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
                      onClick={() => handleDeleteClick(banner)}
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

        {banners.length === 0 && (
          <div className={css({ p: 8, textAlign: 'center', color: 'gray.500' })}>
            バナーがありません。「新規バナー作成」ボタンから追加してください。
          </div>
        )}
      </div>

      {/* 削除確認モーダル */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        itemName="バナー"
        targetName={bannerToDelete?.title}
      />
    </div>
  );
}
