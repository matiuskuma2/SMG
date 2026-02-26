import { css } from '@/styled-system/css';
import { Divider, Grid } from '@/styled-system/jsx';
import { MessageView } from './messages';
import { ThreadMenu } from './thread';

import { fetchDmPageData } from '@/features/direct-message/actions/dm-page';
import { LabelProvider } from '@/features/direct-message/hooks/use-labels';
import { MemoProvider } from '@/features/direct-message/hooks/use-memo';
import { MessageProvider } from '@/features/direct-message/hooks/use-messages';
import { TagProvider } from '@/features/direct-message/hooks/use-tags';
import { ThreadProvider } from '@/features/direct-message/hooks/use-threads';
import { UserProvider } from '@/features/direct-message/hooks/use-users';

export const DirectMessageView = () => (
  <Provider>
    <Grid
      gridTemplateColumns="auto auto 1fr auto auto"
      className={css({
        bg: 'white',
        h: 'calc(100vh - 106px)',
        boxSizing: 'border-box',
        overflowY: 'hidden',
        py: '6',
        px: '4',
      })}
      height="100%"
      minH={0}
    >
      <ThreadMenu />
      <Divider bg={'#d0d0d0'} w={'1px'} />
      <MessageProvider>
        <MessageView />
      </MessageProvider>
    </Grid>
  </Provider>
);

const Provider = async ({ children }: React.PropsWithChildren) => {
  // 1回のRPCコールで全データを取得
  const { threads, labels, tags, users, currentUserId, total } =
    await fetchDmPageData();

  return (
    <UserProvider value={{ users, currentUserId }}>
      <ThreadProvider value={threads} total={total}>
        <LabelProvider value={labels}>
          <TagProvider value={tags}>
            <MemoProvider>{children}</MemoProvider>
          </TagProvider>
        </LabelProvider>
      </ThreadProvider>
    </UserProvider>
  );
};
