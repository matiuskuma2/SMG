'use client';

import { css } from '@/styled-system/css';
import { FormEvent, useRef, useState } from 'react';
import { MdAttachFile, MdSend, MdClose } from 'react-icons/md';
import { sendMessage, createThread } from '@/lib/api/messages';
import { compressImage, formatFileSize } from '@/lib/utils/image';
import Image from 'next/image';
import { flex } from '@/styled-system/patterns';
import { MessageFieldProps } from '@/features/messages/components/messages';

type Props = MessageFieldProps;

// 画像ファイルかどうかを判定するヘルパー関数
const isImageFile = (file: File): boolean => {
	return file.type.startsWith('image/');
};

// 許可するファイル形式
const ACCEPT_TYPES = [
	'image/*',
	'application/pdf',
	'application/vnd.ms-excel',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'application/vnd.ms-powerpoint',
	'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	'text/csv',
	'text/plain',
	'.pdf', '.xls', '.xlsx', '.doc', '.docx', '.ppt', '.pptx', '.csv', '.txt',
].join(',');

// ファイル拡張子からラベルを取得
const getFileLabel = (file: File): string => {
	const ext = file.name.split('.').pop()?.toLowerCase() || '';
	const labels: Record<string, string> = {
		pdf: 'PDF',
		xls: 'Excel',
		xlsx: 'Excel',
		doc: 'Word',
		docx: 'Word',
		ppt: 'PowerPoint',
		pptx: 'PowerPoint',
		csv: 'CSV',
		txt: 'テキスト',
	};
	return labels[ext] || ext.toUpperCase();
};

