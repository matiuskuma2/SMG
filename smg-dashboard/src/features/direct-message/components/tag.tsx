'use client';

import { useTags } from '@/features/direct-message/hooks/use-tags';
import type { MstDmTag } from '@/lib/supabase/types';
import { css } from '@/styled-system/css';
import { Flex, Grid } from '@/styled-system/jsx';
import { DropdownMenu } from 'radix-ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TbDotsVertical, TbTag, TbTagPlus, TbTags } from 'react-icons/tb';
import { DeleteConfirm, FormPrompt } from './dialog';
import { Input, Label } from './form';

const TagView = ({ tags }: { tags: MstDmTag[] }) => {
  const { update, remove, refetch } = useTags();

  const onUpdate = async (id: string, name: string) => {
    await update(id, name);
    refetch();
  };

  const onDelete = async (id: string) => {
    await remove(id);
    refetch();
  };

  return (
    <ul>
      {tags.map((tag) => (
        <li key={tag.tag_id}>
          <Grid
            columnGap={'1'}
            gridTemplateColumns={'auto 1fr auto'}
            paddingBlock={'2'}
            alignItems={'center'}
          >
            <TbTag size={20} />
            <span
              className={css({
                lineClamp: '1',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                cursor: 'default',
              })}
            >
              {tag.name}
            </span>
            <TagOption
              value={tag.name}
              onUpdate={(v) => onUpdate(tag.tag_id, v)}
              onDelete={() => onDelete(tag.tag_id)}
            />
          </Grid>
        </li>
      ))}
    </ul>
  );
};

export const TagMenu = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'edit' | 'view'>('view');
  const { tags, create, activeTags, updateBind, refetch, refetchActivate } =
    useTags();
  const [selected, setSelected] = useState<MstDmTag[]>(activeTags);

  // activeTagsが変更されたらselectedを同期
  useEffect(() => {
    setSelected(activeTags);
  }, [activeTags]);

  const onCreate = useCallback(
    async (value: string, isBind: boolean) => {
      await create(value, isBind);
      refetch();
      refetchActivate();
    },
    [create, refetch, refetchActivate],
  );

  const onSaveEdit = useCallback(async () => {
    await updateBind(selected);
    setMode('view');
  }, [selected, updateBind]);

  return (
    <Grid
      gridTemplateRows={'auto 1fr'}
      rowGap={'3'}
      className={css({ w: '300px', pt: '6', pl: '2' })}
    >
      <Flex justifyContent={'space-between'} alignItems={'center'}>
        <span className={css({ fontWeight: 'bold', cursor: 'default' })}>
          タグ管理
        </span>
        {mode === 'view' && (
          <Flex>
            <button
              type="button"
              className={css({
                rounded: 'full',
                p: '2',
                _hover: { bg: 'gray.200' },
              })}
              onClick={() => setMode('edit')}
            >
              <TbTags size={26} />
            </button>
            <CreateTagButton onSubmit={onCreate} />
          </Flex>
        )}
        {mode === 'edit' && (
          <button
            type="button"
            className={css({
              rounded: 'full',
              p: '2',
              color: 'blue.700',
            })}
            onClick={onSaveEdit}
          >
            保存
          </button>
        )}
      </Flex>

      <div ref={containerRef}>
        <div
          className={css({
            overflowY: 'auto',
            pr: '2',
            maxH: '70vh',
          })}
        >
          {mode === 'view' && <TagView tags={activeTags} />}
          {mode === 'edit' && (
            <TagEditView
              tags={tags}
              selected={selected}
              onUpdate={setSelected}
            />
          )}
        </div>
      </div>
    </Grid>
  );
};

const TagEditView = ({
  tags,
  selected,
  onUpdate,
}: {
  tags: MstDmTag[];
  selected: MstDmTag[];
  onUpdate: (value: MstDmTag[]) => void;
}) => {
  const ids = selected.map((d) => d.tag_id);

  const onChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const id = e.target.value;
      const checked = e.target.checked;
      if (checked) {
        const target = tags.find((d) => d.tag_id === id);
        if (target) onUpdate([...selected, target]);
      } else {
        const idx = selected.findIndex((d) => d.tag_id === id);
        if (idx !== -1) onUpdate(selected.toSpliced(idx, 1));
      }
    },
    [tags, selected, onUpdate],
  );

  return (
    <ul>
      {tags.map((tag) => (
        <li key={tag.tag_id}>
          <Grid
            columnGap={'1'}
            gridTemplateColumns={'auto 1fr'}
            paddingBlock={'2'}
            alignItems={'center'}
          >
            <label className={css({ display: 'inline-flex', gap: '2' })}>
              <input
                checked={ids.includes(tag.tag_id)}
                value={tag.tag_id}
                className={css({ _checked: { bg: 'blue.700' } })}
                type="checkbox"
                onChange={onChange}
              />
              <span
                className={css({
                  lineClamp: '1',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  cursor: 'default',
                })}
              >
                {tag.name}
              </span>
            </label>
          </Grid>
        </li>
      ))}
    </ul>
  );
};

