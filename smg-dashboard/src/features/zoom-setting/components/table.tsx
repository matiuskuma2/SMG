'use client';

import * as Table from '@/components/ui/table';
import type { MstMeetingLink } from '@/lib/supabase/types';
import { useRouter } from 'next/navigation';
import { deleteMettingLink } from '../actions';
import { DeleteBtn, LinkBtn } from './button';

type TableProps = {
  data: MstMeetingLink[];
};

export const MeetingLinkTable = (props: TableProps) => {
  const router = useRouter();

  const handleDelete = async (id: string, close: () => void) => {
    const success = await deleteMettingLink(id);
    if (success) {
      close();
      router.refresh();
    }
    return success;
  };

  return (
    <Table.Root>
      <thead>
        <Table.Row>
          <Table.Head>名前</Table.Head>
          <Table.Head>リンク</Table.Head>
          <Table.Head>アクション</Table.Head>
        </Table.Row>
      </thead>
      <tbody>
        {props.data.map((item) => (
          <Table.Row key={item.meeting_link_id}>
            <Table.Cell>{item.title}</Table.Cell>
            <Table.Cell>
              <LinkBtn
                type="text"
                href={item.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.meeting_link}
              </LinkBtn>
            </Table.Cell>
            <Table.Cell>
              <LinkBtn href={`/zoom-setting/edit/${item.meeting_link_id}`}>
                編集
              </LinkBtn>
              <DeleteBtn
                targetName={item.title}
                onClickDelete={(close) =>
                  handleDelete(item.meeting_link_id, close)
                }
              />
            </Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table.Root>
  );
};
