import type {
	Message,
	MessageImage,
	Thread,
} from '@/features/messages/components/messages';
import { createClient } from '@/lib/supabase';

// Message型を拡張してimagesフィールドを追加
type MessageWithImagesExt = Message & {
	images?: MessageImage[];
};

// クライアントサイド用のシングルトン（同時実行対策）
let threadCreationPromise: Promise<Thread | null> | null = null;

// 現在のユーザーのスレッドを取得
export const getUserThread = async (): Promise<Thread | null> => {
	const supabase = createClient();

	// ユーザー情報を取得
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return null;

	// ユーザーのスレッドを取得（最新の1件のみ）
	const { data, error } = await supabase
		.from('mst_dm_thread')
		.select('*')
		.eq('user_id', user.id)
		.is('deleted_at', null)
		.order('created_at', { ascending: false })
		.limit(1);

	if (error) {
		console.error('スレッド取得エラー:', error);
		return null;
	}

	// データが存在しない場合はnullを返す
	if (!data || data.length === 0) {
		return null;
	}

	return data[0];
};

// スレッドがない場合は新規作成（確実に1度だけ実行されるようにする）
export const createThread = async (): Promise<Thread | null> => {
	// 既存のPromiseがあれば再利用（同時実行を防止）
	if (threadCreationPromise) {
		return threadCreationPromise;
	}

	// 新しいPromiseを作成して保存
	threadCreationPromise = (async () => {
		// 再度スレッドを確認（他の場所で同時に作成されていないか確認）
		const existingThread = await getUserThread();
		if (existingThread) {
			return existingThread;
		}

		const supabase = createClient();

		// ユーザー情報を取得
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) return null;

		// スレッドを作成
		const { data, error } = await supabase
			.from('mst_dm_thread')
			.insert([{ user_id: user.id }])
			.select()
			.single();

		if (error) {
			console.error('スレッド作成エラー:', error);

			// エラー後に再度スレッドを取得（他の場所で同時に作成された可能性がある）
			const retryThread = await getUserThread();
			if (retryThread) {
				return retryThread;
			}

			return null;
		}

		return data;
	})();

	try {
		// Promiseの結果を待つ
		return await threadCreationPromise;
	} finally {
		// 完了後にPromiseをクリア（次回呼び出し時に再実行できるようにする）
		// 少し遅延させてクリアすることで、同時呼び出しを防止
		setTimeout(() => {
			threadCreationPromise = null;
		}, 1000);
	}
};

// スレッドのメッセージを取得
export const getMessages = async (
	threadId: string,
): Promise<MessageWithImagesExt[]> => {
	const supabase = createClient();

	const { data: currentUser } = await supabase.auth.getUser();

	// メッセージを取得
	const { data: messages, error } = await supabase
		.from('trn_dm_message')
		.select('*')
		.eq('thread_id', threadId)
		.is('deleted_at', null)
		.order('created_at', { ascending: true });

	if (error) {
		console.error('メッセージ取得エラー:', error);
		return [];
	}

	// 全てのメッセージIDを抽出
	const messageIds = messages.map((msg) => msg.message_id);

	// メッセージIDがなければ空の配列を返す
	if (messageIds.length === 0) {
		return messages.map((msg) => ({
			...msg,
			isMe: currentUser.user?.id === msg.user_id,
			images: [],
		}));
	}

	// メッセージに紐づく画像を取得
	const { data: images, error: imageError } = await supabase
		.from('trn_dm_message_image')
		.select('*')
		.in('message_id', messageIds)
		.is('deleted_at', null)
		.order('display_order', { ascending: true });

	if (imageError) {
		console.error('画像取得エラー:', imageError);
		return messages.map((msg) => ({
			...msg,
			isMe: currentUser.user?.id === msg.user_id,
			images: [],
		}));
	}

	// メッセージに画像を紐づける
	const messagesWithImages = messages.map((message) => {
		const messageImages =
			images?.filter((img) => img.message_id === message.message_id) || [];
		return {
			...message,
			isMe: currentUser.user?.id === message.user_id,
			images: messageImages,
		};
	});

	return messagesWithImages;
};

