'use client';

import { Pagination } from '@/components/ui/Pagination';
import { exportUsersCSVAction, getUsersAction } from '@/lib/api/user';
import { createClient } from '@/lib/supabase/client';
import { css } from '@/styled-system/css';
import { buildEditPageUrl } from '@/utils/navigation';
import { useRouter, useSearchParams } from 'next/navigation';
import type React from 'react';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { DeleteConfirmModal } from '../ui/DeleteConfirmModal';
import { SearchBar } from './SearchBar';
import { UserCard } from './UserCard';
import { UserListHeader } from './UserListHeader';
import { UserTable } from './UserTable';
import type { UserListItem } from './types';

type UserListClientProps = {
  initialUsers: UserListItem[];
  initialTotalCount: number;
  initialUserTypes: string[];
  initialCanViewPaymentStatus: boolean;
  initialPage: number;
  initialSearchQuery: string;
  initialFilterRole: string;
  initialSortByJoinedDate: 'asc' | 'desc' | null;
};

export const UserListClient = ({
  initialUsers,
  initialTotalCount,
  initialUserTypes,
  initialCanViewPaymentStatus,
  initialPage,
  initialSearchQuery,
  initialFilterRole,
  initialSortByJoinedDate,
}: UserListClientProps) => {
  const router = useRouter();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [users, setUsers] = useState<UserListItem[]>(initialUsers);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [filterRole, setFilterRole] = useState(initialFilterRole);
  const [sortByJoinedDate, setSortByJoinedDate] = useState<
    'asc' | 'desc' | null
  >(initialSortByJoinedDate);
  const [userTypes] = useState<string[]>(initialUserTypes);
  const [canViewPaymentStatus] = useState(initialCanViewPaymentStatus);

  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [itemsPerPage] = useState(50);
  const [sortField, setSortField] = useState<keyof UserListItem>('username');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // モーダル用の状態を追加
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Server Componentから新しいデータを受け取ったら更新
  useEffect(() => {
    setUsers(initialUsers);
    setTotalCount(initialTotalCount);
    setCurrentPage(initialPage);
    setSearchQuery(initialSearchQuery);
    setFilterRole(initialFilterRole);
    setSortByJoinedDate(initialSortByJoinedDate);
  }, [
    initialUsers,
    initialTotalCount,
    initialPage,
    initialSearchQuery,
    initialFilterRole,
    initialSortByJoinedDate,
  ]);

  // データを再取得する関数
  const fetchUsers = async () => {
    startTransition(async () => {
      const result = await getUsersAction({
        page: currentPage,
        itemsPerPage,
        searchQuery,
        filterRole,
        sortByJoinedDate,
      });
      console.log('Fetched users:', result);
      setUsers(result.users);
      setTotalCount(result.totalCount);
    });
  };

  // 検索処理
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    // 検索時はページを1に戻す
    updateQueryParams(1, { search: query });
  };

  // 入会日でのソート処理
  const handleSortByJoinedDate = () => {
    let newSortValue: 'asc' | 'desc' | null = null;
    if (sortByJoinedDate === null) {
      newSortValue = 'asc';
    } else if (sortByJoinedDate === 'asc') {
      newSortValue = 'desc';
    } else {
      newSortValue = null;
    }
    setSortByJoinedDate(newSortValue);
    updateQueryParams(currentPage, { sortByJoined: newSortValue });
  };

  // フィルタ処理
  const handleFilterRole = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFilterRole(value);
    setCurrentPage(1);
    updateQueryParams(1, { filterRole: value });
  };

  // URLクエリパラメータを更新する関数
  const updateQueryParams = (
    page: number,
    additionalParams?: {
      search?: string;
      sortByJoined?: 'asc' | 'desc' | null;
      filterRole?: string;
    },
  ) => {
    setCurrentPage(page);
    const params = new URLSearchParams();

    params.set('page', page.toString());

    // 検索クエリ
    const searchValue =
      additionalParams?.search !== undefined
        ? additionalParams.search
        : searchQuery;
    if (searchValue) {
      params.set('search', searchValue);
    }

    // ソート状態
    const sortValue =
      additionalParams?.sortByJoined !== undefined
        ? additionalParams.sortByJoined
        : sortByJoinedDate;
    if (sortValue) {
      params.set('sortByJoined', sortValue);
    }

    // フィルター状態
    const filterValue =
      additionalParams?.filterRole !== undefined
        ? additionalParams.filterRole
        : filterRole;
    if (filterValue && filterValue !== 'all') {
      params.set('filterRole', filterValue);
    }

    const queryString = params.toString();
    const newUrl = queryString ? `/userlist?${queryString}` : '/userlist';

    startTransition(() => {
      router.push(newUrl);
    });
  };

  // 個別選択の処理
  const handleSelectUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  // 画面サイズの検出
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // 初期チェック
    checkIfMobile();

    // リサイズイベントリスナー
    window.addEventListener('resize', checkIfMobile);

    // クリーンアップ
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // 選択状態が変更されたときに全選択チェックボックスの状態を更新
  useEffect(() => {
    setSelectAll(users.length > 0 && selectedUsers.length === users.length);
  }, [selectedUsers, users]);

  // ページネーション用の計算
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // ページ変更ハンドラー
  const handlePageChange = (page: number) => {
    updateQueryParams(page);
  };

  const handleCreateUser = () => {
    startTransition(() => {
      router.push('/user/create');
    });
  };

  // 編集ページへのリダイレクト
  const handleEdit = (userId: string) => {
    const editUrl = buildEditPageUrl(`/user/edit/${userId}`, searchParams);
    startTransition(() => {
      router.push(editUrl);
    });
  };

  // 削除ボタンのハンドラー
  const handleDelete = (userId: string) => {
    setUserToDelete(userId);
    setIsDeleteModalOpen(true);
  };

  // 削除確認時の処理
  const confirmDelete = async () => {
    if (userToDelete) {
      try {
        // 論理削除を実行（deleted_atに現在の日時を設定）
        const { error } = await supabase
          .from('mst_user')
          .update({ deleted_at: new Date().toISOString() })
          .eq('user_id', userToDelete);

        if (error) throw error;

        // 成功したらデータを再取得
        await fetchUsers();
      } catch (error) {
        console.error('削除に失敗しました:', error);
      } finally {
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
      }
    }
  };

  // 削除キャンセル時の処理
  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  // CSVダウンロード処理
  const handleExportCSV = useCallback(async () => {
    try {
      setIsExporting(true);
      const csvContent = await exportUsersCSVAction({
        searchQuery,
        filterRole,
        sortByJoinedDate,
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      link.href = url;
      link.download = `ユーザー一覧_${dateStr}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('CSVエクスポートに失敗しました:', error);
      alert('CSVエクスポートに失敗しました');
    } finally {
      setIsExporting(false);
    }
  }, [searchQuery, filterRole, sortByJoinedDate]);

  return (
    <>
      {isPending && (
        <div
          className={css({
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bg: 'rgba(0, 0, 0, 0.3)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          })}
        >
          <div
            className={css({
              bg: 'white',
              p: 6,
              rounded: 'lg',
              shadow: 'xl',
            })}
          >
            読み込み中...
          </div>
        </div>
      )}

      {/* ヘッダー部分 */}
      <UserListHeader handleCreateUser={handleCreateUser} />

      {/* 検索・アクション部分 */}
      <SearchBar
        searchQuery={searchQuery}
        filterRole={filterRole}
        sortByJoinedDate={sortByJoinedDate}
        handleSearch={handleSearch}
        handleSortByJoinedDate={handleSortByJoinedDate}
        handleFilterRole={handleFilterRole}
        userTypes={userTypes}
        handleExportCSV={handleExportCSV}
        isExporting={isExporting}
      />

      {/* テーブル部分 - デスクトップ表示 */}
      <UserTable
        currentUsers={users}
        selectedUsers={selectedUsers}
        handleSelectUser={handleSelectUser}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        canViewPaymentStatus={canViewPaymentStatus}
      />

      {/* カード表示 - モバイル表示 */}
      <UserCard
        currentUsers={users}
        selectedUsers={selectedUsers}
        handleSelectUser={handleSelectUser}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        canViewPaymentStatus={canViewPaymentStatus}
      />

      {/* フッター部分 */}
      <div
        className={css({
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          p: { base: '3', md: '4' },
          borderTop: '1px solid',
          borderColor: 'gray.200',
          flexDirection: { base: 'column', md: 'row' },
          gap: { base: '3', md: '0' },
        })}
      >
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        itemName="ユーザー"
        targetName={
          users.find((u) => u.user_id === userToDelete)?.username ?? undefined
        }
      />
    </>
  );
};
