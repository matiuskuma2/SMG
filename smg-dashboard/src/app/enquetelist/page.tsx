import EnqueteListClientWrapper from '@/components/enquetelist/EnqueteListClientWrapper';
import { css } from '@/styled-system/css';

export default function EnqueteListPage() {
  return (
    <div
      className={css({
        p: { base: '2', md: '8' },
        pt: { base: '4', md: '20' },
        minH: 'calc(100vh - 64px)',
      })}
    >
      <div
        className={css({
          bg: 'white',
          rounded: 'lg',
          shadow: 'sm',
          overflow: 'hidden',
        })}
      >
        <EnqueteListClientWrapper />
      </div>
    </div>
  );
}
