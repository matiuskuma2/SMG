'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 5 * 60 * 1000, // 5分間キャッシュ
						gcTime: 10 * 60 * 1000, // 10分間メモリに保持
						refetchOnWindowFocus: false, // ウィンドウフォーカス時に再取得しない
						retry: 1, // リトライ回数
					},
				},
			}),
	);

	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}
