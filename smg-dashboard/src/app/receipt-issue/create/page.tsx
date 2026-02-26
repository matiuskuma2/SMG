'use client';

import { createClient } from '@/lib/supabase/client';
import { css } from '@/styled-system/css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ArrowLeft, Download, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ReceiptIssuePage() {
  const supabase = createClient();
  const router = useRouter();

  // 編集可能な状態管理
  const [recipientName, setRecipientName] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [description, setDescription] = useState('イベント参加費');
  const [remarks, setRemarks] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [amount, setAmount] = useState(5000);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // 固定値
  const registrationNumber = 'T4011101093309';
  const userEmail = 'user@example.com';

  // 税抜き金額計算（税込から逆算）
  const amountExcludingTax = Math.floor(amount / 1.1);

  // 消費税計算
  const taxAmount = amount - amountExcludingTax;

  // 数値をカンマ区切りでフォーマット
  type FormatNumber = (num: number) => string;

  const formatNumber: FormatNumber = (num) => {
    return num.toLocaleString();
  };

  useEffect(() => {
    // 初期値設定
    const today = new Date();
    const formattedDate = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
    setIssueDate(formattedDate);

    // ログインユーザー情報を取得し、領収書番号を生成
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }

      // 既存の領収書番号を取得
      const { data: existingReceipts } = await supabase
        .from('trn_receipt_history')
        .select('number');

      const existingNumbers = new Set(
        existingReceipts?.map((r) => r.number) || [],
      );

      // 重複しない領収書番号を生成
      let newNumber = generateReceiptNumber();
      while (existingNumbers.has(newNumber)) {
        newNumber = generateReceiptNumber();
      }
      setReceiptNumber(newNumber);
    };
    fetchUser();
  }, [supabase]);

  // 領収書番号生成
  const generateReceiptNumber = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomPart = '';
    for (let i = 0; i < 8; i++) {
      randomPart += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return `${year}${month}${day}-${randomPart}`;
  };

  // 金額入力のハンドラー
  interface AmountChangeEvent extends React.ChangeEvent<HTMLInputElement> {}

  const handleAmountChange = (e: AmountChangeEvent): void => {
    const value: string = e.target.value.replace(/[^\d]/g, '');
    const numValue: number = Number.parseInt(value) || 0;
    setAmount(numValue);
  };

  // PDF生成関数
  const generatePDF = async () => {
    const receiptElement = document.getElementById('receipt-content');

    if (!receiptElement) {
      throw new Error('領収書コンテンツが見つかりません。');
    }

    try {
      // PDF生成時のみ枠線を削除
      const originalBorder = receiptElement.style.border;
      receiptElement.style.border = 'none';

      // html2canvasのオプションを調整
      const canvas = await html2canvas(receiptElement, {
        scale: 2, // スケールを下げて安定性を向上
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: false,
        foreignObjectRendering: false,
        imageTimeout: 10000,
        removeContainer: false,
        width: receiptElement.scrollWidth,
        height: receiptElement.scrollHeight,
        x: 0,
        y: 0,
      });

      // 枠線を元に戻す
      receiptElement.style.border = originalBorder;

      const imgData = canvas.toDataURL('image/jpeg', 0.95); // JPEGで圧縮率を上げる
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // A4サイズに合わせて調整
      const pdfWidth = 210;
      const pdfHeight = 297;
      const imgWidth = pdfWidth - 20; // マージン考慮
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // 画像がページサイズを超える場合は調整
      let finalImgHeight = imgHeight;
      if (imgHeight > pdfHeight - 20) {
        finalImgHeight = pdfHeight - 20;
      }

      // 中央配置
      const x = (pdfWidth - imgWidth) / 2;
      const y = 10;

      pdf.addImage(imgData, 'JPEG', x, y, imgWidth, finalImgHeight);

      const fileName = `領収書_${description}_${new Date().toISOString().split('T')[0]}.pdf`;

      return {
        pdf,
        fileName,
      };
    } catch (error) {
      // エラーが発生した場合も枠線を元に戻す
      const receiptElement = document.getElementById('receipt-content');
      if (receiptElement) {
        receiptElement.style.border = '2px solid #333333';
      }
      console.error('PDF生成エラー:', error);
      throw new Error(
        'PDFの生成に失敗しました。ブラウザを更新してもう一度お試しください。',
      );
    }
  };

  // 領収書履歴を保存
  const saveReceiptHistory = async () => {
    if (!currentUserId) {
      throw new Error('ログインユーザー情報が取得できませんでした。');
    }

    // 領収書番号の重複チェック
    const { data: existingReceipt } = await supabase
      .from('trn_receipt_history')
      .select('number')
      .eq('number', receiptNumber)
      .maybeSingle();

    if (existingReceipt) {
      throw new Error(
        '領収書番号が重複しています。ページを更新して新しい番号を生成してください。',
      );
    }

    const { data, error } = await supabase
      .from('trn_receipt_history')
      .insert({
        user_id: currentUserId,
        number: receiptNumber,
        name: recipientName,
        amount: amount,
        description: description || null,
        notes: remarks || null,
        is_dashboard_issued: true,
      })
      .select()
      .single();

    if (error) {
      console.error('領収書履歴の保存エラー:', error);
      throw new Error('領収書履歴の保存に失敗しました。');
    }

    return data;
  };

  // PDFダウンロード処理
  const handleDownloadPDF = async () => {
    if (!recipientName.trim()) {
      alert('宛名を入力してください。');
      return;
    }

    if (amount <= 0) {
      alert('正しい金額を入力してください。');
      return;
    }

    if (!currentUserId) {
      alert('ログイン情報を確認できませんでした。再度ログインしてください。');
      return;
    }

    // ローディング表示のため、ボタンを無効化
    const downloadButton = document.querySelector(
      'button[type="button"]',
    ) as HTMLButtonElement;
    if (downloadButton) {
      downloadButton.disabled = true;
      downloadButton.textContent = 'PDF生成中...';
    }

    try {
      // 少し待機してからPDF生成を開始
      await new Promise((resolve) => setTimeout(resolve, 100));

      const { pdf, fileName } = await generatePDF();

      // 領収書履歴を保存
      await saveReceiptHistory();

      pdf.save(fileName);

      // 成功メッセージ
      alert('PDFが正常にダウンロードされ、履歴が保存されました。');

      // 領収書一覧ページにリダイレクト
      router.push('/receipt-issue');
    } catch (error) {
      console.error('PDF生成エラー:', error);
      alert(
        `PDFの生成に失敗しました。\n詳細: ${error instanceof Error ? error.message : '不明なエラー'}`,
      );
    } finally {
      // ボタンを元に戻す
      if (downloadButton) {
        downloadButton.disabled = false;
        downloadButton.textContent = 'PDFダウンロード';
      }
    }
  };

  return (
    <div
      className={css({
        maxWidth: '1400px',
        margin: '0 auto',
        backgroundColor: 'white',
        minHeight: '100vh',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        position: 'relative',
        padding: '2rem 1.5rem',
        '@media (max-width: 768px)': {
          padding: '1rem',
        },
      })}
    >
      {/* ヘッダー */}
      <div
        className={css({
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
        })}
      >
        <button
          type="button"
          onClick={() => router.push('/receipt-issue')}
          className={css({
            display: 'flex',
            alignItems: 'center',
            gap: '2',
            padding: '0.5rem 1rem',
            color: 'gray.700',
            backgroundColor: 'white',
            border: '1px solid',
            borderColor: 'gray.300',
            borderRadius: 'md',
            cursor: 'pointer',
            fontSize: 'sm',
            fontWeight: 'medium',
            transition: 'all 0.2s',
            _hover: {
              backgroundColor: 'gray.50',
              borderColor: 'gray.400',
            },
          })}
        >
          <ArrowLeft size={16} />
          一覧に戻る
        </button>
      </div>

      {/* メインコンテンツ：領収書と編集セクション */}
      <div
        className={css({
          display: 'flex',
          gap: '3rem',
          alignItems: 'flex-start',
          '@media (max-width: 1200px)': {
            flexDirection: 'column',
            gap: '2rem',
          },
        })}
      >
        {/* 領収書コンテンツ（左側） */}
        <div
          className={css({
            flex: '1',
            minWidth: '0',
            maxWidth: '800px',
          })}
        >
          {/* 領収書コンテンツ */}
          <div
            id="receipt-content"
            className={css({
              maxWidth: 'none',
              margin: '0',
              padding: '2.5rem',
              border: '2px solid #333333',
              borderRadius: '0',
              backgroundColor: 'white',
              height: 'fit-content',
              fontFamily:
                "'Noto Sans JP', 'Yu Gothic', 'YuGothic', 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', sans-serif",
              fontSize: '14px',
              lineHeight: '1.6',
              color: '#000000',
              width: '100%',
              boxSizing: 'border-box',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              overflow: 'visible',
            })}
          >
            {/* タイトル */}
            <div
              className={css({
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginBottom: '2rem',
              })}
            >
              <h1
                className={css({
                  fontSize: '32px',
                  fontWeight: 'bold',
                  marginBottom: '1.5rem',
                  textAlign: 'center',
                  color: '#000000',
                  letterSpacing: '0.1em',
                })}
              >
                領収書
              </h1>
            </div>

            {/* 宛名と発行者情報 */}
            <div
              className={css({
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '3rem',
                alignItems: 'flex-start',
                gap: '2rem',
              })}
            >
              <div className={css({ flex: '1', maxWidth: '400px' })}>
                <div
                  className={css({
                    padding: '0.75rem',
                    minWidth: '200px',
                    borderBottom: '1px solid #cccccc',
                    minHeight: '40px',
                    display: 'flex',
                    alignItems: 'center',
                  })}
                >
                  <span
                    className={css({ fontWeight: 'medium', fontSize: '16px' })}
                  >
                    {recipientName || '　'} 様
                  </span>
                </div>
              </div>
              <div
                className={css({
                  textAlign: 'right',
                  flex: '1',
                  fontSize: '14px',
                })}
              >
                <p className={css({ marginBottom: '0.25rem' })}>
                  発行日 {issueDate}
                </p>
                <p className={css({ marginBottom: '0.25rem' })}>
                  領収番号 {receiptNumber}
                </p>
                <p
                  className={css({
                    marginBottom: '0.25rem',
                    fontWeight: 'bold',
                    fontSize: '16px',
                  })}
                >
                  株式会社えびラーメンと
                  <br />
                  チョコレートモンブランが食べたい
                </p>
                <p className={css({ marginBottom: '0.25rem' })}>
                  〒160-0023 東京都新宿区西新宿7−7−25 ３階
                </p>
                <p className={css({ marginBottom: '0.25rem' })}>
                  登録番号 {registrationNumber}
                </p>
              </div>
            </div>

            {/* 金額セクション */}
            <div className={css({ textAlign: 'center', marginY: '2.5rem' })}>
              <p className={css({ marginBottom: '1.5rem', fontSize: '16px' })}>
                下記金額を領収いたしました。
              </p>
              <p
                className={css({
                  fontSize: '36px',
                  fontWeight: 'bold',
                  marginBottom: '1.5rem',
                  color: '#000000',
                })}
              >
                ¥{formatNumber(amount)}-
              </p>
            </div>

            {/* 詳細情報 */}
            <div
              className={css({
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '2rem',
                borderBottom: '2px solid #333333',
                paddingBottom: '1rem',
                fontSize: '14px',
                gap: '1rem',
              })}
            >
              <div className={css({ textAlign: 'center' })}>
                <p>領収日 {issueDate}</p>
              </div>
              <div className={css({ textAlign: 'right' })}>
                <p>但し{description}として</p>
              </div>
            </div>

            {/* 内訳テーブル */}
            <div className={css({ marginBottom: '2rem' })}>
              <p
                className={css({
                  textAlign: 'right',
                  marginBottom: '0.5rem',
                  fontSize: '12px',
                })}
              >
                単位: 円
              </p>
              <table
                className={css({
                  width: '100%',
                  borderCollapse: 'collapse',
                  border: '2px solid #333333',
                })}
              >
                <thead>
                  <tr>
                    <th
                      className={css({
                        padding: '12px',
                        textAlign: 'left',
                        fontWeight: 'bold',
                        width: '60%',
                        backgroundColor: '#f8f8f8',
                        border: '1px solid #333333',
                        borderRight: '2px solid #333333',
                        fontSize: '14px',
                      })}
                    >
                      内容
                    </th>
                    <th
                      className={css({
                        padding: '12px',
                        textAlign: 'right',
                        fontWeight: 'bold',
                        width: '40%',
                        backgroundColor: '#f8f8f8',
                        border: '1px solid #333333',
                        fontSize: '14px',
                      })}
                    >
                      金額(税込)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      className={css({
                        padding: '12px',
                        border: '1px solid #333333',
                        borderRight: '2px solid #333333',
                        verticalAlign: 'top',
                        fontSize: '14px',
                      })}
                    >
                      {description}
                      {remarks && (
                        <div
                          className={css({
                            fontSize: '12px',
                            color: '#666666',
                            marginTop: '0.25rem',
                          })}
                        >
                          {remarks}
                        </div>
                      )}
                    </td>
                    <td
                      className={css({
                        padding: '12px',
                        textAlign: 'right',
                        border: '1px solid #333333',
                        verticalAlign: 'top',
                        fontSize: '14px',
                        fontWeight: 'medium',
                      })}
                    >
                      {formatNumber(amount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 編集可能フィールド（右側） */}
        <div
          className={css({
            width: '380px',
            flexShrink: 0,
            '@media (max-width: 1200px)': {
              width: '100%',
              maxWidth: '500px',
              margin: '0 auto',
            },
          })}
        >
          <div
            className={css({
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 'lg',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              height: 'fit-content',
              position: 'sticky',
              top: '1rem',
            })}
          >
            <h2
              className={css({
                fontSize: 'lg',
                fontWeight: 'bold',
                marginBottom: '1.5rem',
                color: '#1e293b',
                borderBottom: '2px solid #3b82f6',
                paddingBottom: '0.5rem',
              })}
            >
              領収書情報の編集
            </h2>

            <div
              className={css({
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              })}
            >
              {/* 宛名入力 */}
              <div
                className={css({
                  backgroundColor: 'white',
                  padding: '1rem',
                  borderRadius: 'md',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                })}
              >
                <label
                  htmlFor="recipient"
                  className={css({
                    fontWeight: 'semibold',
                    marginBottom: '0.5rem',
                    display: 'block',
                    color: '#374151',
                    fontSize: 'sm',
                  })}
                >
                  宛名 <span className={css({ color: '#ef4444' })}>*</span>
                </label>
                <input
                  id="recipient"
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="例: 山田 太郎"
                  className={css({
                    width: '100%',
                    padding: '0.6rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: 'md',
                    fontSize: 'sm',
                    transition: 'all 0.2s',
                    _focus: {
                      outline: 'none',
                      borderColor: '#3b82f6',
                      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                      transform: 'translateY(-1px)',
                    },
                    _hover: {
                      borderColor: '#9ca3af',
                    },
                  })}
                />
              </div>

              {/* 金額入力 */}
              <div
                className={css({
                  backgroundColor: 'white',
                  padding: '1rem',
                  borderRadius: 'md',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                })}
              >
                <label
                  htmlFor="amount"
                  className={css({
                    fontWeight: 'semibold',
                    marginBottom: '0.5rem',
                    display: 'block',
                    color: '#374151',
                    fontSize: 'sm',
                  })}
                >
                  金額（税込）{' '}
                  <span className={css({ color: '#ef4444' })}>*</span>
                </label>
                <div className={css({ position: 'relative' })}>
                  <span
                    className={css({
                      position: 'absolute',
                      left: '0.6rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#6b7280',
                      fontSize: 'sm',
                      fontWeight: 'medium',
                    })}
                  >
                    ¥
                  </span>
                  <input
                    id="amount"
                    type="text"
                    value={formatNumber(amount)}
                    onChange={handleAmountChange}
                    placeholder="5,000"
                    className={css({
                      width: '100%',
                      padding: '0.6rem',
                      paddingLeft: '1.8rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: 'md',
                      fontSize: 'sm',
                      transition: 'all 0.2s',
                      _focus: {
                        outline: 'none',
                        borderColor: '#3b82f6',
                        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                        transform: 'translateY(-1px)',
                      },
                      _hover: {
                        borderColor: '#9ca3af',
                      },
                    })}
                  />
                </div>
                <div
                  className={css({
                    marginTop: '0.5rem',
                    padding: '0.5rem',
                    backgroundColor: '#f1f5f9',
                    borderRadius: 'sm',
                    border: '1px solid #cbd5e1',
                  })}
                >
                  <p
                    className={css({
                      fontSize: 'xs',
                      color: '#475569',
                      fontWeight: 'medium',
                    })}
                  >
                    消費税: ¥{formatNumber(taxAmount)} (10%)
                  </p>
                  <p
                    className={css({
                      fontSize: 'xs',
                      color: '#64748b',
                      marginTop: '0.25rem',
                    })}
                  >
                    税抜: ¥{formatNumber(amountExcludingTax)}
                  </p>
                </div>
              </div>

              {/* 発行日 */}
              <div
                className={css({
                  backgroundColor: 'white',
                  padding: '1rem',
                  borderRadius: 'md',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                })}
              >
                <label
                  htmlFor="issueDate"
                  className={css({
                    fontWeight: 'semibold',
                    marginBottom: '0.5rem',
                    display: 'block',
                    color: '#374151',
                    fontSize: 'sm',
                  })}
                >
                  発行日
                </label>
                <input
                  id="issueDate"
                  type="text"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  placeholder="2025年6月1日"
                  className={css({
                    width: '100%',
                    padding: '0.6rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: 'md',
                    fontSize: 'sm',
                    transition: 'all 0.2s',
                    _focus: {
                      outline: 'none',
                      borderColor: '#3b82f6',
                      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                      transform: 'translateY(-1px)',
                    },
                    _hover: {
                      borderColor: '#9ca3af',
                    },
                  })}
                />
              </div>

              {/* 領収書番号 */}
              <div
                className={css({
                  backgroundColor: 'white',
                  padding: '1rem',
                  borderRadius: 'md',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                })}
              >
                <label
                  htmlFor="receiptNumber"
                  className={css({
                    fontWeight: 'semibold',
                    marginBottom: '0.5rem',
                    display: 'block',
                    color: '#374151',
                    fontSize: 'sm',
                  })}
                >
                  領収書番号
                </label>
                <input
                  id="receiptNumber"
                  type="text"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  placeholder="250717-JPDOWCQR"
                  className={css({
                    width: '100%',
                    padding: '0.6rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: 'md',
                    fontSize: 'sm',
                    transition: 'all 0.2s',
                    _focus: {
                      outline: 'none',
                      borderColor: '#3b82f6',
                      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                      transform: 'translateY(-1px)',
                    },
                    _hover: {
                      borderColor: '#9ca3af',
                    },
                  })}
                />
              </div>

              {/* 但し書き */}
              <div
                className={css({
                  backgroundColor: 'white',
                  padding: '1rem',
                  borderRadius: 'md',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                })}
              >
                <label
                  htmlFor="description"
                  className={css({
                    fontWeight: 'semibold',
                    marginBottom: '0.5rem',
                    display: 'block',
                    color: '#374151',
                    fontSize: 'sm',
                  })}
                >
                  但し書き
                </label>
                <input
                  id="description"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="イベント参加費"
                  className={css({
                    width: '100%',
                    padding: '0.6rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: 'md',
                    fontSize: 'sm',
                    transition: 'all 0.2s',
                    _focus: {
                      outline: 'none',
                      borderColor: '#3b82f6',
                      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                      transform: 'translateY(-1px)',
                    },
                    _hover: {
                      borderColor: '#9ca3af',
                    },
                  })}
                />
              </div>

              {/* 備考 */}
              <div
                className={css({
                  backgroundColor: 'white',
                  padding: '1rem',
                  borderRadius: 'md',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                })}
              >
                <label
                  htmlFor="remarks"
                  className={css({
                    fontWeight: 'semibold',
                    marginBottom: '0.5rem',
                    display: 'block',
                    color: '#374151',
                    fontSize: 'sm',
                  })}
                >
                  備考{' '}
                  <span
                    className={css({ color: '#9ca3af', fontWeight: 'normal' })}
                  >
                    (任意)
                  </span>
                </label>
                <input
                  id="remarks"
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="追加情報（任意）"
                  className={css({
                    width: '100%',
                    padding: '0.6rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: 'md',
                    fontSize: 'sm',
                    transition: 'all 0.2s',
                    _focus: {
                      outline: 'none',
                      borderColor: '#3b82f6',
                      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                      transform: 'translateY(-1px)',
                    },
                    _hover: {
                      borderColor: '#9ca3af',
                    },
                  })}
                />
              </div>
            </div>

            {/* アクションボタン */}
            <div
              className={css({
                marginTop: '1.5rem',
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
              })}
            >
              <button
                type="button"
                onClick={handleDownloadPDF}
                className={css({
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  paddingX: '1.5rem',
                  paddingY: '0.75rem',
                  borderRadius: 'md',
                  fontWeight: 'medium',
                  transition: 'all 0.2s',
                  width: '100%',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 'sm',
                  _hover: {
                    backgroundColor: '#2563eb',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  },
                })}
              >
                <Download size={16} />
                PDFダウンロード
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
