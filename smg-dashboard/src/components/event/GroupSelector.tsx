'use client';

import { createClient } from '@/lib/supabase/client';
import { css } from '@/styled-system/css';
import { useEffect, useState } from 'react';

export type Group = {
  group_id: string;
  title: string;
  description: string;
};

type GroupSelectorProps = {
  value?: string;
  onChange: (groupId: string | undefined) => void;
  required?: boolean;
};

export const GroupSelector = ({
  value,
  onChange,
  required = false,
}: GroupSelectorProps) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('mst_group')
          .select('group_id, title, description')
          .is('deleted_at', null)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('グループ取得エラー:', error);
          setError('グループの取得に失敗しました');
          return;
        }

        setGroups(data || []);
      } catch (error) {
        console.error('グループ取得エラー:', error);
        setError('グループの取得中にエラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, [supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    onChange(selectedValue === '' ? undefined : selectedValue);
  };

  if (isLoading) {
    return (
      <div
        className={css({
          p: '4',
          textAlign: 'center',
          color: 'gray.600',
        })}
      >
        グループを読み込み中...
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={css({
          p: '4',
          textAlign: 'center',
          color: 'red.600',
          bg: 'red.50',
          borderRadius: 'md',
        })}
      >
        {error}
      </div>
    );
  }

  return (
    <div>
      <label
        htmlFor="visible_group_id"
        className={css({
          display: 'block',
          fontSize: 'sm',
          fontWeight: 'medium',
          color: 'gray.700',
          mb: '2',
        })}
      >
        表示グループ{' '}
        {required && <span className={css({ color: 'red.500' })}>*</span>}
      </label>
      <select
        id="visible_group_id"
        name="visible_group_id"
        value={value || ''}
        onChange={handleChange}
        required={required}
        className={css({
          w: 'full',
          px: '3',
          py: '2',
          border: '1px solid',
          borderColor: 'gray.300',
          borderRadius: 'md',
          fontSize: 'sm',
          bg: 'white',
          _focus: {
            outline: 'none',
            borderColor: 'blue.500',
            boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
          },
          _disabled: {
            bg: 'gray.100',
            cursor: 'not-allowed',
          },
        })}
        disabled={isLoading}
      >
        <option value="">グループを選択してください</option>
        {groups.map((group) => (
          <option key={group.group_id} value={group.group_id}>
            {group.title}
          </option>
        ))}
      </select>
      {value && groups.find((g) => g.group_id === value)?.description && (
        <p
          className={css({
            mt: '2',
            fontSize: 'xs',
            color: 'gray.600',
            fontStyle: 'italic',
          })}
        >
          {groups.find((g) => g.group_id === value)?.description}
        </p>
      )}
    </div>
  );
};
