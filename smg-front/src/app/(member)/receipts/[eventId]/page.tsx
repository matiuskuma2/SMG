'use client';

import { css } from '@/styled-system/css';
import { ArrowLeft, Download, Mail } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface ReceiptData {
	event_id: string;
	event_name: string;
	payment_amount: number;
	payment_date: string;
	stripe_payment_intent_id: string;
	receipt_download_count: number;
	user_email: string;
	user_name: string;
}

interface ReceiptHistory {
	receipt_id: string;
	number: string;
	name: string;
	amount: number;
	description: string | null;
	is_dashboard_issued: boolean | null;
	is_email_issued: boolean | null;
	created_at: string;
}

export default function ReceiptPage() {
	const params = useParams();
	const router = useRouter();
	const eventId = params.eventId as string;
	const { user } = useAuth();
	const [recipientName, setRecipientName] = useState('');
	const [receiptNumber, setReceiptNumber] = useState('');
	const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [remainingDownloads, setRemainingDownloads] = useState(2);
	const [maxDownloads] = useState(2);
	const [receiptHistory, setReceiptHistory] = useState<ReceiptHistory[]>([]);
	const [historyLoading, setHistoryLoading] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);

	// Stripe APIから領収書番号を取得
	const fetchReceiptNumber = async (stripePaymentIntentId: string) => {
		console.log('=== フロントエンド: 領収書番号取得開始 ===');
		console.log('リクエストするPayment Intent ID:', stripePaymentIntentId);

		try {
			console.log('🔄 APIリクエスト送信中...');
			const response = await fetch('/api/receipts/stripe-receipt-number', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					stripe_payment_intent_id: stripePaymentIntentId,
				}),
			});

			console.log('APIレスポンス:', {
				status: response.status,
				statusText: response.statusText,
				ok: response.ok
			});

			if (!response.ok) {
				const errorData = await response.json();
				console.error('❌ APIエラーレスポンス:', errorData);
				throw new Error('領収書番号の取得に失敗しました');
			}

			const data = await response.json();
			console.log('取得した領収書番号:', data.receipt_number);
			setReceiptNumber(data.receipt_number);
		} catch (error) {
			console.error('❌ 領収書番号取得エラー:', error);
			console.log('🔄 フォールバック: generateReceiptNumber()を使用');
			// エラーが発生した場合はフォールバック
			const fallbackNumber = generateReceiptNumber();
			console.log('フォールバック領収書番号:', fallbackNumber);
			setReceiptNumber(fallbackNumber);
		}
	};

	// trn_gather_attendeeテーブルから領収書データを取得
	useEffect(() => {
		const fetchReceiptData = async () => {
			console.log('=== フロントエンド: 領収書データ取得開始 ===');
			console.log('Event ID:', eventId);
			console.log('User ID:', user?.id);

			if (!user) {
				console.log('❌ ユーザーが認証されていません');
				return;
			}

			try {
				const supabase = createClient();

				console.log('🔄 trn_gather_attendeeテーブルからデータを取得中...');
				// trn_gather_attendeeテーブルからデータを取得
				const { data, error } = await supabase
					.from('trn_gather_attendee')
					.select(`
						event_id,
						payment_amount,
						payment_date,
						stripe_payment_intent_id,
						receipt_download_count,
						mst_event (
							event_name
						)
					`)
					.eq('event_id', eventId)
					.eq('user_id', user.id)
					.is('deleted_at', null)
					.single();

				console.log('Supabaseクエリレスポンス:', { data, error });

				if (error) {
					console.error('❌ 領収書データの取得に失敗しました:', error);
					setError('領収書データが見つかりません。');
					return;
				}

				if (!data) {
					console.log('❌ 該当する領収書が見つかりません');
					setError('該当する領収書が見つかりません。');
					return;
				}

				console.log('✅ 領収書データ取得成功:', data);

				// ユーザー情報を取得
				console.log('🔄 ユーザー情報を取得中...');
				const { data: userData, error: userError } = await supabase
					.from('mst_user')
					.select('email, username')
					.eq('user_id', user.id)
					.single();

				console.log('ユーザー情報クエリレスポンス:', { userData, userError });

				if (userError) {
					console.error('❌ ユーザー情報の取得に失敗しました:', userError);
					setError('ユーザー情報の取得に失敗しました。');
					return;
				}

				console.log('✅ ユーザー情報取得成功:', userData);

				const receiptData = {
					event_id: data.event_id,
					event_name: data.mst_event?.event_name || 'イベント名不明',
					payment_amount: data.payment_amount || 0,
					payment_date: data.payment_date || '',
					stripe_payment_intent_id: data.stripe_payment_intent_id || '',
					receipt_download_count: data.receipt_download_count || 0,
					user_email: userData.email || '',
					user_name: userData.username || '',
				};

				console.log('組み立てた領収書データ:', receiptData);
				setReceiptData(receiptData);

				// 初期宛名は空欄にする（ユーザーが入力）
				setRecipientName('');

				// Stripe APIから領収書番号を取得
				if (receiptData.stripe_payment_intent_id) {
					console.log('🔄 Stripe APIから領収書番号を取得します');
					await fetchReceiptNumber(receiptData.stripe_payment_intent_id);
					// 領収書発行履歴を取得
					await fetchReceiptHistory(receiptData.stripe_payment_intent_id);
				} else {
					console.log('⚠️ stripe_payment_intent_idが無いため、フォールバック番号を生成します');
					// stripe_payment_intent_idが無い場合はフォールバック
					const fallbackNumber = generateReceiptNumber();
					console.log('フォールバック領収書番号:', fallbackNumber);
					setReceiptNumber(fallbackNumber);
				}
			} catch (error) {
				console.error('❌ データ取得中にエラーが発生しました:', error);
				setError('データの取得に失敗しました。');
			} finally {
				setLoading(false);
			}
		};

		fetchReceiptData();
	}, [user, eventId]);

	// 領収書番号
	const generateReceiptNumber = () => {
		// 現在の日時取得
		const now = new Date();
		const year = now.getFullYear().toString().slice(-2); // 年の下2桁
		const month = String(now.getMonth() + 1).padStart(2, '0'); // 月を2桁
		const day = String(now.getDate()).padStart(2, '0'); // 日を2桁

		// ランダムな英数字を8文字生成
		const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		let randomPart = '';
		for (let i = 0; i < 8; i++) {
			randomPart += characters.charAt(
				Math.floor(Math.random() * characters.length),
			);
		}
		return `${year}${month}${day}-${randomPart}`;
	};

	// 登録番号
	const registrationNumber = 'T4011101093309';

	// 金額をフォーマット（税込み金額から消費税を計算）
	const formatAmount = (amount: number) => {
		return amount.toLocaleString();
	};

	// 消費税計算（10%）
	const calculateTax = (amount: number) => {
		return Math.floor(amount * 0.1 / 1.1);
	};

	// 支払い日から領収書日付を設定
	const getReceiptDate = (paymentDate: string) => {
		if (!paymentDate) return new Date().toLocaleDateString('ja-JP');

		const date = new Date(paymentDate);
		return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
	};

	// ページコンテナスタイル
	const pageContainerStyle = css({
		maxWidth: '800px',
		mx: 'auto',
		bg: 'white',
		minHeight: '80vh',
		boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
		position: 'relative',
		p: '4',
	});

	// ヘッダースタイル
	const headerStyle = css({
		bg: '#f9f9f9',
		borderBottom: '1px solid #eaeaea',
		p: '4',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		mb: '6',
	});

	// バックボタンスタイル
	const backButtonStyle = css({
		display: 'flex',
		alignItems: 'center',
		color: 'gray.600',
		fontSize: 'sm',
		_hover: {
			color: 'gray.900',
		},
	});

	// 領収書コンテナスタイル
	const receiptContainerStyle = css({
		maxWidth: '700px',
		mx: 'auto',
		p: '8',
		border: '1px solid #eaeaea',
		borderRadius: 'md',
		bg: 'white',
	});

	// ツールバースタイル
	const toolbarStyle = css({
		mt: '6',
		mb: '10',
		display: 'flex',
		gap: '4',
		justifyContent: 'center',
	});

	// ボタン共通スタイル
	const buttonBaseStyle = css({
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: '2',
		px: '6',
		py: '3',
		borderRadius: 'md',
		fontWeight: 'medium',
		transition: 'all 0.2s',
		width: 'auto',
	});

	// ダウンロードボタンスタイル
	const downloadButtonStyle = css({
		bg: '#3b82f6',
		color: 'white',
		_hover: {
			bg: '#2563eb',
			transform: 'translateY(-1px)',
			boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
		},
		_disabled: {
			bg: '#9ca3af',
			color: '#6b7280',
			cursor: 'not-allowed',
			_hover: {
				bg: '#9ca3af',
				transform: 'none',
				boxShadow: 'none',
			},
		},
	});

	// メール送信ボタンスタイル
	const emailButtonStyle = css({
		bg: '#10b981',
		color: 'white',
		_hover: {
			bg: '#059669',
			transform: 'translateY(-1px)',
			boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
		},
		_disabled: {
			bg: '#9ca3af',
			color: '#6b7280',
			cursor: 'not-allowed',
			_hover: {
				bg: '#9ca3af',
				transform: 'none',
				boxShadow: 'none',
			},
		},
	});

	// 入力エリアスタイル
	const inputAreaStyle = css({
		mb: '6',
	});

	// ラベルスタイル
	const labelStyle = css({
		fontWeight: 'medium',
		mb: '2',
		display: 'block',
	});

	// 入力スタイル
	const inputStyle = css({
		w: 'full',
		p: '2',
		border: '1px solid #d1d5db',
		borderRadius: 'md',
		fontSize: 'md',
		_focus: {
			outline: 'none',
			borderColor: '#3b82f6',
			boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
		},
		maxWidth: '300px',
	});

	// フッタースタイル
	const footerStyle = css({
		textAlign: 'center',
		color: 'gray.500',
		fontSize: 'sm',
		mt: '6',
		pb: '8',
	});

	// サーバーサイドPDF生成関数
	const generatePDFFromServer = async (): Promise<{ blob: Blob; fileName: string }> => {
		if (!receiptData || !user) {
			throw new Error('領収書データが読み込まれていません。');
		}

		const response = await fetch('/api/receipts/generate-pdf', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				eventId: receiptData.event_id,
				userId: user.id,
				recipientName,
				receiptNumber,
			}),
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || 'PDFの生成に失敗しました。');
		}

		const blob = await response.blob();
		const fileName = `領収書_イベント参加費_${new Date().toISOString().split('T')[0]}.pdf`;

		return { blob, fileName };
	};

	// PDFダウンロード処理
	const handleDownloadPDF = async () => {
		if (isProcessing) return;

		if (!recipientName.trim()) {
			alert('宛名を入力してください。');
			return;
		}

		if (!receiptData || !user) {
			alert('領収書データが読み込まれていません。');
			return;
		}

		// ダウンロード回数制限チェック
		if (receiptData.receipt_download_count >= maxDownloads) {
			alert(`ダウンロード回数の上限（${maxDownloads}回）に達しています。`);
			return;
		}

		setIsProcessing(true);
		try {
			// サーバーサイドでPDFを生成
			const { blob, fileName } = await generatePDFFromServer();

			// PDF生成成功後にダウンロード回数を更新
			const response = await fetch('/api/receipts/update-download-count', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					eventId: receiptData.event_id,
					userId: user.id,
				}),
			});

			const result = await response.json();

			if (!response.ok) {
				alert(result.error || 'ダウンロード回数の更新に失敗しました');
				return;
			}

			// 領収書履歴を保存（ダウンロード実行前に完了させる）
			await fetch('/api/receipts/save-history', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					userId: user.id,
					receiptNumber: receiptNumber,
					recipientName: recipientName,
					amount: receiptData.payment_amount,
					description: 'イベント参加費として',
					isDashboardIssued: false,
					isEmailIssued: false,
					stripePaymentIntentId: receiptData.stripe_payment_intent_id
				}),
			});

			// ダウンロード回数と残り回数を更新
			setReceiptData(prev => prev ? {
				...prev,
				receipt_download_count: result.downloadCount
			} : prev);
			setRemainingDownloads(result.remainingCount);

			// 履歴を再取得
			if (receiptData.stripe_payment_intent_id) {
				await fetchReceiptHistory(receiptData.stripe_payment_intent_id);
			}

			// 全てのAPI処理完了後にダウンロードを実行
			// iOS WebKitではlink.click()後に後続のfetchが中断されるため、最後に実行する
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', fileName);
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			setTimeout(() => URL.revokeObjectURL(url), 60000);
		} catch (error) {
			console.error('PDF生成エラー:', error);
			alert('PDFの生成に失敗しました。');
		} finally {
			setIsProcessing(false);
		}
	};

	// メール送信処理
	const handleSendEmail = async () => {
		if (isProcessing) return;

		if (!recipientName.trim()) {
			alert('宛名を入力してください。');
			return;
		}

		if (!receiptData || !user) {
			alert('領収書データが読み込まれていません。');
			return;
		}

		// ダウンロード回数制限チェック
		if (receiptData.receipt_download_count >= maxDownloads) {
			alert(`ダウンロード回数の上限（${maxDownloads}回）に達しています。`);
			return;
		}

		setIsProcessing(true);
		try {
			const fileName = `領収書_イベント参加費_${new Date().toISOString().split('T')[0]}.pdf`;

			// メール送信（PDF生成はサーバー側で実行）
			const response = await fetch('/api/receipts/send-email', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					eventId: receiptData.event_id,
					userId: user.id,
					recipientName: recipientName,
					receiptNumber: receiptNumber,
					fileName: fileName,
				}),
			});

			const result = await response.json();

			if (response.ok) {
				// メール送信成功後、ダウンロード回数を更新
				const countResponse = await fetch('/api/receipts/update-download-count', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						eventId: receiptData.event_id,
						userId: user.id,
					}),
				});

				const countResult = await countResponse.json();

				if (countResponse.ok) {
					// 領収書履歴を保存
					await fetch('/api/receipts/save-history', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							userId: user.id,
							receiptNumber: receiptNumber,
							recipientName: recipientName,
							amount: receiptData.payment_amount,
							description: 'イベント参加費として',
							isDashboardIssued: false,
							isEmailIssued: true,
							stripePaymentIntentId: receiptData.stripe_payment_intent_id
						}),
					});

					// ダウンロード回数と残り回数を更新
					setReceiptData(prev => prev ? {
						...prev,
						receipt_download_count: countResult.downloadCount
					} : prev);
					setRemainingDownloads(countResult.remainingCount);

					// 履歴を再取得
					if (receiptData.stripe_payment_intent_id) {
						await fetchReceiptHistory(receiptData.stripe_payment_intent_id);
					}

					alert(`${fileName}を${receiptData.user_email}に送信しました。`);
				} else {
					alert(`メール送信は完了しましたが、ダウンロード回数の更新に失敗しました: ${countResult.error}`);
				}
			} else {
				alert(`メール送信に失敗しました: ${result.error}`);
			}
		} catch (error) {
			console.error('メール送信エラー:', error);
			alert('メールの送信に失敗しました。');
		} finally {
			setIsProcessing(false);
		}
	};

	// 残りダウンロード回数を計算
	const calculateRemainingDownloads = (downloadCount: number) => {
		return Math.max(0, maxDownloads - downloadCount);
	};

	// 領収書発行履歴を取得
	const fetchReceiptHistory = async (stripePaymentIntentId: string) => {
		setHistoryLoading(true);
		try {
			const response = await fetch(
				`/api/receipts/history?stripe_payment_intent_id=${encodeURIComponent(stripePaymentIntentId)}`
			);

			if (!response.ok) {
				console.error('履歴の取得に失敗しました');
				return;
			}

			const result = await response.json();
			setReceiptHistory(result.history || []);
		} catch (error) {
			console.error('履歴取得エラー:', error);
		} finally {
			setHistoryLoading(false);
		}
	};

	if (loading) {
		return (
			<div className={pageContainerStyle}>
				<div className={css({ textAlign: 'center', py: '16' })}>
					<p>データを読み込み中...</p>
				</div>
			</div>
		);
	}

	if (error || !receiptData) {
		return (
			<div className={pageContainerStyle}>
				{/* ヘッダー */}
				<div className={headerStyle}>
					<button onClick={() => router.back()} className={backButtonStyle}>
						<ArrowLeft size={16} className={css({ mr: '2' })} />
						マイページに戻る
					</button>
				</div>
				<div className={css({ textAlign: 'center', py: '16' })}>
					<p className={css({ color: 'red.500' })}>{error || '領収書データが見つかりません。'}</p>
				</div>
			</div>
		);
	}

	return (
		<div className={pageContainerStyle}>
			{/* ヘッダー */}
			<div className={headerStyle}>
				<button onClick={() => router.back()} className={backButtonStyle}>
					<ArrowLeft size={16} className={css({ mr: '2' })} />
					マイページに戻る
				</button>
			</div>

			{/* ダウンロード回数表示 */}
			<div className={css({ mb: '4', textAlign: 'center' })}>
				<p className={css({ fontSize: 'sm', color: 'gray.600' })}>
					ダウンロード回数: {receiptData?.receipt_download_count || 0} / {maxDownloads}回
				</p>
				<p className={css({ fontSize: 'sm', color: 'gray.600' })}>
					残り: {calculateRemainingDownloads(receiptData?.receipt_download_count || 0)}回
				</p>
			</div>

			{/* 発行履歴 */}
			{receiptHistory.length > 0 && (
				<div className={css({ mb: '6', maxWidth: '800px', mx: 'auto', px: '4' })}>
					<h2 className={css({ fontSize: 'lg', fontWeight: 'bold', mb: '3', textAlign: 'center' })}>
						発行履歴
					</h2>
					<div className={css({ overflowX: 'auto' })}>
						<table className={css({
							width: 'full',
							borderCollapse: 'collapse',
							fontSize: 'sm',
							border: '1px solid #eaeaea'
						})}>
							<thead>
								<tr className={css({ bg: '#f9f9f9', borderBottom: '2px solid #eaeaea' })}>
									<th className={css({ p: '3', textAlign: 'left', fontWeight: 'medium', whiteSpace: 'nowrap' })}>
										発行操作日時
									</th>
									<th className={css({ p: '3', textAlign: 'left', fontWeight: 'medium' })}>
										領収書番号
									</th>
									<th className={css({ p: '3', textAlign: 'left', fontWeight: 'medium' })}>
										宛名
									</th>
									<th className={css({ p: '3', textAlign: 'right', fontWeight: 'medium' })}>
										金額
									</th>
									<th className={css({ p: '3', textAlign: 'center', fontWeight: 'medium' })}>
										方法
									</th>
								</tr>
							</thead>
							<tbody>
								{receiptHistory.map((history, index) => (
									<tr
										key={history.receipt_id}
										className={css({
											borderBottom: '1px solid #eaeaea',
											_hover: { bg: '#f9f9f9' }
										})}
									>
										<td className={css({ p: '3', whiteSpace: 'nowrap' })}>
											{new Date(history.created_at).toLocaleString('ja-JP', {
												year: 'numeric',
												month: '2-digit',
												day: '2-digit',
												hour: '2-digit',
												minute: '2-digit'
											})}
										</td>
										<td className={css({ p: '3' })}>
											{history.number}
										</td>
										<td className={css({ p: '3' })}>
											{history.name}
										</td>
										<td className={css({ p: '3', textAlign: 'right' })}>
											¥{history.amount.toLocaleString()}
										</td>
										<td className={css({ p: '3', textAlign: 'center' })}>
											{history.is_email_issued ? (
												<span className={css({
													px: '2',
													py: '1',
													bg: '#10b981',
													color: 'white',
													borderRadius: 'sm',
													fontSize: 'xs'
												})}>
													メール
												</span>
											) : (
												<span className={css({
													px: '2',
													py: '1',
													bg: '#3b82f6',
													color: 'white',
													borderRadius: 'sm',
													fontSize: 'xs'
												})}>
													PDF
												</span>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* 宛名入力 */}
			<div className={inputAreaStyle}>
				<label htmlFor="recipient" className={labelStyle}>
					宛名を入力してください
				</label>
				<input
					id="recipient"
					type="text"
					value={recipientName}
					onChange={(e) => setRecipientName(e.target.value)}
					className={inputStyle}
					placeholder="例: 山田 太郎"
				/>
			</div>

			{/* 領収書コンテンツ */}
			<div id="receipt-content" className={receiptContainerStyle}>
				{/* 領収書ヘッダー */}
				<div
					className={css({
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						mb: '8',
					})}
				>
					<h1
						className={css({
							fontSize: '3xl',
							fontWeight: 'bold',
							mb: '6',
							textAlign: 'center',
						})}
					>
						領収書
					</h1>
				</div>

				{/* 宛名と会社情報のグリッド */}
				<div
					className={css({
						display: 'flex',
						flexDirection: { base: 'column', md: 'row' },
						justifyContent: 'space-between',
						gap: { base: '4', md: '0' },
						mb: '10',
					})}
				>
					{/* 宛名 */}
					<div
						className={css({
							maxWidth: { base: 'full', md: '400px' },
						})}
					>
						<div
							className={css({
								bg: '#f2f2f2',
								p: '3',
								minWidth: { base: 'auto', md: '200px' },
							})}
						>
							<span className={css({ fontWeight: 'medium' })}>
								{recipientName || '　'} 様
							</span>
						</div>
					</div>

					{/* 会社情報 */}
					<div
						className={css({
							textAlign: { base: 'left', md: 'right' },
						})}
					>
						<p className={css({ mb: '1' })}>発行日 {getReceiptDate(receiptData.payment_date)}</p>
						<p className={css({ mb: '1' })}>領収番号 {receiptNumber}</p>
						<p className={css({ mb: '1', fontWeight: 'medium' })}>
							株式会社えびラーメンとチョコレートモンブランが食べたい
						</p>
						<p className={css({ mb: '1' })}>〒160-0023 東京都新宿区西新宿7−7−25 ３階</p>
						<p className={css({ mb: '1' })}>登録番号 {registrationNumber}</p>
					</div>
				</div>

				{/* 金額表示 */}
				<div
					className={css({
						textAlign: 'center',
						my: '8',
					})}
				>
					<p className={css({ mb: '6' })}>下記金額を領収いたしました。</p>
					<p
						className={css({
							fontSize: '3xl',
							fontWeight: 'bold',
							mb: '6',
						})}
					>
						¥{formatAmount(receiptData.payment_amount)}-
					</p>
				</div>

				{/* 領収日と支払い方法 */}
				<div
					className={css({
						display: 'flex',
						flexDirection: { base: 'column', md: 'row' },
						justifyContent: 'space-between',
						gap: { base: '1', md: '0' },
						mb: '6',
						borderBottom: '1px solid #eaeaea',
						pb: '3',
					})}
				>
					<div>
						<p className={css({ fontWeight: 'medium' })}>金額(税込)</p>
					</div>
					<div>
						<p>領収日 {getReceiptDate(receiptData?.payment_date || '')}</p>
					</div>
					<div>
						<p>但しイベント参加費として</p>
					</div>
				</div>

				{/* テーブル */}
				<div className={css({ mb: '6' })}>
					<p className={css({ textAlign: 'right', mb: '2' })}>単位: 円</p>
					<table
						className={css({
							width: 'full',
							borderCollapse: 'collapse',
						})}
					>
						<thead>
							<tr
								className={css({
									borderBottom: '1px solid #eaeaea',
									borderTop: '1px solid #eaeaea',
								})}
							>
								<th
									className={css({
										p: '3',
										textAlign: 'left',
										fontWeight: 'medium',
										width: '50%',
									})}
								>
									内容
								</th>
								<th
									className={css({
										p: '3',
										textAlign: 'right',
										fontWeight: 'medium',
										width: '50%',
									})}
								>
									金額
								</th>
							</tr>
						</thead>
						<tbody>
							<tr
								className={css({
									borderBottom: '1px solid #eaeaea',
								})}
							>
								<td className={css({ p: '3' })}>イベント参加費</td>
								<td className={css({ p: '3', textAlign: 'right' })}>
									{formatAmount(receiptData.payment_amount)}
								</td>
							</tr>
						</tbody>
					</table>
				</div>

				{/* 合計金額 */}
				<div
					className={css({
						textAlign: 'right',
						mb: '8',
					})}
				>
					<p className={css({ fontWeight: 'medium', mb: '1' })}>
						合計 {formatAmount(receiptData.payment_amount)}
					</p>
					<p className={css({ fontSize: 'sm', color: 'gray.600' })}>
						(内消費税額10% {formatAmount(calculateTax(receiptData.payment_amount))})
					</p>
				</div>
			</div>

			{/* ツールバー */}
			<div className={toolbarStyle}>
				<button
					type="button"
					className={`${buttonBaseStyle} ${downloadButtonStyle}`}
					onClick={handleDownloadPDF}
					disabled={isProcessing || !receiptData || (receiptData.receipt_download_count >= maxDownloads)}
				>
					<Download size={18} />
					{isProcessing ? '処理中...' : 'PDFダウンロード'}
				</button>
				<button
					type="button"
					className={`${buttonBaseStyle} ${emailButtonStyle}`}
					onClick={handleSendEmail}
					disabled={isProcessing || !receiptData || (receiptData.receipt_download_count >= maxDownloads)}
				>
					<Mail size={18} />
					{isProcessing ? '処理中...' : 'メールに送信'}
				</button>
			</div>

			{/* フッター */}
			<div className={footerStyle}>
				<p>※このページは領収書を発行するためのものです。</p>
				<p>※ダウンロードは{maxDownloads}回までとなります。</p>
			</div>
		</div>
	);
}
