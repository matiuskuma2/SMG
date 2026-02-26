import { Avatar } from '@/components/ui/Avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { css } from '@/styled-system/css';
import { Flex } from '@/styled-system/jsx';
import Link from 'next/link';
import type React from 'react';
import { useState } from 'react';
import { LuCheck, LuCopy, LuExternalLink } from 'react-icons/lu';
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

interface UserTableProps {
  currentUsers: UserListItem[];
  selectedUsers: string[];
  handleSelectUser: (userId: string) => void;
  handleEdit: (userId: string) => void;
  handleDelete: (userId: string) => void;
  canViewPaymentStatus: boolean;
}

const NfcProfileCell: React.FC<{ userId: string }> = ({ userId }) => {
  const [copied, setCopied] = useState(false);
  const nfcUrl = `${process.env.NEXT_PUBLIC_FRONT_URL}/nfc-profile/${userId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(nfcUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Flex gap={2} alignItems="center">
      <Link
        href={nfcUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={css({
          display: 'inline-flex',
          alignItems: 'center',
          gap: '1',
          px: '2',
          py: '1',
          rounded: 'md',
          fontSize: 'sm',
          color: 'blue.600',
          bg: 'blue.50',
          _hover: { bg: 'blue.100' },
          transition: 'background-color 0.2s',
        })}
      >
        <LuExternalLink size={16} />
        <span>確認</span>
      </Link>
      <button
        type="button"
        onClick={handleCopy}
        className={css({
          display: 'inline-flex',
          alignItems: 'center',
          gap: '1',
          px: '2',
          py: '1',
          rounded: 'md',
          fontSize: 'sm',
          color: copied ? 'green.600' : 'gray.600',
          bg: copied ? 'green.50' : 'gray.50',
          _hover: { bg: copied ? 'green.100' : 'gray.100' },
          transition: 'all 0.2s',
          cursor: 'pointer',
        })}
      >
        {copied ? <LuCheck size={16} /> : <LuCopy size={16} />}
        <span>{copied ? 'コピー済' : 'URLコピー'}</span>
      </button>
    </Flex>
  );
};

export const UserTable: React.FC<UserTableProps> = ({
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
        display: { base: 'none', xl: 'block' },
        overflowX: 'auto',
      })}
    >
      <table
        className={css({
          w: 'full',
          borderCollapse: 'collapse',
          textAlign: 'left',
        })}
      >
        <thead>
          <tr
            className={css({
              bg: 'gray.50',
              borderBottom: '2px solid',
              borderColor: 'gray.200',
            })}
          >
            <th className={headerCellStyle}>
              <Checkbox checked={false} onChange={() => {}} />
            </th>
            <th className={headerCellStyle}>アイコン</th>
            <th className={headerCellStyle}>名前</th>
            <th className={headerCellStyle}>入会日</th>
            <th className={headerCellStyle}>最終ログイン</th>
            <th className={headerCellStyle}>メールアドレス</th>
            <th className={headerCellStyle}>電話番号</th>
            <th className={headerCellStyle}>属性</th>
            {canViewPaymentStatus && (
              <th className={headerCellStyle}>会員費決済</th>
            )}
            <th className={headerCellStyle}>NFCプロフィール</th>
            <th className={headerCellStyle}>アクション</th>
          </tr>
        </thead>
        <tbody>
          {currentUsers.map((user) => (
            <tr
              key={user.user_id}
              className={css({
                borderBottom: '1px solid',
                borderColor: 'gray.200',
                _hover: { bg: 'gray.50' },
              })}
            >
              <td className={cellStyle}>
                <Checkbox
                  checked={selectedUsers.includes(user.user_id)}
                  onChange={() => handleSelectUser(user.user_id)}
                />
              </td>
              <td className={cellStyle}>
                <Link
                  href={`${process.env.NEXT_PUBLIC_FRONT_URL}/mypage/profile/${user.user_id}/public-profile`}
                  className={css({ display: 'block', cursor: 'pointer' })}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Avatar
                    src={user.icon ?? undefined}
                    alt={user.username ?? undefined}
                    size="sm"
                  />
                </Link>
              </td>
              <td className={cellStyle}>{user.username}</td>
              <td className={cellStyle}>{user.created_at}</td>
              <td className={cellStyle}>{user.last_login_at}</td>
              <td className={cellStyle}>{user.email}</td>
              <td className={cellStyle}>{user.phone_number}</td>
              <td className={cellStyle}>{user.user_type}</td>
              {canViewPaymentStatus && (
                <td className={cellStyle}>
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
                          fontSize: 'sm',
                          fontWeight: 'medium',
                          bg: isSuccess ? 'green.100' : 'red.100',
                          color: isSuccess ? 'green.800' : 'red.800',
                        })}
                      >
                        {PAYMENT_STATUS_TEXT[paymentStatus]}
                      </div>
                    );
                  })()}
                </td>
              )}
              <td className={cellStyle}>
                <NfcProfileCell userId={user.user_id} />
              </td>
              <td className={cellStyle}>
                <ActionButtons
                  targetId={user.user_id}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const headerCellStyle = css({
  py: '3',
  px: '4',
  fontWeight: 'semibold',
  color: 'gray.700',
});

const cellStyle = css({ py: '3', px: '4' });
