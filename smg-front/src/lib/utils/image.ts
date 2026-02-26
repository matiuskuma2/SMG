/**
 * 画像ファイルを圧縮するユーティリティ関数
 *
 * @param file 圧縮する画像ファイル
 * @param quality 圧縮品質（1-100）、デフォルトは80
 * @param maxWidth 最大幅（ピクセル）、デフォルトは1200
 * @returns 圧縮された画像ファイル
 */
export async function compressImage(
  file: File,
  quality = 80,
  maxWidth = 1200,
): Promise<{
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}> {
  try {
    // ファイルサイズの制限（10MB）
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`ファイルサイズは10MB以下にしてください。現在のサイズ: ${formatFileSize(file.size)}`);
    }

    // APIを呼び出すためのFormDataを作成
    const formData = new FormData();
    formData.append('file', file);
    formData.append('quality', quality.toString());
    formData.append('maxWidth', maxWidth.toString());

    // 画像圧縮APIを呼び出す
    const response = await fetch('/api/compress-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('画像の圧縮に失敗しました');
    }

    // 圧縮された画像を取得
    const compressedBlob = await response.blob();

    // 圧縮前後のサイズ情報を取得
    const originalSize = Number(
      response.headers.get('X-Original-Size') || file.size,
    );
    const compressedSize = Number(
      response.headers.get('X-Compressed-Size') || compressedBlob.size,
    );

    // 圧縮後のサイズが元のサイズより大きい場合は元のファイルを返す
    if (compressedSize >= originalSize) {
      console.log(
        `圧縮後のサイズ(${formatFileSize(compressedSize)})が元のサイズ(${formatFileSize(originalSize)})より大きいため、圧縮をスキップします`,
      );
      return {
        file,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 0,
      };
    }

    // 圧縮された画像からFileオブジェクトを作成
    const compressedFile = new File([compressedBlob], file.name, {
      type: 'image/jpeg',
    });

    // 圧縮率を計算（小数点第2位まで）
    const compressionRatio = Number.parseFloat(
      (((originalSize - compressedSize) / originalSize) * 100).toFixed(2),
    );

    return {
      file: compressedFile,
      originalSize,
      compressedSize,
      compressionRatio,
    };
  } catch (error) {
    console.error('画像圧縮エラー:', error);
    // エラー時は元のファイルをそのまま返す
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 0,
    };
  }
}

/**
 * ファイルサイズを読みやすい形式（KB, MB）に変換
 *
 * @param bytes ファイルサイズ（バイト）
 * @returns 読みやすい形式のファイルサイズ
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
} 