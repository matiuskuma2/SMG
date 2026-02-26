'use client';

import Banner from '@/components/events/Banner';
import { RadioFilter, RadioList } from '@/components/radio';
import type { Radio } from '@/components/radio/types';
import { getRadios } from '@/lib/api/radio';
import { css } from '@/styled-system/css';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RadioPage() {
	const [radios, setRadios] = useState<Radio[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [totalCount, setTotalCount] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);
	const router = useRouter();
	const searchParams = useSearchParams();

	// ページネーション設定
	const ITEMS_PER_PAGE = 10;

	// URLから年フィルターとソート順を取得
	const yearFilter = searchParams.get('year') || '';
	const sortOrder = (searchParams.get('sort') || 'newest') as
		| 'newest'
		| 'oldest';

	// URLからページ番号を取得してデータをフェッチ
	useEffect(() => {
		const page = searchParams.get('page');
		const pageNumber = page ? Number.parseInt(page, 10) : 1;
		setCurrentPage(pageNumber);

		const fetchData = async () => {
			setLoading(true);
			try {
				const result = await getRadios(
					yearFilter || undefined,
					sortOrder,
					pageNumber,
					ITEMS_PER_PAGE,
				);
				setRadios(result.items);
				setTotalCount(result.totalCount);
				setError(null);
			} catch (err) {
				console.error('Error fetching radios:', err);
				setError('エラーが発生しました');
				setRadios([]);
				setTotalCount(0);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [searchParams, yearFilter, sortOrder]);

	// ページネーション計算
	const totalPages = Math.ceil((totalCount || 0) / ITEMS_PER_PAGE);

	const handlePageChange = (page: number) => {
		const params = new URLSearchParams(searchParams.toString());
		if (page === 1) {
			params.delete('page');
		} else {
			params.set('page', page.toString());
		}
		router.push(`/radio?${params.toString()}`);
	};

	if (error) {
		return (
			<div
				className={css({
					maxW: '7xl',
					mx: 'auto',
					px: '4',
					py: '8',
					textAlign: 'center',
					color: 'red.500',
				})}
			>
				エラーが発生しました。しばらく経ってから再度お試しください。
			</div>
		);
	}

	return (
		<div
			className={css({
				maxW: '7xl',
				mx: 'auto',
				px: '4',
				'@media (min-width: 768px)': { px: '8' },
			})}
		>
			<Banner />

			<div className={css({ mb: '6' })}>
				<div
					className={css({
						display: 'flex',
						flexDir: { base: 'column', md: 'row' },
						justifyContent: 'space-between',
						alignItems: { base: 'flex-start', md: 'center' },
						gap: { base: '4', md: '0' },
						mb: '6',
						mt: '6',
					})}
				>
					<h1 className={css({ fontSize: '2xl', fontWeight: 'bold' })}>
						ラジオ一覧
					</h1>

					<RadioFilter />
				</div>
			</div>

			<RadioList
				radios={radios}
				currentPage={currentPage}
				totalPages={totalPages}
				basePath="/radio"
				onPageChange={handlePageChange}
				loading={loading}
			/>
		</div>
	);
}
