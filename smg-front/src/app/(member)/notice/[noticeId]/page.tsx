'use client';

import Banner from '@/components/events/Banner';
import { getCategoryColor } from '@/components/notice/categoryColors';
import type { NoticeFile } from '@/components/notice/types';
import { RichContentDisplay } from '@/features/editer/RichContentDisplay';
import { getNoticeByUUID, getNoticeFiles } from '@/lib/api/notice';
import { css } from '@/styled-system/css';
import { Download, FileText, ArrowLeft, Link as LinkIcon, Check } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * 日付を日本時間でフォーマットする
 */
function formatDate(dateString: string | null): string {
	if (!dateString) return '未設定';

	const date = new Date(dateString);
	const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
	const year = jstDate.getUTCFullYear();
	const month = String(jstDate.getUTCMonth() + 1).padStart(2, '0');
	const day = String(jstDate.getUTCDate()).padStart(2, '0');

	return `${year}.${month}.${day}`;
}

type NoticeData = {
	notice_id: string;
	title: string;
	content: string;
	publish_start_at: string | null;
	created_at: string | null;
	category?: {
		id: string;
		name: string;
		description?: string;
	};
};

const NoticeSinglePage = () => {
	const params = useParams();
	const router = useRouter();
	const noticeId = params.noticeId as string;

	const [notice, setNotice] = useState<NoticeData | null>(null);
	const [files, setFiles] = useState<NoticeFile[]>([]);
	const [loading, setLoading] = useState(true);
	const [notFound, setNotFound] = useState(false);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (!noticeId) return;

		const fetchData = async () => {
			setLoading(true);
			try {
				const [noticeData, noticeFiles] = await Promise.all([
					getNoticeByUUID(noticeId),
					getNoticeFiles(noticeId),
				]);

				if (!noticeData) {
					setNotFound(true);
				} else {
					setNotice(noticeData);
					setFiles(noticeFiles);
				}
			} catch (error) {
				console.error('お知らせの取得に失敗しました:', error);
				setNotFound(true);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [noticeId]);

	const handleCopyLink = async () => {
		const url = `${window.location.origin}/notice/${noticeId}`;
		try {
			await navigator.clipboard.writeText(url);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// フォールバック
			const textArea = document.createElement('textarea');
			textArea.value = url;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand('copy');
			document.body.removeChild(textArea);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	const downloadFile = async (fileUrl: string, fileName: string) => {
		try {
			const response = await fetch(fileUrl);
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', fileName);
			link.setAttribute('target', '_blank');
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error('ファイルのダウンロードに失敗しました:', error);
		}
	};

	const categoryColors = notice?.category
		? getCategoryColor(notice.category.name)
		: null;

	const displayDate = notice
		? formatDate(notice.publish_start_at || notice.created_at)
		: '';

	if (loading) {
		return (
			<div
				className={css({
					maxW: '7xl',
					mx: 'auto',
					px: '4',
					'@media (min-width: 768px)': { px: '8' },
				})}
			>
				<Banner />
				<p
					className={css({
						color: 'gray.500',
						fontSize: 'md',
						textAlign: 'center',
						mt: '6',
					})}
				>
					読み込み中...
				</p>
			</div>
		);
	}

	if (notFound || !notice) {
		return (
			<div
				className={css({
					maxW: '7xl',
					mx: 'auto',
					px: '4',
					'@media (min-width: 768px)': { px: '8' },
				})}
			>
				<Banner />
				<div className={css({ textAlign: 'center', mt: '12', mb: '12' })}>
					<p
						className={css({
							color: 'gray.500',
							fontSize: 'lg',
							mb: '4',
						})}
					>
						お知らせが見つかりませんでした。
					</p>
					<button
						type="button"
						onClick={() => router.push('/notice')}
						className={css({
							color: 'blue.600',
							fontSize: 'sm',
							cursor: 'pointer',
							background: 'transparent',
							border: 'none',
							textDecoration: 'underline',
							_hover: { color: 'blue.800' },
						})}
					>
						お知らせ一覧に戻る
					</button>
				</div>
			</div>
		);
	}

	return (
		<div
			className={css({
				maxW: '7xl',
				mx: 'auto',
				px: '4',
				'@media (min-width: 768px)': { px: '8' },
			})}
		>
			<Banner />

			{/* 戻るボタンとリンクコピー */}
			<div
				className={css({
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					mt: '4',
					mb: '4',
				})}
			>
				<button
					type="button"
					onClick={() => router.push('/notice')}
					className={css({
						display: 'flex',
						alignItems: 'center',
						gap: '1',
						color: 'gray.600',
						fontSize: 'sm',
						cursor: 'pointer',
						background: 'transparent',
						border: 'none',
						_hover: { color: 'gray.900' },
					})}
				>
					<ArrowLeft size={16} />
					お知らせ一覧に戻る
				</button>

				<button
					type="button"
					onClick={handleCopyLink}
					className={css({
						display: 'flex',
						alignItems: 'center',
						gap: '1.5',
						px: '3',
						py: '1.5',
						bg: copied ? 'green.50' : 'gray.50',
						color: copied ? 'green.700' : 'gray.600',
						borderRadius: 'md',
						fontSize: 'xs',
						fontWeight: 'medium',
						cursor: 'pointer',
						border: '1px solid',
						borderColor: copied ? 'green.200' : 'gray.200',
						transition: 'all 0.2s',
						_hover: {
							bg: copied ? 'green.50' : 'gray.100',
							borderColor: copied ? 'green.300' : 'gray.300',
						},
					})}
				>
					{copied ? <Check size={14} /> : <LinkIcon size={14} />}
					{copied ? 'コピーしました' : 'この記事のURLをコピー'}
				</button>
			</div>

			{/* 記事コンテンツ */}
			<div
				className={css({
					bg: 'white',
					borderRadius: 'lg',
					border: '1px solid',
					borderColor: 'gray.200',
					overflow: 'hidden',
					mb: '8',
				})}
			>
				{/* ヘッダー部分 */}
				<div className={css({ p: { base: '4', md: '6' } })}>
					{/* 日付とカテゴリー */}
					<div
						className={css({
							display: 'flex',
							alignItems: 'center',
							gap: '3',
							mb: '3',
						})}
					>
						<span
							className={css({
								color: 'gray.400',
								fontSize: 'sm',
							})}
						>
							{displayDate}
						</span>
						{notice.category && categoryColors && (
							<span
								className={css({
									fontSize: 'xs',
									px: '2',
									py: '0.5',
									borderRadius: 'full',
									border: '1px solid',
								})}
								style={{
									backgroundColor: categoryColors.bg,
									color: categoryColors.color,
									borderColor: categoryColors.borderColor,
								}}
							>
								{notice.category.name}
							</span>
						)}
					</div>

					{/* タイトル */}
					<h1
						className={css({
							fontSize: { base: 'xl', md: '2xl' },
							fontWeight: 'bold',
							color: 'gray.900',
							lineHeight: '1.4',
						})}
					>
						{notice.title}
					</h1>
				</div>

				{/* 区切り線 */}
				<div
					className={css({
						borderTop: '1px solid',
						borderColor: 'gray.200',
					})}
				/>

				{/* 本文 */}
				<div
					className={css({
						p: { base: '4', md: '6' },
						color: 'black.700',
						fontSize: 'sm',
					})}
				>
					<RichContentDisplay content={notice.content} isHtml={true} />
				</div>

				{/* 添付ファイル */}
				{files.length > 0 && (
					<div
						className={css({
							px: { base: '4', md: '6' },
							pb: { base: '4', md: '6' },
							borderTop: '1px solid',
							borderColor: 'gray.200',
							pt: '4',
						})}
					>
						<h4
							className={css({
								fontWeight: 'bold',
								fontSize: { base: 'md', md: 'lg' },
								mb: '2',
							})}
						>
							添付資料
						</h4>
						<div
							className={css({
								display: 'flex',
								flexDirection: 'column',
								gap: '2',
							})}
						>
							{files.map((file) => (
								<div
									key={file.file_id}
									className={css({
										display: 'flex',
										alignItems: 'center',
										border: '1px solid',
										borderColor: 'gray.200',
										borderRadius: 'md',
										p: { base: '2', md: '3' },
										bg: 'white',
										cursor: 'pointer',
										_hover: { bg: 'gray.50' },
									})}
									onClick={() =>
										downloadFile(
											file.file_url,
											file.file_name || `資料_${file.file_id}`,
										)
									}
								>
									<FileText
										className={css({
											mr: '2',
											color: 'gray.500',
											fontSize: { base: '16px', md: '18px' },
										})}
									/>
									<div
										className={css({
											flex: '1',
											fontSize: { base: 'xs', md: 'sm' },
											fontWeight: 'medium',
										})}
									>
										{file.file_name || '添付資料をダウンロード'}
									</div>
									<div
										className={css({
											p: '1',
											borderRadius: 'full',
										})}
									>
										<Download size={16} />
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default NoticeSinglePage;
