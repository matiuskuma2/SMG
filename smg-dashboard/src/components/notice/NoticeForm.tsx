import {
  DateValidationErrors,
  FieldDateError,
} from '@/components/ui/DateValidationErrors';
import { useSimpleDateValidation } from '@/hooks/useDateTimeValidation';
import { DEFAULT_PUBLISH_END_DATE } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';
import { css } from '@/styled-system/css';
import { useCallback, useEffect, useState } from 'react';
import { FormActionButtons } from '../ui/FormActionButtons';
import { RichTextEditor } from '../ui/RichTextEditor';
import { UnlimitedToggle } from '../ui/UnlimitedToggle';
import { NoticeFileUploader } from './NoticeFileUploader';
import type { NoticeCategoryBasic, NoticeFile, NoticeFormData } from './types';

type Group = {
  group_id: string;
  title: string;
  description: string | null;
};

type NoticeFormProps = {
  isEditing: boolean;
  initialData?: Partial<NoticeFormData>;
  onSubmit: (data: NoticeFormData, isDraft?: boolean) => void;
  onCancel: () => void;
  loading?: boolean;
};

const inputStyle = css({
  border: '1px solid',
  borderColor: 'gray.300',
  p: '2',
  borderRadius: 'md',
  width: '100%',
  outline: 'none',
  _focus: { borderColor: 'blue.500' },
});

