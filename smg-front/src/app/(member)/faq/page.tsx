'use client';

import FaqAccordion from '@/components/faq/FaqAccordion';
import FaqBanner from '@/components/faq/FaqBanner';
import FaqSearchSection from '@/components/faq/FaqSearchSection';
import { type FaqItem, getFaqs } from '@/lib/api/faq';
import { css } from '@/styled-system/css';
import { useRouter, useSearchParams } from 'next/navigation';
import type React from 'react';
import { Suspense, useCallback, useEffect, useState } from 'react';

const FaqListContent = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const faqIdParam = searchParams.get('faqId');
	const [openFaqId, setOpenFaqId] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState<string>('');

	const [faqs, setFaqs] = useState<FaqItem[]>([]);
	const [loading, setLoading] = useState(true);

	const handleSearchQueryChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setSearchTerm(e.target.value);
		},
		[],
	);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				const fetchedFaqs = await getFaqs(searchTerm);
				setFaqs(fetchedFaqs);
			} catch (error) {
				console.error('FAQデータの取得に失敗しました:', error);
			} finally {
				setLoading(false);
			}
		};

		// 検索の場合はデバウンス処理
		const timeoutId = setTimeout(fetchData, 300);
		return () => clearTimeout(timeoutId);
	}, [searchTerm]);

	useEffect(() => {
		if (faqIdParam && faqs.length > 0) {
			const targetFaq = faqs.find((faq) => faq.id === faqIdParam);
			if (targetFaq) {
				setOpenFaqId(faqIdParam);
			}
		}
	}, [faqIdParam, faqs]);

	return (
		<div
			className={css({
				maxW: '7xl',
				mx: 'auto',
				px: '4',
				'@media (min-width: 768px)': { px: '8' },
			})}
		>
			<FaqBanner />
			<FaqSearchSection
				searchQuery={searchTerm}
				onSearchQueryChange={handleSearchQueryChange}
			/>
			{loading ? (
				<p
					className={css({
						color: 'gray.500',
						fontSize: 'md',
						textAlign: 'center',
						mt: '6',
					})}
				>
					読み込み中...
				</p>
			) : faqs.length === 0 ? (
				<p
					className={css({
						color: 'gray.500',
						fontSize: 'md',
						textAlign: 'center',
						mt: '6',
					})}
				>
					該当するよくある質問は見つかりませんでした。
				</p>
			) : (
				<div className={css({ mt: '6' })}>
					{faqs.map((faq) => (
						<FaqAccordion
							key={faq.id}
							faq={faq}
							isOpen={openFaqId === faq.id}
							onToggle={() => {
								setOpenFaqId(openFaqId === faq.id ? null : faq.id);
							}}
						/>
					))}
				</div>
			)}
		</div>
	);
};

const FaqPage = () => {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<FaqListContent />
		</Suspense>
	);
};

export default FaqPage;
