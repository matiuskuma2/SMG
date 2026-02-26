'use client';

import { css } from '@/styled-system/css';
import { Download, Edit, Eye, Trash } from 'lucide-react';
import Link from 'next/link';
import type { Enquete } from './types';

interface EnqueteCardProps {
  currentEnquetes: Enquete[];
  selectedEnquetes: string[];
  handleSelectEnquete: (enqueteId: string) => void;
  handleDelete: (enqueteId: string) => void;
}

export const EnqueteCard = ({
  currentEnquetes,
  handleDelete,
}: EnqueteCardProps) => {
  // 日付をフォーマットする関数
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}年${month}月${day}日`;
    } catch (error) {
      return dateString;
    }
  };

  // QRコード生成・ダウンロード処理
  const handleQRDownload = (enqueteId: string) => {
    console.log(`QRコードダウンロード: ${enqueteId}`);
    // 実際にはQRコード生成・ダウンロード処理を実装
  };

  // 削除処理
  // const handleDelete = (enqueteId: string) => {
  //   if (window.confirm('このアンケートを削除してもよろしいですか？')) {
  //     console.log(`削除: ${enqueteId}`);
  //     // 実際には削除処理を実装
  //   }
  // };

  return (
    <div className={css({ display: { base: 'block', md: 'none' } })}>
      {currentEnquetes.map((enquete) => (
        <div
          key={enquete.id}
          className={css({
            border: '1px solid',
            borderColor: 'gray.200',
            rounded: 'md',
            mb: '4',
            overflow: 'hidden',
          })}
        >
          <div className={css({ p: '3' })}>
            <div
              className={css({
                display: 'flex',
                justifyContent: 'space-between',
                mb: '2',
              })}
            >
              <span
                className={css({ color: 'gray.600', fontWeight: 'medium' })}
              >
                イベント名:
              </span>
              <span>{enquete.eventName}</span>
            </div>

            <div
              className={css({
                display: 'flex',
                justifyContent: 'space-between',
                mb: '2',
              })}
            >
              <span
                className={css({ color: 'gray.600', fontWeight: 'medium' })}
              >
                開催日:
              </span>
              <span>{formatDate(enquete.eventDate)}</span>
            </div>

            <div
              className={css({
                display: 'flex',
                justifyContent: 'space-between',
                mb: '2',
              })}
            >
              <span
                className={css({ color: 'gray.600', fontWeight: 'medium' })}
              >
                回答期限:
              </span>
              <span>{formatDate(enquete.responseDeadline)}</span>
            </div>

            <div
              className={css({
                display: 'flex',
                justifyContent: 'space-between',
                mb: '2',
              })}
            >
              <span
                className={css({ color: 'gray.600', fontWeight: 'medium' })}
              >
                回答数:
              </span>
              <span>{enquete.responseCount}</span>
            </div>

            <div
              className={css({
                display: 'flex',
                justifyContent: 'center',
                gap: '4',
                mt: '4',
              })}
            >
              <Link
                href={`/enquetelist/responses/${enquete.id}`}
                className={css({
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  color: 'green.600',
                })}
              >
                <div
                  className={css({
                    p: '2',
                    rounded: 'full',
                    bg: 'green.50',
                    mb: '1',
                  })}
                >
                  <Eye size={18} />
                </div>
                <span className={css({ fontSize: 'xs' })}>回答確認</span>
              </Link>

              <button
                type="button"
                onClick={() => handleQRDownload(enquete.id)}
                className={css({
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  color: 'purple.600',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                })}
              >
                <div
                  className={css({
                    p: '2',
                    rounded: 'full',
                    bg: 'purple.50',
                    mb: '1',
                  })}
                >
                  <Download size={18} />
                </div>
                <span className={css({ fontSize: 'xs' })}>QRコード</span>
              </button>

              <Link
                href={`/enquete/edit/${enquete.id}`}
                className={css({
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  color: 'blue.600',
                })}
              >
                <div
                  className={css({
                    p: '2',
                    rounded: 'full',
                    bg: 'blue.50',
                    mb: '1',
                  })}
                >
                  <Edit size={18} />
                </div>
                <span className={css({ fontSize: 'xs' })}>編集</span>
              </Link>

              <button
                type="button"
                onClick={() => handleDelete(enquete.id)}
                className={css({
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  color: 'red.600',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                })}
              >
                <div
                  className={css({
                    p: '2',
                    rounded: 'full',
                    bg: 'red.50',
                    mb: '1',
                  })}
                >
                  <Trash size={18} />
                </div>
                <span className={css({ fontSize: 'xs' })}>削除</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
