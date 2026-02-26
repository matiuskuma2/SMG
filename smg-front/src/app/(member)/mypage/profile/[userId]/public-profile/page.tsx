// app/mypage/profile/[userId]/public-profile/page.tsx
import { NFCExchangeHistoryPage } from '@/components/mypage/NFCExchangeHistoryPage';

interface Props {
	params: { userId: string };
}

export default function NFCUserExchangeHistory({ params }: Props) {
	return <NFCExchangeHistoryPage userId={params.userId} />;
}
