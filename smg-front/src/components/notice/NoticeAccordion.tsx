import { RichContentDisplay } from '@/features/editer/RichContentDisplay';
import { useIsInstructor } from '@/hooks/useIsInstructor';
import { getNoticeFiles } from '@/lib/api/notice';
import { css } from '@/styled-system/css';
import { Check, Download, FileText, Link as LinkIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { FaArrowDown, FaArrowUp } from 'react-icons/fa6';
import { getCategoryColor } from './categoryColors';
import type { NoticeAccordionProps, NoticeFile } from './types';

const NoticeAccordion: React.FC<NoticeAccordionProps> = ({
	id,
	noticeId,
	date,
	title,
	details,
	category,
	isOpen,
	onToggle,
	basePath = '/notice',
	editType = 'notice',
}) => {
	const [height, setHeight] = useState('0px');
	const contentRef = useRef<HTMLDivElement>(null);
	const { isInstructor, loading: isInstructorLoading } = useIsInstructor();
	const [files, setFiles] = useState<NoticeFile[]>([]);
	const [filesLoading, setFilesLoading] = useState(false);
	const [hasFetchedFiles, setHasFetchedFiles] = useState(false);
	const [copied, setCopied] = useState(false);

	// カテゴリの色を事前に計算
	const categoryColors = category ? getCategoryColor(category.name) : null;

	const handleCopyLink = async (e: React.MouseEvent) => {
		e.stopPropagation();
		const url = `${window.location.origin}${basePath}/${noticeId}`;
		try {
			await navigator.clipboard.writeText(url);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
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

	const handleEdit = (e: React.MouseEvent) => {
		e.stopPropagation();
		const dashboardUrl =
			process.env.NEXT_PUBLIC_DASHBOARD_URL ||
			'https://smg-dashboard.vercel.app';
		window.open(`${dashboardUrl}/${editType}/edit/${noticeId}`, '_blank');
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

	const previewFile = (fileUrl: string, fileName: string) => {
		const isPdf = fileName.toLowerCase().endsWith('.pdf');
		if (isPdf) {
			window.open(fileUrl, '_blank');
		} else {
			downloadFile(fileUrl, fileName);
		}
	};

	useEffect(() => {
		if (contentRef.current) {
			setHeight(isOpen ? `${contentRef.current.scrollHeight}px` : '0px');
		}
	}, [isOpen, files.length]);

	useEffect(() => {
		if (isOpen && !hasFetchedFiles && !filesLoading) {
			setHasFetchedFiles(true);
			setFilesLoading(true);
			getNoticeFiles(noticeId)
				.then((data) => {
					setFiles(data);
				})
				.catch((error) => {
					console.error('添付ファイルの取得に失敗しました:', error);
				})
				.finally(() => {
					setFilesLoading(false);
				});
		}
	}, [isOpen, noticeId, hasFetchedFiles, filesLoading]);

	return (
		<div
			className={css({
				borderBottom: '1px solid',
				backgroundColor: 'white',
				borderColor: 'gray.200',
				py: '4',
				px: '4',
				cursor: 'pointer',
			})}
		>
			<div
				className={css({
					display: 'flex',
					alignItems: 'center',
					gap: '2',
				})}
			>
				<button
					type="button"
					onClick={() => onToggle(id)}
					className={css({
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						flex: 1,
						background: 'transparent',
						border: 'none',
						padding: 0,
						cursor: 'pointer',
					})}
				>
					<span
						className={css({
							color: 'gray.400',
							fontSize: 'sm',
							whiteSpace: 'nowrap',
							mr: '4',
						})}
					>
						{date}
					</span>
					<div
						className={css({
							display: 'flex',
							flexDirection: 'column',
							flex: 1,
							gap: '1',
						})}
					>
						{category && categoryColors && (
							<span
								className={css({
									fontSize: 'xs',
									px: '2',
									py: '0.5',
									borderRadius: 'full',
									border: '1px solid',
									whiteSpace: 'nowrap',
									width: 'fit-content',
								})}
								style={{
									backgroundColor: categoryColors.bg,
									color: categoryColors.color,
									borderColor: categoryColors.borderColor,
								}}
							>
								{category.name}
							</span>
						)}
						<span
							className={css({
								fontSize: 'md',
								fontWeight: 'bold',
								color: 'gray.900',
								textAlign: 'left',
							})}
						>
							{title}
						</span>
					</div>
					<span className={css({ ml: '4' })}>
						{isOpen ? <FaArrowUp /> : <FaArrowDown />}
					</span>
				</button>
				<button
					type="button"
					onClick={handleCopyLink}
					title={copied ? 'コピーしました' : 'この記事のURLをコピー'}
					className={css({
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						width: '32px',
						height: '32px',
						borderRadius: 'md',
						bg: copied ? 'green.50' : 'gray.50',
						color: copied ? 'green.600' : 'gray.400',
						border: '1px solid',
						borderColor: copied ? 'green.200' : 'gray.200',
						cursor: 'pointer',
						transition: 'all 0.2s',
						flexShrink: 0,
						_hover: {
							bg: copied ? 'green.100' : 'gray.100',
							color: copied ? 'green.700' : 'gray.600',
						},
					})}
				>
					{copied ? <Check size={14} /> : <LinkIcon size={14} />}
				</button>
				{!isInstructorLoading && isInstructor && (
					<button
						type="button"
						onClick={handleEdit}
						className={css({
							px: '3',
							py: '1',
							bg: 'blue.600',
							color: 'white',
							borderRadius: 'md',
							fontSize: 'xs',
							fontWeight: 'medium',
							cursor: 'pointer',
							transition: 'all 0.2s',
							border: 'none',
							_hover: {
								bg: 'blue.700',
							},
							_active: {
								transform: 'scale(0.98)',
							},
						})}
					>
						編集
					</button>
				)}
			</div>

			<div
				ref={contentRef}
				className={css({
					overflow: 'hidden',
					transition: 'max-height 0.3s ease',
				})}
				style={{ maxHeight: height }}
			>
				<div
					className={css({
						mt: '3',
						color: 'black.700',
						fontSize: 'sm',
					})}
				>
					<RichContentDisplay content={details} isHtml={true} />
				</div>

				{files.length > 0 && (
					<div
						className={css({
							mt: '4',
							pt: '4',
							borderTop: '1px solid',
							borderColor: 'gray.200',
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
									onClick={(e) => {
										e.stopPropagation();
										downloadFile(
											file.file_url,
											file.file_name || `資料_${file.file_id}`,
										);
									}}
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

export default NoticeAccordion;
