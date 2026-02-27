'use client';

import { css } from '@/styled-system/css';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Group = {
  group_id: string;
  title: string;
};

const LINK_TYPE_OPTIONS = [
  { value: 'internal', label: '内部パス', placeholder: '例: /archive' },
  { value: 'notice', label: 'お知らせ', placeholder: '/notice（自動設定）' },
  { value: 'event', label: 'イベント予約', placeholder: '/events（自動設定）' },
  { value: 'shibu', label: '支部', placeholder: '/shibu（自動設定）' },
  { value: 'external', label: '外部URL', placeholder: '例: https://example.com' },
];

const AUTO_LINK_VALUES: Record<string, string> = {
  notice: '/notice',
  event: '/events',
  shibu: '/shibu',
};

export default function TabNewPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);

  // フォーム状態
  const [displayName, setDisplayName] = useState('');
  const [linkType, setLinkType] = useState('internal');
  const [linkValue, setLinkValue] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [status, setStatus] = useState<'public' | 'draft'>('draft');
  const [isVisibleToAll, setIsVisibleToAll] = useState(true);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  // グループ一覧取得
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await fetch('/api/tabs');
        if (res.ok) {
          const data = await res.json();
          // タブ数から次の表示順序を計算
          const maxOrder = Math.max(0, ...(data.tabs || []).map((t: any) => t.display_order));
          setDisplayOrder(maxOrder + 1);
        }
      } catch (e) {
        console.error(e);
      }
    };

    const fetchGroupList = async () => {
      try {
        // グループ一覧はgroup APIから取得
        const res = await fetch('/api/tabs');
        // グループ一覧は別途取得が必要 - Supabaseから直接
        // ここではapi/tabsのGETで取得したvisible_groupsの情報は使えないので
        // 別のアプローチが必要
      } catch (e) {
        console.error(e);
      }
    };

    fetchGroups();
  }, []);

  // グループ一覧を取得（Supabase client経由）
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data, error } = await supabase
          .from('mst_group')
          .select('group_id, title')
          .is('deleted_at', null)
          .order('title');

        if (!error && data) {
          setGroups(data);
        }
      } catch (e) {
        console.error('グループ取得エラー:', e);
      }
    };
    fetchGroups();
  }, []);

  // link_type 変更時に自動リンク値を設定
  useEffect(() => {
    if (AUTO_LINK_VALUES[linkType]) {
      setLinkValue(AUTO_LINK_VALUES[linkType]);
    }
  }, [linkType]);

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
      alert('表示名を入力してください');
      return;
    }
    if (!linkValue.trim()) {
      alert('リンク先を入力してください');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/tabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName.trim(),
          link_type: linkType,
          link_value: linkValue.trim(),
          display_order: displayOrder,
          status,
          is_visible_to_all: isVisibleToAll,
          visible_group_ids: isVisibleToAll ? [] : selectedGroupIds,
        }),
      });

      if (res.ok) {
        router.push('/tablist');
      } else {
        const data = await res.json();
        alert(data.error || '作成に失敗しました');
      }
    } catch (error) {
      console.error('作成エラー:', error);
      alert('作成に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentLinkTypeOption = LINK_TYPE_OPTIONS.find((o) => o.value === linkType);

  return (
    <div className={css({ p: 8, maxW: '800px', mx: 'auto' })}>
      <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', mb: 6 })}>
        新規タブ作成
      </h1>

      <form onSubmit={handleSubmit}>
        <div className={css({ bg: 'white', rounded: 'lg', shadow: 'md', p: 6, display: 'flex', flexDir: 'column', gap: 5 })}>
          {/* 表示名 */}
          <div>
            <label className={css({ fontWeight: 'bold', mb: 1, display: 'block' })}>
              表示名 <span className={css({ color: 'red.500' })}>*</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="例: お知らせ"
              className={css({
                w: 'full',
                px: 3,
                py: 2,
                border: '1px solid',
                borderColor: 'gray.300',
                rounded: 'md',
                _focus: { borderColor: 'blue.500', outline: 'none' },
              })}
            />
          </div>

          {/* リンク種別 */}
          <div>
            <label className={css({ fontWeight: 'bold', mb: 1, display: 'block' })}>
              リンク種別 <span className={css({ color: 'red.500' })}>*</span>
            </label>
            <select
              value={linkType}
              onChange={(e) => setLinkType(e.target.value)}
              className={css({
                w: 'full',
                px: 3,
                py: 2,
                border: '1px solid',
                borderColor: 'gray.300',
                rounded: 'md',
                bg: 'white',
                _focus: { borderColor: 'blue.500', outline: 'none' },
              })}
            >
              {LINK_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* リンク先 */}
          <div>
            <label className={css({ fontWeight: 'bold', mb: 1, display: 'block' })}>
              リンク先 <span className={css({ color: 'red.500' })}>*</span>
            </label>
            <input
              type="text"
              value={linkValue}
              onChange={(e) => setLinkValue(e.target.value)}
              placeholder={currentLinkTypeOption?.placeholder || ''}
              disabled={!!AUTO_LINK_VALUES[linkType]}
              className={css({
                w: 'full',
                px: 3,
                py: 2,
                border: '1px solid',
                borderColor: 'gray.300',
                rounded: 'md',
                _focus: { borderColor: 'blue.500', outline: 'none' },
                _disabled: { bg: 'gray.100', cursor: 'not-allowed' },
              })}
            />
            {AUTO_LINK_VALUES[linkType] && (
              <p className={css({ fontSize: 'xs', color: 'gray.500', mt: 1 })}>
                このリンク種別では自動的にパスが設定されます
              </p>
            )}
          </div>

          {/* 表示順序 */}
          <div>
            <label className={css({ fontWeight: 'bold', mb: 1, display: 'block' })}>
              表示順序
            </label>
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Number.parseInt(e.target.value, 10) || 0)}
              min={0}
              className={css({
                w: '120px',
                px: 3,
                py: 2,
                border: '1px solid',
                borderColor: 'gray.300',
                rounded: 'md',
                _focus: { borderColor: 'blue.500', outline: 'none' },
              })}
            />
            <p className={css({ fontSize: 'xs', color: 'gray.500', mt: 1 })}>
              数値が小さいほど左（上）に表示されます
            </p>
          </div>

          {/* 公開状態 */}
          <div>
            <label className={css({ fontWeight: 'bold', mb: 2, display: 'block' })}>
              公開状態
            </label>
            <div className={css({ display: 'flex', gap: 4 })}>
              <label className={css({ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' })}>
                <input
                  type="radio"
                  name="status"
                  value="public"
                  checked={status === 'public'}
                  onChange={() => setStatus('public')}
                />
                <span>公開</span>
              </label>
              <label className={css({ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' })}>
                <input
                  type="radio"
                  name="status"
                  value="draft"
                  checked={status === 'draft'}
                  onChange={() => setStatus('draft')}
                />
                <span>下書き</span>
              </label>
            </div>
          </div>

          {/* 表示権限 */}
          <div>
            <label className={css({ fontWeight: 'bold', mb: 2, display: 'block' })}>
              表示権限
            </label>
            <label className={css({ display: 'flex', alignItems: 'center', gap: 2, mb: 3, cursor: 'pointer' })}>
              <input
                type="checkbox"
                checked={isVisibleToAll}
                onChange={(e) => setIsVisibleToAll(e.target.checked)}
              />
              <span>全員に表示</span>
            </label>

            {!isVisibleToAll && (
              <div className={css({ pl: 4, borderLeft: '2px solid', borderColor: 'blue.200' })}>
                <p className={css({ fontSize: 'sm', color: 'gray.600', mb: 2 })}>
                  表示するグループを選択してください（運営・講師は常にすべて閲覧可能）
                </p>
                <div className={css({ display: 'flex', flexWrap: 'wrap', gap: 2 })}>
                  {groups.map((group) => (
                    <label
                      key={group.group_id}
                      className={css({
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        px: 3,
                        py: 1.5,
                        rounded: 'md',
                        border: '1px solid',
                        borderColor: selectedGroupIds.includes(group.group_id) ? 'blue.500' : 'gray.200',
                        bg: selectedGroupIds.includes(group.group_id) ? 'blue.50' : 'white',
                        cursor: 'pointer',
                        fontSize: 'sm',
                        _hover: { borderColor: 'blue.300' },
                      })}
                    >
                      <input
                        type="checkbox"
                        checked={selectedGroupIds.includes(group.group_id)}
                        onChange={() => handleGroupToggle(group.group_id)}
                      />
                      {group.title}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ボタン */}
          <div className={css({ display: 'flex', gap: 3, justifyContent: 'flex-end', pt: 4, borderTop: '1px solid', borderColor: 'gray.200' })}>
            <button
              type="button"
              onClick={() => router.push('/tablist')}
              className={css({
                px: 6,
                py: 2,
                rounded: 'md',
                border: '1px solid',
                borderColor: 'gray.300',
                _hover: { bg: 'gray.50' },
              })}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
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
              {isSubmitting ? '作成中...' : '作成'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
