import { css } from '@/styled-system/css';
import type { Event } from '@/types/event';
import { useRouter, useSearchParams } from 'next/navigation';
import type React from 'react';
import { useEffect, useState } from 'react';
import type { EventTypeOption } from './FilterSection';
import ItemCard from './ItemCard';
import ListBanner from './ListBanner';
import { ListPagination } from './ListPagination';
import SearchBar from './SearchBar';

type Item = Event;

interface ListContentProps {
	fetchItems: (
		searchTerm?: string,
		sortOption?: string,
		page?: number,
		pageSize?: number,
		filters?: {
			locations?: string[];
			formats?: string[];
			eventTypes?: string[];
			applied?: boolean;
		},
	) => Promise<{ items: Item[]; totalCount: number }>;
	bannerImageSrc: string;
	bannerAlt: string;
	basePath: string; // '/events' または '/bookkeeping'
	placeholderText?: string; // 検索プレースホルダーテキスト
	emptyText?: string; // アイテムが見つからない場合のテキスト
	sortOptions?: { value: string; label: string }[]; // ソートオプション
	defaultSortOption?: string; // デフォルトのソートオプション
	disabledFilters?: {
		eventType?: boolean;
		format?: boolean;
		location?: boolean;
		applied?: boolean;
	};
	itemsPerPage?: number; // 1ページあたりのアイテム数
	eventTypeOptions?: EventTypeOption[]; // イベントタイプオプション（DBから取得）
}