const CreateTagButton = ({
  onSubmit,
}: {
  onSubmit?: (value: string, isBind: boolean) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const onSave = async (value: string, isBind: boolean) => {
    await onSubmit?.(value, isBind);
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className={css({
          rounded: 'full',
          p: '2',
          _hover: { bg: 'gray.200' },
        })}
        onClick={() => setIsOpen(true)}
      >
        <TbTagPlus size={24} />
      </button>
      <TagFormDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        mode="create"
        onSave={onSave}
      />
    </>
  );
};

const DDownMenuStyle = css({
  py: '1',
  px: '2',
  cursor: 'pointer',
  _hover: {
    bg: 'blue.200',
  },
});

const TagOption = ({
  value = '',
  onUpdate,
  onDelete,
}: {
  value?: string;
  onUpdate: (value: string) => void;
  onDelete: () => void;
}) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const onClickDelete = useCallback(async () => {
    await onDelete?.();
    setIsDeleteOpen(false);
  }, [onDelete]);

  const onClickUpdate = useCallback(
    async (v: string) => {
      await onUpdate?.(v);
      setIsEditOpen(false);
    },
    [onUpdate],
  );

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className="edit-btn">
          <TbDotsVertical size={20} />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            className={css({
              bg: 'white',
              border: '1px solid',
              borderColor: 'gray.300',
              color: { base: 'gray.700' },
              rounded: 'sm',
              minW: '10rem',
            })}
          >
            <DropdownMenu.Item
              className={DDownMenuStyle}
              onSelect={() => setIsEditOpen(true)}
            >
              編集
            </DropdownMenu.Item>
            <DropdownMenu.Item
              className={DDownMenuStyle}
              onSelect={() => setIsDeleteOpen(true)}
            >
              削除
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <TagFormDialog
        open={isEditOpen}
        value={value}
        onSave={onClickUpdate}
        onOpenChange={setIsEditOpen}
        mode="edit"
      />
      <DeleteConfirm
        open={isDeleteOpen}
        onDelete={onClickDelete}
        onOpenChange={setIsDeleteOpen}
        title={`タグ「${value}」を削除しますか？`}
      >
        <p className={css({ color: 'gray.600' })}>
          このタグが付与されているすべてのトークルームから削除されます。
        </p>
      </DeleteConfirm>
    </>
  );
};

type TagFormDialogProps = {
  mode?: 'create' | 'edit';
  open: boolean;
  value?: string;
  onOpenChange: (v: boolean) => void;
  onSave?: (v: string, isBind: boolean) => void;
};
const TagFormDialog = ({
  mode = 'create',
  open,
  value = '',
  onOpenChange,
  onSave,
}: TagFormDialogProps) => {
  const [name, setName] = useState(value);
  const [isBind, setIsBind] = useState(true);
  useEffect(() => setName(value), [value]);
  return (
    <FormPrompt
      open={open}
      onOpenChange={onOpenChange}
      title={`タグを${mode === 'edit' ? '編集' : '追加'}`}
      submitButtonProps={{
        onClick: () => onSave?.(name, mode === 'create' ? isBind : false),
        disabled: name.length === 0,
      }}
    >
      <form
        className={css({
          d: 'flex',
          flexDir: 'column',
          gap: '1rem',
        })}
      >
        <div>
          <Label required>タグ名</Label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus={true}
          />
        </div>

        {mode === 'create' && (
          <label className={css({ color: 'gray.500' })}>
            <input
              type="checkbox"
              className={css({ mr: '1' })}
              checked={isBind}
              value={name}
              onChange={() => setIsBind((prev) => !prev)}
            />
            作成時にこのスレッドに紐づける
          </label>
        )}
      </form>
    </FormPrompt>
  );
};
