import { type NextRequest, NextResponse } from 'next/server';

interface VimeoUploadRequest {
  size: number;
  name?: string;
  description?: string;
}

interface VimeoCreateVideoResponse {
  uri: string;
  link: string;
  upload: {
    upload_link: string;
    size: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { size, name, description }: VimeoUploadRequest =
      await request.json();

    if (!size || size <= 0) {
      return NextResponse.json(
        { error: 'ファイルサイズが無効です' },
        { status: 400 },
      );
    }

    const accessToken = process.env.VIMEO_ACCESS_TOKEN;
    if (!accessToken) {
      console.error('VIMEO_ACCESS_TOKEN環境変数が設定されていません');
      return NextResponse.json({ error: 'Vimeo設定エラー' }, { status: 500 });
    }

    // Vimeo APIで動画リソースを作成し、アップロードURLを取得
    const response = await fetch('https://api.vimeo.com/me/videos', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.vimeo.*+json;version=3.4',
      },
      body: JSON.stringify({
        upload: {
          approach: 'tus',
          size: size,
        },
        name: name || 'イベントアーカイブ動画',
        description: description || '',
        privacy: {
          view: 'anybody',
          embed: 'public',
          download: false,
          add: false,
          comments: 'anybody',
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Vimeo API エラー:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      return NextResponse.json(
        {
          error: 'Vimeoアップロード準備に失敗しました',
          details: errorData,
        },
        { status: response.status },
      );
    }

    const data: VimeoCreateVideoResponse = await response.json();

    console.log('Vimeoアップロード準備完了:', {
      uri: data.uri,
      uploadLink: data.upload.upload_link,
      size: data.upload.size,
    });

    return NextResponse.json({
      success: true,
      videoUri: data.uri,
      videoLink: data.link,
      uploadUrl: data.upload.upload_link,
      uploadSize: data.upload.size,
    });
  } catch (error) {
    console.error('アップロード準備エラー:', error);
    return NextResponse.json(
      {
        error: 'アップロード準備中にエラーが発生しました',
        details: error instanceof Error ? error.message : '不明なエラー',
      },
      { status: 500 },
    );
  }
}
