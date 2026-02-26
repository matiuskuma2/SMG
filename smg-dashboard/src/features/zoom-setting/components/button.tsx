'use client';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { css, cx } from '@/styled-system/css';
import { Flex } from '@/styled-system/jsx';
import Link from 'next/link';
import { useState } from 'react';
import { btnStyle } from '../styled';

type DeleteBtnProps = {
  onClickDelete?: (close: () => void) => Promise<boolean> | undefined;
  onDeleteSuccess?: () => void;
  targetName?: string;
};

export const DeleteBtn = (props: DeleteBtnProps) => {
  const [open, setOpen] = useState(false);
  const onDelete = async () => {
    const close = () => setOpen(false);
    if (props.onClickDelete) {
      const result = await props.onClickDelete(close);
      if (result !== false && props.onDeleteSuccess) {
        props.onDeleteSuccess();
      }
    } else {
      close();
    }
  };

  return (
    <>
      <ActionBtn variant={'danger'} onClick={() => setOpen(true)}>
        削除
      </ActionBtn>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        onOutSideClick={() => setOpen(false)}
      >
        <DialogContent
          className={css({
            border: 'none',
            maxWidth: { base: '90%', md: 'md' },
            width: { base: '100%', md: 'auto' },
            minWidth: '300px',
            padding: { base: '4', md: '6' },
            borderRadius: 'xl',
          })}
        >
          <DialogHeader>
            <DialogTitle
              className={css({
                fontSize: { base: 'lg', md: 'xl' },
              })}
            >
              確認
            </DialogTitle>
          </DialogHeader>

          <p className={css({ color: 'gray.500' })}>
            {props.targetName ? (
              <>
                Zoom設定「
                <span className={css({ fontWeight: 'bold' })}>
                  {props.targetName}
                </span>
                」を削除しますか?
              </>
            ) : (
              'この項目を削除しますか?'
            )}
          </p>

          <DialogFooter>
            <Flex justify={'end'} gap="3">
              <button
                type="button"
                className={css({ color: 'zinc.700' })}
                onClick={() => setOpen(false)}
              >
                キャンセル
              </button>
              <button
                type="button"
                className={css({ color: 'red.700' })}
                onClick={onDelete}
              >
                削除する
              </button>
            </Flex>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const ActionBtn = ({
  type = 'button',
  className,
  variant = 'primary',
  ...props
}: React.HTMLProps<HTMLButtonElement> & {
  variant?: 'primary' | 'danger' | 'text';
}) => {
  const style = cx(btnStyle({ type: variant }), className);
  return <button type="button" className={style} {...props} />;
};

export const LinkBtn = ({
  type = 'primary',
  className,
  href = '#',
  ...props
}: React.HTMLProps<HTMLAnchorElement> & {
  type?: 'primary' | 'danger' | 'text';
}) => {
  const style = cx(btnStyle({ type }), className);
  return <Link {...props} href={href} className={style} />;
};
