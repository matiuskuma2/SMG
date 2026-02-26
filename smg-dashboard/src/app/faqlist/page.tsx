'use client';

import { FaqListCards } from '@/components/faqlist/FaqListCards';
import { FaqListHeader } from '@/components/faqlist/FaqListHeader';
import { FaqListTable } from '@/components/faqlist/FaqListTable';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { deleteFaq, getFaqsClient } from '@/lib/api/faq';
import { css } from '@/styled-system/css';
import type { Faq } from '@/types/faq';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useEffect, useState } from 'react';

export default function FaqListPage() {
  const router = useRouter();

  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // モーダル用の状態を追加
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState<string | null>(null);

  // FAQデータを取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getFaqsClient();
        setFaqs(data);
      } catch (error) {
        console.error('Error fetching FAQs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // 編集ページへのリダイレクト
  const handleEdit = (faqId: string) => {
    router.push(`/faq/${faqId}`);
  };

  // 新規作成ページへのリダイレクト
  const handleCreateFaq = () => {
    router.push('/faq/new');
  };

  // 削除処理
  const handleDeleteClick = (faqId: string) => {
    setFaqToDelete(faqId);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!faqToDelete) return;

    try {
      await deleteFaq(faqToDelete);
      // 削除後、データを再取得
      const data = await getFaqsClient();
      setFaqs(data);
    } catch (error) {
      console.error('Error deleting FAQ:', error);
    } finally {
      setIsDeleteModalOpen(false);
      setFaqToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setFaqToDelete(null);
  };

  if (isLoading) {
    return (
      <div
        className={css({
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minH: '400px',
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
          {/* ヘッダー部分 */}
          <FaqListHeader handleCreateFaq={handleCreateFaq} />

          {/* テーブル表示 */}
          <FaqListTable
            faqs={faqs}
            handleEdit={handleEdit}
            handleDelete={handleDeleteClick}
          />

          {/* カード表示 */}
          <FaqListCards
            faqs={faqs}
            handleEdit={handleEdit}
            handleDelete={handleDeleteClick}
          />
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        itemName="FAQ"
        targetName={faqs.find((f) => f.faq_id === faqToDelete)?.title}
      />
    </>
  );
}
