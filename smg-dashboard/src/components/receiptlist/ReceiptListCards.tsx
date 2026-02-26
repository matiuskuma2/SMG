import { css } from '@/styled-system/css';
import { Mail } from 'lucide-react';
import Link from 'next/link';
import type React from 'react';
import { FaFilePdf } from 'react-icons/fa';
import type { ReceiptHistory } from './ReceiptListTable';

interface ReceiptListCardsProps {
  receipts: ReceiptHistory[];
}

export const ReceiptListCards: React.FC<ReceiptListCardsProps> = ({
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
    <div className={css({ display: { base: 'block', xl: 'none' }, p: '4' })}>
      <div
        className={css({ display: 'flex', flexDirection: 'column', gap: '4' })}
      >
        {receipts.map((receipt) => (
          <div
            key={receipt.receipt_id}
            className={css({
              bg: 'white',
              border: '1px solid',
              borderColor: 'gray.200',
              rounded: 'lg',
              p: '4',
              shadow: 'sm',
            })}
          >
            <div
              className={css({
                display: 'flex',
                flexDirection: 'column',
                gap: '3',
              })}
            >
              <div
                className={css({
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                })}
              >
                <div
                  className={css({
                    fontSize: 'sm',
                    color: 'gray.600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2',
                  })}
                >
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
                            w: '5',
                            h: '5',
                            rounded: 'full',
                            objectFit: 'cover',
                          })}
                        />
                      ) : (
                        <div
                          className={css({
                            w: '5',
                            h: '5',
                            rounded: 'full',
                            bg: 'gray.200',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          })}
                        >
                          <span
                            className={css({
                              fontSize: 'xs',
                              color: 'gray.600',
                            })}
                          >
                            {receipt.mst_user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span>{receipt.mst_user.username}</span>
                      {receipt.mst_user.company_name && (
                        <span
                          className={css({
                            color: 'gray.500',
                            fontSize: 'xs',
                          })}
                        >
                          ({receipt.mst_user.company_name})
                        </span>
                      )}
                    </Link>
                  ) : (
                    '-'
                  )}
                </div>
                <span
                  className={css({
                    display: 'inline-flex',
                    alignItems: 'center',
                    px: '2',
                    py: '1',
                    borderRadius: 'md',
                    fontSize: 'xs',
                    fontWeight: 'semibold',
                    bg: receipt.is_dashboard_issued ? 'blue.100' : 'orange.100',
                    color: receipt.is_dashboard_issued
                      ? 'blue.700'
                      : 'orange.700',
                  })}
                >
                  {receipt.is_dashboard_issued ? '管理者' : '会員'}
                </span>
              </div>

              <div>
                <div
                  className={css({
                    fontSize: 'xs',
                    color: 'gray.500',
                    mb: '1',
                  })}
                >
                  領収書番号: {receipt.number}
                </div>
                <div
                  className={css({
                    fontSize: 'lg',
                    fontWeight: 'bold',
                    mb: '1',
                  })}
                >
                  {receipt.name}
                </div>
                <div className={css({ fontSize: 'sm', color: 'gray.600' })}>
                  {receipt.description || '-'}
                </div>
              </div>

              <div
                className={css({
                  pt: '2',
                  borderTop: '1px solid',
                  borderColor: 'gray.100',
                })}
              >
                <div
                  className={css({
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: '1',
                  })}
                >
                  <span className={css({ fontSize: 'sm', color: 'gray.600' })}>
                    {formatDate(receipt.created_at)}
                  </span>
                  <span className={css({ fontSize: 'lg', fontWeight: 'bold' })}>
                    {formatAmount(receipt.amount)}
                  </span>
                </div>
                <div
                  className={css({
                    fontSize: 'sm',
                    color: 'gray.600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2',
                  })}
                >
                  発行方法:{' '}
                  {receipt.is_dashboard_issued ? (
                    <FaFilePdf
                      size={16}
                      className={css({ color: 'red.600' })}
                    />
                  ) : receipt.is_email_issued ? (
                    <Mail size={16} className={css({ color: 'green.600' })} />
                  ) : (
                    <FaFilePdf
                      size={16}
                      className={css({ color: 'red.600' })}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
