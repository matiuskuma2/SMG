import { css } from '@/styled-system/css';
import { Tabs } from 'radix-ui';
import { MemoMenu } from './memo';
import { TagMenu } from './tag';

const triggerStyle = css({
  flex: 1,
  padding: '8px',
  boxSizing: 'border-box',
  pos: 'relative',
  _selected: {
    _after: {
      content: '""',
      pos: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      h: '2px',
      bg: '#000',
    },
  },
});

export const Tab = () => {
  return (
    <Tabs.Root defaultValue="memo">
      <Tabs.List className={css({ d: 'flex' })}>
        <Tabs.Trigger className={triggerStyle} value="memo">
          メモ
        </Tabs.Trigger>
        <Tabs.Trigger className={triggerStyle} value="tag">
          タグ
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="memo">
        <MemoMenu />
      </Tabs.Content>
      <Tabs.Content value="tag">
        <TagMenu />
      </Tabs.Content>
    </Tabs.Root>
  );
};
