'use client';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useArrayForm } from '@/features/direct-message/hooks/use-array-form';
import { useLabels } from '@/features/direct-message/hooks/use-labels';
import { useThreads } from '@/features/direct-message/hooks/use-threads';
import type { MstDmLabel } from '@/lib/supabase/types';
import { css } from '@/styled-system/css';
import { Flex, styled } from '@/styled-system/jsx';
import { useEffect, useState } from 'react';
import { FaChevronRight, FaCircleCheck } from 'react-icons/fa6';
import { IoAddOutline, IoCloseOutline, IoTrashOutline } from 'react-icons/io5';
import { MdModeEdit } from 'react-icons/md';
import { v4 as uuid } from 'uuid';
import {
  type LabelColorVariant,
  type LabelOptionVariantProps,
  colorInputStyle,
  colorOptionStyle,
  labelOption,
  tagStyle,
  toLabelColor,
} from './styled';

export const StatusSelector = () => {
  const [open, setOpen] = useState(false);
  const { currentThread, refetch } = useThreads();
  const { selected, setById, labels, defaultLabel, setSelectedById } =
    useLabels();

  const onSelect = async (value?: string) => {
    if (value) {
      await setById(value);
      refetch();
    }
    setOpen(false);
  };

  useEffect(() => {
    setSelectedById(currentThread?.labelId);
  }, [currentThread, setSelectedById]);

  return (
    <div
      className={css({
        display: 'inline-flex',
        gap: '3',
        alignItems: 'center',
      })}
    >
      <div className={css({ pos: 'relative' })}>
        <StatusButton
          type={toLabelColor(selected.color)}
          onClick={() => setOpen((prev) => !prev)}
        >
          {selected.name}
          <FaChevronRight
            className={css({ transition: 'all 0.2s' })}
            style={{ rotate: open ? '90deg' : '0deg' }}
          />
        </StatusButton>
        {open && (
          <Flex
            flexDir="column"
            gap="4"
            align="end"
            pos="absolute"
            bg="white"
            zIndex="500"
            borderRadius="md"
            border="1px solid token(colors.gray.300)"
            right="-.5rem"
            mt="2"
            px="2"
            py="4"
          >
            {[defaultLabel, ...labels].map((option) => (
              <StatusOption
                key={option.label_id}
                value={option.label_id}
                type={toLabelColor(option.color)}
                selected={selected.label_id === option.label_id}
                onSelect={onSelect}
              >
                {option.name}
              </StatusOption>
            ))}
          </Flex>
        )}
      </div>
      <StatusEditButton />
    </div>
  );
};

const StatusOption = ({
  selected = false,
  value = undefined,
  children,
  type = 'plain',
  onSelect = () => {},
}: React.PropsWithChildren<
  {
    selected?: boolean;
    value?: string;
    onSelect?: (value?: string) => void;
  } & LabelOptionVariantProps
>) => {
  return (
    <Flex justifyContent={'space-between'} alignItems={'center'} gap={'2'}>
      <i>
        {selected && (
          <FaCircleCheck className={css({ color: 'green.400' })} size={24} />
        )}
      </i>
      <StatusButton type={type} onClick={() => onSelect(value)}>
        {children}
      </StatusButton>
    </Flex>
  );
};

const StatusButton = styled('button', labelOption);

export const StatusTag = ({ tagId }: { tagId?: string }) => {
  const { labels } = useLabels();
  const tag = labels.find((option) => option.label_id === tagId);
  if (!tag) return null;

  const style = css(
    labelOption.raw({ type: toLabelColor(tag.color) }),
    tagStyle,
  );
  return <span className={style}>{tag.name}</span>;
};

const initialFormValue: MstDmLabel = {
  label_id: '',
  name: '',
  color: 'plain',
  created_at: null,
  deleted_at: null,
  updated_at: null,
};

const StatusEditButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { labels, update: updateLabels } = useLabels();
  const { values, reset, remove, push, update, getDiff } =
    useArrayForm<MstDmLabel>('label_id', labels);

  const open = () => {
    reset();
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
  };

  const onSave = async () => {
    await updateLabels(getDiff());
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
        onClick={open}
      >
        <MdModeEdit size={20} />
      </button>
      <Dialog open={isOpen} onOpenChange={setIsOpen} onOutSideClick={() => {}}>
        <DialogContent
          className={css({
            maxWidth: { base: '90%', md: 'md' },
            width: { base: '100%', md: 'auto' },
            padding: { base: '4', md: '6' },
            borderRadius: 'xl',
            border: 'none',
          })}
        >
          <DialogHeader className={css({ pos: 'relative' })}>
            <DialogTitle
              className={css({
                fontSize: { base: 'lg', md: 'xl' },
                textAlign: 'center',
              })}
            >
              対応ステータス編集
            </DialogTitle>
            <p className={css({ textAlign: 'center', fontSize: 'sm' })}>
              テキストとカラーの変更ができます
            </p>
            <button
              type="button"
              className={css({ pos: 'absolute', right: '0' })}
              onClick={close}
            >
              <IoCloseOutline size={24} />
            </button>
          </DialogHeader>

          <Flex flexDir={'column'} gap={'4'}>
            {values.map((v, idx) => (
              <StatusRow
                key={v.label_id ?? `row-${idx}`}
                label={v}
                disabled={values.length === 1}
                onClickTrash={() => remove(idx)}
                onUpdate={update(idx)}
              />
            ))}
            <button
              type="button"
              className={css({
                marginInline: 'auto',
                rounded: 'full',
                outline: '2px dashed',
                outlineColor: 'gray.600',
                color: 'black',
                p: '2',
              })}
              onClick={() => push({ ...initialFormValue, label_id: uuid() })}
            >
              <IoAddOutline size={24} />
            </button>
          </Flex>

          <DialogFooter>
            <Flex justify={'end'} gap={'3'}>
              <button
                type="button"
                className={css({ color: 'zinc.700' })}
                onClick={() => close()}
              >
                キャンセル
              </button>
              <button
                type="button"
                className={css({ color: 'blue.700' })}
                onClick={() => onSave()}
              >
                保存する
              </button>
            </Flex>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const StatusRow = ({
  label,
  onUpdate,
  onClickTrash,
  disabled = false,
}: {
  label: MstDmLabel;
  onUpdate?: (v: MstDmLabel) => void;
  onClickTrash: () => void;
  disabled?: boolean;
}) => {
  const type = toLabelColor(label.color);

  const updateForm = <T extends keyof MstDmLabel>(
    field: T,
    value: MstDmLabel[T],
  ) => {
    const updatedForm = { ...label, [field]: value };
    onUpdate?.(updatedForm);
  };

  return (
    <Flex gap={'4'} alignItems={'center'}>
      <ColoredInput
        type={type}
        value={label.name}
        onChange={(e) => updateForm('name', e.target.value)}
      />
      <ColorSelector value={type} onChange={(v) => updateForm('color', v)} />
      <button
        type="button"
        className={css({
          _disabled: { color: 'gray.400', cursor: 'not-allowed' },
        })}
        onClick={onClickTrash}
        disabled={disabled}
      >
        <IoTrashOutline size={20} color="gray.600" />
      </button>
    </Flex>
  );
};

const ColoredInput = styled('input', colorInputStyle, {
  defaultProps: {
    maxLength: 10,
  },
});

const ColorOption = styled('button', colorOptionStyle);

const ColorSelector = ({
  value,
  onChange,
}: {
  value: LabelColorVariant;
  onChange: (value: LabelColorVariant) => void;
}) => {
  const [selected, setSelected] = useState<LabelColorVariant>(value || 'plain');
  const [isOpen, setIsOpen] = useState(false);

  const set = (value: LabelColorVariant) => () => {
    setSelected(value);
    onChange(value);
    setIsOpen(false);
  };

  return (
    <>
      <div className={css({ pos: 'relative', h: '2rem' })}>
        <ColorOption
          type={selected}
          onClick={() => setIsOpen((prev) => !prev)}
        />
        {isOpen && (
          <Flex
            className={css({
              bg: 'white',
              border: '1px solid ',
            })}
            gap="2"
            p="4"
            zIndex={1000}
            pos="absolute"
            borderRadius="md"
            left="-4"
            border="1px solid token(colors.gray.300)"
          >
            <ColorOption type="plain" onClick={set('plain')} />
            <ColorOption type="red" onClick={set('red')} />
            <ColorOption type="blue" onClick={set('blue')} />
            <ColorOption type="yellow" onClick={set('yellow')} />
            <ColorOption type="green" onClick={set('green')} />
            <ColorOption type="gray" onClick={set('gray')} />
          </Flex>
        )}
      </div>
    </>
  );
};
