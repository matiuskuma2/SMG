'use client';

import { css } from '@/styled-system/css';
import { useState } from 'react';

// ---------- 型定義 ----------

interface MissingRecord {
  sessionId: string;
  paymentIntent: string;
  eventId: string;
  eventName: string;
  userId: string;
  userName: string;
  userEmail: string;
  selectedTypes: string[];
  participationType: string | null;
  amountTotal: number;
  paidAt: string;
  missingTables: string[];
}

interface RepairedTable {
  table: string;
  status: 'success' | 'error';
  error?: string;
}

interface RepairResult extends MissingRecord {
  repairedTables: RepairedTable[];
}

interface DryRunResponse {
  mode: 'dry-run';
  totalStripeSessions: number;
  missingCount: number;
  missingRecords: MissingRecord[];
}

interface ExecuteResponse {
  mode: 'execute';
  totalStripeSessions: number;
  repairedCount: number;
  successCount: number;
  errorCount: number;
  results: RepairResult[];
}

// ---------- ヘルパー ----------

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function tableLabel(table: string): string {
  switch (table) {
    case 'trn_gather_attendee':
      return '懇親会';
    case 'trn_event_attendee':
      return 'イベント';
    case 'trn_consultation_attendee':
      return '個別相談';
    default:
      return table;
  }
}

// ---------- コンポーネント ----------

