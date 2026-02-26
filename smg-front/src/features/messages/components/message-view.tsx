'use client';

import type {
	Message,
	MessageImage,
} from '@/features/messages/components/messages';
import { getMessages, markAsRead } from '@/lib/api/messages';
import { createClient } from '@/lib/supabase';
import type { TrnDmMessage, TrnDmMessageImage } from '@/lib/supabase/types';
import { css } from '@/styled-system/css';
import dayjs from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
import { MessageItem, UpdateMessageButton } from './message-item';

// Message型を拡張してimagesフィールドとis_inquiryを追加
type MessageWithImages = Message & {
	images?: MessageImage[];
	is_inquiry?: boolean;
};

type Props = {
	refreshCounter?: number;
	onThreadIdChange?: (threadId: string | null) => void;
	threadId: string | null;
};

export const MessageView = ({
	refreshCounter = 0,
	onThreadIdChange,
	threadId,
}: Props) => {
	const [messages, setMessages] = useState<MessageWithImages[]>([]);
	const [loading, setLoading] = useState(true);

	// メッセージの取得
	const fetchMessages = useCallback(async () => {
		if (!threadId) {
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			// スレッドのメッセージを取得
			const messageData = await getMessages(threadId);
			setMessages(messageData);

			// 未読メッセージを既読にする
			const unreadMessageIds = messageData
				.filter((msg) => !msg.is_read && !msg.is_sent)
				.map((msg) => msg.message_id);

			if (unreadMessageIds.length > 0) {
				await markAsRead(unreadMessageIds);
			}
		} catch (error) {
			console.error('メッセージ取得エラー:', error);
		} finally {
			setLoading(false);
		}
	}, [threadId]);

	// スレッドIDが変更されたとき、またはリフレッシュカウンターが変更されたときにメッセージを取得
	useEffect(() => {
		fetchMessages();
	}, [fetchMessages, threadId, refreshCounter]);

	// リアルタイム更新のセットアップ
	useEffect(() => {
		if (!threadId) return;

		const supabase = createClient();

		// メッセージテーブルの変更をサブスクライブ
		const messageSubscription = supabase
			.channel(`thread-message-${threadId}`)
			.on<TrnDmMessage>(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'trn_dm_message',
					filter: `thread_id=eq.${threadId}`,
				},
				async (payload) => {
					const {
						data: { user },
					} = await supabase.auth.getUser();

					// 新しいメッセージを追加
					const newMessage: MessageWithImages = {
						...payload.new,
						isMe: user?.id === payload.new.user_id,
					};

					// メッセージに関連する画像を取得
					const { data: images, error } = await supabase
						.from('trn_dm_message_image')
						.select('*')
						.eq('message_id', newMessage.message_id)
						.is('deleted_at', null)
						.order('display_order', { ascending: true });

					if (!error && images) {
						newMessage.images = images as MessageImage[];
					}

					setMessages((prev) => {
						if (prev.some((msg) => msg.message_id === newMessage.message_id)) {
							return prev;
						}
						return [...prev, newMessage];
					});

					// 自分のメッセージでない場合は既読にする

					if (user && newMessage.user_id !== user.id) {
						await markAsRead([newMessage.message_id]);
					}
				},
			)
			.subscribe();

		// 画像テーブルの変更をサブスクライブ
		const imageSubscription = supabase
			.channel(`thread-image-${threadId}`)
			.on<TrnDmMessageImage>(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'trn_dm_message_image',
				},
				async (payload) => {
					const newImage = payload.new;
					const messageId = newImage.message_id;

					// メッセージリストに画像を追加
					setMessages((prev) =>
						prev.map((msg) => {
							if (msg.message_id === messageId) {
								const updatedImages = [...(msg.images || []), newImage];
								return {
									...msg,
									images: updatedImages,
								} as MessageWithImages;
							}
							return msg;
						}),
					);
				},
			)
			.subscribe();

		// クリーンアップ関数
		return () => {
			messageSubscription.unsubscribe();
			imageSubscription.unsubscribe();
		};
	}, [threadId]);

	// メッセージを日付でグループ化
	const groupedMessages = Object.groupBy(messages, ({ created_at }) => {
		const date = dayjs(created_at);
		return date.format('YYYY/M/DD');
	});

	if (loading && messages.length === 0) {
		return (
			<div className={css({ textAlign: 'center', py: '4' })}>読み込み中...</div>
		);
	}

	// メッセージがない場合のガイド表示
	if (!threadId) {
		return (
			<div className={css({ textAlign: 'center', py: '4' })}>
				メッセージを送信すると、管理者とのやり取りが始まります。
			</div>
		);
	}

	// メッセージが空の場合
	if (messages.length === 0) {
		return (
			<div className={css({ textAlign: 'center', py: '4' })}>
				まだメッセージがありません。
			</div>
		);
	}

	return (
		<div className={css({ overflow: 'auto', scrollbar: 'hidden', pb: '1rem' })}>
			{Object.entries(groupedMessages).map(([day, dayMessages]) => (
				<div key={day}>
					<DayDivider day={day} />
					{dayMessages?.map((msg) => (
						<MessageItem
							key={msg.message_id}
							msg={msg.content || ''}
							sendAt={msg.created_at || ''}
							isMe={msg.isMe}
							isOpen={msg.is_read || false}
							images={msg.images}
							message_id={msg.message_id}
							is_inquiry={msg.is_inquiry || false}
						/>
					))}
				</div>
			))}
			<UpdateMessageButton onUpdate={fetchMessages} />
		</div>
	);
};

const DayDivider = ({ day }: { day: string }) => (
	<p
		className={css({
			textAlign: 'center',
			position: 'relative',
			cursor: 'default',
			_before: {
				content: '""',
				w: '40%',
				position: 'absolute',
				top: '50%',
				left: '0',
				borderBottom: '1px solid #e0e0e0',
			},
			_after: {
				content: '""',
				w: '40%',
				position: 'absolute',
				top: '50%',
				right: '0',
				borderBottom: '1px solid #e0e0e0',
			},
		})}
	>
		{day}
	</p>
);
