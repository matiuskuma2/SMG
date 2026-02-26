// lib/vimeo.ts
// Vimeoクライアントの初期化と動画アップロード機能を提供

export interface UploadOptions {
  name?: string;
  description?: string;
  privacy?: {
    view:
      | 'anybody'
      | 'nobody'
      | 'contacts'
      | 'password'
      | 'unlisted'
      | 'disable';
    embed?: 'public' | 'private';
    download?: boolean;
    add?: boolean;
    comments?: 'anybody' | 'contacts' | 'nobody';
  };
}

export interface VimeoUploadResponse {
  uri: string;
  name: string;
  description: string;
  link: string;
  embed?: {
    html: string;
  };
  created_time?: string;
  duration?: number;
  status?: string;
}

// CommonJS形式でVimeoクライアントを初期化する関数
export const initVimeoClient = () => {
  try {
    // CommonJS requireを使用
    const VimeoClass = require('vimeo').Vimeo;
    const clientId = process.env.VIMEO_CLIENT_ID;
    const clientSecret = process.env.VIMEO_CLIENT_SECRET;
    const accessToken = process.env.VIMEO_ACCESS_TOKEN;

    if (!clientId || !clientSecret || !accessToken) {
      throw new Error('必要な環境変数が設定されていません');
    }

    return new VimeoClass(clientId, clientSecret, accessToken);
  } catch (error) {
    try {
      // @vimeo/vimeoを試す
      const VimeoModule = require('@vimeo/vimeo');
      const VimeoClass = VimeoModule.default || VimeoModule.Vimeo;
      const clientId = process.env.VIMEO_CLIENT_ID;
      const clientSecret = process.env.VIMEO_CLIENT_SECRET;
      const accessToken = process.env.VIMEO_ACCESS_TOKEN;

      if (!clientId || !clientSecret || !accessToken) {
        throw new Error('必要な環境変数が設定されていません');
      }

      return new VimeoClass(clientId, clientSecret, accessToken);
    } catch (secondError) {
      console.error('Vimeoクライアントの初期化に失敗しました:', {
        error,
        secondError,
      });
      throw new Error('Vimeoクライアントの初期化に失敗しました');
    }
  }
};

// 動画アップロード関数
export const uploadVideoToVimeo = (
  filePath: string,
  options: UploadOptions = {},
): Promise<VimeoUploadResponse> => {
  const vimeo = initVimeoClient();

  return new Promise((resolve, reject) => {
    const uploadOptions = {
      name: options.name || 'Untitled Video',
      description: options.description || '',
      privacy: {
        view: options.privacy?.view || 'anybody', // デフォルトを'anybody'に変更
        embed: options.privacy?.embed || 'public',
        download: options.privacy?.download || false,
        add: options.privacy?.add || false,
        comments: options.privacy?.comments || 'anybody',
      },
    };

    vimeo.upload(
      filePath,
      uploadOptions,
      (uri: string) => {
        console.log('アップロード完了:', uri);

        // アップロード完了後、動画情報を取得
        vimeo.request(
          {
            method: 'GET',
            path: uri,
          },
          (error: Error, body: VimeoUploadResponse) => {
            if (error) {
              reject(error);
            } else {
              resolve(body);
            }
          },
        );
      },
      (bytesUploaded: number, bytesTotal: number) => {
        const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
        console.log(`アップロード進行状況: ${percentage}%`);
      },
      (error: Error) => {
        console.error('アップロードエラー:', error);
        reject(error);
      },
    );
  });
};
