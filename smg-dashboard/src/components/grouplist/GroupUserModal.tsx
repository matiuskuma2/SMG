import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { css } from '@/styled-system/css';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from '../userlist/types';
import type { Group } from './types';

interface AddUserToGroupModalProps {
  open: boolean;
  onClose: () => void;
  users: User[];
  onSubmit: (selectedUserIds: string[]) => void;
  currentGroupId: string | null;
  currentGroups: Group[];
}

type TabType = 'individual' | 'bulk';

export const AddUserToGroupModal: React.FC<AddUserToGroupModalProps> = ({
  open,
  onClose,
  users,
  onSubmit,
  currentGroupId,
  currentGroups,
}) => {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentGroupName, setCurrentGroupName] = useState<string>('');
  const [existingUserIds, setExistingUserIds] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'member' | 'non-member'>(
    'member',
  );
  const [activeTab, setActiveTab] = useState<TabType>('individual');

  // 一括追加用の状態
  const [bulkInput, setBulkInput] = useState('');
  const [bulkMatchedUsers, setBulkMatchedUsers] = useState<User[]>([]);
  const [bulkNotFound, setBulkNotFound] = useState<string[]>([]);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);
  const [hasBulkSearched, setHasBulkSearched] = useState(false);
  const [bulkIsProcessing, setBulkIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 現在のグループ名とメンバーを取得
  useEffect(() => {
    if (currentGroupId && currentGroups) {
      const group = currentGroups.find((g) => g.group_id === currentGroupId);
      if (group) {
        setCurrentGroupName(group.title);
        const groupUserIds = group.users?.map((user) => user.user_id) ?? [];
        setExistingUserIds(groupUserIds);
      }
    }
  }, [currentGroupId, currentGroups]);

  // モーダルが開かれたときに選択を初期化(既存のユーザーを選択状態に)
  useEffect(() => {
    if (open) {
      setSelectedUserIds([...existingUserIds]);
      setSearchTerm('');
      setFilterType('member');
      setActiveTab('individual');
      // 一括追加の状態もリセット
      setBulkInput('');
      setBulkMatchedUsers([]);
      setBulkNotFound([]);
      setBulkSelectedIds([]);
      setHasBulkSearched(false);
    } else {
      setSelectedUserIds([]);
      setFilterType('member');
    }
  }, [open, existingUserIds]);

  // === 個別検索タブのロジック（既存） ===
  const filteredUsers = useMemo(() => {
    let filtered = users.filter(
      (user) =>
        (user.username?.toLowerCase() ?? '').includes(
          searchTerm.toLowerCase(),
        ) ||
        (user.email?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()),
    );

    if (filterType === 'member') {
      filtered = filtered.filter((user) =>
        existingUserIds.includes(user.user_id),
      );
    } else if (filterType === 'non-member') {
      filtered = filtered.filter(
        (user) => !existingUserIds.includes(user.user_id),
      );
    }

    return filtered;
  }, [users, searchTerm, filterType, existingUserIds]);

  const toggleSelect = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const hasChanges = useMemo(() => {
    if (existingUserIds.length !== selectedUserIds.length) return true;
    return (
      !selectedUserIds.every((id) => existingUserIds.includes(id)) ||
      !existingUserIds.every((id) => selectedUserIds.includes(id))
    );
  }, [selectedUserIds, existingUserIds]);

  // === 一括追加タブのロジック ===

  // 入力テキストをパースしてユーザー名/メールの配列に変換
  const parseInput = useCallback((text: string): string[] => {
    // カンマ、改行、タブ、セミコロンで分割
    return text
      .split(/[,\n\t;]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }, []);

  // 一括検索実行
  const handleBulkSearch = useCallback(() => {
    const terms = parseInput(bulkInput);
    if (terms.length === 0) return;

    const matched: User[] = [];
    const notFound: string[] = [];
    const matchedIds = new Set<string>();

    for (const term of terms) {
      const lowerTerm = term.toLowerCase();
      const found = users.find(
        (u) =>
          u.email?.toLowerCase() === lowerTerm ||
          u.username?.toLowerCase() === lowerTerm,
      );

      if (found && !matchedIds.has(found.user_id)) {
        matched.push(found);
        matchedIds.add(found.user_id);
      } else if (!found) {
        notFound.push(term);
      }
    }

    setBulkMatchedUsers(matched);
    setBulkNotFound(notFound);
    // 新規ユーザー（既存メンバーでない）のみをデフォルトで選択
    setBulkSelectedIds(
      matched
        .filter((u) => !existingUserIds.includes(u.user_id))
        .map((u) => u.user_id),
    );
    setHasBulkSearched(true);
  }, [bulkInput, users, existingUserIds, parseInput]);

  // CSVファイル読み込み
  const handleCsvUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (!text) return;

        // CSVをパース（ヘッダ行をスキップする可能性を考慮）
        const lines = text.split('\n').filter((line) => line.trim().length > 0);
        const extracted: string[] = [];

        for (const line of lines) {
          const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
          // 各列からメールアドレスまたは名前を抽出
          for (const col of cols) {
            if (col && col.length > 0) {
              // ヘッダー行をスキップ（一般的なヘッダー名を除外）
              const headerKeywords = [
                '名前', 'name', 'メール', 'email', 'mail',
                'ユーザー', 'user', '氏名', 'アドレス', 'address',
              ];
              if (!headerKeywords.some((h) => col.toLowerCase() === h.toLowerCase())) {
                extracted.push(col);
              }
            }
          }
        }

        setBulkInput(extracted.join('\n'));
      };
      reader.readAsText(file);

      // ファイル入力をリセット（同じファイルを再選択可能に）
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [],
  );

  // 一括追加の選択トグル
  const toggleBulkSelect = (userId: string) => {
    setBulkSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  // 一括の全選択/全解除
  const toggleBulkSelectAll = () => {
    const newUsers = bulkMatchedUsers.filter(
      (u) => !existingUserIds.includes(u.user_id),
    );
    if (bulkSelectedIds.length === newUsers.length) {
      setBulkSelectedIds([]);
    } else {
      setBulkSelectedIds(newUsers.map((u) => u.user_id));
    }
  };

  // 一括追加を実行
  const handleBulkAdd = useCallback(() => {
    if (bulkSelectedIds.length === 0) return;
    setBulkIsProcessing(true);

    // 既存メンバー + 一括選択を合成してonSubmitに渡す
    const mergedIds = Array.from(
      new Set([...existingUserIds, ...bulkSelectedIds]),
    );
    onSubmit(mergedIds);
    setBulkIsProcessing(false);
  }, [bulkSelectedIds, existingUserIds, onSubmit]);

  // 一括追加で新規追加可能なユーザー数
  const newBulkUsersCount = bulkMatchedUsers.filter(
    (u) => !existingUserIds.includes(u.user_id),
  ).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        onClick={(e) => e.stopPropagation()}
        className={css({
          w: '90vw',
          maxW: '700px',
          maxH: '85vh',
          overflowY: 'auto',
        })}
      >
        <DialogHeader>
          <DialogTitle>
            {currentGroupName
              ? `「${currentGroupName}」のメンバー管理`
              : 'グループメンバーの管理'}
          </DialogTitle>
        </DialogHeader>

        {/* タブ切り替え */}
        <div
          className={css({
            display: 'flex',
            borderBottom: '2px solid',
            borderColor: 'gray.200',
            mb: 3,
          })}
        >
          <button
            type="button"
            onClick={() => setActiveTab('individual')}
            className={css({
              flex: 1,
              py: 2,
              fontSize: 'sm',
              fontWeight: activeTab === 'individual' ? 'bold' : 'normal',
              color: activeTab === 'individual' ? 'blue.600' : 'gray.500',
              borderBottom: '2px solid',
              borderColor:
                activeTab === 'individual' ? 'blue.600' : 'transparent',
              mb: '-2px',
              cursor: 'pointer',
              bg: 'transparent',
              transition: 'all 0.15s',
              _hover: { color: 'blue.500' },
            })}
          >
            個別管理
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bulk')}
            className={css({
              flex: 1,
              py: 2,
              fontSize: 'sm',
              fontWeight: activeTab === 'bulk' ? 'bold' : 'normal',
              color: activeTab === 'bulk' ? 'blue.600' : 'gray.500',
              borderBottom: '2px solid',
              borderColor:
                activeTab === 'bulk' ? 'blue.600' : 'transparent',
              mb: '-2px',
              cursor: 'pointer',
              bg: 'transparent',
              transition: 'all 0.15s',
              _hover: { color: 'blue.500' },
            })}
          >
            一括追加
          </button>
        </div>

        {/* === 個別管理タブ（既存機能） === */}
        {activeTab === 'individual' && (
          <>
            <div className={css({ mb: '4', display: 'flex', gap: '2' })}>
              <Input
                placeholder="名前やメールアドレスで検索"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={css({ flex: '1' })}
              />
              <select
                value={filterType}
                onChange={(e) =>
                  setFilterType(
                    e.target.value as 'all' | 'member' | 'non-member',
                  )
                }
                className={css({
                  w: '180px',
                  px: 3,
                  py: 2,
                  borderRadius: 'md',
                  border: '1px solid',
                  borderColor: 'gray.300',
                  bg: 'white',
                  outline: 'none',
                  _focus: { borderColor: 'blue.500' },
                })}
              >
                <option value="all">全て表示</option>
                <option value="member">所属メンバー</option>
                <option value="non-member">未所属メンバー</option>
              </select>
            </div>

            {filteredUsers.length === 0 ? (
              <div
                className={css({
                  textAlign: 'center',
                  py: '4',
                  color: 'gray.500',
                })}
              >
                ユーザーが見つかりません
              </div>
            ) : (
              <ul
                className={css({
                  listStyle: 'none',
                  p: '0',
                  m: '0',
                  maxH: '300px',
                  overflowY: 'auto',
                })}
              >
                {filteredUsers.map((user) => (
                  <li
                    key={user.user_id}
                    className={css({
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: '2',
                      borderBottom: '1px solid',
                      borderColor: 'gray.200',
                      bg: 'transparent',
                    })}
                  >
                    <div
                      className={css({
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3',
                      })}
                    >
                      <Checkbox
                        checked={selectedUserIds.includes(user.user_id)}
                        onChange={() => toggleSelect(user.user_id)}
                      />
                      <span>{user.username}</span>
                    </div>
                    <span
                      className={css({ color: 'gray.500', fontSize: 'sm' })}
                    >
                      {user.email}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <DialogFooter>
              <div
                className={css({
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 3,
                  flexWrap: 'nowrap',
                  justifyContent: 'center',
                })}
              >
                <Button
                  type="button"
                  onClick={onClose}
                  className={css({
                    bg: 'gray.100',
                    color: 'gray.800',
                    _hover: { bg: 'gray.200' },
                    px: 5,
                    py: 2,
                    borderRadius: 'md',
                    fontWeight: 'medium',
                  })}
                >
                  キャンセル
                </Button>

                <Button
                  type="button"
                  onClick={() => onSubmit(selectedUserIds)}
                  className={css({
                    bg: 'blue.600',
                    color: 'white',
                    _hover: { bg: 'blue.700' },
                    px: 5,
                    py: 2,
                    borderRadius: 'md',
                    fontWeight: 'medium',
                  })}
                  disabled={!hasChanges}
                >
                  更新
                </Button>
              </div>
            </DialogFooter>
          </>
        )}

        {/* === 一括追加タブ === */}
        {activeTab === 'bulk' && (
          <>
            <div className={css({ mb: 3 })}>
              <p
                className={css({
                  fontSize: 'sm',
                  color: 'gray.600',
                  mb: 2,
                })}
              >
                ユーザー名またはメールアドレスをカンマ区切り・改行区切りで入力するか、CSVファイルをアップロードしてください。
              </p>

              <div className={css({ display: 'flex', gap: 2, mb: 2 })}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={css({
                    px: 3,
                    py: 1.5,
                    fontSize: 'sm',
                    border: '1px solid',
                    borderColor: 'gray.300',
                    borderRadius: 'md',
                    bg: 'white',
                    cursor: 'pointer',
                    _hover: { bg: 'gray.50' },
                    whiteSpace: 'nowrap',
                  })}
                >
                  CSVアップロード
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleCsvUpload}
                  className={css({ display: 'none' })}
                />
              </div>

              <textarea
                value={bulkInput}
                onChange={(e) => {
                  setBulkInput(e.target.value);
                  setHasBulkSearched(false);
                }}
                placeholder={
                  '例:\n田中太郎, 佐藤花子, 山田一郎\nまたは\ntanaka@example.com\nsato@example.com'
                }
                className={css({
                  w: 'full',
                  h: '120px',
                  p: 3,
                  border: '1px solid',
                  borderColor: 'gray.300',
                  borderRadius: 'md',
                  fontSize: 'sm',
                  resize: 'vertical',
                  outline: 'none',
                  _focus: { borderColor: 'blue.500' },
                })}
              />

              <Button
                type="button"
                onClick={handleBulkSearch}
                disabled={bulkInput.trim().length === 0}
                className={css({
                  mt: 2,
                  bg: 'blue.600',
                  color: 'white',
                  _hover: { bg: 'blue.700' },
                  _disabled: { opacity: 0.5, cursor: 'not-allowed' },
                  px: 4,
                  py: 2,
                  borderRadius: 'md',
                  fontSize: 'sm',
                  w: 'full',
                })}
              >
                検索
              </Button>
            </div>

            {/* 検索結果 */}
            {hasBulkSearched && (
              <div>
                {/* サマリー */}
                <div
                  className={css({
                    display: 'flex',
                    gap: 3,
                    mb: 2,
                    fontSize: 'sm',
                    flexWrap: 'wrap',
                  })}
                >
                  <span className={css({ color: 'gray.600' })}>
                    検索結果: {bulkMatchedUsers.length}件ヒット
                  </span>
                  {newBulkUsersCount > 0 && (
                    <span className={css({ color: 'blue.600' })}>
                      新規追加可能: {newBulkUsersCount}件
                    </span>
                  )}
                  {bulkNotFound.length > 0 && (
                    <span className={css({ color: 'red.500' })}>
                      見つからない: {bulkNotFound.length}件
                    </span>
                  )}
                </div>

                {/* 見つからなかったユーザー */}
                {bulkNotFound.length > 0 && (
                  <div
                    className={css({
                      mb: 3,
                      p: 2,
                      bg: 'red.50',
                      borderRadius: 'md',
                      border: '1px solid',
                      borderColor: 'red.200',
                    })}
                  >
                    <p
                      className={css({
                        fontSize: 'xs',
                        fontWeight: 'bold',
                        color: 'red.600',
                        mb: 1,
                      })}
                    >
                      以下のユーザーは見つかりませんでした:
                    </p>
                    <p
                      className={css({
                        fontSize: 'xs',
                        color: 'red.500',
                        wordBreak: 'break-all',
                      })}
                    >
                      {bulkNotFound.join(', ')}
                    </p>
                  </div>
                )}

                {/* マッチしたユーザー一覧 */}
                {bulkMatchedUsers.length > 0 && (
                  <>
                    {/* 全選択/全解除 */}
                    {newBulkUsersCount > 0 && (
                      <div className={css({ mb: 2 })}>
                        <button
                          type="button"
                          onClick={toggleBulkSelectAll}
                          className={css({
                            fontSize: 'xs',
                            color: 'blue.600',
                            bg: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            _hover: { color: 'blue.800' },
                          })}
                        >
                          {bulkSelectedIds.length === newBulkUsersCount
                            ? '全解除'
                            : '新規ユーザーを全選択'}
                        </button>
                      </div>
                    )}

                    <ul
                      className={css({
                        listStyle: 'none',
                        p: 0,
                        m: 0,
                        maxH: '250px',
                        overflowY: 'auto',
                      })}
                    >
                      {bulkMatchedUsers.map((user) => {
                        const isExisting = existingUserIds.includes(
                          user.user_id,
                        );
                        return (
                          <li
                            key={user.user_id}
                            className={css({
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              py: 2,
                              px: 1,
                              borderBottom: '1px solid',
                              borderColor: 'gray.200',
                              bg: isExisting ? 'gray.50' : 'transparent',
                            })}
                          >
                            <div
                              className={css({
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3,
                              })}
                            >
                              {isExisting ? (
                                <span
                                  className={css({
                                    fontSize: 'xs',
                                    color: 'green.600',
                                    bg: 'green.50',
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: 'sm',
                                    whiteSpace: 'nowrap',
                                  })}
                                >
                                  登録済
                                </span>
                              ) : (
                                <Checkbox
                                  checked={bulkSelectedIds.includes(
                                    user.user_id,
                                  )}
                                  onChange={() =>
                                    toggleBulkSelect(user.user_id)
                                  }
                                />
                              )}
                              <span
                                className={css({
                                  fontSize: 'sm',
                                  color: isExisting ? 'gray.500' : 'gray.800',
                                })}
                              >
                                {user.username}
                              </span>
                            </div>
                            <span
                              className={css({
                                color: 'gray.400',
                                fontSize: 'xs',
                              })}
                            >
                              {user.email}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
              </div>
            )}

            <DialogFooter>
              <div
                className={css({
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 3,
                  flexWrap: 'nowrap',
                  justifyContent: 'center',
                  mt: 2,
                })}
              >
                <Button
                  type="button"
                  onClick={onClose}
                  className={css({
                    bg: 'gray.100',
                    color: 'gray.800',
                    _hover: { bg: 'gray.200' },
                    px: 5,
                    py: 2,
                    borderRadius: 'md',
                    fontWeight: 'medium',
                  })}
                >
                  キャンセル
                </Button>

                <Button
                  type="button"
                  onClick={handleBulkAdd}
                  disabled={
                    bulkSelectedIds.length === 0 || bulkIsProcessing
                  }
                  className={css({
                    bg: 'blue.600',
                    color: 'white',
                    _hover: { bg: 'blue.700' },
                    _disabled: { opacity: 0.5, cursor: 'not-allowed' },
                    px: 5,
                    py: 2,
                    borderRadius: 'md',
                    fontWeight: 'medium',
                  })}
                >
                  {bulkIsProcessing
                    ? '追加中...'
                    : `${bulkSelectedIds.length}人を追加`}
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
