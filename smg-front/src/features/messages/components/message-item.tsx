'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { MessageItemProps } from '@/features/messages/components/messages';
import { css } from '@/styled-system/css';
import { flex } from '@/styled-system/patterns';
import { token } from '@/styled-system/tokens';
import dayjs from 'dayjs';
import Image from 'next/image';
import { useState } from 'react';
import { GrUpdate } from 'react-icons/gr';

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

	// メッセージが空で画像のみかどうかを判定
	const isOnlyImages = !msg.trim() && images.length > 0;

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
			{/* メッセージが空でない場合のみ表示（画像の有無に関わらず） */}
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

			{images.length > 0 && (
				<div
					className={flex({
						flexWrap: 'wrap',
						gap: '2',
						mt: isOnlyImages ? '3' : '0',
						justifyContent: isMe ? 'flex-end' : 'flex-start',
						alignItems: 'center',
						maxWidth: '60%',
						marginLeft: isMe ? 'auto' : '0',
						marginRight: isMe ? '0' : 'auto',
					})}
				>
					{images.map((image, index) => (
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
							{isOnlyImages && index === 0 && (
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
