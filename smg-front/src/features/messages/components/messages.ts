/**
 * メッセージ関連のType定義
 */

import type {
	MstDmThread,
	TrnDmMessage,
	TrnDmMessageImage,
} from '@/lib/supabase/types';

// Supabaseの型定義を使用
export type Thread = MstDmThread;
export type Message = TrnDmMessage & {
	isMe: boolean;
	is_inquiry?: boolean;
};
export type MessageImage = TrnDmMessageImage;

// コンポーネント用のProps型
export type MessageItemProps = {
	isMe?: boolean;
	isOpen?: boolean;
	msg: string;
	sendAt: string;
	images?: MessageImage[];
	message_id: string;
	deleted_at?: string | null;
	is_inquiry?: boolean;
};

export type MessageFieldProps = {
	threadId: string | null;
	onSent?: () => void;
	onThreadCreated?: (threadId: string) => void;
};

// API関数の戻り値型
export type MessageWithImages = Message & {
	images: MessageImage[];
};

// 削除操作の結果型
export type DeleteResult = {
	success: boolean;
	error?: string;
};

// 画像アップロード結果型
export type ImageUploadResult = {
	success: boolean;
	images?: MessageImage[];
	error?: string;
};
