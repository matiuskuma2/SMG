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
import { useEffect, useMemo, useState } from 'react';
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
    } else {
      // モーダルが閉じられたときに選択状態をクリア
      setSelectedUserIds([]);
      setFilterType('member');
    }
  }, [open, existingUserIds]);

  const filteredUsers = useMemo(() => {
    let filtered = users.filter(
      (user) =>
        (user.username?.toLowerCase() ?? '').includes(
          searchTerm.toLowerCase(),
        ) ||
        (user.email?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()),
    );

    // フィルタータイプに応じて絞り込み
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

  // 変更があったかどうかを確認
  const hasChanges = useMemo(() => {
    if (existingUserIds.length !== selectedUserIds.length) return true;

    // 選択されたすべてのIDが既存のIDに含まれているか確認
    return (
      !selectedUserIds.every((id) => existingUserIds.includes(id)) ||
      !existingUserIds.every((id) => selectedUserIds.includes(id))
    );
  }, [selectedUserIds, existingUserIds]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        onClick={(e) => e.stopPropagation()}
        className={css({
          w: '90vw',
          maxW: '600px',
          maxH: '80vh',
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
              setFilterType(e.target.value as 'all' | 'member' | 'non-member')
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
            className={css({ textAlign: 'center', py: '4', color: 'gray.500' })}
          >
            ユーザーが見つかりません
          </div>
        ) : (
          <ul className={css({ listStyle: 'none', p: '0', m: '0' })}>
            {filteredUsers.map((user) => {
              const isExistingUser = existingUserIds.includes(user.user_id);
              return (
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
                  <span className={css({ color: 'gray.500', fontSize: 'sm' })}>
                    {user.email}
                  </span>
                </li>
              );
            })}
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
      </DialogContent>
    </Dialog>
  );
};
