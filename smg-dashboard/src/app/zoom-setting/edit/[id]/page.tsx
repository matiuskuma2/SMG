import { Container, Header, Main } from '@/components/layout';
import { Breadcrumb } from '@/features/root/components/breadcrumb';
import { MeetingLinkEditView } from '@/features/zoom-setting/components/page';

const Page = ({ params }: { params: { id: string } }) => (
  <Container>
    <Header>
      <Breadcrumb.Root>
        <Breadcrumb.Item>Zoomリンクの編集</Breadcrumb.Item>
      </Breadcrumb.Root>
    </Header>
    <Main>
      <MeetingLinkEditView id={params.id} />
    </Main>
  </Container>
);
export default Page;
