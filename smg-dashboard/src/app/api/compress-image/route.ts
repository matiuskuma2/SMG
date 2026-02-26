import { type NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs';

/**
 * 画像圧縮API
 * POSTメソッドで画像データを受け取り、圧縮して返します。
 */
export async function POST(request: NextRequest) {
  try {
    // リクエストからFormDataを取得
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが提供されていません' },
        { status: 400 },
      );
    }

    // 画像品質のパラメータ取得（デフォルトは90%）
    const quality = Number(formData.get('quality') || 90);

    // 最大幅のパラメータ取得（デフォルトは1200px）
    const maxWidth = Number(formData.get('maxWidth') || 1200);

    // ファイルをArrayBufferに変換
    const buffer = await file.arrayBuffer();

    // 元のファイルサイズ
    const originalSize = buffer.byteLength;

    // 画像のメタデータを取得
    const metadata = await sharp(Buffer.from(buffer)).metadata();

    // 画像の幅が既にmaxWidth以下の場合はリサイズしない
    const shouldResize = metadata.width && metadata.width > maxWidth;

    // sharpで画像を処理
    let sharpInstance = sharp(Buffer.from(buffer));

    // リサイズが必要な場合のみ実行
    if (shouldResize) {
      sharpInstance = sharpInstance.resize({
        width: maxWidth,
        withoutEnlargement: true, // 元の画像より大きくしない
      });
    }

    // 画像の最適化
    const compressedImageBuffer = await sharpInstance
      .jpeg({
        quality,
        mozjpeg: true, // mozjpegを使用してより効率的な圧縮を実現
        chromaSubsampling: '4:4:4', // 高品質なクロマサブサンプリングを適用
      })
      .toBuffer();

    // 圧縮後のサイズ
    const compressedSize = compressedImageBuffer.length;

    // 圧縮後のサイズが元のサイズより大きい場合は元の画像を返す
    if (compressedSize >= originalSize) {
      console.log(
        `圧縮後のサイズ(${compressedSize}バイト)が元のサイズ(${originalSize}バイト)より大きいため、圧縮をスキップします`,
      );
      return new NextResponse(Buffer.from(buffer), {
        status: 200,
        headers: {
          'Content-Type': file.type || 'image/jpeg',
          'Content-Disposition': `attachment; filename="${file.name}"`,
          'X-Original-Size': originalSize.toString(),
          'X-Compressed-Size': originalSize.toString(),
        },
      });
    }

    // ファイル名を取得
    const fileName = file.name;

    // BufferをUint8Arrayに変換してBlobを作成
    const uint8Array = new Uint8Array(compressedImageBuffer);
    const blob = new Blob([uint8Array], { type: 'image/jpeg' });

    // HTTPレスポンスを作成
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'X-Original-Size': originalSize.toString(),
        'X-Compressed-Size': compressedSize.toString(),
      },
    });
  } catch (error) {
    console.error('画像圧縮エラー:', error);
    return NextResponse.json(
      { error: '画像の圧縮に失敗しました' },
      { status: 500 },
    );
  }
}
