import { css } from '@/styled-system/css';
import { Divider } from '@/styled-system/jsx';
import { IoAdd } from 'react-icons/io5';
import { fetchMettingLinks, getMettingLinkById } from '../actions';
import { LinkBtn } from './button';
import { MeetingLinkForm } from './form';
import { MeetingLinkTable } from './table';

export const MeetingLinkView = async () => {
  const data = await fetchMettingLinks();
  return (
    <section className={css({ padding: '1rem', backgroundColor: 'white' })}>
      <header
        className={css({
          paddingBlock: '2',
          d: 'flex',
          alignItems: 'center',
        })}
      >
        <h2
          className={css({
            fontWeight: 'semibold',
            fontSize: 'xl',
            flex: '1',
            textAlign: 'center',
          })}
        >
          Zoom リンク
        </h2>
        <LinkBtn href="/zoom-setting/create">
          <IoAdd size={20} /> リンクを追加
        </LinkBtn>
      </header>
      <Divider color={'gray.300'} />
      <div className={css({ paddingBlock: '0.5rem' })}>
        <MeetingLinkTable data={data} />
      </div>
    </section>
  );
};

export const MeetingLinkRegisterView = () => (
  <section className={css({ padding: '1rem', backgroundColor: 'white' })}>
    <header
      className={css({
        paddingBlock: '2',
        d: 'flex',
        alignItems: 'center',
      })}
    >
      <h2
        className={css({
          fontWeight: 'semibold',
          fontSize: 'xl',
          flex: '1',
          textAlign: 'center',
        })}
      >
        Zoom リンク登録
      </h2>
    </header>
    <Divider color={'gray.300'} />
    <div className={css({ paddingBlock: '0.5rem' })}>
      <MeetingLinkForm />
    </div>
  </section>
);

export const MeetingLinkEditView = async ({ id }: { id: string }) => {
  const meetingLink = await getMettingLinkById(id);
  return (
    <section className={css({ padding: '1rem', backgroundColor: 'white' })}>
      <header
        className={css({
          paddingBlock: '2',
          d: 'flex',
          alignItems: 'center',
        })}
      >
        <h2
          className={css({
            fontWeight: 'semibold',
            fontSize: 'xl',
            flex: '1',
            textAlign: 'center',
          })}
        >
          Zoom リンク編集
        </h2>
      </header>
      <Divider color={'gray.300'} />
      <div className={css({ paddingBlock: '0.5rem' })}>
        <MeetingLinkForm mode="edit" defaultValues={meetingLink || undefined} />
      </div>
    </section>
  );
};
