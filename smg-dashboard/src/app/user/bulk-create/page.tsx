'use client';

import { css } from '@/styled-system/css';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface BulkCreateResult {
  successful: Array<{
    userName: string;
    email: string;
    password: string;
  }>;
  failed: Array<{
    userName: string;
    email: string;
    error: string;
  }>;
  invalid: Array<{
    userName: string;
    email: string;
    error: string;
  }>;
}

export default function UserBulkCreatePage() {
  const router = useRouter();
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BulkCreateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      setError(null);
    } else {
      setError('CSVファイルを選択してください');
      setCsvFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!csvFile) {
      setError('CSVファイルを選択してください');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('csvFile', csvFile);

      console.log('送信データ:', {
        fileName: csvFile.name,
        fileSize: csvFile.size,
      });

      const response = await fetch('/api/users/bulk-create', {
        method: 'POST',
        body: formData,
      });

      console.log('レスポンス状況:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('APIエラーレスポンス:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('成功レスポンス:', data);

      setResult(data.results);
    } catch (error) {
      console.error('バルクユーザー作成エラー:', error);

      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        setError(
          'サーバーへの接続に失敗しました。ネットワーク接続を確認してください。',
        );
      } else {
        setError(
          error instanceof Error
            ? error.message
            : 'ユーザーの一括作成に失敗しました',
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
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

  const buttonStyle = css({
    px: '4',
    py: '2',
    borderRadius: 'md',
    fontWeight: 'medium',
    cursor: 'pointer',
    transition: 'colors',
  });

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
            textAlign: 'center',
            mb: '6',
          })}
        >
          ユーザー一括作成
        </h1>

        {!result ? (
          <form
            onSubmit={handleSubmit}
            className={css({ display: 'grid', gap: '4' })}
          >
            <div className={css({ p: '4', bg: 'blue.50', borderRadius: 'md' })}>
              <h3 className={css({ fontWeight: 'bold', mb: '2' })}>
                CSVファイル形式
              </h3>
              <p
                className={css({ fontSize: 'sm', color: 'gray.600', mb: '2' })}
              >
                以下の形式でCSVファイルを作成してください（カンマ区切りまたはタブ区切り）：
              </p>
              <pre
                className={css({
                  fontSize: 'sm',
                  bg: 'white',
                  p: '2',
                  borderRadius: 'sm',
                })}
              >
                氏名,ふりがな,メールアドレス 下村 和也,しもむら
                かずや,kara@gmail.com 森山 陽介,もりやま
                ようすけ,oma2525@gmail.com
              </pre>
              <p className={css({ fontSize: 'sm', color: 'red.600', mt: '2' })}>
                ※ メールアドレスが空欄のユーザーは作成されません
              </p>
            </div>

            <label>
              CSVファイル <span className={css({ color: 'red.500' })}>*</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className={inputStyle}
                required
              />
            </label>

            {error && (
              <div
                className={css({
                  p: '3',
                  bg: 'red.50',
                  color: 'red.700',
                  borderRadius: 'md',
                })}
              >
                {error}
              </div>
            )}

            <div
              className={css({
                display: 'flex',
                gap: '4',
                justifyContent: 'center',
                mt: '6',
              })}
            >
              <button
                type="button"
                onClick={handleCancel}
                className={`${buttonStyle} ${css({
                  bg: 'gray.200',
                  color: 'gray.700',
                  _hover: { bg: 'gray.300' },
                })}`}
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`${buttonStyle} ${css({
                  bg: 'blue.500',
                  color: 'white',
                  _hover: { bg: 'blue.600' },
                  _disabled: { bg: 'gray.300', cursor: 'not-allowed' },
                })}`}
              >
                {isLoading ? '作成中...' : '一括作成'}
              </button>
            </div>
          </form>
        ) : (
          <div className={css({ display: 'grid', gap: '4' })}>
            <div
              className={css({ p: '4', bg: 'green.50', borderRadius: 'md' })}
            >
              <h3 className={css({ fontWeight: 'bold', color: 'green.700' })}>
                処理完了: {result.successful.length}件のユーザーを作成しました
              </h3>
            </div>

            {result.successful.length > 0 && (
              <div>
                <h4 className={css({ fontWeight: 'bold', mb: '2' })}>
                  作成成功
                </h4>
                <div
                  className={css({
                    maxH: '200px',
                    overflowY: 'auto',
                    border: '1px solid',
                    borderColor: 'gray.200',
                    borderRadius: 'md',
                  })}
                >
                  {result.successful.map((user, index) => (
                    <div
                      key={`success-${user.email}-${index}`}
                      className={css({
                        p: '2',
                        borderBottom: '1px solid',
                        borderColor: 'gray.100',
                      })}
                    >
                      <div>
                        {user.userName} ({user.email})
                      </div>
                      <div
                        className={css({ fontSize: 'sm', color: 'gray.600' })}
                      >
                        パスワード: {user.password}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.failed.length > 0 && (
              <div>
                <h4
                  className={css({
                    fontWeight: 'bold',
                    mb: '2',
                    color: 'red.600',
                  })}
                >
                  作成失敗
                </h4>
                <div
                  className={css({
                    maxH: '200px',
                    overflowY: 'auto',
                    border: '1px solid',
                    borderColor: 'red.200',
                    borderRadius: 'md',
                  })}
                >
                  {result.failed.map((user, index) => (
                    <div
                      key={`failed-${user.email}-${index}`}
                      className={css({
                        p: '2',
                        borderBottom: '1px solid',
                        borderColor: 'red.100',
                      })}
                    >
                      <div>
                        {user.userName} ({user.email})
                      </div>
                      <div
                        className={css({ fontSize: 'sm', color: 'red.600' })}
                      >
                        エラー: {user.error}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.invalid.length > 0 && (
              <div>
                <h4
                  className={css({
                    fontWeight: 'bold',
                    mb: '2',
                    color: 'orange.600',
                  })}
                >
                  無効なデータ
                </h4>
                <div
                  className={css({
                    maxH: '200px',
                    overflowY: 'auto',
                    border: '1px solid',
                    borderColor: 'orange.200',
                    borderRadius: 'md',
                  })}
                >
                  {result.invalid.map((user, index) => (
                    <div
                      key={`invalid-${user.email}-${index}`}
                      className={css({
                        p: '2',
                        borderBottom: '1px solid',
                        borderColor: 'orange.100',
                      })}
                    >
                      <div>
                        {user.userName} ({user.email})
                      </div>
                      <div
                        className={css({ fontSize: 'sm', color: 'orange.600' })}
                      >
                        エラー: {user.error}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div
              className={css({
                display: 'flex',
                gap: '4',
                justifyContent: 'center',
                mt: '6',
              })}
            >
              <button
                type="button"
                onClick={() => setResult(null)}
                className={`${buttonStyle} ${css({
                  bg: 'blue.500',
                  color: 'white',
                  _hover: { bg: 'blue.600' },
                })}`}
              >
                再度実行
              </button>
              <button
                type="button"
                onClick={() => router.push('/userlist')}
                className={`${buttonStyle} ${css({
                  bg: 'green.500',
                  color: 'white',
                  _hover: { bg: 'green.600' },
                })}`}
              >
                ユーザー一覧へ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
