import { css } from '@/styled-system/css';
import { FormButtons } from '../ui/FormButton';
import type { GroupFormData } from './types';

type GroupFormProps = {
  isEditing: boolean;
  initialData?: Partial<GroupFormData>;
  onSubmit: (data: GroupFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  isGroupNameEditable?: boolean;
  restrictedGroupNames?: string[];
};

const inputStyle = css({
  border: '1px solid',
  borderColor: 'gray.300',
  p: '2',
  borderRadius: 'md',
  width: '100%',
  outline: 'none',
  _focus: { borderColor: 'blue.500' },
  _disabled: {
    background: '#f3f3f3',
    color: 'gray.500',
    cursor: 'not-allowed',
  },
  _readOnly: {
    background: '#f3f3f3',
    color: 'gray.500',
    cursor: 'not-allowed',
  },
});

export const GroupForm = ({
  isEditing,
  initialData = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
  isGroupNameEditable = true,
  restrictedGroupNames = [
    '簿記講座',
    '運営',
    '講師',
    '未決済',
    '退会',
    '講師_質問受付グループ',
    '決済情報閲覧',
  ],
}: GroupFormProps) => {
  // デバッグログを追加
  console.log('=== GroupForm Props デバッグ ===');
  console.log('isEditing:', isEditing);
  console.log('initialData.title:', initialData.title);
  console.log('isGroupNameEditable:', isGroupNameEditable);
  console.log('restrictedGroupNames:', restrictedGroupNames);
  console.log('isSubmitting:', isSubmitting);
  console.log('============================');
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const getRequiredString = (key: string): string => {
      const value = formData.get(key);
      if (typeof value !== 'string' || value.trim() === '') {
        throw new Error(`Missing required field: ${key}`);
      }
      return value.trim();
    };

    const title = getRequiredString('title');

    // 新規作成時に制限されたグループ名をチェック
    if (!isEditing && restrictedGroupNames.includes(title)) {
      alert(
        `「${title}」は使用できないグループ名です。別の名前を入力してください。`,
      );
      return;
    }

    const data: GroupFormData = {
      group_id: initialData.group_id ?? '',
      title,
      description: getRequiredString('content'),
      created_at: initialData.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
      users: initialData.users ?? [],
    };

    onSubmit(data);
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
          {isEditing ? 'グループの編集' : 'グループの作成'}
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
              グループの内容
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
                placeholder="xxxxグループ"
                defaultValue={initialData.title}
                readOnly={!isGroupNameEditable}
                disabled={isSubmitting}
                ref={(el) => {
                  if (el) {
                    console.log('=== タイトル入力フィールド状態 ===');
                    console.log('disabled属性:', el.disabled);
                    console.log('value:', el.value);
                    console.log('isSubmitting:', isSubmitting);
                    console.log('isGroupNameEditable:', isGroupNameEditable);
                    console.log(
                      '計算されたdisabled:',
                      isSubmitting || !isGroupNameEditable,
                    );
                    console.log('==============================');
                  }
                }}
              />
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
              <textarea
                id="content"
                name="content"
                required
                rows={5}
                className={inputStyle}
                defaultValue={initialData.description}
                disabled={isSubmitting}
              />
            </div>
          </section>

          <FormButtons
            isEditing={isEditing}
            onCancel={onCancel}
            isSubmitting={isSubmitting}
          />

          {isSubmitting && (
            <div className={css({ textAlign: 'center', color: 'blue.600' })}>
              処理中...
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
