'use client';

import { css } from '@/styled-system/css';
import { FormEvent, useRef, useState } from 'react';
import { MdInsertPhoto, MdSend, MdClose } from 'react-icons/md';
import { sendMessage, createThread } from '@/lib/api/messages';
import { compressImage, formatFileSize } from '@/lib/utils/image';
import Image from 'next/image';
import { flex } from '@/styled-system/patterns';
import { MessageFieldProps } from '@/features/messages/components/messages';

type Props = MessageFieldProps;

export const MessageField = ({ threadId, onSent, onThreadCreated }: Props) => {
	const fileInput = useRef<HTMLInputElement>(null);
	const [content, setContent] = useState('');
	const [sending, setSending] = useState(false);
	const [selectedImages, setSelectedImages] = useState<File[]>([]);
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
		
		// プレビューURLを生成（圧縮前の画像でプレビュー用）
		const newPreviewUrls = files.map(file => URL.createObjectURL(file));
		setPreviewUrls([...previewUrls, ...newPreviewUrls]);
		
		// 画像圧縮処理
		setCompressing(true);
		try {
			const compressedImages = await Promise.all(
				files.map(async (file) => {
					const result = await compressImage(file);
					console.log(
						`画像圧縮: ${file.name} - 元サイズ: ${formatFileSize(result.originalSize)}, 圧縮後: ${formatFileSize(result.compressedSize)}, 圧縮率: ${result.compressionRatio}%`
					);
					return result.file;
				})
			);
			
			// 圧縮された画像を保存
			setSelectedImages([...selectedImages, ...compressedImages]);
		} catch (error) {
			console.error('画像圧縮処理中にエラーが発生しました:', error);
			// エラー時は元の画像をそのまま使用
			setSelectedImages([...selectedImages, ...files]);
		} finally {
			setCompressing(false);
		}
		
		// ファイル選択をリセット（同じファイルを連続で選択できるように）
		e.target.value = '';
	};
	
	const removeImage = (index: number) => {
		// プレビューURLを解放
		URL.revokeObjectURL(previewUrls[index]);
		
		// 配列から削除
		const newSelectedImages = [...selectedImages];
		const newPreviewUrls = [...previewUrls];
		newSelectedImages.splice(index, 1);
		newPreviewUrls.splice(index, 1);
		
		setSelectedImages(newSelectedImages);
		setPreviewUrls(newPreviewUrls);
	};

	const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		
		if ((!content.trim() && selectedImages.length === 0) || sending || compressing) return;
		
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
			
			// メッセージを送信（画像も一緒に）
			await sendMessage(currentThreadId, content || '', selectedImages.length > 0 ? selectedImages : undefined);
			setContent('');
			
			// 画像選択とプレビューをクリア
			setSelectedImages([]);
			previewUrls.forEach(url => URL.revokeObjectURL(url));
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
			{/* 選択した画像のプレビュー */}
			{previewUrls.length > 0 && (
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
							画像を圧縮中...
						</div>
					)}
					{previewUrls.map((url, index) => (
						<div key={index} className={css({
							position: 'relative',
							width: '80px',
							height: '80px',
						})}>
							<Image
								src={url}
								alt={`選択した画像 ${index + 1}`}
								fill
								quality={100}
								unoptimized={true}
								style={{ objectFit: 'cover', borderRadius: '4px' }}
							/>
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
								onClick={() => removeImage(index)}
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
				>
					<MdInsertPhoto size={24} color={selectedImages.length > 0 ? "#3f51b5" : "rgba(0,0,0,.6)"} />
					{selectedImages.length > 0 && (
						<span className={css({ fontSize: 'xs', color: '#3f51b5', ml: '1' })}>
							{selectedImages.length}
						</span>
					)}
				</button>
				<input
					type="file"
					accept="image/*"
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
						cursor: (sending || compressing || (!content.trim() && selectedImages.length === 0)) ? 'not-allowed' : 'pointer',
						px: '2', 
					})}
					disabled={sending || compressing || (!content.trim() && selectedImages.length === 0)}
				>
					<MdSend size={24} color={(sending || compressing || (!content.trim() && selectedImages.length === 0)) ? "rgba(0,0,0,.3)" : "#3f51b5"} />
				</button>
			</form>
		</div>
	);
};
