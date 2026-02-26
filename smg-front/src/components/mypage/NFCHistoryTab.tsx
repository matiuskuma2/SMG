import { css } from '@/styled-system/css';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ListPagination } from '@/components/ui/ListPagination';
import { SearchSortFilter } from './SearchSortFilter';
import { useAuth } from '@/hooks/useAuth';
import { fetchNFCExchangeHistory } from '@/lib/api/nfcHistory';

type NFCExchangeUser = {
	id: string;
	username: string;
	company_name: string;
	industry_name: string;
	icon: string;
	exchange_date: string;
	created_at: string;
	is_username_visible: boolean;
	is_company_name_visible: boolean;
	is_industry_id_visible: boolean;
};

export const NFCHistoryTab = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { user } = useAuth();
	const [searchQuery, setSearchQuery] = useState('');
	const [sortOption, setSortOption] = useState('date_desc');
	const [industryFilter, setIndustryFilter] = useState('すべて');
	const itemsPerPage = 10; // 1ページあたりの表示件数
	const [nfcExchangeUsers, setNfcExchangeUsers] = useState<NFCExchangeUser[]>([]);
	const [industries, setIndustries] = useState<string[]>(['すべて']);
	const [isLoading, setIsLoading] = useState(true);

	// クエリパラメータからページを取得
	const currentPage = parseInt(searchParams.get('page') || '1', 10);

	// NFC交換履歴を取得する
	useEffect(() => {
		const loadNFCExchangeHistory = async () => {
			if (!user) return;

			setIsLoading(true);
			try {
				const { nfcExchangeUsers: users, industries: industryList } = await fetchNFCExchangeHistory(user.id);
				setNfcExchangeUsers(users);
				setIndustries(industryList);
			} catch (error) {
				console.error('NFC交換履歴の取得に失敗しました:', error);
			} finally {
				setIsLoading(false);
			}
		};

		loadNFCExchangeHistory();
	}, [user]);

	// 検索フィルター関数
	const filteredNfcData = nfcExchangeUsers.filter((person) => {
		const lowerCaseQuery = searchQuery.toLowerCase();

		// 検索クエリによるフィルタリング
		const matchesSearch =
			person.username.toLowerCase().includes(lowerCaseQuery) ||
			person.company_name.toLowerCase().includes(lowerCaseQuery);

		// 業種によるフィルタリング
		const matchesIndustry =
			industryFilter === 'すべて' || person.industry_name === industryFilter;

		return matchesSearch && matchesIndustry;
	});

	// ソート関数
	const sortedNfcData = [...filteredNfcData].sort((a, b) => {
		console.log('ソート前のデータ:', {
			a: { username: a.username, created_at: a.created_at },
			b: { username: b.username, created_at: b.created_at }
		});

		const dateA = new Date(a.created_at);
		const dateB = new Date(b.created_at);

		console.log('Date オブジェクト変換後:', {
			a: { username: a.username, date: dateA },
			b: { username: b.username, date: dateB }
		});

		switch (sortOption) {
			case 'date_asc':
				return dateA.getTime() - dateB.getTime();
			case 'date_desc':
				return dateB.getTime() - dateA.getTime();
			default:
				return dateB.getTime() - dateA.getTime();
		}
	});

	console.log('ソート後のデータ:', sortedNfcData.map(item => ({
		username: item.username,
		created_at: item.created_at
	})));

	// ページネーション用のデータ計算
	const totalPages = Math.ceil(sortedNfcData.length / itemsPerPage);
	const paginatedData = sortedNfcData.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage,
	);

	// ページ変更ハンドラー
	const handlePageChange = (page: number) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set('page', page.toString());
		router.push(`/mypage?${params.toString()}`, { scroll: false });
	};

	// NFC交換項目の表示
	const renderNFCItem = (person: NFCExchangeUser) => (
		<button
			key={`${person.id}-${person.created_at}`}
			type="button"
			onClick={() => router.push(`/mypage/profile/${person.id}/public-profile`)}
			className={css({
				display: 'block',
				width: 'full',
				textAlign: 'left',
				borderBottomWidth: '1px',
				borderColor: 'gray.100',
				_last: { borderBottomWidth: '0' },
				py: '3',
				_hover: { bg: 'gray.50' },
			})}
		>
			<div className={css({ display: 'flex', alignItems: 'center', gap: '4' })}>
				{/* プロフィール画像 */}
				<div
					className={css({
						w: '12',
						h: '12',
						rounded: 'full',
						overflow: 'hidden',
						flexShrink: '0',
					})}
				>
					<Image
						src={person.icon}
						alt={person.is_username_visible ? person.username : 'ユーザー'}
						width={48}
						height={48}
						quality={100}
						unoptimized={true}
						className={css({ w: 'full', h: 'full', objectFit: 'cover' })}
					/>
				</div>

				{/* ユーザー情報 */}
				<div className={css({ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' })}>
					<div className={css({ display: 'flex', alignItems: 'center', gap: '2' })}>
						{person.is_username_visible && (
							<span className={css({ fontWeight: 'bold' })}>
								{person.username}
							</span>
						)}
						{person.is_company_name_visible && (
							<span className={css({ color: 'gray.600' })}>
								{person.company_name}
							</span>
						)}
						{person.is_industry_id_visible && (
							<span className={css({ color: 'gray.500' })}>
								{person.industry_name}
							</span>
						)}
					</div>
					<span className={css({ fontSize: 'xs', color: 'gray.400' })}>
						{person.exchange_date}
					</span>
				</div>
			</div>
		</button>
	);

	// フィルタリングやソートが変更されたときに1ページ目に戻す
	const resetPage = () => {
		const params = new URLSearchParams(searchParams.toString());
		params.set('page', '1');
		router.push(`/mypage?${params.toString()}`, { scroll: false });
	};

	// 検索条件変更時にページをリセット
	const handleSearchQueryChange = (query: string) => {
		setSearchQuery(query);
		resetPage();
	};

	// ソートオプション変更時にページをリセット
	const handleSortOptionChange = (option: string) => {
		setSortOption(option);
		resetPage();
	};

	// 業種フィルター変更時にページをリセット
	const handleIndustryFilterChange = (industry: string) => {
		setIndustryFilter(industry);
		resetPage();
	};

	return (
		<div className={css({ w: 'full' })}>
			{/* 検索とソート機能 */}
			<SearchSortFilter
				searchQuery={searchQuery}
				setSearchQuery={handleSearchQueryChange}
				sortOption={sortOption}
				setSortOption={handleSortOptionChange}
				industryFilter={industryFilter}
				setIndustryFilter={handleIndustryFilterChange}
				industries={industries}
			/>

			{/* 検索結果 */}
			{isLoading ? (
				<p className={css({ textAlign: 'center', py: '8', color: 'gray.500' })}>
					データを読み込み中...
				</p>
			) : sortedNfcData.length > 0 ? (
				<>
					<div className={css({ mt: '4' })}>
						{paginatedData.map(renderNFCItem)}
					</div>
					{totalPages > 1 && (
						<ListPagination
							currentPage={currentPage}
							totalPages={totalPages}
							onPageChange={handlePageChange}
						/>
					)}
				</>
			) : (
				<p className={css({ textAlign: 'center', py: '8', color: 'gray.500' })}>
					NFC交換履歴がありません
				</p>
			)}
		</div>
	);
};
