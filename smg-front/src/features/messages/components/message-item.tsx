'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { MessageItemProps } from '@/features/messages/components/messages';
import { css } from '@/styled-system/css';
import { flex } from '@/styled-system/patterns';
import { token } from '@/styled-system/tokens';
import dayjs from 'dayjs';
import Image from 'next/image';
import { useCallback, useState } from 'react';
import { GrUpdate } from 'react-icons/gr';
import { MdFileDownload, MdInsertDriveFile, MdDescription, MdTableChart, MdSlideshow } from 'react-icons/md';

// 画像ファイルかどうかをURLから判定
const isImageUrl = (url: string): boolean => {
	const ext = url.split('.').pop()?.toLowerCase() || '';
	return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext);
};

// ファイル拡張子からアイコンを取得
const getFileIcon = (url: string) => {
	const ext = url.split('.').pop()?.toLowerCase() || '';
	if (['pdf'].includes(ext)) return <MdDescription size={24} color="#e53e3e" />;
	if (['xls', 'xlsx', 'csv'].includes(ext)) return <MdTableChart size={24} color="#38a169" />;
	if (['ppt', 'pptx'].includes(ext)) return <MdSlideshow size={24} color="#dd6b20" />;
	if (['doc', 'docx', 'txt'].includes(ext)) return <MdDescription size={24} color="#3182ce" />;
	return <MdInsertDriveFile size={24} color="#718096" />;
};

// URLからファイル名ラベルを取得
const getFileName = (url: string): string => {
	const ext = url.split('.').pop()?.toLowerCase() || '';
	const extLabel: Record<string, string> = {
		pdf: 'PDFファイル',
		xls: 'Excelファイル',
		xlsx: 'Excelファイル',
		doc: 'Wordファイル',
		docx: 'Wordファイル',
		ppt: 'PowerPointファイル',
		pptx: 'PowerPointファイル',
		csv: 'CSVファイル',
		txt: 'テキストファイル',
	};
	return extLabel[ext] || `ファイル (.${ext})`;
};

// ファイル添付コンポーネント（非画像）
const FileAttachment = ({ url, isMe }: { url: string; isMe: boolean }) => {
	const handleDownload = useCallback(async () => {
		try {
			const response = await fetch(url);
			const blob = await response.blob();
			const blobUrl = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = blobUrl;
			a.download = url.split('/').pop() || 'file';
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(blobUrl);
		} catch {
			window.open(url, '_blank');
		}
	}, [url]);

	return (
		<div
			onClick={handleDownload}
			className={css({
				display: 'flex',
				alignItems: 'center',
				gap: '2',
				p: '3',
				bg: isMe ? 'blue.50' : 'gray.100',
				rounded: 'md',
				cursor: 'pointer',
				transition: 'background 0.2s',
				_hover: { bg: isMe ? 'blue.100' : 'gray.200' },
				minW: '180px',
				maxW: '280px',
			})}
		>
			<div className={css({ flexShrink: 0 })}>
				{getFileIcon(url)}
			</div>
			<div className={css({ flex: 1, minW: 0 })}>
				<div className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'gray.800', truncate: true })}>
					{getFileName(url)}
				</div>
			</div>
			<div className={css({ color: 'gray.500', flexShrink: 0 })}>
				<MdFileDownload size={18} />
			</div>
		</div>
	);
};