// メッセージを送信
export const sendMessage = async (
	threadId: string,
	content?: string,
	imageFiles?: File[],
): Promise<MessageWithImagesExt | null> => {
	const supabase = createClient();

	// ユーザー情報を取得
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return null;

	// メッセージを作成
	const { data, error } = await supabase
		.from('trn_dm_message')
		.insert([
			{
				thread_id: threadId,
				user_id: user.id,
				content: content || null,
				is_sent: true,
			},
		])
		.select()
		.single();

	if (error) {
		console.error('メッセージ送信エラー:', error);
		return null;
	}

	// スレッドのlast_sent_atとis_admin_readを更新
	const { error: threadUpdateError } = await supabase
		.from('mst_dm_thread')
		.update({
			last_sent_at: new Date().toISOString(),
			is_admin_read: false,
		})
		.eq('thread_id', threadId);

	if (threadUpdateError) {
		console.error('スレッド更新エラー:', threadUpdateError);
	}

	const message: MessageWithImagesExt = {
		...data,
		isMe: user?.id === data.user_id,
		images: [],
	};

	// 画像がなければメッセージのみ返す
	if (!imageFiles || imageFiles.length === 0) {
		return message;
	}

	// 画像をアップロードして紐づける
	const uploadedImages = await uploadMessageImages(
		message.message_id,
		imageFiles,
	);
	message.images = uploadedImages;

	return message;
};

// 画像をアップロードする
export const uploadMessageImages = async (
	messageId: string,
	files: File[],
): Promise<MessageImage[]> => {
	if (!files.length) return [];

	const supabase = createClient();
	const uploadedImages: MessageImage[] = [];

	// 各画像をアップロード
	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const fileExt = file.name.split('.').pop();
		const fileName = `${messageId}_${i}.${fileExt}`;
		const filePath = `message_image/${fileName}`;

		// Storageにアップロード
		const { data: uploadData, error: uploadError } = await supabase.storage
			.from('dm_image')
			.upload(filePath, file, {
				cacheControl: '3600',
				upsert: false,
			});

		if (uploadError) {
			console.error('画像アップロードエラー:', uploadError);
			continue;
		}

		// 公開URLを取得
		const { data: urlData } = supabase.storage
			.from('dm_image')
			.getPublicUrl(filePath);

		// データベースに画像情報を登録
		const { data: imageData, error: imageError } = await supabase
			.from('trn_dm_message_image')
			.insert([
				{
					message_id: messageId,
					image_url: urlData.publicUrl,
					display_order: i,
				},
			])
			.select()
			.single();

		if (imageError) {
			console.error('画像情報登録エラー:', imageError);
			continue;
		}

		uploadedImages.push(imageData as MessageImage);
	}

	return uploadedImages;
};

// メッセージを既読にする
export const markAsRead = async (messageIds: string[]): Promise<boolean> => {
	if (!messageIds.length) return true;

	const supabase = createClient();

	const { error } = await supabase
		.from('trn_dm_message')
		.update({ is_read: true })
		.in('message_id', messageIds);

	if (error) {
		console.error('既読更新エラー:', error);
		return false;
	}

	return true;
};

