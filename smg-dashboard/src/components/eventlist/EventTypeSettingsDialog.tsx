'use client';

import { css } from '@/styled-system/css';
import { createClient } from '@/lib/supabase/client';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';

interface EventTypeItem {
  event_type_id: string;
  event_type_name: string;
  show_in_event_list: boolean;
}

interface EventTypeSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EventTypeSettingsDialog: React.FC<
  EventTypeSettingsDialogProps
> = ({ isOpen, onClose }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const supabase = createClient();
  const [eventTypes, setEventTypes] = useState<EventTypeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // ダイアログの開閉制御
  useEffect(() => {
    const dialogElement = dialogRef.current;
    if (!dialogElement) return;

    if (isOpen) {
      dialogElement.showModal();
    } else {
      dialogElement.close();
    }

    return () => {
      if (dialogElement.open) {
        dialogElement.close();
      }
    };
  }, [isOpen]);

  // イベントタイプデータの取得
  useEffect(() => {
    if (!isOpen) return;

    const fetchEventTypes = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('mst_event_type')
          .select('event_type_id, event_type_name, show_in_event_list')
          .is('deleted_at', null)
          .order('created_at', { ascending: true });

        if (error) throw error;

        setEventTypes(
          (data || []).map((item) => ({
            event_type_id: item.event_type_id,
            event_type_name: item.event_type_name,
            // show_in_event_listがnullの場合はデフォルトtrueとして扱う
            show_in_event_list: item.show_in_event_list !== false,
          })),
        );
      } catch (error) {
        console.error('イベントタイプの取得に失敗:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventTypes();
  }, [isOpen, supabase]);

  // チェックボックス切り替え
  const handleToggle = (eventTypeId: string) => {
    setEventTypes((prev) =>
      prev.map((item) =>
        item.event_type_id === eventTypeId
          ? { ...item, show_in_event_list: !item.show_in_event_list }
          : item,
      ),
    );
    setSaveMessage(null);
  };

  // 保存処理
  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      // 各イベントタイプのshow_in_event_listを更新
      for (const eventType of eventTypes) {
        const { error } = await supabase
          .from('mst_event_type')
          .update({ show_in_event_list: eventType.show_in_event_list })
          .eq('event_type_id', eventType.event_type_id);

        if (error) throw error;
      }

      setSaveMessage('保存しました');
      // 2秒後にメッセージを消す
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (error) {
      console.error('保存に失敗:', error);
      setSaveMessage('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 背景クリックで閉じる
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  // コンテンツクリックの伝播を防止
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className={css({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        bg: 'transparent',
        border: 'none',
        p: 0,
        m: 0,
        width: { base: '90%', sm: '480px' },
        maxW: '560px',
        zIndex: 50,
        '&::backdrop': {
          bg: 'rgba(0, 0, 0, 0.5)',
        },
      })}
      onClick={handleBackdropClick}
      aria-labelledby="event-type-settings-title"
      aria-modal="true"
    >
      <div
        className={css({
          bg: 'white',
          rounded: 'md',
          p: 6,
          shadow: 'xl',
          width: '100%',
        })}
        onClick={handleContentClick}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onClose();
          }
        }}
      >
        <h3
          id="event-type-settings-title"
          className={css({
            fontSize: 'lg',
            fontWeight: 'bold',
            mb: 2,
          })}
        >
          イベントタイプ表示設定
        </h3>
        <p
          className={css({
            fontSize: 'sm',
            color: 'gray.500',
            mb: 4,
          })}
        >
          チェックを入れたイベントタイプは、会員サイトの「講座・イベント予約一覧」に表示されます。
        </p>

        {isLoading ? (
          <div
            className={css({
              py: 8,
              textAlign: 'center',
              color: 'gray.500',
            })}
          >
            読み込み中...
          </div>
        ) : (
          <div
            className={css({
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              mb: 6,
              maxH: '300px',
              overflowY: 'auto',
            })}
          >
            {eventTypes.map((eventType) => (
              <label
                key={eventType.event_type_id}
                className={css({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  p: 3,
                  rounded: 'md',
                  border: '1px solid',
                  borderColor: 'gray.200',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  _hover: { bg: 'gray.50', borderColor: 'gray.300' },
                })}
              >
                <input
                  type="checkbox"
                  checked={eventType.show_in_event_list}
                  onChange={() => handleToggle(eventType.event_type_id)}
                  className={css({
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    accentColor: '#2563eb',
                  })}
                />
                <span
                  className={css({
                    fontSize: 'sm',
                    fontWeight: 'medium',
                  })}
                >
                  {eventType.event_type_name}
                </span>
                {!eventType.show_in_event_list && (
                  <span
                    className={css({
                      fontSize: 'xs',
                      color: 'gray.400',
                      ml: 'auto',
                    })}
                  >
                    専用タブのみ
                  </span>
                )}
              </label>
            ))}
          </div>
        )}

        {/* 保存メッセージ */}
        {saveMessage && (
          <p
            className={css({
              fontSize: 'sm',
              mb: 3,
              color: saveMessage === '保存しました' ? 'green.600' : 'red.600',
              textAlign: 'center',
            })}
          >
            {saveMessage}
          </p>
        )}

        {/* ボタン */}
        <div
          className={css({
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 3,
          })}
        >
          <button
            type="button"
            onClick={onClose}
            className={css({
              px: 4,
              py: 2,
              rounded: 'md',
              border: '1px solid',
              borderColor: 'gray.300',
              fontSize: 'sm',
              cursor: 'pointer',
              _hover: { bg: 'gray.50' },
            })}
          >
            閉じる
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className={css({
              px: 4,
              py: 2,
              rounded: 'md',
              bg: 'blue.600',
              color: 'white',
              fontSize: 'sm',
              cursor: 'pointer',
              _hover: { bg: 'blue.700' },
              _disabled: { opacity: 0.5, cursor: 'not-allowed' },
            })}
          >
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </dialog>
  );
};
