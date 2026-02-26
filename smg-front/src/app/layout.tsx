import type { Metadata } from 'next';
import { Inter, Roboto_Mono } from 'next/font/google';
import { ProfileProvider } from '../components/ProfileContext';
import './globals.css';
import { QueryProvider } from '@/components/QueryProvider';

const inter = Inter({
	variable: '--font-inter',
	subsets: ['latin'],
});

const robotoMono = Roboto_Mono({
	variable: '--font-roboto-mono',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: 'SMG経営塾',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="ja">
			<body className={`${inter.variable} ${robotoMono.variable}`}>
				<QueryProvider>
					<ProfileProvider>{children}</ProfileProvider>
				</QueryProvider>
			</body>
		</html>
	);
}
