import { Avatar } from '@/components/ui/Avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { css } from '@/styled-system/css';
import Link from 'next/link';
import type React from 'react';
import { ActionButtons } from '../ui/ActionIconButton';
import type { UserListItem } from './types';

// 定数定義
const PAYMENT_STATUS = {
  SUCCESS: 'success',
  FAILURE: 'failure',
} as const;

const PAYMENT_STATUS_TEXT = {
  [PAYMENT_STATUS.SUCCESS]: '成功',
  [PAYMENT_STATUS.FAILURE]: '失敗',
} as const;

const UNPAID_GROUP_NAME = '未決済';

interface UserCardProps {
  currentUsers: UserListItem[];
  selectedUsers: string[];
  handleSelectUser: (userId: string) => void;
  handleEdit: (userId: string) => void;
  handleDelete: (userId: string) => void;
  canViewPaymentStatus: boolean;
}

export const UserCard: React.FC<UserCardProps> = ({
  currentUsers,
  selectedUsers,
  handleSelectUser,
  handleEdit,
  handleDelete,
  canViewPaymentStatus,
}) => {
  return (
    <div
      className={css({
        display: { base: 'block', xl: 'none' },
      })}
    >
      {currentUsers.map((user) => (
        <div
          key={user.user_id}
          className={css({
            borderBottom: '1px solid',
            borderColor: 'gray.200',
            p: '4',
          })}
        >
          <div
            className={css({
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: '3',
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
                checked={selectedUsers.includes(user.user_id)}
                onChange={() => handleSelectUser(user.user_id)}
              />
              <Link
                href={`/user/${user.user_id}`}
                className={css({
                  display: 'block',
                  cursor: 'pointer',
                })}
              >
                <Avatar
                  src={user.icon ?? undefined}
                  alt={user.username ?? undefined}
                  size="md"
                />
              </Link>
              <div>
                <div className={css({ fontWeight: 'bold' })}>
                  <Link
                    href={`/user/${user.user_id}`}
                    className={css({
                      color: 'blue.600',
                      _hover: { textDecoration: 'underline' },
                    })}
                  >
                    {user.username}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className={css({ ml: '10' })}>
            <div
              className={css({
                display: 'grid',
                gridTemplateColumns: '120px 1fr',
                gap: '2',
                mb: '1',
              })}
            >
              <div className={css({ color: 'gray.600', fontSize: 'sm' })}>
                メールアドレス:
              </div>
              <div className={css({ fontSize: 'sm', wordBreak: 'break-all' })}>
                {user.email}
              </div>
            </div>
            <div
              className={css({
                display: 'grid',
                gridTemplateColumns: '120px 1fr',
                gap: '2',
                mb: '1',
              })}
            >
              <div className={css({ color: 'gray.600', fontSize: 'sm' })}>
                電話番号:
              </div>
              <div className={css({ fontSize: 'sm' })}>{user.phone_number}</div>
            </div>
            <div
              className={css({
                display: 'grid',
                gridTemplateColumns: '120px 1fr',
                gap: '2',
                mb: '1',
              })}
            >
              <div className={css({ color: 'gray.600', fontSize: 'sm' })}>
                属性:
              </div>
              <div className={css({ fontSize: 'sm' })}>{user.user_type}</div>
            </div>
            <div
              className={css({
                display: 'grid',
                gridTemplateColumns: '120px 1fr',
                gap: '2',
                mb: '1',
              })}
            >
              <div className={css({ color: 'gray.600', fontSize: 'sm' })}>
                入会日:
              </div>
              <div className={css({ fontSize: 'sm' })}>{user.created_at}</div>
            </div>
            <div
              className={css({
                display: 'grid',
                gridTemplateColumns: '120px 1fr',
                gap: '2',
                mb: '1',
              })}
            >
              <div className={css({ color: 'gray.600', fontSize: 'sm' })}>
                最終ログイン:
              </div>
              <div className={css({ fontSize: 'sm' })}>
                {user.last_login_at}
              </div>
            </div>
            {canViewPaymentStatus && (
              <div
                className={css({
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr',
                  gap: '2',
                  mb: '1',
                })}
              >
                <div className={css({ color: 'gray.600', fontSize: 'sm' })}>
                  会員費決済:
                </div>
                <div className={css({ fontSize: 'sm' })}>
                  {(() => {
                    const hasUnpaidGroup = user.trn_group_user?.some(
                      (groupUser) =>
                        groupUser.mst_group?.title === UNPAID_GROUP_NAME,
                    );
                    const paymentStatus = hasUnpaidGroup
                      ? PAYMENT_STATUS.FAILURE
                      : PAYMENT_STATUS.SUCCESS;
                    const isSuccess = paymentStatus === PAYMENT_STATUS.SUCCESS;
                    return (
                      <div
                        className={css({
                          display: 'inline-flex',
                          alignItems: 'center',
                          px: '2',
                          py: '1',
                          rounded: 'full',
                          fontSize: 'xs',
                          fontWeight: 'medium',
                          bg: isSuccess ? 'green.100' : 'red.100',
                          color: isSuccess ? 'green.800' : 'red.800',
                        })}
                      >
                        {PAYMENT_STATUS_TEXT[paymentStatus]}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>

          <div
            className={css({
              mt: '3',
              display: 'flex',
              justifyContent: 'flex-end',
            })}
          >
            <ActionButtons
              targetId={user.user_id}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
