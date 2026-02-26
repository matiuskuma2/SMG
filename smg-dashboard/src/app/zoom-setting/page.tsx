import { Container, Header, Main } from '@/components/layout';
import { Breadcrumb } from '@/features/root/components/breadcrumb';
import { MeetingLinkView } from '@/features/zoom-setting/components/page';

const Page = () => (
  <Container>
    <Header>
      <Breadcrumb.Root>
        <Breadcrumb.Item>設定</Breadcrumb.Item>
        <Breadcrumb.Item>Zoomリンク</Breadcrumb.Item>
      </Breadcrumb.Root>
    </Header>
    <Main>
      <MeetingLinkView />
    </Main>
  </Container>
);

export default Page;
