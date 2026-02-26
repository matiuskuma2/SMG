'use client';

import { css } from '@/styled-system/css';
import { Divider, Flex, Grid, Stack } from '@/styled-system/jsx';
import dayjs from 'dayjs';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { MessageItem } from './item';

import { useMessageInfiniteScroll } from '@/features/direct-message/hooks/use-infinite-scroll';
import { useMessages } from '@/features/direct-message/hooks/use-messages';
import Link from 'next/link';
import { composeRefs } from 'radix-ui/internal';
import { MdSend } from 'react-icons/md';
import { FileInputBtn } from '../file-input-button';
import { StatusSelector } from '../labels';
import { Tab } from '../tab';

export const MessageView = () => {
  const { currentThread } = useMessages();

  if (!currentThread) return null;

  return (
    <>
      <Grid gridTemplateRows={'auto 1fr'} px={'4'} height="100%" minH={0}>
        <Flex
          alignItems={'center'}
          justifyContent={'space-between'}
          className={css({
            py: '2',
            boxSizing: 'border-box',
            borderBottom: '1px solid #d0d0d0',
          })}
        >
          <Link
            href={'#'}
            className={css({
              fontSize: 'large',
              fontWeight: 'bold',
            })}
          >
            {currentThread.user.username}
          </Link>
          <StatusSelector />
        </Flex>
        <Flex flexDir={'column'} height="100%" minH={0} gap={'1rem'}>
          <Messages />
          <MessageField />
        </Flex>
      </Grid>
      <Divider bg={'#d0d0d0'} w={'1px'} />
      <Tab />
    </>
  );
};

const Messages = () => {
  const { messages, isLoading, hasMore } = useMessages();
  const container = useRef<HTMLDivElement>(null);
  const { rootRef, loadRef } = useMessageInfiniteScroll();

  const refs = composeRefs(container, rootRef);

  const groupEntiries = useMemo(() => {
    const groupBy = Object.groupBy(messages, ({ created_at }) => {
      const date = dayjs(created_at);
      return date.format('YYYY/M/DD');
    });
    return Object.entries(groupBy).toReversed();
  }, [messages]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useLayoutEffect(() => {
    if (container.current && !isLoading && messages.length > 0) {
      requestAnimationFrame(() =>
        container.current?.scrollTo({ top: container.current.scrollHeight }),
      );
    }
  }, [isLoading]);

  return (
    <Stack flex={1} overflowY={'auto'} minH={0} ref={refs}>
      {hasMore && <div className={css({ h: '1px' })} ref={loadRef} />}
      <Flex flexDir={'column-reverse'} pr={'2'} pb={'1rem'}>
        {!isLoading &&
          groupEntiries.map(([day, messages]) => (
            <div key={day}>
              <DayDivider day={day} />
              {messages?.map((msg) => (
                <MessageItem key={msg.message_id} msg={msg} />
              ))}
            </div>
          ))}
      </Flex>
    </Stack>
  );
};

const DayDivider = ({ day }: { day: string }) => (
  <p
    className={css({
      textAlign: 'center',
      position: 'relative',
      cursor: 'default',
      mt: '4',
      mb: '2',
      boxSizing: 'border-box',
      _before: {
        content: '""',
        w: '40%',
        position: 'absolute',
        top: '50%',
        left: '0',
        borderBottom: '1px solid #e0e0e0',
      },
      _after: {
        content: '""',
        w: '40%',
        position: 'absolute',
        top: '50%',
        right: '0',
        borderBottom: '1px solid #e0e0e0',
      },
    })}
  >
    {day}
  </p>
);

const MessageField = () => {
  const { postText, postImages } = useMessages();
  const [message, setMessage] = useState<string>('');

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    setMessage(e.target.value);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!message) return;

    await postText(message);
    setMessage('');
  };

  return (
    <form
      className={css({
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        alignItems: 'center',
        outline: '1px solid #d0d0d0',
        rounded: 'md',
      })}
      onSubmit={onSubmit}
    >
      <FileInputBtn onUpload={postImages} />
      <textarea
        value={message}
        name="content"
        placeholder="メッセージを入力"
        className={css({
          p: '2',
          resize: 'none',
          // Note: this property is not work some browser like firefox or safari.
          fieldSizing: 'content',
          _focus: { outline: 'none' },
        })}
        onChange={onChange}
      />
      <button
        type="submit"
        disabled={message.length === 0}
        className={css({
          cursor: { base: 'pointer', _disabled: 'not-allowed' },
          px: '2',
          color: '#3f51b5',
          opacity: { base: '1', _disabled: '0.3' },
        })}
      >
        <MdSend size={24} />
      </button>
    </form>
  );
};
