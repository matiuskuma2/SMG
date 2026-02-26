import {
  DateValidationErrors,
  FieldDateError,
} from '@/components/ui/DateValidationErrors';
import { useEventDateValidation } from '@/hooks/useDateTimeValidation';
import { DEFAULT_PUBLISH_END_DATE } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';
import { css } from '@/styled-system/css';
import type { DateValidationError } from '@/utils/dateValidation';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RichTextEditor } from '../ui/RichTextEditor';
import { UnlimitedToggle } from '../ui/UnlimitedToggle';
import type { Group } from './GroupSelector';
import type { EventBasicInfoData, EventType } from './types';

type EventBasicInfoProps = {
  initialData?: EventBasicInfoData;
  onThumbnailChange: (file: File | null) => void;
  initialSelectedGroupIds?: string[];
  onGroupsChange?: (groupIds: string[]) => void;
  onValidationChange?: (errors: DateValidationError[]) => void;
};

export const EventBasicInfo = ({
  initialData = {},
  onThumbnailChange,
  initialSelectedGroupIds = [],
  onGroupsChange,
  onValidationChange,
}: EventBasicInfoProps) => {
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    initialData.image_url || null,
  );
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(
    initialSelectedGroupIds,
  );
  const [publishEndDateTime, setPublishEndDateTime] = useState(
    initialData.publish_end_at || '',
  );
  const [isUnlimited, setIsUnlimited] = useState(
    initialData.publish_end_at?.startsWith('2200') || false,
  );
  const [description, setDescription] = useState<string>(
    initialData.event_description || '',
  );

  // 日付フィールドの状態管理
  const [publishStartDateTime, setPublishStartDateTime] = useState(
    initialData.publish_start_at || '',
  );
  const [startDateTime, setStartDateTime] = useState(
    initialData.event_start_datetime || '',
  );
  const [endDateTime, setEndDateTime] = useState(
    initialData.event_end_datetime || '',
  );
  const [registrationStartDateTime, setRegistrationStartDateTime] = useState(
    initialData.registration_start_datetime || '',
  );
  const [registrationEndDateTime, setRegistrationEndDateTime] = useState(
    initialData.registration_end_datetime || '',
  );

  // 日付整合性チェックフック
  const { errors, hasErrors, updateAllFields, hasFieldError } =
    useEventDateValidation({
      publishStart: initialData.publish_start_at || undefined,
      publishEnd: isUnlimited
        ? DEFAULT_PUBLISH_END_DATE
        : initialData.publish_end_at || undefined,
      applicationStart: initialData.registration_start_datetime || undefined,
      applicationEnd: initialData.registration_end_datetime || undefined,
      eventStart: initialData.event_start_datetime || undefined,
      eventEnd: initialData.event_end_datetime || undefined,
    });

  // 日付変更時のバリデーション更新
  const updateValidation = useCallback(() => {
    updateAllFields({
      publishStart: publishStartDateTime,
      publishEnd: isUnlimited ? DEFAULT_PUBLISH_END_DATE : publishEndDateTime,
      applicationStart: registrationStartDateTime,
      applicationEnd: registrationEndDateTime,
      eventStart: startDateTime,
      eventEnd: endDateTime,
    });
  }, [
    publishStartDateTime,
    publishEndDateTime,
    isUnlimited,
    registrationStartDateTime,
    registrationEndDateTime,
    startDateTime,
    endDateTime,
    updateAllFields,
  ]);

  // 日付が変更されたらバリデーション実行
  useEffect(() => {
    updateValidation();
  }, [updateValidation]);

  // エラー状態を親コンポーネントに通知（エラー内容が変わった時のみ）
  const prevErrorsRef = useRef<string>('');
  useEffect(() => {
    const errorsKey = JSON.stringify(errors);
    if (errorsKey !== prevErrorsRef.current) {
      prevErrorsRef.current = errorsKey;
      onValidationChange?.(errors);
    }
  }, [errors, onValidationChange]);

  const supabase = createClient();

  // 無期限トグルの変更時の処理
  const handleUnlimitedChange = (checked: boolean) => {
    setIsUnlimited(checked);
    if (checked) {
      setPublishEndDateTime(DEFAULT_PUBLISH_END_DATE);
    } else {
      setPublishEndDateTime(initialData.publish_end_at || '');
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      onThumbnailChange(file);

      // 以前のプレビューURLがある場合は解放
      if (thumbnailPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(thumbnailPreview);
      }

      // 新しいプレビューURLを作成
      const objectUrl = URL.createObjectURL(file);
      setThumbnailPreview(objectUrl);
    }
  };

  // イベント区分を取得
  useEffect(() => {
    const fetchEventTypes = async () => {
      try {
        const { data, error } = await supabase
          .from('mst_event_type')
          .select('event_type_id, event_type_name')
          .order('event_type_id')
          .is('deleted_at', null);

        if (error) {
          throw error;
        }

        if (data) {
          console.log('EventBasicInfo - 取得した開催区分:', data);
          setEventTypes(
            data.map((type) => ({
              ...type,
              created_at: null,
              deleted_at: null,
              updated_at: null,
            })),
          );
        }
      } catch (error) {
        console.error('開催区分の取得に失敗しました:', error);
      }
    };

    fetchEventTypes();
  }, [supabase]);

  // グループを取得
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const { data, error } = await supabase
          .from('mst_group')
          .select('group_id, title, description')
          .is('deleted_at', null)
          .order('created_at', { ascending: true });

        if (error) {
          throw error;
        }

        if (data) {
          setGroups(data);
        }
      } catch (error) {
        console.error('グループの取得に失敗しました:', error);
      }
    };

    fetchGroups();
  }, [supabase]);

  // コンポーネントのアンマウント時にBlobURLを解放
  useEffect(() => {
    return () => {
      if (thumbnailPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [thumbnailPreview]);

  return (
    <section>
      <h2
        className={css({
          fontSize: 'lg',
          fontWeight: 'bold',
          mb: '4',
          borderLeft: '4px solid',
          borderColor: 'blue.500',
          pl: '2',
        })}
      >
        イベントの内容
      </h2>

      <div className={css({ mb: '4' })}>
        <label
          htmlFor="title"
          className={css({ display: 'block', mb: '2', fontWeight: 'medium' })}
        >
          イベント名 <span className={css({ color: 'red.500' })}>*</span>
        </label>
        <input
          id="title"
          type="text"
          name="title"
          required
          className={css({
            border: '1px solid',
            borderColor: 'gray.300',
            p: '2',
            borderRadius: 'md',
            width: '100%',
            outline: 'none',
            _focus: { borderColor: 'blue.500' },
          })}
          placeholder="例: 2023年7月定例会"
          defaultValue={initialData.event_name}
        />
      </div>

      <div className={css({ mb: '4' })}>
        <label
          htmlFor="thumbnailFile"
          className={css({ display: 'block', mb: '2', fontWeight: 'medium' })}
        >
          サムネイル
        </label>
        <div
          className={css({
            display: 'flex',
            flexDir: { base: 'column', md: 'row' },
            gap: '4',
            alignItems: { md: 'center' },
          })}
        >
          <div
            className={css({
              width: '200px',
              height: '150px',
              border: '1px dashed',
              borderColor: 'gray.300',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden',
              bg: 'white',
            })}
          >
            {thumbnailPreview ? (
              <Image
                src={thumbnailPreview}
                alt="サムネイルプレビュー"
                fill
                sizes="200px"
                style={{ objectFit: 'cover' }}
                priority
                unoptimized={thumbnailPreview.startsWith('blob:')}
              />
            ) : (
              <span className={css({ color: 'gray.500' })}>プレビュー</span>
            )}
          </div>
          <div className={css({ flex: '1' })}>
            <label
              htmlFor="thumbnailFile"
              className={css({
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2',
                bg: 'blue.500',
                color: 'white',
                px: '4',
                py: '2',
                borderRadius: 'md',
                cursor: 'pointer',
                fontSize: 'sm',
                fontWeight: 'medium',
                _hover: { bg: 'blue.600' },
                transition: 'background-color 0.2s',
              })}
            >
              画像を選択
              <input
                id="thumbnailFile"
                type="file"
                name="thumbnailFile"
                accept="image/jpeg,image/png"
                onChange={handleThumbnailChange}
                className={css({
                  position: 'absolute',
                  width: '1px',
                  height: '1px',
                  padding: '0',
                  margin: '-1px',
                  overflow: 'hidden',
                  clip: 'rect(0, 0, 0, 0)',
                  whiteSpace: 'nowrap',
                  border: '0',
                })}
              />
            </label>
          </div>
        </div>
      </div>

      {/* 日付整合性エラー表示 */}
      {hasErrors && <DateValidationErrors errors={errors} />}

      {/* 投稿期間 */}
      <div
        className={css({
          display: 'grid',
          gridTemplateColumns: { base: '1fr', md: '1fr 1fr' },
          gap: '4',
          mb: '4',
        })}
      >
        <div>
          <label
            htmlFor="publishStartDateTime"
            className={css({ display: 'block', mb: '2', fontWeight: 'medium' })}
          >
            投稿開始 <span className={css({ color: 'red.500' })}>*</span>
          </label>
          <div
            className={css({ display: 'flex', gap: '2', alignItems: 'center' })}
          >
            <input
              id="publishStartDateTime"
              type="datetime-local"
              name="publishStartDateTime"
              required
              autoComplete="one-time-code"
              value={publishStartDateTime}
              onChange={(e) => setPublishStartDateTime(e.target.value)}
              className={css({
                border: '1px solid',
                borderColor: hasFieldError('publishStart')
                  ? 'red.500'
                  : 'gray.300',
                p: '2',
                borderRadius: 'md',
                flex: '1',
                outline: 'none',
                _focus: { borderColor: 'blue.500' },
              })}
            />
          </div>
          <FieldDateError errors={errors} field="publishStart" />
        </div>
        <div>
          <div
            className={css({
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: '2',
            })}
          >
            <label
              htmlFor="publishEndDateTime"
              className={css({ fontWeight: 'medium' })}
            >
              投稿終了 <span className={css({ color: 'red.500' })}>*</span>
            </label>
            <UnlimitedToggle
              checked={isUnlimited}
              onChange={handleUnlimitedChange}
            />
          </div>
          <input
            id="publishEndDateTime"
            type="datetime-local"
            name="publishEndDateTime"
            required={!isUnlimited}
            disabled={isUnlimited}
            autoComplete="one-time-code"
            value={isUnlimited ? '' : publishEndDateTime}
            onChange={(e) => setPublishEndDateTime(e.target.value)}
            className={css({
              border: '1px solid',
              borderColor: hasFieldError('publishEnd') ? 'red.500' : 'gray.300',
              p: '2',
              borderRadius: 'md',
              width: '100%',
              outline: 'none',
              _focus: { borderColor: 'blue.500' },
              opacity: isUnlimited ? 0.5 : 1,
            })}
          />
          {isUnlimited && (
            <input
              type="hidden"
              name="publishEndDateTime"
              value={DEFAULT_PUBLISH_END_DATE}
            />
          )}
          <FieldDateError errors={errors} field="publishEnd" />
        </div>
      </div>

      {/* イベント日時 */}
      <div
        className={css({
          display: 'grid',
          gridTemplateColumns: { base: '1fr', md: '1fr 1fr' },
          gap: '4',
          mb: '4',
        })}
      >
        <div>
          <label
            htmlFor="startDateTime"
            className={css({ display: 'block', mb: '2', fontWeight: 'medium' })}
          >
            イベント開始 <span className={css({ color: 'red.500' })}>*</span>
          </label>
          <div
            className={css({ display: 'flex', gap: '2', alignItems: 'center' })}
          >
            <input
              id="startDateTime"
              type="datetime-local"
              name="startDateTime"
              required
              autoComplete="one-time-code"
              value={startDateTime}
              onChange={(e) => setStartDateTime(e.target.value)}
              className={css({
                border: '1px solid',
                borderColor: hasFieldError('eventStart')
                  ? 'red.500'
                  : 'gray.300',
                p: '2',
                borderRadius: 'md',
                flex: '1',
                outline: 'none',
                _focus: { borderColor: 'blue.500' },
              })}
            />
          </div>
          <FieldDateError errors={errors} field="eventStart" />
        </div>
        <div>
          <label
            htmlFor="endDateTime"
            className={css({ display: 'block', mb: '2', fontWeight: 'medium' })}
          >
            イベント終了 <span className={css({ color: 'red.500' })}>*</span>
          </label>
          <div
            className={css({ display: 'flex', gap: '2', alignItems: 'center' })}
          >
            <input
              id="endDateTime"
              type="datetime-local"
              name="endDateTime"
              required
              autoComplete="one-time-code"
              value={endDateTime}
              onChange={(e) => setEndDateTime(e.target.value)}
              className={css({
                border: '1px solid',
                borderColor: hasFieldError('eventEnd') ? 'red.500' : 'gray.300',
                p: '2',
                borderRadius: 'md',
                flex: '1',
                outline: 'none',
                _focus: { borderColor: 'blue.500' },
              })}
            />
          </div>
          <FieldDateError errors={errors} field="eventEnd" />
        </div>
      </div>

      {/* 申込期間 */}
      <div
        className={css({
          display: 'grid',
          gridTemplateColumns: { base: '1fr', md: '1fr 1fr' },
          gap: '4',
          mb: '4',
        })}
      >
        <div>
          <label
            htmlFor="registrationStartDateTime"
            className={css({ display: 'block', mb: '2', fontWeight: 'medium' })}
          >
            申込開始 <span className={css({ color: 'red.500' })}>*</span>
          </label>
          <div
            className={css({ display: 'flex', gap: '2', alignItems: 'center' })}
          >
            <input
              id="registrationStartDateTime"
              type="datetime-local"
              name="registrationStartDateTime"
              required
              autoComplete="one-time-code"
              value={registrationStartDateTime}
              onChange={(e) => setRegistrationStartDateTime(e.target.value)}
              className={css({
                border: '1px solid',
                borderColor: hasFieldError('applicationStart')
                  ? 'red.500'
                  : 'gray.300',
                p: '2',
                borderRadius: 'md',
                flex: '1',
                outline: 'none',
                _focus: { borderColor: 'blue.500' },
              })}
            />
          </div>
          <FieldDateError errors={errors} field="applicationStart" />
        </div>
        <div>
          <label
            htmlFor="registrationEndDateTime"
            className={css({ display: 'block', mb: '2', fontWeight: 'medium' })}
          >
            申込終了 <span className={css({ color: 'red.500' })}>*</span>
          </label>
          <div
            className={css({ display: 'flex', gap: '2', alignItems: 'center' })}
          >
            <input
              id="registrationEndDateTime"
              type="datetime-local"
              name="registrationEndDateTime"
              required
              autoComplete="one-time-code"
              value={registrationEndDateTime}
              onChange={(e) => setRegistrationEndDateTime(e.target.value)}
              className={css({
                border: '1px solid',
                borderColor: hasFieldError('applicationEnd')
                  ? 'red.500'
                  : 'gray.300',
                p: '2',
                borderRadius: 'md',
                flex: '1',
                outline: 'none',
                _focus: { borderColor: 'blue.500' },
              })}
            />
          </div>
          <FieldDateError errors={errors} field="applicationEnd" />
        </div>
      </div>

      {/* 場所 */}
      <div className={css({ mb: '4' })}>
        <label
          htmlFor="location"
          className={css({ display: 'block', mb: '2', fontWeight: 'medium' })}
        >
          場所 <span className={css({ color: 'red.500' })}>*</span>
        </label>
        <input
          id="location"
          type="text"
          name="location"
          required
          className={css({
            border: '1px solid',
            borderColor: 'gray.300',
            p: '2',
            borderRadius: 'md',
            width: '100%',
            outline: 'none',
            _focus: { borderColor: 'blue.500' },
          })}
          placeholder="例: 東京都渋谷区..."
          defaultValue={initialData.event_location}
        />
      </div>

      {/* 開催地域 */}
      <div className={css({ mb: '4' })}>
        <label
          htmlFor="region"
          className={css({ display: 'block', mb: '2', fontWeight: 'medium' })}
        >
          開催地域 <span className={css({ color: 'red.500' })}>*</span>
        </label>
        <select
          id="region"
          name="region"
          required
          className={css({
            border: '1px solid',
            borderColor: 'gray.300',
            p: '2',
            borderRadius: 'md',
            width: '100%',
            outline: 'none',
            _focus: { borderColor: 'blue.500' },
          })}
          defaultValue={initialData.event_city || ''}
        >
          <option value="">選択してください</option>
          <option value="東京">東京</option>
          <option value="大阪">大阪</option>
          <option value="福岡">福岡</option>
          <option value="仙台">仙台</option>
          <option value="名古屋">名古屋</option>
          <option value="オンライン">オンライン</option>
        </select>
      </div>

      {/* 定員数と表示グループ */}
      <div className={css({ mb: '4', display: 'flex', gap: '4' })}>
        {/* 定員数 */}
        <div className={css({ flex: '1' })}>
          <label
            htmlFor="capacity"
            className={css({ display: 'block', mb: '2', fontWeight: 'medium' })}
          >
            定員数 <span className={css({ color: 'red.500' })}>*</span>
          </label>
          <input
            id="capacity"
            type="number"
            name="capacity"
            required
            min="1"
            className={css({
              border: '1px solid',
              borderColor: 'gray.300',
              p: '2',
              borderRadius: 'md',
              width: '100%',
              outline: 'none',
              _focus: { borderColor: 'blue.500' },
            })}
            defaultValue={initialData.event_capacity}
          />
        </div>

        {/* 表示グループ（複数選択） */}
        <div className={css({ flex: '1.2' })}>
          <label
            htmlFor="visible_group_ids"
            className={css({ display: 'block', mb: '2', fontWeight: 'medium' })}
          >
            表示グループ
          </label>
          <div
            className={css({
              border: '1px solid',
              borderColor: 'gray.300',
              borderRadius: 'md',
              maxHeight: '120px',
              overflowY: 'auto',
              p: '2',
              bg: 'white',
            })}
          >
            {groups.length === 0 ? (
              <div className={css({ color: 'gray.500', fontSize: 'sm' })}>
                グループを読み込み中...
              </div>
            ) : (
              groups.map((group) => (
                <label
                  key={group.group_id}
                  className={css({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2',
                    mb: '2',
                    cursor: 'pointer',
                    _last: { mb: '0' },
                  })}
                >
                  <input
                    type="checkbox"
                    name="visible_group_ids"
                    value={group.group_id}
                    checked={selectedGroupIds.includes(group.group_id)}
                    onChange={(e) => {
                      let newGroupIds: string[];
                      if (e.target.checked) {
                        newGroupIds = [...selectedGroupIds, group.group_id];
                      } else {
                        newGroupIds = selectedGroupIds.filter(
                          (id) => id !== group.group_id,
                        );
                      }
                      setSelectedGroupIds(newGroupIds);
                      onGroupsChange?.(newGroupIds);
                    }}
                    className={css({
                      cursor: 'pointer',
                    })}
                  />
                  <span className={css({ fontSize: 'sm' })}>{group.title}</span>
                </label>
              ))
            )}
          </div>
          <div className={css({ color: 'red.600', mt: '2' })}>
            <div className={css({ fontSize: 'sm' })}>
              表示するグループを選択したい場合は、こちらからお選びください。
            </div>
            <div className={css({ fontSize: 'sm' })}>
              ※何も選ばない場合は全員に表示されます。
            </div>
          </div>
        </div>
      </div>

      {/* 開催区分 */}
      <div className={css({ mb: '4' })}>
        <label
          htmlFor="eventType"
          className={css({ display: 'block', mb: '2', fontWeight: 'medium' })}
        >
          開催区分 <span className={css({ color: 'red.500' })}>*</span>
        </label>
        <div className={css({ display: 'flex', flexWrap: 'wrap', gap: '4' })}>
          {eventTypes.length > 0 ? (
            eventTypes.map((type) => {
              const isChecked = initialData.event_type === type.event_type_id;

              return (
                <label
                  key={type.event_type_id}
                  className={css({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2',
                  })}
                >
                  <input
                    type="radio"
                    name="event_type"
                    value={type.event_type_id}
                    defaultChecked={isChecked}
                    required
                  />
                  {type.event_type_name}
                </label>
              );
            })
          ) : (
            <>
              <label
                className={css({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2',
                })}
              >
                <input type="radio" name="eventType" value="pdca" disabled />
                読み込み中...
              </label>
            </>
          )}
        </div>
      </div>

      {/* 説明文 */}
      <div className={css({ mb: '6' })}>
        <label
          htmlFor="description"
          className={css({ display: 'block', mb: '2', fontWeight: 'medium' })}
        >
          説明文 <span className={css({ color: 'red.500' })}>*</span>
        </label>
        <RichTextEditor
          name="description"
          value={description}
          onChange={setDescription}
          placeholder="説明文を入力してください..."
        />
      </div>
    </section>
  );
};
