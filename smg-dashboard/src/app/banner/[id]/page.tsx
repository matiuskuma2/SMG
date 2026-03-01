'use client';

import { css } from '@/styled-system/css';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function BannerEditPage() {
  const router = useRouter();
  const params = useParams();
  const bannerId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [href, setHref] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  // バナー情報取得
  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const res = await fetch(`/api/banners/${bannerId}`);
        if (res.ok) {
          const data = await res.json();
          const banner = data.banner;
          setTitle(banner.title);
          setImageUrl(banner.image_url);
          setHref(banner.href);
          setSortOrder(banner.sort_order);
          setIsActive(banner.is_active);
          setPreviewUrl(banner.image_url);
        } else {
          alert('バナーが見つかりません');
          router.push('/bannerlist');
        }
      } catch (error) {
        console.error('バナー取得エラー:', error);
        alert('バナーの取得に失敗しました');
        router.push('/bannerlist');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanner();
  }, [bannerId, router]);

  // 画像アップロード
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // プレビュー表示
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploading(true);
    try {
      const supabase = createClient();
      const fileName = `banner_${Date.now()}_${file.name}`;
      
      const { data, error } = await supabase.storage
        .from('banner_image')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('画像アップロードエラー:', error);
        alert('画像のアップロードに失敗しました');
        return;
      }

      // 公開URLを取得
      const { data: urlData } = supabase.storage
        .from('banner_image')
        .getPublicUrl(data.path);

      setImageUrl(urlData.publicUrl);
    } catch (error) {
      console.error('画像アップロードエラー:', error);
      alert('画像のアップロードに失敗しました');
    } finally {
      setIsUploading(false);
    }
  };

  // 保存
  const handleSave = async () => {
    if (!title || !imageUrl || !href) {
      alert('タイトル、画像、リンク先は必須です');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/banners/${bannerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          image_url: imageUrl,
          href,
          sort_order: sortOrder,
          is_active: isActive,
        }),
      });

      if (res.ok) {
        alert('バナーを更新しました');
        router.push('/bannerlist');
      } else {
        const data = await res.json();
        alert(data.error || '更新に失敗しました');
      }
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className={css({ p: 8, textAlign: 'center' })}>
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className={css({ p: 8, maxW: '800px', mx: 'auto' })}>
      <div className={css({ display: 'flex', alignItems: 'center', gap: 4, mb: 6 })}>
        <button
          type="button"
          onClick={() => router.push('/bannerlist')}
          className={css({
            px: 3,
            py: 1,
            rounded: 'md',
            bg: 'gray.200',
            _hover: { bg: 'gray.300' },
          })}
        >
          ← 戻る
        </button>
        <h1 className={css({ fontSize: '2xl', fontWeight: 'bold' })}>
          バナー編集
        </h1>
      </div>

      <div className={css({ bg: 'white', rounded: 'lg', shadow: 'md', p: 6 })}>
        {/* タイトル */}
        <div className={css({ mb: 4 })}>
          <label className={css({ display: 'block', fontWeight: 'bold', mb: 1 })}>
            タイトル <span className={css({ color: 'red.500' })}>*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="バナーのタイトル（管理用）"
            className={css({
              w: 'full',
              p: 2,
              border: '1px solid',
              borderColor: 'gray.300',
              rounded: 'md',
              _focus: { borderColor: 'blue.500', outline: 'none' },
            })}
          />
        </div>

        {/* 画像 */}
        <div className={css({ mb: 4 })}>
          <label className={css({ display: 'block', fontWeight: 'bold', mb: 1 })}>
            バナー画像 <span className={css({ color: 'red.500' })}>*</span>
          </label>
          
          {/* プレビュー */}
          {previewUrl && (
            <div className={css({ mb: 2, p: 2, bg: 'gray.100', rounded: 'md', display: 'inline-block' })}>
              {previewUrl.startsWith('http') || previewUrl.startsWith('data:') ? (
                <img
                  src={previewUrl}
                  alt="プレビュー"
                  style={{ maxWidth: '400px', height: 'auto' }}
                />
              ) : (
                <Image
                  src={previewUrl}
                  alt="プレビュー"
                  width={400}
                  height={113}
                  style={{ objectFit: 'contain' }}
                />
              )}
            </div>
          )}

          <div className={css({ display: 'flex', gap: 2, alignItems: 'center' })}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={css({
                px: 4,
                py: 2,
                rounded: 'md',
                bg: 'gray.600',
                color: 'white',
                _hover: { bg: 'gray.700' },
                _disabled: { opacity: 0.5, cursor: 'not-allowed' },
              })}
            >
              {isUploading ? 'アップロード中...' : '画像を変更'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className={css({ display: 'none' })}
            />
          </div>

          {/* 画像URL直接入力 */}
          <div className={css({ mt: 2 })}>
            <label className={css({ display: 'block', fontSize: 'sm', color: 'gray.500', mb: 1 })}>
              または画像URL直接入力:
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setPreviewUrl(e.target.value);
              }}
              placeholder="https://... または /top/banners/..."
              className={css({
                w: 'full',
                p: 2,
                border: '1px solid',
                borderColor: 'gray.300',
                rounded: 'md',
                fontSize: 'sm',
                _focus: { borderColor: 'blue.500', outline: 'none' },
              })}
            />
          </div>
        </div>

        {/* リンク先 */}
        <div className={css({ mb: 4 })}>
          <label className={css({ display: 'block', fontWeight: 'bold', mb: 1 })}>
            リンク先 <span className={css({ color: 'red.500' })}>*</span>
          </label>
          <input
            type="text"
            value={href}
            onChange={(e) => setHref(e.target.value)}
            placeholder="/events または https://..."
            className={css({
              w: 'full',
              p: 2,
              border: '1px solid',
              borderColor: 'gray.300',
              rounded: 'md',
              _focus: { borderColor: 'blue.500', outline: 'none' },
            })}
          />
          <p className={css({ fontSize: 'xs', color: 'gray.500', mt: 1 })}>
            内部リンク例: /events, /notice/xxxx-xxxx, /beginner, /archive
          </p>
        </div>

        {/* 表示順 */}
        <div className={css({ mb: 4 })}>
          <label className={css({ display: 'block', fontWeight: 'bold', mb: 1 })}>
            表示順序
          </label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            min={0}
            className={css({
              w: '100px',
              p: 2,
              border: '1px solid',
              borderColor: 'gray.300',
              rounded: 'md',
              _focus: { borderColor: 'blue.500', outline: 'none' },
            })}
          />
        </div>

        {/* 有効/無効 */}
        <div className={css({ mb: 6 })}>
          <label className={css({ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' })}>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className={css({ w: '18px', h: '18px' })}
            />
            <span className={css({ fontWeight: 'bold' })}>有効（トップページに表示）</span>
          </label>
        </div>

        {/* 保存ボタン */}
        <div className={css({ display: 'flex', gap: 3 })}>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={css({
              px: 6,
              py: 2,
              rounded: 'md',
              bg: 'blue.500',
              color: 'white',
              fontWeight: 'bold',
              _hover: { bg: 'blue.600' },
              _disabled: { opacity: 0.5, cursor: 'not-allowed' },
            })}
          >
            {isSaving ? '保存中...' : '保存'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/bannerlist')}
            className={css({
              px: 6,
              py: 2,
              rounded: 'md',
              bg: 'gray.200',
              _hover: { bg: 'gray.300' },
            })}
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
