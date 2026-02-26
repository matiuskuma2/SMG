'use client';

import {
	ArchiveFilter,
	ArchiveList,
	ArchiveSidebar,
	ArchiveTabs,
} from '@/components/archive';
import Banner from '@/components/events/Banner';
import { useArchives } from '@/hooks/useArchives';
import { useThemes } from '@/hooks/useThemes';
import { css } from '@/styled-system/css';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function ArchiveTabPage() {
	const params = useParams();
	const tabId = params.tabId as string;
	const [yearFilter, setYearFilter] = useState('');
	const [themeFilter, setThemeFilter] = useState('');
	const [sortOrder, setSortOrder] = useState('newest');
	const router = useRouter();
	const searchParams = useSearchParams();
	const currentPage = useMemo(() => {
		const pageParam = searchParams.get('page');
		const parsedPage = Number.parseInt(pageParam ?? '1', 10);

		if (Number.isNaN(parsedPage) || parsedPage < 1) {
			return 1;
		}

		return parsedPage;
	}, [searchParams]);
	const hasMounted = useRef(false);
	const prevFilters = useRef({ themeFilter: '', yearFilter: '' });

	// ページネーション設定
	const ITEMS_PER_PAGE = 10;

	// テーマデータの取得（沢辺講師タブのみ）
	const { themes } =
		tabId === 'sawabe-instructor' ? useThemes() : { themes: [] };

	// アーカイブデータの取得
	const getTabType = () => {
		const validTabTypes = [
			'regular',
			'bookkeeping',
			'online-seminar',
			'special-seminar',
			'five-cities',
			'photos',
			'newsletter',
			'sawabe-instructor',
		];
		return validTabTypes.includes(tabId) ? tabId : 'regular';
	};

	const { archives, loading, error, totalCount } = useArchives(
		getTabType() as
			| 'regular'
			| 'bookkeeping'
			| 'online-seminar'
			| 'special-seminar'
			| 'five-cities'
			| 'photos'
			| 'newsletter'
			| 'sawabe-instructor',
		yearFilter || undefined,
		sortOrder as 'newest' | 'oldest',
		currentPage,
		ITEMS_PER_PAGE,
		themeFilter || undefined,
	);

	// フィルタ変更時にページを1にリセット
	useEffect(() => {
		const hasFilterChanged =
			prevFilters.current.themeFilter !== themeFilter ||
			prevFilters.current.yearFilter !== yearFilter;

		if (!hasMounted.current) {
			hasMounted.current = true;
			prevFilters.current = { themeFilter, yearFilter };
			return;
		}

		if (hasFilterChanged) {
			if (currentPage !== 1) {
				router.push(`/archive/tabs/${tabId}`);
			}
			prevFilters.current = { themeFilter, yearFilter };
		}
	}, [themeFilter, yearFilter, currentPage, router, tabId]);

	// ページネーション計算
	const totalPages = Math.ceil((totalCount || 0) / ITEMS_PER_PAGE);

	const handlePageChange = (page: number) => {
		if (page === 1) {
			router.push(`/archive/tabs/${tabId}`);
		} else {
			router.push(`/archive/tabs/${tabId}?page=${page}`);
		}
	};

	const handleTabChange = (tab: string) => {
		let tabPath: string;
		switch (tab) {
			case '定例会':
				tabPath = 'regular';
				break;
			case '簿記講座':
				tabPath = 'bookkeeping';
				break;
			case 'オンラインセミナー':
				tabPath = 'online-seminar';
				break;
			case '特別セミナー':
				tabPath = 'special-seminar';
				break;
			case '写真':
				tabPath = 'photos';
				break;
			case 'ニュースレター':
				tabPath = 'newsletter';
				break;
			case '沢辺講師':
				tabPath = 'sawabe-instructor';
				break;
			case 'グループ相談会':
				tabPath = 'five-cities';
				break;
			default:
				tabPath = 'regular';
		}
		router.push(`/archive/tabs/${tabPath}`);
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
				<h1 className={css({ fontSize: '2xl', fontWeight: 'bold', mb: '4' })}>
					アーカイブ一覧
				</h1>

				<div
					className={css({
						display: 'flex',
						flexDir: { base: 'column', md: 'row' },
						justifyContent: 'space-between',
						alignItems: { base: 'flex-start', md: 'center' },
						gap: { base: '4', md: '0' },
						borderBottomWidth: '1px',
						borderColor: 'gray.300',
						mb: '6',
						mt: '6',
					})}
				>
					<ArchiveTabs tabId={tabId} handleTabChange={handleTabChange} />
					<ArchiveFilter
						yearFilter={yearFilter}
						setYearFilter={setYearFilter}
						sortOrder={sortOrder}
						setSortOrder={setSortOrder}
						themeFilter={themeFilter}
						setThemeFilter={setThemeFilter}
						themes={themes}
						showThemeFilter={tabId === 'sawabe-instructor'}
					/>
				</div>
			</div>

			<div
				className={css({
					display: 'flex',
					gap: '6',
					alignItems: 'flex-start',
				})}
			>
				{tabId === 'sawabe-instructor' && themes.length > 0 && (
					<ArchiveSidebar
						themes={themes}
						themeFilter={themeFilter}
						setThemeFilter={setThemeFilter}
					/>
				)}

				<div className={css({ flex: '1', minW: '0' })}>
					<ArchiveList
						archives={archives}
						currentPage={currentPage}
						totalPages={totalPages}
						basePath={`/archive/tabs/${tabId}`}
						onPageChange={handlePageChange}
						loading={loading}
						isOthers={['photos', 'newsletter'].includes(tabId)}
					/>
				</div>
			</div>
		</div>
	);
}