const ListContent: React.FC<ListContentProps> = ({
	fetchItems,
	bannerImageSrc,
	bannerAlt,
	basePath,
	placeholderText = 'イベント名で検索',
	emptyText = 'イベントが見つかりませんでした。',
	sortOptions,
	defaultSortOption = 'date',
	disabledFilters,
	itemsPerPage = 10,
	eventTypeOptions = [],
}) => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const currentPage = Number.parseInt(searchParams.get('page') || '1', 10);
	const [items, setItems] = useState<Item[]>([]);
	const [totalCount, setTotalCount] = useState(0);
	const [loading, setLoading] = useState(true);

	// データ取得（URLパラメータから直接読み取り）
	useEffect(() => {
		const loadItems = async () => {
			setLoading(true);
			try {
				// URLパラメータから直接読み取り
				const searchTerm = searchParams.get('search') || '';
				const sortOption = searchParams.get('sort') || defaultSortOption;

				// フィルター情報を準備
				const filters: {
					locations?: string[];
					formats?: string[];
					eventTypes?: string[];
					applied?: boolean;
				} = {};

				// 開催地フィルター
				const locationParams = searchParams.get('locations')?.split(',') || [];
				if (locationParams.length > 0) {
					filters.locations = locationParams;
				}

				// 開催形式フィルター
				const formatParams = searchParams.get('formats')?.split(',') || [];
				if (formatParams.length > 0) {
					filters.formats = formatParams;
				}

				// イベント種類フィルター
				const eventTypeParams =
					searchParams.get('eventTypes')?.split(',') || [];
				if (eventTypeParams.length > 0) {
					filters.eventTypes = eventTypeParams;
				}

				// 申し込み済みフィルター
				const appliedParam = searchParams.get('applied') === 'true';
				if (appliedParam) {
					filters.applied = true;
				}

				const { items: fetchedItems, totalCount: count } = await fetchItems(
					searchTerm,
					sortOption,
					currentPage,
					itemsPerPage,
					filters,
				);
				setItems(fetchedItems);
				setTotalCount(count);
			} catch (error) {
				console.error('Error fetching items:', error);
				setItems([]);
				setTotalCount(0);
			} finally {
				setLoading(false);
			}
		};

		loadItems();
	}, [fetchItems, searchParams, currentPage, itemsPerPage, defaultSortOption]);
	const handleSearch = (params: {
		searchTerm: string;
		sortOption: string;
		appliedFilters: {
			applied: boolean;
			locations: {
				tokyo: boolean;
				osaka: boolean;
				fukuoka: boolean;
				sendai: boolean;
				nagoya: boolean;
				online: boolean;
			};
			eventTypes: Record<string, boolean>;
			format: {
				online: boolean;
				offline: boolean;
			};
		};
	}) => {
		// URLパラメータに状態を保存
		const urlParams = new URLSearchParams();

		if (params.searchTerm) {
			urlParams.set('search', params.searchTerm);
		}

		if (params.sortOption !== defaultSortOption) {
			urlParams.set('sort', params.sortOption);
		}

		if (params.appliedFilters.applied) {
			urlParams.set('applied', 'true');
		}

		// 地域フィルター
		const selectedLocations = Object.entries(params.appliedFilters.locations)
			.filter(([_, selected]) => selected)
			.map(([location]) => location);
		if (selectedLocations.length > 0) {
			urlParams.set('locations', selectedLocations.join(','));
		}

		// イベントタイプフィルター
		const selectedEventTypes = Object.entries(params.appliedFilters.eventTypes)
			.filter(([_, selected]) => selected)
			.map(([eventType]) => eventType);
		if (selectedEventTypes.length > 0) {
			urlParams.set('eventTypes', selectedEventTypes.join(','));
		}

		// フォーマットフィルター
		const selectedFormats = Object.entries(params.appliedFilters.format)
			.filter(([_, selected]) => selected)
			.map(([format]) => format);
		if (selectedFormats.length > 0) {
			urlParams.set('formats', selectedFormats.join(','));
		}

		// 検索時は最初のページに戻る
		const queryString = urlParams.toString();
		const url = queryString ? `${basePath}?${queryString}` : basePath;
		router.push(url);
	};

	// URLパラメータからcurrentFilterParamsを生成
	const eventTypeIdsFromUrl = searchParams.get('eventTypes')?.split(',') || [];
	const eventTypesRecord: Record<string, boolean> = {};
	for (const id of eventTypeIdsFromUrl) {
		if (id) {
			eventTypesRecord[id] = true;
		}
	}

	const currentFilterParams = {
		searchTerm: searchParams.get('search') || '',
		sortOption: searchParams.get('sort') || defaultSortOption,
		appliedFilters: {
			applied: searchParams.get('applied') === 'true',
			locations: {
				tokyo:
					searchParams.get('locations')?.split(',').includes('tokyo') || false,
				osaka:
					searchParams.get('locations')?.split(',').includes('osaka') || false,
				fukuoka:
					searchParams.get('locations')?.split(',').includes('fukuoka') ||
					false,
				sendai:
					searchParams.get('locations')?.split(',').includes('sendai') || false,
				nagoya:
					searchParams.get('locations')?.split(',').includes('nagoya') || false,
				online:
					searchParams.get('locations')?.split(',').includes('online') || false,
			},
			eventTypes: eventTypesRecord,
			format: {
				online:
					searchParams.get('formats')?.split(',').includes('online') || false,
				offline:
					searchParams.get('formats')?.split(',').includes('offline') || false,
			},
		},
	};

	// サーバーサイドでフィルタリング・ソート済みなので、そのまま使用
	const displayItems = items;

	// ページネーション関連の計算（サーバーサイドでページネーション済み）
	const totalPages = Math.ceil(totalCount / itemsPerPage);

	// ページ番号が無効な場合の処理
	useEffect(() => {
		if (Number.isNaN(currentPage) || currentPage < 1) {
			const currentSearchParams = new URLSearchParams(window.location.search);
			currentSearchParams.delete('page');
			const queryString = currentSearchParams.toString();
			const url = queryString ? `${basePath}?${queryString}` : basePath;
			router.push(url);
		} else if (currentPage > totalPages && totalPages > 0) {
			const currentSearchParams = new URLSearchParams(window.location.search);
			currentSearchParams.set('page', totalPages.toString());
			const queryString = currentSearchParams.toString();
			const url = queryString ? `${basePath}?${queryString}` : basePath;
			router.push(url);
		}
	}, [currentPage, router, totalPages, basePath]);

	// 現在のページに表示するアイテムを計算

	// ページ範囲をチェック
	if (currentPage > totalPages && totalPages > 0) {
		return null;
	}

	// ロード中の表示
	if (loading) {
		return (
			<div
				className={css({
					maxW: '7xl',
					mx: 'auto',
					px: '4',
					py: '10',
					textAlign: 'center',
					'@media (min-width: 768px)': { px: '8' },
				})}
			>
				<p>読み込み中...</p>
			</div>
		);
	}

	return (
		<div
			className={css({
				maxW: '7xl',
				mx: 'auto',
				px: '4',
				'@media (min-width: 768px)': {
					px: '8',
				},
			})}
		>
			<ListBanner imageSrc={bannerImageSrc} alt={bannerAlt} />
			<SearchBar
				onSearch={handleSearch}
				placeholderText={placeholderText}
				sortOptions={sortOptions}
				disabledFilters={disabledFilters}
				currentFilterParams={currentFilterParams}
				eventTypeOptions={eventTypeOptions}
			/>

			{displayItems.length === 0 ? (
				<div className={css({ textAlign: 'center', py: '10' })}>
					<p>{emptyText}</p>
				</div>
			) : (
				displayItems.map((item) => (
					<ItemCard key={item.event_id} {...item} basePath={basePath} />
				))
			)}

			{/* ページネーションナビゲーション */}
			{totalPages > 1 && (
				<ListPagination
					currentPage={currentPage}
					totalPages={totalPages}
					basePath={basePath}
				/>
			)}
		</div>
	);
};

export default ListContent;
