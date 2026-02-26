import {
  DeleteConfirm,
  FormPrompt,
} from '@/features/direct-message/components/dialog';
import { useMemos } from '@/features/direct-message/hooks/use-memo';
import { createContext } from '@/lib/create-context';
import { css } from '@/styled-system/css';
import { Flex, Grid } from '@/styled-system/jsx';
import dayjs from 'dayjs';
import { DropdownMenu } from 'radix-ui';
import { useState } from 'react';
import { MdEditNote } from 'react-icons/md';
import { TbDotsVertical } from 'react-icons/tb';
import { Input, Label } from '../form';
import { UserSelect } from './user-select';

import type { DmMemo } from '@/features/direct-message/actions/memo';

type MemoContext = {
  open: boolean;
  setOpen: (options: {
    open: boolean;
    id?: string;
  }) => void;
};

const [context, useMemoContext] = createContext<MemoContext>({
  open: false,
  setOpen: () => {},
});

export const MemoMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { getById, create, update } = useMemos();

  const [selected, setSelected] = useState<string>();
  const [mode, setMode] = useState<'edit' | 'create'>('create');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [assignee, setAssignee] = useState<string>('');

  const setOpen: MemoContext['setOpen'] = ({ open, id }) => {
    if (!open) return setIsOpen(false);
    const target = getById(id);

    setMode(target ? 'edit' : 'create');
    setTitle(target?.title ?? '');
    setContent(target?.content ?? '');
    setAssignee(target?.assignee?.user_id ?? '');
    setSelected(id);
    setIsOpen(true);
  };

  const onSave = async () => {
    if (mode === 'create') {
      await create({ title, content, assignee });
    } else {
      await update(selected as string, { title, content, assignee });
    }
    setIsOpen(false);
  };

  return (
    <>
      <context.Provider value={{ open: isOpen, setOpen }}>
        <MemoLayout />
      </context.Provider>

      <FormPrompt
        open={isOpen}
        onOpenChange={setIsOpen}
        submitButtonProps={{
          onClick: onSave,
          disabled: !title || !content,
        }}
        title={`メモを${mode === 'edit' ? '編集' : '追加'}`}
      >
        <form>
          <Grid gridTemplateRows={'auto auto 1fr'} rowGap={'3'} w="100%">
            <div>
              <Label htmlFor="memo-title" required>
                タイトル
              </Label>
              <Input
                id="memo-title"
                type="text"
                name="title"
                placeholder="タイトル"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="memo-assignee">担当者</Label>
              <UserSelect
                id={'memo-assignee'}
                name="assignee"
                value={assignee}
                onValueChange={(value) => setAssignee(value)}
              />
            </div>

            <div>
              <Label htmlFor="memo-content" required>
                メモ内容
              </Label>
              <textarea
                placeholder="ここにメモを入力"
                id="memo-content"
                name="content"
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={css({
                  width: '100%',
                  height: '100px',
                  padding: '8px',
                  borderRadius: 'md',
                  border: '1px solid token(colors.gray.300)',
                  resize: 'none',
                })}
              />
            </div>
          </Grid>
        </form>
      </FormPrompt>
    </>
  );
};

export const MemoLayout = () => {
  const { setOpen } = useMemoContext();
  const { memos } = useMemos();

  return (
    <Grid
      gridTemplateRows={'auto 1fr'}
      rowGap={'3'}
      className={css({ w: '300px', pt: '6', pl: '2' })}
    >
      <Flex justifyContent={'space-between'} alignItems={'center'}>
        <span className={css({ fontWeight: 'bold' })}>メモ</span>
        <button
          type="button"
          className={css({
            rounded: 'full',
            p: '2',
            _hover: { bg: 'gray.200' },
          })}
          onClick={() => setOpen({ open: true })}
        >
          <MdEditNote size={24} />
        </button>
      </Flex>

      <Flex
        overflowY={'auto'}
        pr={'2'}
        gap={'4'}
        flexDir={'column'}
        maxH={'70vh'}
      >
        {memos.map((memo) => (
          <MemoBox key={memo.memo_id} memo={memo} />
        ))}
      </Flex>
    </Grid>
  );
};

const DDownMenuStyle = css({
  py: '1',
  px: '2',
  cursor: 'pointer',
  boxShadow: '0 10px 38px -10px #16171859,0 10px 20px -15px #16171833',
  _hover: {
    bg: 'blue.200',
  },
});

const MemoBox = ({ memo }: { memo: DmMemo }) => {
  const { setOpen } = useMemoContext();
  const { remove } = useMemos();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const onDelete = async () => {
    await remove(memo.memo_id);
    setIsDeleteOpen(false);
  };

  return (
    <>
      <Grid
        gridTemplateRows={'auto  1fr auto'}
        rowGap={'0'}
        rounded={'md'}
        fontSize={'sm'}
        border={'1px solid token(colors.gray.300)'}
        className={css({
          '& > * + *': {
            borderTop: '1px solid',
            borderColor: 'gray.300',
          },
        })}
      >
        <Flex justify={'space-between'} bg={'gray.200'} px={'2'} py={'1'}>
          <span className={css({ fontWeight: 'bold' })}>{memo.title}</span>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <TbDotsVertical size={16} />
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
                  onSelect={() => setOpen({ open: true, id: memo.memo_id })}
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
        </Flex>
        <p
          className={css({
            cursor: 'default',
            p: '2',
          })}
        >
          {memo.content}
        </p>
        <Flex justify={'space-between'} bg={'gray.200'} px={'2'} py={'1'}>
          {memo.assignee ? <p>{memo.assignee?.username}</p> : <div />}
          <p>{dayjs(memo.created_at).format('YYYY/MM/DD HH:mm')}</p>
        </Flex>
      </Grid>
      <DeleteConfirm
        open={isDeleteOpen}
        onDelete={onDelete}
        onOpenChange={setIsDeleteOpen}
        title="メモの削除"
      >
        <p className={css({ color: 'gray.600' })}>このメモを削除しますか？</p>
      </DeleteConfirm>
    </>
  );
};