export const NoticeForm = ({
  isEditing,
  initialData = {},
  onSubmit,
  onCancel,
  loading = false,
}: NoticeFormProps) => {
  const [description, setDescription] = useState<string>(
    initialData.content || '',
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialData.category_id || '',
  );
  const [categories, setCategories] = useState<NoticeCategoryBasic[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(
    initialData.visible_group_ids || [],
  );
  const [publishStartAt, setPublishStartAt] = useState(
    initialData.publish_start_at || '',
  );
  const [publishEndAt, setPublishEndAt] = useState(
    initialData.publish_end_at?.toString() || '',
  );
  const [isUnlimited, setIsUnlimited] = useState(
    initialData.publish_end_at?.toString().startsWith('2200') || false,
  );
  const [files, setFiles] = useState<NoticeFile[]>(initialData.files || []);
  const supabase = createClient();

  // 日付整合性チェック
  const { errors, hasErrors, updateAllFields, hasFieldError } =
    useSimpleDateValidation(
      {
        start: initialData.publish_start_at,
        end: isUnlimited
          ? DEFAULT_PUBLISH_END_DATE
          : initialData.publish_end_at?.toString(),
      },
      '投稿開始',
      '投稿終了',
    );

  // 日付変更時のバリデーション更新
  const updateValidation = useCallback(() => {
    updateAllFields({
      start: publishStartAt,
      end: isUnlimited ? DEFAULT_PUBLISH_END_DATE : publishEndAt,
    });
  }, [publishStartAt, publishEndAt, isUnlimited, updateAllFields]);

  // 日付が変更されたらバリデーション実行
  useEffect(() => {
    updateValidation();
  }, [updateValidation]);

  // 無期限トグルの変更時の処理
  const handleUnlimitedChange = (checked: boolean) => {
    setIsUnlimited(checked);
    if (checked) {
      setPublishEndAt(DEFAULT_PUBLISH_END_DATE);
    } else {
      setPublishEndAt(initialData.publish_end_at?.toString() || '');
    }
  };

  // カテゴリーデータを取得
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('mst_notice_category')
          .select('category_id, category_name')
          .is('deleted_at', null)
          .order('created_at');

        if (error) throw error;

        setCategories(data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, [supabase]);

  // グループデータを取得
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

  // initialDataが変更されたときにstateを更新
  useEffect(() => {
    setDescription(initialData.content || '');
    setSelectedCategory(initialData.category_id || '');
    setSelectedGroupIds(initialData.visible_group_ids || []);
    setFiles(initialData.files || []);
  }, [
    initialData.content,
    initialData.category_id,
    initialData.visible_group_ids,
    initialData.files,
  ]);

  const handleSubmit = (
    e: React.FormEvent<HTMLFormElement>,
    isDraft = false,
  ) => {
    e.preventDefault();

    // 日付整合性エラーがある場合は送信をブロック
    if (hasErrors) {
      console.error('日付整合性エラーがあります:', errors);
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);

    const getRequiredString = (key: string): string => {
      const value = formData.get(key);
      if (typeof value !== 'string' || value.trim() === '') {
        throw new Error(`Missing required field: ${key}`);
      }
      return value.trim();
    };

    const getOptionalString = (key: string): string | null => {
      const value = formData.get(key);
      return typeof value === 'string' && value.trim() !== ''
        ? value.trim()
        : null;
    };

    const data: NoticeFormData = {
      title: getRequiredString('title'),
      content: description,
      publish_start_at: getRequiredString('publish_start_at'),
      publish_end_at: getOptionalString('publish_end_at'),
      category_id: selectedCategory || null,
      visible_group_ids: selectedGroupIds,
      files: files,
    };

    onSubmit(data, isDraft);
  };

  const handleSaveDraft = () => {
    const form = document.querySelector('form');
    if (form instanceof HTMLFormElement) {
      const syntheticEvent = {
        preventDefault: () => {},
        currentTarget: form,
      } as React.FormEvent<HTMLFormElement>;
      handleSubmit(syntheticEvent, true);
    }
  };

  return (
    <div className={css({ mx: 'auto', maxW: '900px', p: '3' })}>
      <div
        className={css({
          p: '6',
          bg: 'white',
          borderRadius: 'md',
          boxShadow: 'sm',
          mt: '8',
          mb: '8',
        })}
      >
        <h1
          className={css({
            fontSize: '2xl',
            fontWeight: 'bold',
            mb: '6',
            textAlign: 'center',
            borderBottom: '1px solid',
            borderColor: 'gray.200',
            pb: '4',
          })}
        >
          {isEditing ? 'お知らせの編集' : 'お知らせの作成'}
        </h1>

        <form
          onSubmit={handleSubmit}
          className={css({ display: 'flex', flexDir: 'column', gap: '6' })}
        >
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
              お知らせの内容
            </h2>

            {/* タイトル */}
            <div className={css({ mb: '4' })}>
              <label
                htmlFor="title"
                className={css({
                  display: 'block',
                  mb: '2',
                  fontWeight: 'medium',
                })}
              >
                タイトル <span className={css({ color: 'red.500' })}>*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                className={inputStyle}
                placeholder="例: 2023年7月定例会"
                defaultValue={initialData.title}
                disabled={loading}
              />
            </div>

            {/* カテゴリー */}
            <div className={css({ mb: '4' })}>
              <label
                htmlFor="category_id"
                className={css({
                  display: 'block',
                  mb: '2',
                  fontWeight: 'medium',
                })}
              >
                カテゴリー
              </label>
              <select
                id="category_id"
                name="category_id"
                className={inputStyle}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                disabled={loading || categoriesLoading}
              >
                <option value="">カテゴリーを選択してください</option>
                {categories.map((category) => (
                  <option
                    key={category.category_id}
                    value={category.category_id}
                  >
                    {category.category_name}
                  </option>
                ))}
              </select>
              {categoriesLoading && (
                <p
                  className={css({
                    fontSize: 'sm',
                    color: 'gray.500',
                    mt: '1',
                  })}
                >
                  カテゴリーを読み込み中...
                </p>
              )}
            </div>

            {/* 日付整合性エラー表示 */}
            {hasErrors && <DateValidationErrors errors={errors} />}

            {/* 開始・終了日時 */}
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
                  htmlFor="publish_start_at"
                  className={css({
                    display: 'block',
                    mb: '2',
                    fontWeight: 'medium',
                  })}
                >
                  投稿開始日時{' '}
                  <span className={css({ color: 'red.500' })}>*</span>
                </label>
                <input
                  id="publish_start_at"
                  name="publish_start_at"
                  type="datetime-local"
                  required
                  autoComplete="one-time-code"
                  value={publishStartAt}
                  onChange={(e) => setPublishStartAt(e.target.value)}
                  className={css({
                    border: '1px solid',
                    borderColor: hasFieldError('start')
                      ? 'red.500'
                      : 'gray.300',
                    p: '2',
                    borderRadius: 'md',
                    width: '100%',
                    outline: 'none',
                    _focus: { borderColor: 'blue.500' },
                  })}
                  disabled={loading}
                />
                <FieldDateError errors={errors} field="start" />
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
                    htmlFor="publish_end_at"
                    className={css({ fontWeight: 'medium' })}
                  >
                    投稿終了日時{' '}
                    <span className={css({ color: 'red.500' })}>*</span>
                  </label>
                  <UnlimitedToggle
                    checked={isUnlimited}
                    onChange={handleUnlimitedChange}
                    disabled={loading}
                  />
                </div>
                <input
                  id="publish_end_at"
                  name="publish_end_at"
                  type="datetime-local"
                  required={!isUnlimited}
                  disabled={isUnlimited || loading}
                  autoComplete="one-time-code"
                  value={isUnlimited ? '' : publishEndAt}
                  onChange={(e) => setPublishEndAt(e.target.value)}
                  className={css({
                    border: '1px solid',
                    borderColor: hasFieldError('end') ? 'red.500' : 'gray.300',
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
                    name="publish_end_at"
                    value={DEFAULT_PUBLISH_END_DATE}
                  />
                )}
                <FieldDateError errors={errors} field="end" />
              </div>
            </div>

            {/* 説明文 */}
            <div className={css({ mb: '6' })}>
              <label
                htmlFor="content"
                className={css({
                  display: 'block',
                  mb: '2',
                  fontWeight: 'medium',
                })}
              >
                説明文 <span className={css({ color: 'red.500' })}>*</span>
              </label>
              <RichTextEditor
                name="content"
                value={description}
                onChange={setDescription}
                placeholder="説明文を入力してください..."
                disabled={loading}
              />
            </div>

            {/* 表示グループ */}
            <div className={css({ mb: '4' })}>
              <label
                htmlFor="visible_group_ids"
                className={css({
                  display: 'block',
                  mb: '2',
                  fontWeight: 'medium',
                })}
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
                          if (e.target.checked) {
                            setSelectedGroupIds([
                              ...selectedGroupIds,
                              group.group_id,
                            ]);
                          } else {
                            setSelectedGroupIds(
                              selectedGroupIds.filter(
                                (id) => id !== group.group_id,
                              ),
                            );
                          }
                        }}
                        disabled={loading}
                        className={css({
                          cursor: 'pointer',
                        })}
                      />
                      <span className={css({ fontSize: 'sm' })}>
                        {group.title}
                      </span>
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

            {/* ファイルアップロード */}
            <NoticeFileUploader
              initialFiles={files}
              onChange={(updatedFiles) => setFiles(updatedFiles)}
            />
          </section>

          <FormActionButtons
            isEditing={isEditing}
            onCancel={onCancel}
            onSaveDraft={handleSaveDraft}
            isSubmitting={loading}
          />
        </form>
      </div>
    </div>
  );
};