export const MessageItem = ({
	isMe = true,
	isOpen = true,
	msg,
	sendAt,
	images = [],
	deleted_at = null,
	is_inquiry = false,
}: MessageItemProps) => {
	// 削除されたメッセージは表示しない
	if (deleted_at) return null;

	const [imageViewOpen, setImageViewOpen] = useState(false);
	const [selectedImageUrl, setSelectedImageUrl] = useState('');

	// 画像ファイルと非画像ファイルを分離
	const imageAttachments = images.filter((d) => isImageUrl(d.image_url));
	const fileAttachments = images.filter((d) => !isImageUrl(d.image_url));

	// メッセージが空で添付のみかどうかを判定
	const isOnlyAttachments = !msg.trim() && images.length > 0;

	const openImageView = (url: string) => {
		setSelectedImageUrl(url);
		setImageViewOpen(true);
	};

	return (
		<div className={css({ py: '2' })}>
			{/* お問い合わせバッジ */}
			{is_inquiry && (
				<div
					className={css({
						display: 'flex',
						justifyContent: isMe ? 'flex-end' : 'flex-start',
						mb: '-0.5rem',
					})}
				>
					<div
						className={css({
							fontSize: 'xs',
							px: '2',
							py: '0.5',
							bg: 'orange.500',
							color: 'white',
							rounded: 'md',
							fontWeight: 'medium',
							width: 'fit-content',
							position: 'relative',
							mb: '-0.5rem',
							zIndex: 1,
						})}
						style={{
							marginLeft: isMe ? '0' : '0.5rem',
							marginRight: isMe ? '0.5rem' : '0',
						}}
					>
						お問い合わせ
					</div>
				</div>
			)}
			{/* メッセージが空でない場合のみ表示 */}
			{msg.trim() && (
				<div
					className={flex({
						alignItems: 'end',
						columnGap: '.5rem',
						py: '2',
					})}
					style={{
						justifyContent: isMe ? 'end' : 'start',
						flexDirection: isMe ? 'row-reverse' : 'row',
					}}
				>
					<div
						className={css({
							rounded: 'md',
							color: 'white',
							p: '2',
							maxWidth: '50%',
							minH: '40px',
						})}
						style={{
							background: isMe ? '#007aff' : token('colors.gray.500'),
							borderBottomRightRadius: isMe ? '0' : '8px',
							borderBottomLeftRadius: !isMe ? '0' : '8px',
						}}
					>
						<div
							className={css({
								fontSize: 'md',
								textAlign: 'left',
								whiteSpace: 'pre-wrap',
							})}
						>
							{msg}
						</div>
					</div>
					<div
						className={css({
							fontSize: 'xs',
							textAlign: 'right',
							cursor: 'default',
						})}
					>
						<div>{isMe && isOpen && '既読'}</div>
						<div>{dayjs(sendAt).format('HH:mm')}</div>
					</div>
				</div>
			)}

			{/* 画像添付 */}
			{imageAttachments.length > 0 && (
				<div
					className={flex({
						flexWrap: 'wrap',
						gap: '2',
						mt: isOnlyAttachments ? '3' : '0',
						justifyContent: isMe ? 'flex-end' : 'flex-start',
						alignItems: 'center',
						maxWidth: '60%',
						marginLeft: isMe ? 'auto' : '0',
						marginRight: isMe ? '0' : 'auto',
					})}
				>
					{imageAttachments.map((image, index) => (
						<div
							key={image.image_id}
							className={css({
								position: 'relative',
								width: '120px',
								height: '120px',
								cursor: 'pointer',
							})}
							onClick={() => openImageView(image.image_url)}
						>
							<Image
								src={image.image_url}
								alt="メッセージ画像"
								fill
								quality={100}
								unoptimized={true}
								style={{ objectFit: 'cover', borderRadius: '4px' }}
							/>
							{/* 画像のみの場合、最初の画像の左下に時刻を表示 */}
							{isOnlyAttachments && fileAttachments.length === 0 && index === 0 && (
								<div
									className={css({
										position: 'absolute',
										bottom: '0',
										left: '-65px',
										fontSize: 'xs',
										color: 'gray.600',
										backgroundColor: 'rgba(255, 255, 255, 0.7)',
										padding: '1px 4px',
										borderRadius: '2px',
										zIndex: '1',
										whiteSpace: 'nowrap',
									})}
								>
									{isMe && isOpen && (
										<span className={css({ mr: '1' })}>既読</span>
									)}
									{dayjs(image.created_at || sendAt).format('HH:mm')}
								</div>
							)}
						</div>
					))}
				</div>
			)}

			{/* ファイル添付（PDF, Excel等） */}
			{fileAttachments.length > 0 && (
				<div
					className={flex({
						flexDir: 'column',
						gap: '2',
						mt: imageAttachments.length > 0 || !msg.trim() ? '2' : '0',
						alignItems: isMe ? 'flex-end' : 'flex-start',
					})}
				>
					{fileAttachments.map((file, index) => (
						<div key={file.image_id} className={css({ position: 'relative' })}>
							<FileAttachment url={file.image_url} isMe={isMe} />
							{/* 添付ファイルのみの場合、最後のファイルの下に時刻を表示 */}
							{isOnlyAttachments && imageAttachments.length === 0 && index === fileAttachments.length - 1 && (
								<div
									className={css({
										fontSize: 'xs',
										color: 'gray.600',
										mt: '0.5',
										textAlign: isMe ? 'right' : 'left',
									})}
								>
									{isMe && isOpen && (
										<span className={css({ mr: '1' })}>既読</span>
									)}
									{dayjs(file.created_at || sendAt).format('HH:mm')}
								</div>
							)}
						</div>
					))}
				</div>
			)}

			<Dialog open={imageViewOpen} onOpenChange={setImageViewOpen}>
				<DialogContent
					className={css({
						maxWidth: { base: '90vw', md: '80vw' },
						width: { base: '100%', md: 'auto' },
						height: { base: '90vh', md: 'auto' },
						padding: { base: '2', md: '4' },
						borderRadius: 'xl',
					})}
				>
					<div
						className={css({
							width: '100%',
							height: '100%',
							position: 'relative',
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
						})}
					>
						<Image
							src={selectedImageUrl}
							alt="拡大画像"
							style={{
								objectFit: 'contain',
								maxWidth: '100%',
								maxHeight: '80vh',
								width: 'auto',
								height: 'auto',
							}}
							width={1000}
							height={1000}
							quality={100}
							unoptimized={true}
						/>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export const UpdateMessageButton = ({
	onUpdate,
}: { onUpdate?: () => void }) => (
	<div className={css({ display: 'grid', placeItems: 'center', pt: '2' })}>
		<button
			type="button"
			className={css({
				display: 'inline-flex',
				alignItems: 'center',
				gap: '1rem',
				color: '#4A90E2',
				fontSize: 'md',
			})}
			onClick={onUpdate}
		>
			<GrUpdate />
			メッセージを更新
		</button>
	</div>
);
