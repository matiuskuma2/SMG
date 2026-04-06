'use client';

import { createClient } from '@/lib/supabase/client';
import { css } from '@/styled-system/css';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

type EventOption = {
  event_id: string;
  event_name: string;
  event_start_datetime: string;
  event_type: { event_type_name: string } | null;
  has_gather: boolean;
  has_consultation: boolean;
};

type AttendanceRecord = {
  event_id: string;
  created_at: string | null;
  deleted_at: string | null;
  is_offline?: boolean;
  stripe_payment_status?: string;
  payment_amount?: number;
  is_urgent?: boolean;
  is_first_consultation?: boolean;
  notes?: string | null;
  event: {
    event_name: string;
    event_start_datetime: string;
    event_type: { event_type_name: string } | null;
  } | null;
};

type Tab = 'event' | 'gather' | 'consultation';

export default function UserAttendancePage({
  params,
}: {
  params: { userId: string };
}) {
  const router = useRouter();
  const supabase = createClient();
  const userId = params.userId;

  const [userName, setUserName] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('event');
  const [eventAttendances, setEventAttendances] = useState<AttendanceRecord[]>([]);
  const [gatherAttendances, setGatherAttendances] = useState<AttendanceRecord[]>([]);
  const [consultationAttendances, setConsultationAttendances] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 追加モーダル用
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [eventOptions, setEventOptions] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [addIsOffline, setAddIsOffline] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventSearchTerm, setEventSearchTerm] = useState('');

  // 確認ダイアログ
  const [confirmAction, setConfirmAction] = useState<{
    type: Tab;
    eventId: string;
    eventName: string;
    action: 'delete' | 'restore';
  } | null>(null);

  // ユーザー情報取得
  useEffect(() => {
    const fetchUserName = async () => {
      const { data } = await supabase
        .from('mst_user')
        .select('username')
        .eq('user_id', userId)
        .single();
      if (data) setUserName(data.username || '');
    };
    fetchUserName();
  }, [userId, supabase]);

  // 参加記録取得
  const fetchAttendances = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/attendance`, {
        cache: 'no-store',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setEventAttendances(data.eventAttendances);
      setGatherAttendances(data.gatherAttendances);
      setConsultationAttendances(data.consultationAttendances);
    } catch (e) {
      setError(e instanceof Error ? e.message : '参加記録の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAttendances();
  }, [fetchAttendances]);

  // イベント一覧取得（追加モーダル用）
  const fetchEventOptions = async () => {
    const { data } = await supabase
      .from('mst_event')
      .select(`
        event_id,
        event_name,
        event_start_datetime,
        event_type:mst_event_type(event_type_name),
        has_gather,
        has_consultation
      `)
      .is('deleted_at', null)
      .order('event_start_datetime', { ascending: false });

    if (data) {
      setEventOptions(data as unknown as EventOption[]);
    }
  };

  // 追加モーダルを開く
  const openAddModal = () => {
    fetchEventOptions();
    setSelectedEventId('');
    setAddIsOffline(true);
    setEventSearchTerm('');
    setIsAddModalOpen(true);
  };

  // 参加記録を追加
  const handleAdd = async () => {
    if (!selectedEventId) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/users/${userId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab,
          eventId: selectedEventId,
          isOffline: addIsOffline,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setIsAddModalOpen(false);
      await fetchAttendances();
    } catch (e) {
      alert(e instanceof Error ? e.message : '追加に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 参加記録を削除
  const handleDelete = async (type: Tab, eventId: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/users/${userId}/attendance`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, eventId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setConfirmAction(null);
      await fetchAttendances();
    } catch (e) {
      alert(e instanceof Error ? e.message : '削除に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 参加記録を復元
  const handleRestore = async (type: Tab, eventId: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/users/${userId}/attendance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, eventId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setConfirmAction(null);
      await fetchAttendances();
    } catch (e) {
      alert(e instanceof Error ? e.message : '復元に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 日付フォーマット
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
  };

  // 現在のタブのデータ
  const currentData = activeTab === 'event'
    ? eventAttendances
    : activeTab === 'gather'
      ? gatherAttendances
      : consultationAttendances;

  // アクティブ・削除済みを分離
  const activeRecords = currentData.filter(r => !r.deleted_at);
  const deletedRecords = currentData.filter(r => r.deleted_at);

  // フィルタ済みイベント
  const filteredEvents = eventOptions.filter(e => {
    if (!eventSearchTerm) return true;
    const term = eventSearchTerm.toLowerCase();
    return e.event_name.toLowerCase().includes(term) ||
      (e.event_type?.event_type_name || '').toLowerCase().includes(term);
  });

  // 追加モーダル用：タブに応じてフィルタ
  const availableEvents = activeTab === 'gather'
    ? filteredEvents.filter(e => e.has_gather)
    : activeTab === 'consultation'
      ? filteredEvents.filter(e => e.has_consultation)
      : filteredEvents;

  const tabLabels: Record<Tab, string> = {
    event: '定例会・イベント',
    gather: '懇親会',
    consultation: '個別相談',
  };

  if (isLoading) {
    return <div className={css({ p: '6', textAlign: 'center' })}>読み込み中...</div>;
  }

  if (error) {
    return <div className={css({ p: '6', textAlign: 'center', color: 'red.500' })}>{error}</div>;
  }

  return (
    <div className={css({ mx: 'auto', maxW: '1200px', p: { base: '3', md: '6' } })}>
      <div className={css({ bg: 'white', borderRadius: 'md', boxShadow: 'sm', p: '6' })}>
        {/* ヘッダー */}
        <div className={css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '6', flexWrap: 'wrap', gap: '3' })}>
          <div>
            <button
              onClick={() => router.push(`/user/edit/${userId}`)}
              className={css({ color: 'blue.500', fontSize: 'sm', cursor: 'pointer', _hover: { textDecoration: 'underline' } })}
            >
              ← ユーザー編集に戻る
            </button>
            <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', mt: '2' })}>
              参加記録管理
            </h1>
            <p className={css({ color: 'gray.600', fontSize: 'sm', mt: '1' })}>
              {userName} さんの参加記録
            </p>
          </div>
          <button
            onClick={openAddModal}
            className={css({
              px: '4', py: '2', bg: 'blue.500', color: 'white', borderRadius: 'md',
              fontWeight: 'medium', cursor: 'pointer', _hover: { bg: 'blue.600' },
              fontSize: 'sm',
            })}
          >
            + 参加記録を追加
          </button>
        </div>

        {/* タブ */}
        <div className={css({ display: 'flex', borderBottom: '2px solid', borderColor: 'gray.200', mb: '4', gap: '0' })}>
          {(Object.keys(tabLabels) as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={css({
                px: '4', py: '3', fontSize: 'sm', fontWeight: 'medium', cursor: 'pointer',
                borderBottom: '2px solid', mb: '-2px', transition: 'all 0.2s',
                borderColor: activeTab === tab ? 'blue.500' : 'transparent',
                color: activeTab === tab ? 'blue.600' : 'gray.500',
                _hover: { color: 'blue.500' },
              })}
            >
              {tabLabels[tab]}
              <span className={css({ ml: '1', fontSize: 'xs', color: 'gray.400' })}>
                ({(activeTab === tab ? activeRecords : (tab === 'event' ? eventAttendances : tab === 'gather' ? gatherAttendances : consultationAttendances).filter(r => !r.deleted_at)).length})
              </span>
            </button>
          ))}
        </div>

        {/* アクティブ記録テーブル */}
        <div className={css({ mb: '6' })}>
          <h3 className={css({ fontSize: 'md', fontWeight: 'semibold', mb: '3', color: 'gray.700' })}>
            参加中 ({activeRecords.length}件)
          </h3>
          {activeRecords.length === 0 ? (
            <p className={css({ color: 'gray.400', textAlign: 'center', py: '8', fontSize: 'sm' })}>
              参加記録がありません
            </p>
          ) : (
            <div className={css({ overflowX: 'auto' })}>
              <table className={css({ width: '100%', fontSize: 'sm' })}>
                <thead>
                  <tr className={css({ borderBottom: '1px solid', borderColor: 'gray.200' })}>
                    <th className={css({ py: '2', px: '3', textAlign: 'left', fontWeight: 'medium', color: 'gray.600' })}>イベント名</th>
                    <th className={css({ py: '2', px: '3', textAlign: 'left', fontWeight: 'medium', color: 'gray.600' })}>開催日</th>
                    <th className={css({ py: '2', px: '3', textAlign: 'left', fontWeight: 'medium', color: 'gray.600' })}>種別</th>
                    {activeTab === 'event' && (
                      <th className={css({ py: '2', px: '3', textAlign: 'left', fontWeight: 'medium', color: 'gray.600' })}>参加形態</th>
                    )}
                    {activeTab === 'gather' && (
                      <th className={css({ py: '2', px: '3', textAlign: 'left', fontWeight: 'medium', color: 'gray.600' })}>支払状態</th>
                    )}
                    <th className={css({ py: '2', px: '3', textAlign: 'left', fontWeight: 'medium', color: 'gray.600' })}>登録日</th>
                    <th className={css({ py: '2', px: '3', textAlign: 'center', fontWeight: 'medium', color: 'gray.600' })}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {activeRecords.map(record => (
                    <tr key={record.event_id} className={css({ borderBottom: '1px solid', borderColor: 'gray.100', _hover: { bg: 'gray.50' } })}>
                      <td className={css({ py: '3', px: '3', maxW: '300px' })}>
                        <div className={css({ fontWeight: 'medium', truncate: true })}>
                          {record.event?.event_name || '-'}
                        </div>
                      </td>
                      <td className={css({ py: '3', px: '3', whiteSpace: 'nowrap' })}>
                        {formatDate(record.event?.event_start_datetime || null)}
                      </td>
                      <td className={css({ py: '3', px: '3', whiteSpace: 'nowrap' })}>
                        <span className={css({ px: '2', py: '0.5', borderRadius: 'full', fontSize: 'xs', bg: 'blue.50', color: 'blue.700' })}>
                          {record.event?.event_type?.event_type_name || '-'}
                        </span>
                      </td>
                      {activeTab === 'event' && (
                        <td className={css({ py: '3', px: '3' })}>
                          {record.is_offline ? 'オフライン' : 'オンライン'}
                        </td>
                      )}
                      {activeTab === 'gather' && (
                        <td className={css({ py: '3', px: '3' })}>
                          <span className={css({
                            px: '2', py: '0.5', borderRadius: 'full', fontSize: 'xs',
                            bg: record.stripe_payment_status === 'succeeded' ? 'green.50' : record.stripe_payment_status === 'manual' ? 'yellow.50' : 'gray.50',
                            color: record.stripe_payment_status === 'succeeded' ? 'green.700' : record.stripe_payment_status === 'manual' ? 'yellow.700' : 'gray.700',
                          })}>
                            {record.stripe_payment_status === 'succeeded' ? '決済済' : record.stripe_payment_status === 'manual' ? '手動追加' : record.stripe_payment_status || '-'}
                          </span>
                        </td>
                      )}
                      <td className={css({ py: '3', px: '3', whiteSpace: 'nowrap' })}>
                        {formatDate(record.created_at)}
                      </td>
                      <td className={css({ py: '3', px: '3', textAlign: 'center' })}>
                        <button
                          onClick={() => setConfirmAction({
                            type: activeTab,
                            eventId: record.event_id,
                            eventName: record.event?.event_name || '',
                            action: 'delete',
                          })}
                          className={css({
                            px: '3', py: '1', fontSize: 'xs', borderRadius: 'md',
                            border: '1px solid', borderColor: 'red.300', color: 'red.600',
                            cursor: 'pointer', _hover: { bg: 'red.50' },
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
          )}
        </div>

        {/* 削除済み記録 */}
        {deletedRecords.length > 0 && (
          <div>
            <h3 className={css({ fontSize: 'md', fontWeight: 'semibold', mb: '3', color: 'gray.500' })}>
              削除済み ({deletedRecords.length}件)
            </h3>
            <div className={css({ overflowX: 'auto' })}>
              <table className={css({ width: '100%', fontSize: 'sm', opacity: 0.7 })}>
                <thead>
                  <tr className={css({ borderBottom: '1px solid', borderColor: 'gray.200' })}>
                    <th className={css({ py: '2', px: '3', textAlign: 'left', fontWeight: 'medium', color: 'gray.500' })}>イベント名</th>
                    <th className={css({ py: '2', px: '3', textAlign: 'left', fontWeight: 'medium', color: 'gray.500' })}>開催日</th>
                    <th className={css({ py: '2', px: '3', textAlign: 'left', fontWeight: 'medium', color: 'gray.500' })}>削除日</th>
                    <th className={css({ py: '2', px: '3', textAlign: 'center', fontWeight: 'medium', color: 'gray.500' })}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedRecords.map(record => (
                    <tr key={record.event_id} className={css({ borderBottom: '1px solid', borderColor: 'gray.100' })}>
                      <td className={css({ py: '3', px: '3' })}>
                        <div className={css({ textDecoration: 'line-through', color: 'gray.500' })}>
                          {record.event?.event_name || '-'}
                        </div>
                      </td>
                      <td className={css({ py: '3', px: '3', whiteSpace: 'nowrap' })}>
                        {formatDate(record.event?.event_start_datetime || null)}
                      </td>
                      <td className={css({ py: '3', px: '3', whiteSpace: 'nowrap' })}>
                        {formatDate(record.deleted_at)}
                      </td>
                      <td className={css({ py: '3', px: '3', textAlign: 'center' })}>
                        <button
                          onClick={() => setConfirmAction({
                            type: activeTab,
                            eventId: record.event_id,
                            eventName: record.event?.event_name || '',
                            action: 'restore',
                          })}
                          className={css({
                            px: '3', py: '1', fontSize: 'xs', borderRadius: 'md',
                            border: '1px solid', borderColor: 'green.300', color: 'green.600',
                            cursor: 'pointer', _hover: { bg: 'green.50' },
                          })}
                        >
                          復元
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 追加モーダル */}
      {isAddModalOpen && (
        <div className={css({
          position: 'fixed', inset: '0', bg: 'rgba(0,0,0,0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 50, p: '4',
        })}>
          <div className={css({
            bg: 'white', borderRadius: 'lg', p: '6', maxW: '600px', w: '100%',
            maxH: '80vh', overflowY: 'auto',
          })}>
            <h2 className={css({ fontSize: 'lg', fontWeight: 'bold', mb: '4' })}>
              {tabLabels[activeTab]}の参加記録を追加
            </h2>

            {/* イベント検索 */}
            <div className={css({ mb: '4' })}>
              <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: '1', color: 'gray.700' })}>
                イベントを選択
              </label>
              <input
                type="text"
                placeholder="イベント名で検索..."
                value={eventSearchTerm}
                onChange={e => setEventSearchTerm(e.target.value)}
                className={css({
                  w: '100%', px: '3', py: '2', border: '1px solid', borderColor: 'gray.300',
                  borderRadius: 'md', mb: '2', fontSize: 'sm', outline: 'none',
                  _focus: { borderColor: 'blue.500' },
                })}
              />
              <div className={css({
                maxH: '200px', overflowY: 'auto', border: '1px solid', borderColor: 'gray.200',
                borderRadius: 'md',
              })}>
                {availableEvents.length === 0 ? (
                  <p className={css({ p: '3', textAlign: 'center', color: 'gray.400', fontSize: 'sm' })}>
                    該当するイベントがありません
                  </p>
                ) : (
                  availableEvents.map(event => (
                    <button
                      key={event.event_id}
                      type="button"
                      onClick={() => setSelectedEventId(event.event_id)}
                      className={css({
                        w: '100%', textAlign: 'left', p: '3', cursor: 'pointer',
                        borderBottom: '1px solid', borderColor: 'gray.100',
                        bg: selectedEventId === event.event_id ? 'blue.50' : 'transparent',
                        _hover: { bg: selectedEventId === event.event_id ? 'blue.50' : 'gray.50' },
                        _last: { borderBottom: 'none' },
                      })}
                    >
                      <div className={css({ fontWeight: 'medium', fontSize: 'sm' })}>
                        {event.event_name}
                      </div>
                      <div className={css({ fontSize: 'xs', color: 'gray.500', mt: '0.5' })}>
                        {formatDate(event.event_start_datetime)} | {event.event_type?.event_type_name || '-'}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* イベント参加の場合、参加形態選択 */}
            {activeTab === 'event' && (
              <div className={css({ mb: '4' })}>
                <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: '1', color: 'gray.700' })}>
                  参加形態
                </label>
                <div className={css({ display: 'flex', gap: '4' })}>
                  <label className={css({ display: 'flex', alignItems: 'center', gap: '2', cursor: 'pointer', fontSize: 'sm' })}>
                    <input
                      type="radio"
                      name="isOffline"
                      checked={addIsOffline}
                      onChange={() => setAddIsOffline(true)}
                    />
                    オフライン
                  </label>
                  <label className={css({ display: 'flex', alignItems: 'center', gap: '2', cursor: 'pointer', fontSize: 'sm' })}>
                    <input
                      type="radio"
                      name="isOffline"
                      checked={!addIsOffline}
                      onChange={() => setAddIsOffline(false)}
                    />
                    オンライン
                  </label>
                </div>
              </div>
            )}

            {/* ボタン */}
            <div className={css({ display: 'flex', justifyContent: 'flex-end', gap: '3', mt: '4' })}>
              <button
                onClick={() => setIsAddModalOpen(false)}
                disabled={isSubmitting}
                className={css({
                  px: '4', py: '2', border: '1px solid', borderColor: 'gray.300',
                  borderRadius: 'md', fontSize: 'sm', cursor: 'pointer', _hover: { bg: 'gray.50' },
                })}
              >
                キャンセル
              </button>
              <button
                onClick={handleAdd}
                disabled={!selectedEventId || isSubmitting}
                className={css({
                  px: '4', py: '2', bg: 'blue.500', color: 'white', borderRadius: 'md',
                  fontSize: 'sm', cursor: 'pointer', _hover: { bg: 'blue.600' },
                  _disabled: { opacity: 0.5, cursor: 'not-allowed' },
                })}
              >
                {isSubmitting ? '追加中...' : '追加する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 確認ダイアログ */}
      {confirmAction && (
        <div className={css({
          position: 'fixed', inset: '0', bg: 'rgba(0,0,0,0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 50, p: '4',
        })}>
          <div className={css({ bg: 'white', borderRadius: 'lg', p: '6', maxW: '400px', w: '100%' })}>
            <h3 className={css({ fontSize: 'lg', fontWeight: 'bold', mb: '3' })}>
              {confirmAction.action === 'delete' ? '参加記録を削除' : '参加記録を復元'}
            </h3>
            <p className={css({ fontSize: 'sm', color: 'gray.600', mb: '4' })}>
              「{confirmAction.eventName}」の{tabLabels[confirmAction.type]}参加記録を
              {confirmAction.action === 'delete' ? '削除' : '復元'}しますか？
            </p>
            <div className={css({ display: 'flex', justifyContent: 'flex-end', gap: '3' })}>
              <button
                onClick={() => setConfirmAction(null)}
                disabled={isSubmitting}
                className={css({
                  px: '4', py: '2', border: '1px solid', borderColor: 'gray.300',
                  borderRadius: 'md', fontSize: 'sm', cursor: 'pointer',
                })}
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  if (confirmAction.action === 'delete') {
                    handleDelete(confirmAction.type, confirmAction.eventId);
                  } else {
                    handleRestore(confirmAction.type, confirmAction.eventId);
                  }
                }}
                disabled={isSubmitting}
                className={css({
                  px: '4', py: '2', borderRadius: 'md', fontSize: 'sm', cursor: 'pointer', color: 'white',
                  bg: confirmAction.action === 'delete' ? 'red.500' : 'green.500',
                  _hover: { bg: confirmAction.action === 'delete' ? 'red.600' : 'green.600' },
                  _disabled: { opacity: 0.5, cursor: 'not-allowed' },
                })}
              >
                {isSubmitting ? '処理中...' : confirmAction.action === 'delete' ? '削除する' : '復元する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
