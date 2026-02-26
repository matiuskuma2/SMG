'use client';

import { css } from '@/styled-system/css';
import { Download, Edit, Eye, Trash } from 'lucide-react';
import Link from 'next/link';
import type { Enquete } from './types';

interface EnqueteTableProps {
  currentEnquetes: Enquete[];
  selectedEnquetes: string[];
  handleSelectEnquete: (enqueteId: string) => void;
  handleDelete: (enqueteId: string) => void;
}

export const EnqueteTable = ({
  currentEnquetes,
  selectedEnquetes,
  handleSelectEnquete,
  handleDelete,
}: EnqueteTableProps) => {
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

  return (
    <div
      className={css({
        overflowX: 'auto',
        display: { base: 'none', md: 'block' },
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
              borderBottom: '1px solid',
              borderColor: 'gray.200',
            })}
          >
            <th
              className={css({
                py: '3',
                px: '4',
                fontWeight: 'medium',
                color: 'gray.600',
              })}
            >
              イベント名
            </th>
            <th
              className={css({
                py: '3',
                px: '4',
                fontWeight: 'medium',
                color: 'gray.600',
              })}
            >
              対象イベントの開催日
            </th>
            <th
              className={css({
                py: '3',
                px: '4',
                fontWeight: 'medium',
                color: 'gray.600',
              })}
            >
              回答期限
            </th>
            <th
              className={css({
                py: '3',
                px: '4',
                fontWeight: 'medium',
                color: 'gray.600',
                textAlign: 'center',
              })}
            >
              回答数
            </th>
            <th
              className={css({
                py: '3',
                px: '4',
                fontWeight: 'medium',
                color: 'gray.600',
                textAlign: 'center',
              })}
            >
              アクション
            </th>
          </tr>
        </thead>
        <tbody>
          {currentEnquetes.map((enquete) => (
            <tr
              key={enquete.id}
              className={css({
                borderBottom: '1px solid',
                borderColor: 'gray.200',
                _hover: { bg: 'gray.50' },
              })}
            >
              <td
                className={css({
                  py: '3',
                  px: '4',
                })}
              >
                {enquete.eventName}
              </td>
              <td
                className={css({
                  py: '3',
                  px: '4',
                })}
              >
                {formatDate(enquete.eventDate)}
              </td>
              <td
                className={css({
                  py: '3',
                  px: '4',
                })}
              >
                {formatDate(enquete.responseDeadline)}
              </td>
              <td
                className={css({
                  py: '3',
                  px: '4',
                  textAlign: 'center',
                })}
              >
                {enquete.responseCount}
              </td>
              <td
                className={css({
                  py: '3',
                  px: '4',
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '2',
                })}
              >
                <Link
                  href={`/enquetelist/responses/${enquete.id}`}
                  className={css({
                    px: '3',
                    py: '1',
                    rounded: 'md',
                    bg: 'green.500',
                    color: 'white',
                    fontSize: 'sm',
                    cursor: 'pointer',
                    _hover: { bg: 'green.600' },
                  })}
                >
                  回答確認
                </Link>
                <button
                  type="button"
                  onClick={() => handleQRDownload(enquete.id)}
                  className={css({
                    px: '3',
                    py: '1',
                    rounded: 'md',
                    bg: 'purple.500',
                    color: 'white',
                    fontSize: 'sm',
                    cursor: 'pointer',
                    _hover: { bg: 'purple.600' },
                  })}
                >
                  QRコード
                </button>
                <Link
                  href={`/enquete/edit/${enquete.id}`}
                  className={css({
                    px: '3',
                    py: '1',
                    rounded: 'md',
                    bg: 'blue.500',
                    color: 'white',
                    fontSize: 'sm',
                    cursor: 'pointer',
                    _hover: { bg: 'blue.600' },
                  })}
                >
                  編集
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(enquete.id)}
                  className={css({
                    px: '3',
                    py: '1',
                    rounded: 'md',
                    bg: 'red.500',
                    color: 'white',
                    fontSize: 'sm',
                    cursor: 'pointer',
                    _hover: { bg: 'red.600' },
                  })}
                >
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
