'use client';

import { BroadcastDetailContent } from '@/components/broadcast/BroadcastDetailContent';
import { getBroadcastDetail } from '@/lib/api/broadcast';
import { css } from '@/styled-system/css';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaArrowLeft } from 'react-icons/fa';

type BroadcastDetail = {
  broadcast_id: string;
  is_sent: boolean;
  content: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  target_users: {
    user_id: string;
    username: string;
    email: string;
    company_name: string | null;
    is_sent: boolean;
  }[];
  success_count: number;
  failure_count: number;
};

export default function BroadcastDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const [detail, setDetail] = useState<BroadcastDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const data = await getBroadcastDetail(id);
        setDetail(data);
      } catch (err) {
        console.error('詳細取得エラー:', err);
        setError('配信履歴の詳細を取得できませんでした');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (isLoading) {
    return (
      <div
        className={css({
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minH: 'calc(100vh - 64px)',
        })}
      >
        読み込み中...
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div
        className={css({
          p: { base: '2', xl: '8' },
          pt: { base: '4', xl: '20' },
          minH: 'calc(100vh - 64px)',
        })}
      >
        <div
          className={css({
            maxW: '1200px',
            mx: 'auto',
            p: '6',
            rounded: 'lg',
            bg: 'red.50',
            border: '1px solid',
            borderColor: 'red.200',
            color: 'red.700',
          })}
        >
          {error || '配信履歴が見つかりませんでした'}
        </div>
      </div>
    );
  }

  return (
    <div
      className={css({
        p: { base: '2', xl: '8' },
        pt: { base: '4', xl: '20' },
        minH: 'calc(100vh - 64px)',
      })}
    >
      <div
        className={css({
          maxW: '1200px',
          mx: 'auto',
          p: { base: '4', xl: '8' },
          rounded: 'lg',
          bg: 'white',
          shadow: 'sm',
        })}
      >
        {/* ヘッダー */}
        <div
          className={css({
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: '6',
            pb: '4',
            borderBottom: '2px solid',
            borderColor: 'gray.200',
          })}
        >
          <div>
            <h1
              className={css({
                fontSize: { base: 'xl', md: '2xl' },
                fontWeight: 'bold',
                color: 'gray.800',
              })}
            >
              配信履歴詳細
            </h1>
          </div>
          <button
            type="button"
            onClick={() => router.push('/broadcast-history')}
            className={css({
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2',
              px: '4',
              py: '2',
              rounded: 'md',
              bg: 'gray.100',
              color: 'gray.700',
              fontSize: 'sm',
              fontWeight: 'medium',
              cursor: 'pointer',
              transition: 'all 0.2s',
              _hover: {
                bg: 'gray.200',
              },
            })}
          >
            <FaArrowLeft />
            一覧に戻る
          </button>
        </div>

        {/* 詳細コンテンツ */}
        <BroadcastDetailContent detail={detail} />
      </div>
    </div>
  );
}
