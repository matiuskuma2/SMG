import { Container, Header, Main } from '@/components/layout';
import { Breadcrumb } from '@/features/root/components/breadcrumb';
import { MeetingLinkRegisterView } from '@/features/zoom-setting/components/page';

const Page = () => (
  <Container>
    <Header>
      <Breadcrumb.Root>
        <Breadcrumb.Item>Zoomリンクの追加</Breadcrumb.Item>
      </Breadcrumb.Root>
    </Header>
    <Main>
      <MeetingLinkRegisterView />
    </Main>
  </Container>
);

export default Page;
