'use client';

import { ReceiptListCards } from '@/components/receiptlist/ReceiptListCards';
import { ReceiptListHeader } from '@/components/receiptlist/ReceiptListHeader';
import type { ReceiptHistory } from '@/components/receiptlist/ReceiptListTable';
import { ReceiptListTable } from '@/components/receiptlist/ReceiptListTable';
import { Pagination } from '@/components/ui/Pagination';
import { createClient } from '@/lib/supabase/client';
import { css } from '@/styled-system/css';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const ITEMS_PER_PAGE = 10;

export default function ReceiptHistoryPage() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [receipts, setReceipts] = useState<ReceiptHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterSource, setFilterSource] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inputValue, setInputValue] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  // URLパラメータから初期値を取得
  useEffect(() => {
    const searchParam = searchParams.get('search');
    const pageParam = searchParams.get('page');
    if (searchParam) {
      setSearchQuery(searchParam);
      setInputValue(searchParam);
    }
    if (pageParam) {
      setCurrentPage(Number(pageParam));
    }
  }, [searchParams]);

  // データ取得
  const fetchReceipts = useCallback(async () => {
    try {
      setIsLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('trn_receipt_history')
        .select(`
          *,
          mst_user (
            username,
            email,
            icon,
            company_name
          )
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReceipts(data || []);
    } catch (error) {
      console.error('領収書履歴の取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  const handleCreateReceipt = () => {
    router.push('/receipt-issue/create');
  };

  const handleFilterSource = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterSource(e.target.value);
  };

  // 検索入力変更
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // 検索実行
  const executeSearch = () => {
    setSearchQuery(inputValue);
    setCurrentPage(1); // 検索時はページを1にリセット
    // URLパラメータを更新
    const params = new URLSearchParams();
    if (inputValue) {
      params.set('search', inputValue);
    }
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  // ページ変更
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const params = new URLSearchParams();
    if (searchQuery) {
      params.set('search', searchQuery);
    }
    params.set('page', page.toString());
    router.push(`?${params.toString()}`);
  };

  // フィルタリングされた領収書
  const filteredReceipts = receipts.filter((receipt) => {
    // 発行元フィルタ
    let matchesSource = true;
    if (filterSource === 'dashboard') {
      matchesSource = receipt.is_dashboard_issued === true;
    } else if (filterSource === 'member') {
      matchesSource = receipt.is_dashboard_issued === false;
    }

    // 検索フィルタ（発行者氏名、宛名、会社名）
    let matchesSearch = true;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const issuerName = receipt.mst_user?.username?.toLowerCase() || '';
      const recipientName = receipt.name?.toLowerCase() || '';
      const companyName = receipt.mst_user?.company_name?.toLowerCase() || '';
      matchesSearch =
        issuerName.includes(query) ||
        recipientName.includes(query) ||
        companyName.includes(query);
    }

    return matchesSource && matchesSearch;
  });

  // ページネーション計算
  const totalPages = Math.ceil(filteredReceipts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedReceipts = filteredReceipts.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  return (
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
        <ReceiptListHeader
          handleCreateReceipt={handleCreateReceipt}
          filterSource={filterSource}
          handleFilterSource={handleFilterSource}
          searchQuery={inputValue}
          handleInputChange={handleInputChange}
          executeSearch={executeSearch}
        />

        {/* テーブル部分 - デスクトップ表示 */}
        <ReceiptListTable receipts={paginatedReceipts} />

        {/* カード表示 - モバイル表示 */}
        <ReceiptListCards receipts={paginatedReceipts} />

        {/* ページネーション */}
        <div
          className={css({
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            p: { base: '3', xl: '4' },
            borderTop: '1px solid',
            borderColor: 'gray.200',
            flexDirection: { base: 'column', xl: 'row' },
            gap: { base: '3', xl: '0' },
          })}
        >
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
}
