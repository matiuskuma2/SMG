'use client';

import {
  type DmUser,
  useUsers,
} from '@/features/direct-message/hooks/use-users';
import { css, cx, sva } from '@/styled-system/css';
import { Flex, Stack } from '@/styled-system/jsx';
import { type Token, token } from '@/styled-system/tokens';
import type { SystemStyleObject } from '@/styled-system/types';
import Image from 'next/image';
import { Select } from 'radix-ui';
import { useState } from 'react';
import { LuChevronDown, LuCircleX } from 'react-icons/lu';

const select = sva({
  slots: ['trigger', 'content', 'item', 'icon', 'viewport'],
  base: {
    trigger: {
      d: 'inline-flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px',
      borderRadius: 'md',
      border: '1px solid token(colors.gray.300)',
      _placeholder: { color: '#8e8e8e' },
      w: 'full',
    },
    content: {
      bg: 'white',
      boxShadow: 'lg',
      borderRadius: 'md',
    },
    item: {
      p: '2',
      d: 'flex',
      gap: '1rem',
      cursor: 'pointer',
      _hover: {
        bg: 'blue.200',
        outline: 'none',
      },
      '&[data-state=checked]': {
        color: 'blue.700',
        fontWeight: 'semibold',
      },
      borderTopRadius: {
        _first: 'md',
      },
      borderBottomRadius: {
        _last: 'md',
      },
    },
    icon: {
      rounded: 'full',
      bg: 'black',
      objectFit: 'contain',
    },
  },
})();

export const UserSelect = ({
  id,
  ...props
}: React.ComponentPropsWithoutRef<typeof Select.Root> & { id?: string }) => {
  const { me, admin } = useUsers();
  const onClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    props.onValueChange?.('');
  };

  return (
    <Select.Root {...props}>
      <Stack pos={'relative'} className="group">
        <Select.Trigger className={select.trigger}>
          <Select.Value placeholder="担当者を選択" />
          <Flex gap={'0.5'} w={'fit-content'}>
            <Select.Icon>
              <LuChevronDown size={20} />
            </Select.Icon>
          </Flex>
        </Select.Trigger>
        {props.value && (
          <button
            type="button"
            className={css({
              pos: 'absolute',
              right: '2.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
              d: { base: 'none', _groupHover: 'block' },
            })}
            onClick={onClear}
          >
            <LuCircleX className={css({ color: 'gray.700' })} size={20} />
          </button>
        )}
      </Stack>

      <Select.Content
        id={id}
        position="popper"
        className={cx(
          select.content,
          css({ maxH: '300px', overflowY: 'auto' }),
        )}
      >
        <Select.Viewport>
          <Select.Group>
            <Item user={me} />
            {admin.map((d) => (
              <Item key={d.id} user={d} />
            ))}
          </Select.Group>
        </Select.Viewport>
      </Select.Content>
    </Select.Root>
  );
};

const Item = ({ user }: { user: DmUser }) => (
  <Select.Item className={select.item} value={user.id}>
    <DmAvator size={'6'} user={user} />
    <Select.ItemText>{user.username}</Select.ItemText>
  </Select.Item>
);

export const DmAvator = <T extends Pick<DmUser, 'icon' | 'username'>>({
  user,
  size = '8',
}: { user: T; size?: SystemStyleObject['w'] }) => {
  const [isFailed, setIsFailed] = useState(false);
  const isValidSrc = !!user.icon;

  const iconSize = token.var(`sizes.${size}` as Token);
  return (
    <Stack
      className={css({
        rounded: 'full',
        bg: 'gray.300',
      })}
      style={{
        height: iconSize,
        width: iconSize,
      }}
    >
      {isValidSrc && (
        <Image
          className={css({
            h: 'inherit',
            w: 'inherit',
            borderRadius: 'inherit',
            objectFit: 'cover',
          })}
          width={32}
          height={32}
          style={{ maxWidth: iconSize }}
          src={user.icon as string}
          alt={'avator'}
          onError={() => setIsFailed(true)}
        />
      )}
      {(!isValidSrc || isFailed) && (
        <Stack
          className={css({
            h: 'inherit',
            w: 'inherit',
            rounded: 'inherit',
            color: 'gray.700',
            d: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'sm',
          })}
          style={{ maxWidth: iconSize }}
        >
          {user.username?.charAt(0)}
        </Stack>
      )}
    </Stack>
  );
};
