'use client';
import { css } from '@/styled-system/css';
import Image from 'next/image';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

// 許可される画像形式
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];

// 最大ファイルサイズ（10MB）- イベントと同じ
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export interface ArchiveImageUploaderProps {
  imageUrl?: string | null;
  onChange: (file: File | null, previewUrl: string | null) => void;
  onError?: (error: string | null) => void;
}

export const ArchiveImageUploader = memo(
  ({ imageUrl, onChange, onError }: ArchiveImageUploaderProps) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(
      imageUrl || null,
    );
    const fileInputRef = useRef<HTMLInputElement>(null);

    // imageUrlが外部から変更された場合に同期
    useEffect(() => {
      setPreviewUrl(imageUrl || null);
    }, [imageUrl]);

    const handleFileChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
          const file = files[0];

          // ファイル形式チェック
          if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            onError?.('JPEG、PNG形式の画像のみアップロード可能です。');
            e.target.value = '';
            return;
          }

          // ファイルサイズチェック
          if (file.size > MAX_FILE_SIZE) {
            onError?.('ファイルサイズは10MB以下にしてください。');
            e.target.value = '';
            return;
          }

          // エラーをクリア
          onError?.(null);

          // 以前のプレビューURLがある場合は解放
          if (previewUrl?.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
          }

          // 新しいプレビューURLを作成
          const objectUrl = URL.createObjectURL(file);
          setPreviewUrl(objectUrl);

          // 親コンポーネントに通知
          onChange(file, objectUrl);
        }
      },
      [previewUrl, onChange, onError],
    );

    return (
      <div className={css({ mb: '4' })}>
        <label
          htmlFor="archiveImageFile"
          className={css({ display: 'block', mb: '2', fontWeight: 'medium' })}
        >
          サムネイル
        </label>
        <div
          className={css({
            display: 'flex',
            flexDir: { base: 'column', md: 'row' },
            gap: '4',
            alignItems: { md: 'center' },
          })}
        >
          <div
            className={css({
              width: '200px',
              height: '150px',
              border: '1px dashed',
              borderColor: 'gray.300',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden',
              bg: 'white',
            })}
          >
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="サムネイルプレビュー"
                fill
                sizes="200px"
                style={{ objectFit: 'cover' }}
                priority
                unoptimized={previewUrl.startsWith('blob:')}
              />
            ) : (
              <span className={css({ color: 'gray.500' })}>プレビュー</span>
            )}
          </div>
          <div className={css({ flex: '1' })}>
            <label
              htmlFor="archiveImageFile"
              className={css({
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2',
                bg: 'blue.500',
                color: 'white',
                px: '4',
                py: '2',
                borderRadius: 'md',
                cursor: 'pointer',
                fontSize: 'sm',
                fontWeight: 'medium',
                _hover: { bg: 'blue.600' },
                transition: 'background-color 0.2s',
              })}
            >
              画像を選択
              <input
                id="archiveImageFile"
                ref={fileInputRef}
                type="file"
                name="archiveImageFile"
                accept="image/jpeg,image/png"
                onChange={handleFileChange}
                className={css({
                  position: 'absolute',
                  width: '1px',
                  height: '1px',
                  padding: '0',
                  margin: '-1px',
                  overflow: 'hidden',
                  clip: 'rect(0, 0, 0, 0)',
                  whiteSpace: 'nowrap',
                  border: '0',
                })}
              />
            </label>
          </div>
        </div>
      </div>
    );
  },
);

ArchiveImageUploader.displayName = 'ArchiveImageUploader';
