'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { css } from '@/styled-system/css';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase';

export default function PaymentSuccessPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [eventName, setEventName] = useState<string>('');

  useEffect(() => {
    // session_idがない場合はイベント一覧にリダイレクト
    if (!sessionId) {
      router.replace('/events');
      return;
    }

    const fetchEventInfo = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from('mst_event')
        .select('event_name')
        .eq('event_id', id)
        .single();

      if (!error && data) {
        setEventName(data.event_name);
      }
      setLoading(false);
    };

    fetchEventInfo();
  }, [id, sessionId, router]);

  const handleReturnToEvent = () => {
    // 決済完了ページの履歴をイベント一覧に置き換えてから詳細ページに遷移
    window.history.replaceState(null, '', '/events');
    router.push(`/events/${id}`);
  };

  // session_idがない場合は何も表示しない（リダイレクト中）
  if (!sessionId) {
    return null;
  }

  if (loading) {
    return (
      <div className={css({
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh'
      })}>
        <p>決済情報を確認中...</p>
      </div>
    );
  }



  return (
    <div className={css({
      maxW: 'md',
      mx: 'auto',
      my: '12',
      p: '8',
      bg: 'white',
      rounded: 'xl',
      boxShadow: 'md',
      textAlign: 'center'
    })}>
      <div className={css({
        mb: '6',
        color: 'green.500',
        fontSize: '5xl',
      })}>
        ✓
      </div>
      
      <h1 className={css({
        fontSize: '2xl',
        fontWeight: 'bold',
        mb: '4',
        color: 'gray.800'
      })}>
        決済完了
      </h1>
      
      <p className={css({
        mb: '6',
        color: 'gray.600'
      })}>
        イベントの決済が正常に完了しました。ご参加をお待ちしております。
      </p>
      
      <div className={css({
        bg: 'gray.50',
        p: '4',
        rounded: 'md',
        mb: '6',
        textAlign: 'left'
      })}>
        <p className={css({ fontSize: 'sm', color: 'gray.600' })}>
          イベント名: {eventName}
        </p>
      </div>
      
      <Button
        onClick={handleReturnToEvent}
        className={css({
          bg: 'blue.500',
          color: 'white',
          px: '8',
          py: '2',
          rounded: 'full',
          _hover: { bg: 'blue.600' }
        })}
      >
        イベントページに戻る
      </Button>
    </div>
  );
} 