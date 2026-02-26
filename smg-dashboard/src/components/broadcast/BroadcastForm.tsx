'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { css } from '@/styled-system/css';
import type React from 'react';
import { useEffect, useState } from 'react';

type Group = {
  group_id: string;
  title: string;
  description: string;
};

type User = {
  user_id: string;
  username: string;
  email: string;
  company_name: string | null;
};

type BroadcastFormProps = {
  groups: Group[];
  users: User[];
  onSubmit: (content: string, selectedUserIds: string[]) => Promise<void>;
  onGroupSelectionChange: (groupIds: string[]) => void;
};

export const BroadcastForm: React.FC<BroadcastFormProps> = ({
  groups,
  users,
  onSubmit,
  onGroupSelectionChange,
}) => {
  const [content, setContent] = useState('');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
    users.map((u) => u.user_id),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 置き換え文字をテキストエリアに挿入
  const insertPlaceholder = (placeholder: string) => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent =
      content.substring(0, start) + placeholder + content.substring(end);

    setContent(newContent);

    // カーソル位置を調整
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + placeholder.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  // グループ選択の変更
  const handleGroupChange = (groupId: string, checked: boolean) => {
    const newSelectedGroupIds = checked
      ? [...selectedGroupIds, groupId]
      : selectedGroupIds.filter((id) => id !== groupId);

    setSelectedGroupIds(newSelectedGroupIds);
    onGroupSelectionChange(newSelectedGroupIds);
  };

  // 全グループ選択/解除
  const handleSelectAllGroups = (checked: boolean) => {
    const newSelectedGroupIds = checked ? groups.map((g) => g.group_id) : [];
    setSelectedGroupIds(newSelectedGroupIds);
    onGroupSelectionChange(newSelectedGroupIds);
  };

  // ユーザー選択の変更
  const handleUserChange = (userId: string, checked: boolean) => {
    setSelectedUserIds((prev) =>
      checked ? [...prev, userId] : prev.filter((id) => id !== userId),
    );
  };

  // 全ユーザー選択/解除
  const handleSelectAllUsers = (checked: boolean) => {
    setSelectedUserIds(checked ? users.map((u) => u.user_id) : []);
  };

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      alert('メッセージ本文を入力してください');
      return;
    }

    if (selectedUserIds.length === 0) {
      alert('送信先のユーザーを選択してください');
      return;
    }

    const confirmed = window.confirm(
      `${selectedUserIds.length}名のユーザーにメッセージを送信します。よろしいですか?`,
    );

    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content, selectedUserIds);
      setContent('');
      alert('メッセージを送信しました');
    } catch (error) {
      console.error('送信エラー:', error);
      alert('メッセージの送信に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // usersが変更されたら全選択状態に戻す
  useEffect(() => {
    setSelectedUserIds(users.map((u) => u.user_id));
  }, [users]);

  const allGroupsSelected =
    groups.length > 0 && selectedGroupIds.length === groups.length;
  const allUsersSelected =
    users.length > 0 && selectedUserIds.length === users.length;

  return (
    <form onSubmit={handleSubmit}>
      <div
        className={css({
          p: { base: '4', xl: '6' },
        })}
      >
        {/* グループ選択セクション */}
        <div
          className={css({
            mb: '6',
            p: '4',
            rounded: 'md',
            border: '1px solid',
            borderColor: 'gray.200',
            bg: 'gray.50',
          })}
        >
          <div
            className={css({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: '4',
              pb: '3',
              borderBottom: '1px solid',
              borderColor: 'gray.200',
            })}
          >
            <h2
              className={css({
                fontSize: 'lg',
                fontWeight: 'bold',
                color: 'gray.800',
              })}
            >
              グループ選択
            </h2>
            <label
              className={css({
                display: 'flex',
                alignItems: 'center',
                gap: '2',
                cursor: 'pointer',
              })}
            >
              <input
                type="checkbox"
                checked={allGroupsSelected}
                onChange={(e) => handleSelectAllGroups(e.target.checked)}
                className={css({
                  w: '4',
                  h: '4',
                  cursor: 'pointer',
                })}
              />
              <span className={css({ fontSize: 'sm', fontWeight: 'medium' })}>
                全て選択
              </span>
            </label>
          </div>
          <div
            className={css({
              display: 'grid',
              gridTemplateColumns: {
                base: '1fr',
                md: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)',
              },
              gap: '3',
            })}
          >
            {groups.map((group) => (
              <label
                key={group.group_id}
                className={css({
                  display: 'flex',
                  alignItems: 'start',
                  gap: '3',
                  p: '3',
                  rounded: 'md',
                  border: '1px solid',
                  borderColor: 'gray.200',
                  bg: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  _hover: { bg: 'gray.50', borderColor: 'blue.300' },
                })}
              >
                <input
                  type="checkbox"
                  checked={selectedGroupIds.includes(group.group_id)}
                  onChange={(e) =>
                    handleGroupChange(group.group_id, e.target.checked)
                  }
                  className={css({
                    w: '4',
                    h: '4',
                    mt: '0.5',
                    cursor: 'pointer',
                    flexShrink: 0,
                  })}
                />
                <div className={css({ flex: '1', minW: 0 })}>
                  <div
                    className={css({
                      fontWeight: 'medium',
                      fontSize: 'sm',
                      color: 'gray.900',
                      wordBreak: 'break-word',
                    })}
                  >
                    {group.title}
                  </div>
                  {group.description && (
                    <div
                      className={css({
                        fontSize: 'xs',
                        color: 'gray.600',
                        mt: '1',
                        lineHeight: '1.4',
                        wordBreak: 'break-word',
                      })}
                    >
                      {group.description}
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* メンバー選択セクション */}
        <div
          className={css({
            mb: '6',
            p: '4',
            rounded: 'md',
            border: '1px solid',
            borderColor: 'gray.200',
            bg: 'gray.50',
          })}
        >
          <div
            className={css({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: '4',
              pb: '3',
              borderBottom: '1px solid',
              borderColor: 'gray.200',
            })}
          >
            <h2
              className={css({
                fontSize: 'lg',
                fontWeight: 'bold',
                color: 'gray.800',
              })}
            >
              送信先メンバー ({users.length}名)
            </h2>
            <label
              className={css({
                display: 'flex',
                alignItems: 'center',
                gap: '2',
                cursor: 'pointer',
              })}
            >
              <input
                type="checkbox"
                checked={allUsersSelected}
                onChange={(e) => handleSelectAllUsers(e.target.checked)}
                className={css({
                  w: '4',
                  h: '4',
                  cursor: 'pointer',
                })}
              />
              <span className={css({ fontSize: 'sm', fontWeight: 'medium' })}>
                全て選択
              </span>
            </label>
          </div>
          <div
            className={css({
              maxH: '400px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '2',
            })}
          >
            {users.map((user) => (
              <label
                key={user.user_id}
                className={css({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3',
                  p: '3',
                  rounded: 'md',
                  border: '1px solid',
                  borderColor: 'gray.200',
                  bg: 'white',
                  cursor: 'pointer',
                  _hover: { bg: 'gray.50' },
                })}
              >
                <input
                  type="checkbox"
                  checked={selectedUserIds.includes(user.user_id)}
                  onChange={(e) =>
                    handleUserChange(user.user_id, e.target.checked)
                  }
                  className={css({
                    w: '4',
                    h: '4',
                    cursor: 'pointer',
                  })}
                />
                <div className={css({ flex: '1' })}>
                  <div
                    className={css({ fontWeight: 'medium', fontSize: 'sm' })}
                  >
                    {user.username}
                  </div>
                  <div className={css({ fontSize: 'xs', color: 'gray.600' })}>
                    {user.email}
                    {user.company_name && ` - ${user.company_name}`}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* メッセージ入力セクション */}
        <div
          className={css({
            mb: '6',
            p: '4',
            rounded: 'md',
            border: '1px solid',
            borderColor: 'gray.200',
            bg: 'gray.50',
          })}
        >
          <h2
            className={css({
              fontSize: 'lg',
              fontWeight: 'bold',
              color: 'gray.800',
              mb: '4',
              pb: '3',
              borderBottom: '1px solid',
              borderColor: 'gray.200',
            })}
          >
            メッセージ本文
          </h2>

          {/* 置き換え文字ボタン */}
          <div
            className={css({
              mb: '3',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '2',
            })}
          >
            <button
              type="button"
              onClick={() => insertPlaceholder('%name%')}
              className={css({
                px: '3',
                py: '1.5',
                fontSize: 'xs',
                fontWeight: 'medium',
                bg: 'white',
                border: '1px solid',
                borderColor: 'gray.300',
                rounded: 'md',
                cursor: 'pointer',
                transition: 'all 0.2s',
                _hover: {
                  bg: 'blue.50',
                  borderColor: 'blue.400',
                  color: 'blue.700',
                },
              })}
            >
              名前
            </button>
            <button
              type="button"
              onClick={() => insertPlaceholder('%kana%')}
              className={css({
                px: '3',
                py: '1.5',
                fontSize: 'xs',
                fontWeight: 'medium',
                bg: 'white',
                border: '1px solid',
                borderColor: 'gray.300',
                rounded: 'md',
                cursor: 'pointer',
                transition: 'all 0.2s',
                _hover: {
                  bg: 'blue.50',
                  borderColor: 'blue.400',
                  color: 'blue.700',
                },
              })}
            >
              カナ
            </button>
            <button
              type="button"
              onClick={() => insertPlaceholder('%mail%')}
              className={css({
                px: '3',
                py: '1.5',
                fontSize: 'xs',
                fontWeight: 'medium',
                bg: 'white',
                border: '1px solid',
                borderColor: 'gray.300',
                rounded: 'md',
                cursor: 'pointer',
                transition: 'all 0.2s',
                _hover: {
                  bg: 'blue.50',
                  borderColor: 'blue.400',
                  color: 'blue.700',
                },
              })}
            >
              メールアドレス
            </button>
            <button
              type="button"
              onClick={() => insertPlaceholder('%phone%')}
              className={css({
                px: '3',
                py: '1.5',
                fontSize: 'xs',
                fontWeight: 'medium',
                bg: 'white',
                border: '1px solid',
                borderColor: 'gray.300',
                rounded: 'md',
                cursor: 'pointer',
                transition: 'all 0.2s',
                _hover: {
                  bg: 'blue.50',
                  borderColor: 'blue.400',
                  color: 'blue.700',
                },
              })}
            >
              電話番号
            </button>
            <button
              type="button"
              onClick={() => insertPlaceholder('%company%')}
              className={css({
                px: '3',
                py: '1.5',
                fontSize: 'xs',
                fontWeight: 'medium',
                bg: 'white',
                border: '1px solid',
                borderColor: 'gray.300',
                rounded: 'md',
                cursor: 'pointer',
                transition: 'all 0.2s',
                _hover: {
                  bg: 'blue.50',
                  borderColor: 'blue.400',
                  color: 'blue.700',
                },
              })}
            >
              会社名
            </button>
            <button
              type="button"
              onClick={() => insertPlaceholder('%joinDate%')}
              className={css({
                px: '3',
                py: '1.5',
                fontSize: 'xs',
                fontWeight: 'medium',
                bg: 'white',
                border: '1px solid',
                borderColor: 'gray.300',
                rounded: 'md',
                cursor: 'pointer',
                transition: 'all 0.2s',
                _hover: {
                  bg: 'blue.50',
                  borderColor: 'blue.400',
                  color: 'blue.700',
                },
              })}
            >
              入会日
            </button>
            <button
              type="button"
              onClick={() => insertPlaceholder('%now%')}
              className={css({
                px: '3',
                py: '1.5',
                fontSize: 'xs',
                fontWeight: 'medium',
                bg: 'white',
                border: '1px solid',
                borderColor: 'gray.300',
                rounded: 'md',
                cursor: 'pointer',
                transition: 'all 0.2s',
                _hover: {
                  bg: 'blue.50',
                  borderColor: 'blue.400',
                  color: 'blue.700',
                },
              })}
            >
              現在日時
            </button>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="送信するメッセージを入力してください"
            rows={8}
            required
            className={css({
              w: 'full',
              p: '3',
              border: '1px solid',
              borderColor: 'gray.300',
              rounded: 'md',
              fontSize: 'sm',
              bg: 'white',
              resize: 'vertical',
              _focus: {
                outline: 'none',
                borderColor: 'blue.500',
                boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
              },
            })}
          />
        </div>

        {/* 送信ボタン */}
        <div className={css({ display: 'flex', justifyContent: 'center' })}>
          <Button
            type="submit"
            disabled={isSubmitting}
            className={css({
              px: '8',
              py: '3',
              bg: 'blue.600',
              color: 'white',
              rounded: 'md',
              fontWeight: 'medium',
              _hover: { bg: 'blue.700' },
              _disabled: {
                bg: 'gray.400',
                cursor: 'not-allowed',
              },
            })}
          >
            {isSubmitting ? '送信中...' : `${selectedUserIds.length}名に送信`}
          </Button>
        </div>
      </div>
    </form>
  );
};
