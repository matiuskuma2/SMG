import { css } from '@/styled-system/css';
import { useEffect, useState } from 'react';
import { FormButtons } from '../ui/FormButton';
import type { UserFormData } from '../userlist/types';

interface UserFormProps {
  isEditing: boolean;
  initialData?: Partial<UserFormData>;
  onSubmit: (data: UserFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const inputStyle = css({
  border: '1px solid',
  borderColor: 'gray.300',
  p: '2',
  borderRadius: 'md',
  width: '100%',
  outline: 'none',
  _focus: { borderColor: 'blue.500' },
});

interface Representative {
  user_id: string;
  username: string | null;
  email: string;
  company_name: string | null;
}

export const UserForm = ({
  isEditing,
  initialData = {},
  onSubmit,
  onCancel,
  isLoading = false,
}: UserFormProps) => {
  const [userType, setUserType] = useState(initialData.userType || '');
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRepresentatives, setFilteredRepresentatives] = useState<
    Representative[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedRepresentativeId, setSelectedRepresentativeId] = useState(
    initialData.daihyoshaId || '',
  );
  const [selectedRepresentative, setSelectedRepresentative] =
    useState<Representative | null>(null);
  const [representativeError, setRepresentativeError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // 代表者ユーザーの一覧を取得
  useEffect(() => {
    const fetchRepresentatives = async () => {
      try {
        const response = await fetch('/api/representatives');

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '代表者情報の取得に失敗しました');
        }

        const { representatives } = await response.json();
        setRepresentatives(representatives);

        // 編集モードで既存の代表者が設定されている場合、検索フィールドに表示
        if (
          isEditing &&
          initialData.daihyoshaId &&
          representatives.length > 0
        ) {
          const selectedRep = representatives.find(
            (rep: Representative) => rep.user_id === initialData.daihyoshaId,
          );
          if (selectedRep) {
            setSelectedRepresentative(selectedRep);
            setSelectedRepresentativeId(selectedRep.user_id);
            setSearchTerm('');
          }
        }
      } catch (error) {
        console.error('代表者情報の取得に失敗しました:', error);
        // エラーハンドリング（トースト通知など）
      }
    };

    fetchRepresentatives();
  }, [isEditing, initialData.daihyoshaId]);

