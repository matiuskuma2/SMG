'use client';

import {
  deleteLabels,
  fetchLabels,
  insertLabels,
  updateLabels,
} from '@/features/direct-message/actions/label';
import { useThreadParams } from '@/features/direct-message/hooks/use-threads';
import { createContext } from '@/lib/create-context';
import type { MstDmLabel } from '@/lib/supabase/types';
import { useCallback, useState } from 'react';
import { updateThreadLabel } from '../actions/thread';
import type { ArrayDiff } from './use-array-form';

const defaultLabel: MstDmLabel = {
  label_id: '0',
  name: 'ステータスなし',
  color: 'plain',
  created_at: null,
  deleted_at: null,
  updated_at: null,
};

export const useLabels = () => {
  const { labels, refetch } = useLabelContext();
  const [selected, setSelected] = useState<MstDmLabel>(defaultLabel);
  const { id } = useThreadParams();

  const getById = useCallback(
    (id?: string) => {
      return labels.find((label) => label.label_id === id) ?? defaultLabel;
    },
    [labels],
  );

  const setSelectedById = useCallback(
    (labelId: string | null | undefined) => {
      const label = labelId ? getById(labelId) : defaultLabel;
      setSelected(label);
    },
    [getById],
  );

  const setById = useCallback(
    async (labelId: string, setDefault = true) => {
      if (!id) return;
      const label = getById(labelId);
      const next = setDefault && label.label_id === '0' ? defaultLabel : label;
      const result = await updateThreadLabel(id, next.label_id);
      if (result) setSelected(next);
    },
    [id, getById],
  );

  const update = async (diff: ArrayDiff<MstDmLabel>) => {
    if (!diff.hasChanges) return;
    const { added, modified, removed } = diff;

    await Promise.all([
      insertLabels(added),
      updateLabels(modified.map((d) => d.current)),
      deleteLabels(removed),
    ]);
    refetch();
  };

  return {
    labels,
    selected,
    getById,
    setById,
    defaultLabel,
    setSelectedById,
    update,
  };
};

type LabelContextState = {
  labels: MstDmLabel[];
  refetch: () => Promise<void>;
};
export const [LabelContext, useLabelContext] = createContext<LabelContextState>(
  {
    labels: [],
    refetch: () => Promise.resolve(),
  },
);

export const LabelProvider = ({
  value,
  children,
}: React.PropsWithChildren<{ value: MstDmLabel[] }>) => {
  const [labels, setLabels] = useState<MstDmLabel[]>(value);
  const refetch = useCallback(async () => {
    const result = await fetchLabels();
    setLabels(result);
  }, []);
  return (
    <LabelContext.Provider value={{ labels, refetch }}>
      {children}
    </LabelContext.Provider>
  );
};
