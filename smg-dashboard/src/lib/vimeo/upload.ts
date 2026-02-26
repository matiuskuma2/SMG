/**
 * Vimeo直接アップロード機能のユーティリティ
 */

export type VimeoUploadState = {
  file: File | null;
  uploading: boolean;
  progress: number;
  error: string | null;
};

export type VimeoUploadOptions = {
  title?: string;
  description?: string;
  onProgress?: (progress: number) => void;
  onError?: (error: string) => void;
};

/**
 * Vimeoに直接動画をアップロードする
 * @param file アップロードするファイル
 * @param options アップロードオプション
 * @returns アップロード後のVimeo動画URL
 */
export async function uploadVideoToVimeo(
  file: File,
  options: VimeoUploadOptions = {},
): Promise<string> {
  const {
    title = 'アップロード動画',
    description = '',
    onProgress,
    onError,
  } = options;

  // ファイル形式の検証
  if (!file.type.startsWith('video/')) {
    const error = '動画ファイルのみ選択可能です';
    onError?.(error);
    throw new Error(error);
  }

  // ファイルサイズの検証（15GB制限）
  const maxSize = 15 * 1024 * 1024 * 1024; // 15GB
  if (file.size > maxSize) {
    const error = 'ファイルサイズが15GBを超えています';
    onError?.(error);
    throw new Error(error);
  }

  try {
    // 1. Vimeoアップロード用URLを取得
    const uploadUrlResponse = await fetch('/api/vimeo/get-upload-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        size: file.size,
        name: title,
        description: description,
      }),
    });

    if (!uploadUrlResponse.ok) {
      const errorData = await uploadUrlResponse.json();
      throw new Error(errorData.error || 'アップロードURL取得に失敗しました');
    }

    const uploadUrlData = await uploadUrlResponse.json();

    console.log('Vimeoアップロード準備完了:', {
      uri: uploadUrlData.uri,
      uploadLink: uploadUrlData.uploadUrl,
      size: file.size,
    });

    // 初期進捗を設定
    onProgress?.(10);

    // 2. 直接Vimeoにアップロード（TUSプロトコル使用）
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // アップロード進捗の監視
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete =
            Math.round((event.loaded / event.total) * 90) + 10; // 10-100%の範囲
          onProgress?.(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        // TUSプロトコルでは204 No Contentが成功レスポンス
        if (xhr.status === 204 || xhr.status === 200) {
          resolve();
        } else {
          reject(new Error('Vimeoへの直接アップロードに失敗しました'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('ネットワークエラーが発生しました'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('アップロードがタイムアウトしました'));
      });

      // TUSプロトコルに準拠したリクエスト設定
      console.log('TUSアップロード開始:', {
        url: uploadUrlData.uploadUrl,
        fileSize: file.size,
        fileName: file.name,
      });

      xhr.open('PATCH', uploadUrlData.uploadUrl);
      xhr.setRequestHeader('Content-Type', 'application/offset+octet-stream');
      xhr.setRequestHeader('Upload-Offset', '0');
      xhr.setRequestHeader('Tus-Resumable', '1.0.0');
      xhr.timeout = 30 * 60 * 1000; // 30分タイムアウト

      // アップロード開始
      xhr.send(file);
    });

    // アップロード完了
    onProgress?.(100);
    return uploadUrlData.videoLink;
  } catch (error) {
    let errorMessage = '動画のアップロードに失敗しました';

    if (error instanceof Error) {
      if (error.message.includes('アップロードURL取得')) {
        errorMessage =
          'アップロード準備に失敗しました。しばらく待ってから再試行してください。';
      } else if (error.message.includes('ネットワークエラー')) {
        errorMessage = 'ネットワーク接続を確認して再試行してください。';
      } else if (error.message.includes('タイムアウト')) {
        errorMessage =
          'アップロードに時間がかかりすぎました。ファイルサイズを確認して再試行してください。';
      } else if (error.message.includes('Vimeoへの直接アップロード')) {
        errorMessage =
          'Vimeoサーバーへのアップロードに失敗しました。しばらく待ってから再試行してください。';
      } else {
        errorMessage = error.message;
      }
    }

    onError?.(errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * 複数のVimeoアップロード状態を管理するためのヘルパー関数
 */
export function createVimeoUploadState(): VimeoUploadState {
  return {
    file: null,
    uploading: false,
    progress: 0,
    error: null,
  };
}

/**
 * アップロード状態を更新するヘルパー関数
 */
export function updateVimeoUploadState(
  currentState: VimeoUploadState,
  updates: Partial<VimeoUploadState>,
): VimeoUploadState {
  return {
    ...currentState,
    ...updates,
  };
}