  // 検索フィルタリング
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredRepresentatives([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = representatives.filter(
      (rep) =>
        rep.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rep.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rep.company_name?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredRepresentatives(filtered);
    setShowSuggestions(true);
  }, [searchTerm, representatives]);

  const handleRepresentativeSelect = (representative: Representative) => {
    setSearchTerm('');
    setSelectedRepresentativeId(representative.user_id);
    setSelectedRepresentative(representative);
    setRepresentativeError('');
    setShowSuggestions(false);
  };

  const handleRepresentativeClear = () => {
    setSelectedRepresentativeId('');
    setSelectedRepresentative(null);
    setSearchTerm('');
    setShowSuggestions(false);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    // エラーメッセージをクリア
    setPasswordError('');
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // パスワードのバリデーションチェック
    if (!isEditing && password.length > 0 && password.length < 6) {
      setPasswordError('パスワードは6文字以上で入力してください');
      return;
    }

    if (isEditing && password.length > 0 && password.length < 6) {
      setPasswordError('パスワードは6文字以上で入力してください');
      return;
    }

    if (userType === 'パートナー' && !selectedRepresentativeId) {
      setRepresentativeError('代表者を選択してください');
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);

    const getString = (key: string): string =>
      formData.get(key)?.toString().trim() || '';

    const data: UserFormData = {
      id: initialData.id,
      userName: getString('userName'),
      userNameKana: getString('userNameKana') || undefined,
      email: getString('email'),
      companyName: getString('companyName'),
      companyNameKana: getString('companyNameKana'),
      password: getString('password') || undefined,
      birthDate: getString('birthDate') || undefined,
      userType: (getString('userType') as '代表者' | 'パートナー') || undefined,
      daihyoshaId: selectedRepresentativeId || undefined,
    };

    onSubmit(data);
  };

  return (
    <div className={css({ mx: 'auto', maxW: '900px', p: '3' })}>
      <form
        onSubmit={handleSubmit}
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
            textAlign: 'center',
            mb: '6',
          })}
        >
          {isEditing ? 'ユーザー編集' : 'ユーザー作成'}
        </h1>

        <div className={css({ display: 'grid', gap: '4' })}>
          <label>
            名前 <span className={css({ color: 'red.500' })}>*</span>
            <input
              name="userName"
              required
              defaultValue={initialData.userName}
              className={inputStyle}
            />
          </label>
          <label>
            ふりがな
            <input
              name="userNameKana"
              defaultValue={initialData.userNameKana}
              className={inputStyle}
            />
          </label>
          <label>
            生年月日
            <input
              type="date"
              name="birthDate"
              defaultValue={initialData.birthDate}
              className={inputStyle}
            />
          </label>
          <label>
            会社名 <span className={css({ color: 'red.500' })}>*</span>
            <input
              name="companyName"
              required
              className={inputStyle}
              defaultValue={initialData.companyName || ''}
            />
          </label>
          <label>
            会社名ふりがな <span className={css({ color: 'red.500' })}>*</span>
            <input
              name="companyNameKana"
              required
              defaultValue={initialData.companyNameKana || ''}
              className={inputStyle}
            />
          </label>
          <label>
            メールアドレス <span className={css({ color: 'red.500' })}>*</span>
            <input
              type="email"
              name="email"
              required
              defaultValue={initialData.email}
              className={inputStyle}
            />
          </label>
          <label>
            パスワード{' '}
            {!isEditing && <span className={css({ color: 'red.500' })}>*</span>}
            <input
              type="password"
              name="password"
              value={password}
              onChange={handlePasswordChange}
              required={!isEditing}
              className={inputStyle}
            />
            {passwordError && (
              <div
                className={css({ color: 'red.500', fontSize: 'sm', mt: '1' })}
              >
                {passwordError}
              </div>
            )}
            <div
              className={css({ color: 'gray.600', fontSize: 'sm', mt: '1' })}
            >
              6文字以上で入力してください
            </div>
          </label>
          <label>
            属性 <span className={css({ color: 'red.500' })}>*</span>
            <select
              name="userType"
              required
              value={userType}
              onChange={(e) =>
                setUserType(e.target.value as '代表者' | 'パートナー')
              }
              className={inputStyle}
            >
              <option value="">選択してください</option>
              <option value="代表者">代表者</option>
              <option value="パートナー">パートナー</option>
            </select>
          </label>

          {userType === 'パートナー' && (
            <label>
              代表者 <span className={css({ color: 'red.500' })}>*</span>
              <div className={css({ position: 'relative' })}>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="名前・メール・会社名で検索"
                  className={inputStyle}
                  aria-label="代表者を検索"
                />
                {showSuggestions && filteredRepresentatives.length > 0 && (
                  <div
                    className={css({
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bg: 'white',
                      border: '1px solid',
                      borderColor: 'gray.300',
                      borderRadius: 'md',
                      boxShadow: 'md',
                      maxH: '240px',
                      overflowY: 'auto',
                      zIndex: 10,
                    })}
                  >
                    {filteredRepresentatives.map((rep) => (
                      <button
                        key={rep.user_id}
                        type="button"
                        onClick={() => handleRepresentativeSelect(rep)}
                        className={css({
                          p: '3',
                          cursor: 'pointer',
                          borderBottom: '1px solid',
                          borderColor: 'gray.100',
                          _hover: { bg: 'gray.50' },
                          _last: { borderBottom: 'none' },
                          width: '100%',
                          textAlign: 'left',
                          bg: 'transparent',
                          border: 'none',
                        })}
                      >
                        <div className={css({ fontWeight: 'semibold' })}>
                          {rep.username || '名前未設定'}
                        </div>
                        <div
                          className={css({ fontSize: 'sm', color: 'gray.600' })}
                        >
                          {rep.email}
                        </div>
                        {rep.company_name && (
                          <div
                            className={css({
                              fontSize: 'xs',
                              color: 'gray.500',
                            })}
                          >
                            {rep.company_name}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                <div
                  className={css({
                    color: 'gray.600',
                    fontSize: 'sm',
                    mt: '1',
                  })}
                >
                  ※
                  検索のみの入力欄です。下の「選択中」に表示された代表者が保存されます
                </div>

                <div
                  className={css({
                    mt: '3',
                    p: '3',
                    border: '1px solid',
                    borderColor: 'gray.200',
                    borderRadius: 'md',
                    bg: 'gray.50',
                  })}
                >
                  <div
                    className={css({
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '3',
                    })}
                  >
                    <div>
                      <div
                        className={css({
                          fontSize: 'xs',
                          color: 'gray.600',
                          mb: '1',
                        })}
                      >
                        選択中
                      </div>
                      {selectedRepresentative ? (
                        <div>
                          <div className={css({ fontWeight: 'semibold' })}>
                            {selectedRepresentative.username || '名前未設定'}
                          </div>
                          <div
                            className={css({
                              fontSize: 'sm',
                              color: 'gray.600',
                            })}
                          >
                            {selectedRepresentative.email}
                          </div>
                          {selectedRepresentative.company_name && (
                            <div
                              className={css({
                                fontSize: 'xs',
                                color: 'gray.500',
                              })}
                            >
                              {selectedRepresentative.company_name}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          className={css({ fontSize: 'sm', color: 'red.500' })}
                        >
                          未選択
                        </div>
                      )}
                    </div>
                    {selectedRepresentative && (
                      <button
                        type="button"
                        onClick={handleRepresentativeClear}
                        className={css({
                          px: '3',
                          py: '1',
                          fontSize: 'sm',
                          borderRadius: 'md',
                          border: '1px solid',
                          borderColor: 'gray.300',
                          bg: 'white',
                          _hover: { bg: 'gray.100' },
                        })}
                      >
                        選択を解除
                      </button>
                    )}
                  </div>
                  {representativeError && (
                    <div
                      className={css({
                        color: 'red.500',
                        fontSize: 'sm',
                        mt: '2',
                      })}
                    >
                      {representativeError}
                    </div>
                  )}
                </div>
              </div>
            </label>
          )}
        </div>

        <div className={css({ mt: '6' })}>
          <FormButtons
            isEditing={isEditing}
            onCancel={onCancel}
            isSubmitting={isLoading}
          />
        </div>
      </form>
    </div>
  );
};