export default function RepairAttendeesPage() {
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [dryRunData, setDryRunData] = useState<DryRunResponse | null>(null);
  const [executeData, setExecuteData] = useState<ExecuteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDryRun = async () => {
    setLoading(true);
    setError(null);
    setDryRunData(null);
    setExecuteData(null);

    try {
      const res = await fetch('/api/repair-attendees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'dry-run' }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }

      const data: DryRunResponse = await res.json();
      setDryRunData(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '不明なエラー');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (
      !window.confirm(
        `${dryRunData?.missingCount || 0}件の未反映データを復元します。よろしいですか？`,
      )
    ) {
      return;
    }

    setExecuting(true);
    setError(null);
    setExecuteData(null);

    try {
      const res = await fetch('/api/repair-attendees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'execute' }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }

      const data: ExecuteResponse = await res.json();
      setExecuteData(data);
      setDryRunData(null); // ドライラン結果をクリア
    } catch (e) {
      setError(e instanceof Error ? e.message : '不明なエラー');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className={css({ p: '6', maxW: '1400px', mx: 'auto' })}>
      {/* ヘッダー */}
      <div className={css({ mb: '6' })}>
        <h1
          className={css({
            fontSize: '2xl',
            fontWeight: 'bold',
            color: 'gray.800',
            mb: '2',
          })}
        >
          イベント申込データ復元ツール
        </h1>
        <p className={css({ color: 'gray.600', fontSize: 'sm' })}>
          Stripeの決済データとDBの参加者テーブルを突合し、未反映のデータを検出・復元します。
        </p>
      </div>

      {/* アクションボタン */}
      <div
        className={css({
          display: 'flex',
          gap: '4',
          mb: '6',
          flexWrap: 'wrap',
        })}
      >
        <button
          type="button"
          onClick={handleDryRun}
          disabled={loading || executing}
          className={css({
            px: '6',
            py: '3',
            bg: loading ? 'gray.400' : 'blue.600',
            color: 'white',
            rounded: 'lg',
            fontWeight: 'bold',
            cursor: loading || executing ? 'not-allowed' : 'pointer',
            _hover: { bg: loading || executing ? 'gray.400' : 'blue.700' },
            transition: 'all 0.2s',
          })}
        >
          {loading ? '🔄 チェック中...' : '🔍 ドライラン（差分チェック）'}
        </button>

        {dryRunData && dryRunData.missingCount > 0 && (
          <button
            type="button"
            onClick={handleExecute}
            disabled={executing}
            className={css({
              px: '6',
              py: '3',
              bg: executing ? 'gray.400' : 'red.600',
              color: 'white',
              rounded: 'lg',
              fontWeight: 'bold',
              cursor: executing ? 'not-allowed' : 'pointer',
              _hover: { bg: executing ? 'gray.400' : 'red.700' },
              transition: 'all 0.2s',
            })}
          >
            {executing
              ? '🔄 復元実行中...'
              : `⚡ 復元実行（${dryRunData.missingCount}件）`}
          </button>
        )}
      </div>

      {/* エラー表示 */}
      {error && (
        <div
          className={css({
            p: '4',
            bg: 'red.50',
            border: '1px solid',
            borderColor: 'red.300',
            rounded: 'lg',
            mb: '6',
            color: 'red.700',
          })}
        >
          <strong>エラー: </strong>
          {error}
        </div>
      )}

      {/* ドライラン結果 */}
      {dryRunData && (
        <div className={css({ mb: '6' })}>
          {/* サマリー */}
          <div
            className={css({
              display: 'flex',
              gap: '4',
              mb: '4',
              flexWrap: 'wrap',
            })}
          >
            <div
              className={css({
                p: '4',
                bg: 'white',
                rounded: 'lg',
                boxShadow: 'sm',
                minW: '200px',
              })}
            >
              <div
                className={css({
                  fontSize: 'sm',
                  color: 'gray.500',
                  mb: '1',
                })}
              >
                Stripe決済セッション数
              </div>
              <div
                className={css({
                  fontSize: '2xl',
                  fontWeight: 'bold',
                  color: 'blue.600',
                })}
              >
                {dryRunData.totalStripeSessions}件
              </div>
            </div>
            <div
              className={css({
                p: '4',
                bg: 'white',
                rounded: 'lg',
                boxShadow: 'sm',
                minW: '200px',
              })}
            >
              <div
                className={css({
                  fontSize: 'sm',
                  color: 'gray.500',
                  mb: '1',
                })}
              >
                未反映データ数
              </div>
              <div
                className={css({
                  fontSize: '2xl',
                  fontWeight: 'bold',
                  color:
                    dryRunData.missingCount > 0 ? 'red.600' : 'green.600',
                })}
              >
                {dryRunData.missingCount}件
              </div>
            </div>
          </div>

          {/* 未反映なし */}
          {dryRunData.missingCount === 0 && (
            <div
              className={css({
                p: '6',
                bg: 'green.50',
                border: '1px solid',
                borderColor: 'green.300',
                rounded: 'lg',
                textAlign: 'center',
                color: 'green.700',
                fontWeight: 'bold',
              })}
            >
              ✅ 全ての決済データがDBに正しく反映されています。未反映データはありません。
            </div>
          )}

          {/* 未反映一覧 */}
          {dryRunData.missingCount > 0 && (
            <div className={css({ overflowX: 'auto' })}>
              <table
                className={css({
                  w: '100%',
                  bg: 'white',
                  rounded: 'lg',
                  boxShadow: 'sm',
                  borderCollapse: 'collapse',
                  fontSize: 'sm',
                })}
              >
                <thead>
                  <tr
                    className={css({
                      bg: 'gray.100',
                      borderBottom: '2px solid',
                      borderColor: 'gray.300',
                    })}
                  >
                    <th className={css({ p: '3', textAlign: 'left' })}>#</th>
                    <th className={css({ p: '3', textAlign: 'left' })}>
                      決済日
                    </th>
                    <th className={css({ p: '3', textAlign: 'left' })}>
                      イベント名
                    </th>
                    <th className={css({ p: '3', textAlign: 'left' })}>
                      ユーザー
                    </th>
                    <th className={css({ p: '3', textAlign: 'left' })}>
                      申込タイプ
                    </th>
                    <th className={css({ p: '3', textAlign: 'right' })}>
                      金額
                    </th>
                    <th className={css({ p: '3', textAlign: 'left' })}>
                      未反映テーブル
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dryRunData.missingRecords.map((r, i) => (
                    <tr
                      key={r.sessionId}
                      className={css({
                        borderBottom: '1px solid',
                        borderColor: 'gray.200',
                        _hover: { bg: 'gray.50' },
                      })}
                    >
                      <td className={css({ p: '3', color: 'gray.500' })}>
                        {i + 1}
                      </td>
                      <td className={css({ p: '3', whiteSpace: 'nowrap' })}>
                        {formatDate(r.paidAt)}
                      </td>
                      <td
                        className={css({
                          p: '3',
                          fontWeight: 'medium',
                          maxW: '250px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        })}
                      >
                        {r.eventName}
                      </td>
                      <td className={css({ p: '3' })}>
                        <div className={css({ fontWeight: 'medium' })}>
                          {r.userName}
                        </div>
                        <div
                          className={css({
                            fontSize: 'xs',
                            color: 'gray.500',
                          })}
                        >
                          {r.userEmail}
                        </div>
                      </td>
                      <td className={css({ p: '3' })}>
                        {r.selectedTypes.map((t) => (
                          <span
                            key={t}
                            className={css({
                              display: 'inline-block',
                              px: '2',
                              py: '0.5',
                              mr: '1',
                              mb: '1',
                              rounded: 'md',
                              fontSize: 'xs',
                              fontWeight: 'medium',
                              bg:
                                t === 'Event'
                                  ? 'blue.100'
                                  : t === 'Networking'
                                    ? 'orange.100'
                                    : 'purple.100',
                              color:
                                t === 'Event'
                                  ? 'blue.700'
                                  : t === 'Networking'
                                    ? 'orange.700'
                                    : 'purple.700',
                            })}
                          >
                            {t === 'Event'
                              ? 'イベント'
                              : t === 'Networking'
                                ? '懇親会'
                                : '個別相談'}
                          </span>
                        ))}
                      </td>
                      <td
                        className={css({
                          p: '3',
                          textAlign: 'right',
                          whiteSpace: 'nowrap',
                        })}
                      >
                        ¥{r.amountTotal.toLocaleString()}
                      </td>
                      <td className={css({ p: '3' })}>
                        {r.missingTables.map((t) => (
                          <span
                            key={t}
                            className={css({
                              display: 'inline-block',
                              px: '2',
                              py: '0.5',
                              mr: '1',
                              mb: '1',
                              rounded: 'md',
                              fontSize: 'xs',
                              fontWeight: 'bold',
                              bg: 'red.100',
                              color: 'red.700',
                            })}
                          >
                            {tableLabel(t)}
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 実行結果 */}
      {executeData && (
        <div className={css({ mb: '6' })}>
          {/* サマリー */}
          <div
            className={css({
              display: 'flex',
              gap: '4',
              mb: '4',
              flexWrap: 'wrap',
            })}
          >
            <div
              className={css({
                p: '4',
                bg: 'white',
                rounded: 'lg',
                boxShadow: 'sm',
                minW: '200px',
              })}
            >
              <div
                className={css({
                  fontSize: 'sm',
                  color: 'gray.500',
                  mb: '1',
                })}
              >
                復元対象
              </div>
              <div
                className={css({
                  fontSize: '2xl',
                  fontWeight: 'bold',
                  color: 'blue.600',
                })}
              >
                {executeData.repairedCount}件
              </div>
            </div>
            <div
              className={css({
                p: '4',
                bg: 'white',
                rounded: 'lg',
                boxShadow: 'sm',
                minW: '200px',
              })}
            >
              <div
                className={css({
                  fontSize: 'sm',
                  color: 'gray.500',
                  mb: '1',
                })}
              >
                成功
              </div>
              <div
                className={css({
                  fontSize: '2xl',
                  fontWeight: 'bold',
                  color: 'green.600',
                })}
              >
                {executeData.successCount}件
              </div>
            </div>
            {executeData.errorCount > 0 && (
              <div
                className={css({
                  p: '4',
                  bg: 'white',
                  rounded: 'lg',
                  boxShadow: 'sm',
                  minW: '200px',
                })}
              >
                <div
                  className={css({
                    fontSize: 'sm',
                    color: 'gray.500',
                    mb: '1',
                  })}
                >
                  エラー
                </div>
                <div
                  className={css({
                    fontSize: '2xl',
                    fontWeight: 'bold',
                    color: 'red.600',
                  })}
                >
                  {executeData.errorCount}件
                </div>
              </div>
            )}
          </div>

          {/* 結果テーブル */}
          <div className={css({ overflowX: 'auto' })}>
            <table
              className={css({
                w: '100%',
                bg: 'white',
                rounded: 'lg',
                boxShadow: 'sm',
                borderCollapse: 'collapse',
                fontSize: 'sm',
              })}
            >
              <thead>
                <tr
                  className={css({
                    bg: 'gray.100',
                    borderBottom: '2px solid',
                    borderColor: 'gray.300',
                  })}
                >
                  <th className={css({ p: '3', textAlign: 'left' })}>#</th>
                  <th className={css({ p: '3', textAlign: 'left' })}>
                    イベント名
                  </th>
                  <th className={css({ p: '3', textAlign: 'left' })}>
                    ユーザー
                  </th>
                  <th className={css({ p: '3', textAlign: 'left' })}>
                    復元結果
                  </th>
                </tr>
              </thead>
              <tbody>
                {executeData.results.map((r, i) => (
                  <tr
                    key={r.sessionId}
                    className={css({
                      borderBottom: '1px solid',
                      borderColor: 'gray.200',
                      _hover: { bg: 'gray.50' },
                    })}
                  >
                    <td className={css({ p: '3', color: 'gray.500' })}>
                      {i + 1}
                    </td>
                    <td className={css({ p: '3', fontWeight: 'medium' })}>
                      {r.eventName}
                    </td>
                    <td className={css({ p: '3' })}>
                      <div className={css({ fontWeight: 'medium' })}>
                        {r.userName}
                      </div>
                    </td>
                    <td className={css({ p: '3' })}>
                      {r.repairedTables.map((t) => (
                        <span
                          key={t.table}
                          className={css({
                            display: 'inline-block',
                            px: '2',
                            py: '0.5',
                            mr: '1',
                            mb: '1',
                            rounded: 'md',
                            fontSize: 'xs',
                            fontWeight: 'bold',
                            bg:
                              t.status === 'success'
                                ? 'green.100'
                                : 'red.100',
                            color:
                              t.status === 'success'
                                ? 'green.700'
                                : 'red.700',
                          })}
                        >
                          {tableLabel(t.table)}:{' '}
                          {t.status === 'success' ? '✅' : `❌ ${t.error}`}
                        </span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 注意事項 */}
      <div
        className={css({
          p: '4',
          bg: 'yellow.50',
          border: '1px solid',
          borderColor: 'yellow.300',
          rounded: 'lg',
          mt: '6',
        })}
      >
        <h3
          className={css({
            fontWeight: 'bold',
            color: 'yellow.800',
            mb: '2',
          })}
        >
          ⚠️ 注意事項
        </h3>
        <ul
          className={css({
            color: 'yellow.700',
            fontSize: 'sm',
            listStyle: 'disc',
            pl: '5',
          })}
        >
          <li>
            ドライランは読み取り専用です。DBに変更を加えません。
          </li>
          <li>
            復元実行はupsert（存在すれば更新、なければ挿入）で行うため、既存データを破壊しません。
          </li>
          <li>
            Stripeの全決済セッションをスキャンするため、ドライランの完了まで数十秒〜数分かかる場合があります。
          </li>
          <li>
            このツールは復元完了後に削除されます。
          </li>
        </ul>
      </div>
    </div>
  );
}
