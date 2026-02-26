import { Container, Header, Main } from '@/components/layout';
import { DirectMessageView } from '@/features/direct-message/components/page';
import { Breadcrumb } from '@/features/root/components/breadcrumb';

const Page = () => (
  <Container>
    <Header>
      <Breadcrumb.Root>
        <Breadcrumb.Item>ダイレクトメッセージ</Breadcrumb.Item>
        <Breadcrumb.Item>一覧</Breadcrumb.Item>
      </Breadcrumb.Root>
    </Header>
    <Main>
      <DirectMessageView />
    </Main>
  </Container>
);

export default Page;