export const MessageField = ({ threadId, onSent, onThreadCreated }: Props) => {
	const fileInput = useRef<HTMLInputElement>(null);
	const [content, setContent] = useState('');
	const [sending, setSending] = useState(false);
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const [previewUrls, setPreviewUrls] = useState<string[]>([]);
	const [compressing, setCompressing] = useState(false);

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files || e.target.files.length === 0) return;
		
		const files = Array.from(e.target.files);
		
		// ファイルサイズの制限（10MB）
		const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
		const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE);
		
		if (oversizedFiles.length > 0) {
			alert(`ファイルサイズは10MB以下にしてください。\n以下のファイルが制限を超えています：\n${oversizedFiles.map(f => `${f.name} (${formatFileSize(f.size)})`).join('\n')}`);
			e.target.value = '';
			return;
		}
		
		// プレビューURLを生成（画像ファイルのみプレビューURL生成）
		const newPreviewUrls = files.map(file => 
			isImageFile(file) ? URL.createObjectURL(file) : ''
		);
		setPreviewUrls([...previewUrls, ...newPreviewUrls]);
		
		// 画像は圧縮、非画像ファイルはそのまま保存
		setCompressing(true);
		try {
			const processedFiles = await Promise.all(
				files.map(async (file) => {
					// 画像ファイルのみ圧縮
					if (isImageFile(file)) {
						const result = await compressImage(file);
						console.log(
							`画像圧縮: ${file.name} - 元サイズ: ${formatFileSize(result.originalSize)}, 圧縮後: ${formatFileSize(result.compressedSize)}, 圧縮率: ${result.compressionRatio}%`
						);
						return result.file;
					}
					// PDF/Excel等はそのまま返す
					return file;
				})
			);
			
			setSelectedFiles([...selectedFiles, ...processedFiles]);
		} catch (error) {
			console.error('ファイル処理中にエラーが発生しました:', error);
			setSelectedFiles([...selectedFiles, ...files]);
		} finally {
			setCompressing(false);
		}
		
		// ファイル選択をリセット（同じファイルを連続で選択できるように）
		e.target.value = '';
	};
	
	const removeFile = (index: number) => {
		// プレビューURLを解放
		if (previewUrls[index]) {
			URL.revokeObjectURL(previewUrls[index]);
		}
		
		// 配列から削除
		const newSelectedFiles = [...selectedFiles];
		const newPreviewUrls = [...previewUrls];
		newSelectedFiles.splice(index, 1);
		newPreviewUrls.splice(index, 1);
		
		setSelectedFiles(newSelectedFiles);
		setPreviewUrls(newPreviewUrls);
	};

	const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		
		if ((!content.trim() && selectedFiles.length === 0) || sending || compressing) return;
		
		try {
			setSending(true);
			
			let currentThreadId = threadId;
			
			// スレッドがない場合は新規作成
			if (!currentThreadId) {
				const thread = await createThread();
				if (thread) {
					currentThreadId = thread.thread_id;
					onThreadCreated?.(thread.thread_id);
				} else {
					throw new Error('スレッドの作成に失敗しました');
				}
			}
			
			// メッセージを送信（ファイルも一緒に）
			await sendMessage(currentThreadId, content || '', selectedFiles.length > 0 ? selectedFiles : undefined);
			setContent('');
			
			// ファイル選択とプレビューをクリア
			setSelectedFiles([]);
			previewUrls.forEach(url => { if (url) URL.revokeObjectURL(url); });
			setPreviewUrls([]);
			
			onSent?.();
		} catch (error) {
			console.error('メッセージ送信エラー:', error);
		} finally {
			setSending(false);
		}
	};

	return (
		<div className={css({
			display: 'flex',
			flexDirection: 'column',
			gap: '2',
		})}>
			{/* 選択したファイルのプレビュー */}
			{selectedFiles.length > 0 && (
				<div className={css({
					display: 'flex',
					flexWrap: 'wrap',
					gap: '2',
					p: '2',
					border: '1px solid',
					borderColor: 'gray.200',
					rounded: 'md',
					position: 'relative',
				})}>
					{compressing && (
						<div className={css({
							position: 'absolute',
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							bg: 'rgba(255, 255, 255, 0.7)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							zIndex: 10,
						})}>
							処理中...
						</div>
					)}
					{selectedFiles.map((file, index) => (
						<div key={index} className={css({
							position: 'relative',
							width: isImageFile(file) ? '80px' : 'auto',
							height: isImageFile(file) ? '80px' : 'auto',
						})}>
							{isImageFile(file) && previewUrls[index] ? (
								<Image
									src={previewUrls[index]}
									alt={`選択した画像 ${index + 1}`}
									fill
									quality={100}
									unoptimized={true}
									style={{ objectFit: 'cover', borderRadius: '4px' }}
								/>
							) : (
								<div className={css({
									display: 'flex',
									alignItems: 'center',
									gap: '1',
									p: '2',
									bg: 'gray.100',
									rounded: 'md',
									fontSize: 'xs',
									color: 'gray.700',
									pr: '6',
								})}>
									<MdAttachFile size={16} />
									<span className={css({ maxW: '120px', truncate: true })}>
										{file.name}
									</span>
									<span className={css({ color: 'gray.500' })}>({getFileLabel(file)})</span>
								</div>
							)}
							<button
								type="button"
								className={css({
									position: 'absolute',
									top: '-8px',
									right: '-8px',
									bg: 'red.500',
									color: 'white',
									rounded: 'full',
									width: '24px',
									height: '24px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								})}
								onClick={() => removeFile(index)}
							>
								<MdClose size={16} />
							</button>
						</div>
					))}
				</div>
			)}

			{/* メッセージ入力フォーム */}
			<form
				className={css({
					display: 'grid',
					gridTemplateColumns: 'auto 1fr auto',
					alignItems: 'center',
				})}
				onSubmit={onSubmit}
			>
				<button
					type="button"
					className={flex({ p: '2', alignItems: 'center' })}
					onClick={() => fileInput.current?.click()}
					disabled={sending || compressing}
					title="ファイルを添付（画像・PDF・Excel・Word等）"
				>
					<MdAttachFile size={24} color={selectedFiles.length > 0 ? "#3f51b5" : "rgba(0,0,0,.6)"} />
					{selectedFiles.length > 0 && (
						<span className={css({ fontSize: 'xs', color: '#3f51b5', ml: '1' })}>
							{selectedFiles.length}
						</span>
					)}
				</button>
				<input
					type="file"
					accept={ACCEPT_TYPES}
					ref={fileInput}
					className={css({ display: 'none' })}
					onChange={handleFileChange}
					multiple
				/>
				<textarea
					placeholder="メッセージを入力"
					className={css({
						p: '2',
						resize: 'none',
						// Note: this property is not work some browser like firefox or safari.
						fieldSizing: 'content',
						_focus: { outline: 'none' },
					})}
					value={content}
					onChange={(e) => setContent(e.target.value)}
					disabled={sending || compressing}
				/>
				<button 
					type="submit" 
					className={css({ 
						cursor: (sending || compressing || (!content.trim() && selectedFiles.length === 0)) ? 'not-allowed' : 'pointer',
						px: '2', 
					})}
					disabled={sending || compressing || (!content.trim() && selectedFiles.length === 0)}
				>
					<MdSend size={24} color={(sending || compressing || (!content.trim() && selectedFiles.length === 0)) ? "rgba(0,0,0,.3)" : "#3f51b5"} />
				</button>
			</form>
		</div>
	);
};
