import { css } from '@/styled-system/css';
import { Mail } from 'lucide-react';
import Link from 'next/link';
import type React from 'react';
import { FaFilePdf } from 'react-icons/fa';

export type ReceiptHistory = {
  receipt_id: string;
  user_id: string;
  number: string;
  name: string;
  amount: number;
  description: string | null;
  notes: string | null;
  is_dashboard_issued: boolean | null;
  is_email_issued: boolean | null;
  created_at: string | null;
  mst_user?: {
    username: string | null;
    email: string | null;
    icon: string | null;
    company_name: string | null;
  } | null;
};

interface ReceiptListTableProps {
  receipts: ReceiptHistory[];
}

export const ReceiptListTable: React.FC<ReceiptListTableProps> = ({
  receipts,
}) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${hours}:${minutes}`;
  };

  const formatAmount = (amount: number) => {
    return `¥${amount.toLocaleString()}`;
  };

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
            <th className={headerStyle}>発行元</th>
            <th className={headerStyle}>発行者</th>
            <th className={headerStyle}>会社名</th>
            <th className={headerStyle}>領収書番号</th>
            <th className={headerStyle}>宛名</th>
            <th className={headerStyle}>但し書き</th>
            <th className={headerStyle}>金額</th>
            <th className={headerStyle}>発行日</th>
            <th className={headerStyle}>発行方法</th>
          </tr>
        </thead>
        <tbody>
          {receipts.map((receipt) => (
            <tr
              key={receipt.receipt_id}
              className={css({
                borderBottom: '1px solid',
                borderColor: 'gray.200',
                _hover: { bg: 'gray.50' },
              })}
            >
              <td className={cellStyle}>
                {receipt.is_dashboard_issued ? (
                  <span
                    className={css({
                      display: 'inline-flex',
                      alignItems: 'center',
                      px: '2',
                      py: '1',
                      borderRadius: 'md',
                      fontSize: 'xs',
                      fontWeight: 'semibold',
                      bg: 'blue.100',
                      color: 'blue.700',
                      whiteSpace: 'nowrap',
                    })}
                  >
                    管理者
                  </span>
                ) : (
                  <span
                    className={css({
                      display: 'inline-flex',
                      alignItems: 'center',
                      px: '2',
                      py: '1',
                      borderRadius: 'md',
                      fontSize: 'xs',
                      fontWeight: 'semibold',
                      bg: 'orange.100',
                      color: 'orange.700',
                      whiteSpace: 'nowrap',
                    })}
                  >
                    会員
                  </span>
                )}
              </td>
              <td className={cellStyle}>
                {receipt.mst_user?.username ? (
                  <Link
                    href={`${process.env.NEXT_PUBLIC_FRONT_URL}/mypage/profile/${receipt.user_id}/public-profile`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={css({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2',
                      cursor: 'pointer',
                      _hover: { opacity: 0.7 },
                      transition: 'opacity 0.2s',
                    })}
                  >
                    {receipt.mst_user.icon ? (
                      <img
                        src={receipt.mst_user.icon}
                        alt={receipt.mst_user.username}
                        className={css({
                          w: '6',
                          h: '6',
                          rounded: 'full',
                          objectFit: 'cover',
                        })}
                      />
                    ) : (
                      <div
                        className={css({
                          w: '6',
                          h: '6',
                          rounded: 'full',
                          bg: 'gray.200',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        })}
                      >
                        <span
                          className={css({ fontSize: 'xs', color: 'gray.600' })}
                        >
                          {receipt.mst_user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span>{receipt.mst_user.username}</span>
                  </Link>
                ) : (
                  '-'
                )}
              </td>
              <td className={cellStyle}>
                {receipt.mst_user?.company_name || '-'}
              </td>
              <td className={cellStyle}>{receipt.number}</td>
              <td className={cellStyle}>{receipt.name}</td>
              <td className={cellStyle}>{receipt.description || '-'}</td>
              <td className={cellStyle}>{formatAmount(receipt.amount)}</td>
              <td className={cellStyle}>{formatDate(receipt.created_at)}</td>
              <td className={cellStyle}>
                {receipt.is_dashboard_issued ? (
                  <FaFilePdf size={18} className={css({ color: 'red.600' })} />
                ) : receipt.is_email_issued ? (
                  <Mail size={18} className={css({ color: 'green.600' })} />
                ) : (
                  <FaFilePdf size={18} className={css({ color: 'red.600' })} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const headerStyle = css({
  py: '3',
  px: '4',
  fontWeight: 'semibold',
  color: 'gray.700',
  minW: '120px',
});

const cellStyle = css({ py: '3', px: '4' });
