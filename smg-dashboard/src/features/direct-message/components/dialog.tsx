import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { css, cx } from '@/styled-system/css';
import { Flex } from '@/styled-system/jsx';

export const DeleteConfirm = ({
  onDelete,
  onOpenChange,
  open,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDelete?: () => void;
  title?: string;
  children?: React.ReactNode;
}) => {
  const close = () => onOpenChange(false);
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange} onOutSideClick={() => {}}>
        <DialogContent
          className={css({
            maxWidth: { base: '90%', md: 'md' },
            width: { base: '100%', md: 'auto' },
            padding: { base: '4', md: '6' },
            borderRadius: 'xl',
            border: 'none',
          })}
        >
          <DialogHeader>
            <DialogTitle
              className={css({
                fontSize: { base: 'lg', md: 'xl' },
              })}
            >
              {title}
            </DialogTitle>
          </DialogHeader>

          {children}

          <DialogFooter>
            <Flex justify={'end'} gap={'3'}>
              <button
                type="button"
                className={css({ color: 'zinc.700' })}
                onClick={close}
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

const submitBtnStyle = css({
  color: 'blue.700',
  _disabled: {
    color: 'blue.300',
    cursor: 'default',
  },
});

export const FormPrompt = ({
  onOpenChange,
  open,
  title,
  children,
  cancelButtonProps = {},
  submitButtonProps = {},
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string | React.ReactNode;
  children?: React.ReactNode;
  cancelButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  submitButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
}) => {
  const mergedSubmitProps: React.ButtonHTMLAttributes<HTMLButtonElement> = {
    children: '保存する',
    onClick: () => onOpenChange(false),
    ...submitButtonProps,
    className: cx(submitBtnStyle, submitButtonProps.className),
  };

  const mergedCancelProps: React.ButtonHTMLAttributes<HTMLButtonElement> = {
    children: 'キャンセル',
    onClick: () => onOpenChange(false),
    ...cancelButtonProps,
    className: cx(css({ color: 'zinc.700' }), cancelButtonProps.className),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} onOutSideClick={() => {}}>
      <DialogContent
        className={css({
          maxWidth: { base: '90%', md: 'md' },
          width: '100%',
          padding: '6',
          borderRadius: 'xl',
          border: 'none',
        })}
      >
        <DialogHeader>
          <DialogTitle
            className={css({
              fontSize: { base: 'lg', md: 'xl' },
              textAlign: 'left',
            })}
          >
            {title}
          </DialogTitle>
        </DialogHeader>

        {children}

        <DialogFooter>
          <Flex justify={'end'} gap={'3'}>
            <button type="button" {...mergedCancelProps} />
            <button type="button" {...mergedSubmitProps} />
          </Flex>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