// メッセージを削除する
export const deleteMessage = async (messageId: string): Promise<boolean> => {
	const supabase = createClient();

	// 現在の日時を取得
	const now = new Date().toISOString();

	// トランザクションを模倣するため、順番に処理を行う

	// 1. 関連する画像を取得してストレージからも削除
	const { data: images, error: fetchError } = await supabase
		.from('trn_dm_message_image')
		.select('image_id, image_url')
		.eq('message_id', messageId)
		.is('deleted_at', null);

	if (fetchError) {
		console.error('画像取得エラー:', fetchError);
		return false;
	}

	// 各画像ファイルをストレージから削除
	if (images && images.length > 0) {
		const filePaths: string[] = [];

		for (const image of images) {
			// URLからファイルパスを抽出
			const imageUrl = image.image_url;
			const urlParts = imageUrl.split('/');
			const fileName = urlParts[urlParts.length - 1];
			const filePath = `message_image/${fileName}`;
			filePaths.push(filePath);
		}

		// ストレージから複数ファイルを削除（エラーは無視）
		if (filePaths.length > 0) {
			const { error: storageError } = await supabase.storage
				.from('dm_image')
				.remove(filePaths);

			if (storageError) {
				console.warn(
					'ストレージからの画像削除エラー（処理は続行）:',
					storageError,
				);
			}
		}
	}

	// 2. 関連する画像を論理削除
	const { error: imageError } = await supabase
		.from('trn_dm_message_image')
		.update({ deleted_at: now })
		.eq('message_id', messageId);

	if (imageError) {
		console.error('画像削除エラー:', imageError);
		return false;
	}

	// 3. メッセージを論理削除
	const { error: messageError } = await supabase
		.from('trn_dm_message')
		.update({ deleted_at: now })
		.eq('message_id', messageId);

	if (messageError) {
		console.error('メッセージ削除エラー:', messageError);
		return false;
	}

	return true;
};

// 特定の画像を削除する
export const deleteMessageImage = async (imageId: string): Promise<boolean> => {
	const supabase = createClient();

	// 現在の日時を取得
	const now = new Date().toISOString();

	// 削除前に画像情報を取得
	const { data: imageData, error: fetchError } = await supabase
		.from('trn_dm_message_image')
		.select('image_url')
		.eq('image_id', imageId)
		.is('deleted_at', null)
		.single();

	if (fetchError) {
		console.error('画像情報取得エラー:', fetchError);
		return false;
	}

	// ストレージからファイルを削除
	if (imageData?.image_url) {
		// URLからファイルパスを抽出
		const imageUrl = imageData.image_url;
		const urlParts = imageUrl.split('/');
		const fileName = urlParts[urlParts.length - 1];
		const filePath = `message_image/${fileName}`;

		// ストレージからファイルを削除（エラーは無視）
		const { error: storageError } = await supabase.storage
			.from('dm_image')
			.remove([filePath]);

		if (storageError) {
			console.warn(
				'ストレージからの画像削除エラー（処理は続行）:',
				storageError,
			);
		}
	}

	// 画像を論理削除
	const { error } = await supabase
		.from('trn_dm_message_image')
		.update({ deleted_at: now })
		.eq('image_id', imageId);

	if (error) {
		console.error('画像削除エラー:', error);
		return false;
	}

	return true;
};

// 複数の画像をまとめて削除する
export const deleteMessageImages = async (
	imageIds: string[],
): Promise<boolean> => {
	if (!imageIds.length) return true;

	const supabase = createClient();

	// 現在の日時を取得
	const now = new Date().toISOString();

	// 削除前に画像情報を取得
	const { data: images, error: fetchError } = await supabase
		.from('trn_dm_message_image')
		.select('image_id, image_url')
		.in('image_id', imageIds)
		.is('deleted_at', null);

	if (fetchError) {
		console.error('画像情報取得エラー:', fetchError);
		return false;
	}

	// ストレージから複数ファイルを削除
	if (images && images.length > 0) {
		const filePaths: string[] = [];

		for (const image of images) {
			// URLからファイルパスを抽出
			const imageUrl = image.image_url;
			const urlParts = imageUrl.split('/');
			const fileName = urlParts[urlParts.length - 1];
			const filePath = `message_image/${fileName}`;
			filePaths.push(filePath);
		}

		// ストレージから複数ファイルを削除（エラーは無視）
		if (filePaths.length > 0) {
			const { error: storageError } = await supabase.storage
				.from('dm_image')
				.remove(filePaths);

			if (storageError) {
				console.warn(
					'ストレージからの画像削除エラー（処理は続行）:',
					storageError,
				);
			}
		}
	}

	// 複数の画像を論理削除
	const { error } = await supabase
		.from('trn_dm_message_image')
		.update({ deleted_at: now })
		.in('image_id', imageIds);

	if (error) {
		console.error('複数画像削除エラー:', error);
		return false;
	}

	return true;
};
