'use client';

import { SearchForm } from '@/components/search/SearchForm';
import {
	type SearchResult,
	type SearchResultType,
	searchAll,
} from '@/lib/api/search';
import { css } from '@/styled-system/css';
import { useQuery } from '@tanstack/react-query';
import {
	Check,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Tag,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

const typeConfig: Record<
	SearchResultType,
	{ label: string; bg: string; color: string }
> = {
	event: { label: 'イベント予約', bg: '#EDF2F7', color: '#4A5568' },
	notice: { label: 'お知らせ', bg: '#DBEAFE', color: '#1E40AF' },
	consultation: { label: '個別相談予約', bg: '#E9D8FD', color: '#553C9A' },
	archive: { label: 'アーカイブ', bg: '#B2F5EA', color: '#285E61' },
	question: { label: '質問', bg: '#FED7D7', color: '#C53030' },
	bookkeeping: { label: '簿記講座', bg: '#FEEBC8', color: '#C05621' },
	beginner: { label: '初めての方へ', bg: '#C6F6D5', color: '#276749' },
	faq: { label: 'よくある質問', bg: '#FEF3C7', color: '#92400E' },
	radio: { label: 'ラジオ', bg: '#8B5CF6', color: '#FFFFFF' },
};

const SearchResultsContent = () => {
	const searchParams = useSearchParams();
	const router = useRouter();
	const query = searchParams.get('q') || '';
	const currentPage = Number.parseInt(searchParams.get('page') || '1', 10);
	const typesParam = searchParams.get('types');
	const ITEMS_PER_PAGE = 20;

	// フィルタ状態
	const [selectedTypes, setSelectedTypes] = useState<
		Record<SearchResultType, boolean>
	>({
		event: false,
		notice: false,
		consultation: false,
		archive: false,
		question: false,
		bookkeeping: false,
		beginner: false,
		faq: false,
		radio: false,
	});
	const [filterOpen, setFilterOpen] = useState(false);
	const filterRef = useRef<HTMLDivElement>(null);

	// URLからフィルタを復元
	useEffect(() => {
		if (typesParam) {
			const types = typesParam.split(',') as SearchResultType[];
			const newSelectedTypes: Record<SearchResultType, boolean> = {
				event: false,
				notice: false,
				consultation: false,
				archive: false,
				question: false,
				bookkeeping: false,
				beginner: false,
				faq: false,
				radio: false,
			};
			for (const type of types) {
				if (type in newSelectedTypes) {
					newSelectedTypes[type] = true;
				}
			}
			setSelectedTypes(newSelectedTypes);
		} else {
			// URLにtypesパラメータがない場合はリセット
			setSelectedTypes({
				event: false,
				notice: false,
				consultation: false,
				archive: false,
				question: false,
				bookkeeping: false,
				beginner: false,
				faq: false,
				radio: false,
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [typesParam]);

	// 選択されたタイプのみを取得
	const activeTypes = Object.entries(selectedTypes)
		.filter(([_, value]) => value)
		.map(([key]) => key as SearchResultType);

	const { data, isLoading } = useQuery({
		queryKey: ['search', query, currentPage, activeTypes.join(',')],
		queryFn: () =>
			searchAll(
				query,
				currentPage,
				ITEMS_PER_PAGE,
				activeTypes.length > 0 ? activeTypes : undefined,
			),
		staleTime: 5 * 60 * 1000,
		enabled: !!query,
	});

	const results = data?.items || [];
	const totalCount = data?.totalCount || 0;
	const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

	// フィルタ外クリックで閉じる
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				filterRef.current &&
				!filterRef.current.contains(event.target as Node)
			) {
				setFilterOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const handleTypeToggle = (type: SearchResultType) => {
		const newSelectedTypes = { ...selectedTypes, [type]: !selectedTypes[type] };
		setSelectedTypes(newSelectedTypes);

		// URLを更新
		const params = new URLSearchParams(searchParams.toString());
		const activeTypes = Object.entries(newSelectedTypes)
			.filter(([_, value]) => value)
			.map(([key]) => key)
			.join(',');

		if (activeTypes) {
			params.set('types', activeTypes);
		} else {
			params.delete('types');
		}
		params.delete('page'); // フィルタ変更時はページをリセット

		router.push(`/search?${params.toString()}`);
	};

	const handlePageChange = (page: number) => {
		const params = new URLSearchParams(searchParams.toString());
		if (page === 1) {
			params.delete('page');
		} else {
			params.set('page', page.toString());
		}
		router.push(`/search?${params.toString()}`);
	};

	if (isLoading) {
		return (
			<div className={css({ p: '2rem', textAlign: 'center' })}>
				読み込み中...
			</div>
		);
	}

	const isFilterActive = Object.values(selectedTypes).some((v) => v);

	return (
		<div className={css({ maxW: '1200px', mx: 'auto', p: '2rem' })}>
			{/* バナー */}
			<div className={css({ w: '100%', mb: '2rem' })}>
				<img
					src="/banner.png"
					alt="smglogo"
					className={css({ w: '100%', h: 'auto', objectFit: 'contain' })}
				/>
			</div>

			{/* 検索結果セクション */}
			<div className={css({ maxW: '900px', mx: 'auto' })}>
				<h1
					className={css({ fontSize: '2xl', fontWeight: 'bold', mb: '1rem' })}
				>
					検索結果
				</h1>

				{/* 検索フォーム */}
				<div className={css({ mb: '2rem' })}>
					<SearchForm />
				</div>

				{/* 検索結果件数とフィルタ */}
				{query && totalCount > 0 && (
					<div
						className={css({
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							mb: '2rem',
							gap: '2',
							flexWrap: 'wrap',
						})}
					>
						<p className={css({ color: 'gray.600', m: 0 })}>
							「{query}」の検索結果: {totalCount}件
						</p>
						<div ref={filterRef} className={css({ position: 'relative' })}>
							<button
								type="button"
								className={css({
									display: 'flex',
									alignItems: 'center',
									gap: '2',
									px: '3',
									py: '2',
									bg: isFilterActive ? 'green.100' : 'white',
									color: isFilterActive ? 'green.700' : 'gray.700',
									border: '1px solid',
									borderColor: isFilterActive ? 'green.500' : 'gray.200',
									rounded: 'md',
									fontSize: 'sm',
									cursor: 'pointer',
									_hover: {
										bg: isFilterActive ? 'green.100' : 'gray.50',
									},
								})}
								onClick={() => setFilterOpen(!filterOpen)}
							>
								<Tag size={16} />
								カテゴリー
								<ChevronDown size={16} />
							</button>
							{filterOpen && (
								<div
									className={css({
										position: 'absolute',
										mt: '1',
										zIndex: '10',
										bg: 'white',
										border: '1px solid',
										borderColor: 'gray.200',
										rounded: 'md',
										shadow: 'md',
										p: '2',
										minWidth: '220px',
									})}
								>
									{(Object.keys(typeConfig) as SearchResultType[]).map(
										(type) => {
											const config = typeConfig[type];
											return (
												<div
													key={type}
													className={css({
														display: 'flex',
														alignItems: 'center',
														gap: '2',
														px: '3',
														py: '2',
														rounded: 'md',
														cursor: 'pointer',
														bg: selectedTypes[type] ? 'green.50' : 'white',
														color: selectedTypes[type]
															? 'green.700'
															: 'gray.700',
														whiteSpace: 'nowrap',
														_hover: {
															bg: selectedTypes[type] ? 'green.100' : 'gray.50',
														},
													})}
													onClick={() => handleTypeToggle(type)}
												>
													{selectedTypes[type] && <Check size={16} />}
													<span>{config.label}</span>
												</div>
											);
										},
									)}
								</div>
							)}
						</div>
					</div>
				)}

				{!query ? (
					<p
						className={css({
							textAlign: 'center',
							color: 'gray.500',
							mt: '4rem',
						})}
					>
						検索キーワードを入力してください
					</p>
				) : results.length === 0 ? (
					<p
						className={css({
							textAlign: 'center',
							color: 'gray.500',
							mt: '4rem',
						})}
					>
						検索結果が見つかりませんでした
					</p>
				) : (
					<>
						<div className={css({ display: 'grid', gap: '1rem' })}>
							{results.map((result) => {
								const config = typeConfig[result.type];
								return (
									<Link
										key={result.id}
										href={result.path}
										className={css({
											display: 'flex',
											alignItems: 'center',
											gap: { base: '0.5rem', md: '1rem' },
											p: { base: '0.75rem', md: '1rem' },
											bg: 'white',
											border: '1px solid',
											borderColor: 'gray.200',
											borderRadius: 'md',
											transition: 'all 0.2s',
											overflow: 'hidden',
											_hover: {
												boxShadow: 'md',
												borderColor: 'gray.300',
											},
										})}
									>
										<span
											className={css({
												px: { base: '0.5rem', md: '0.75rem' },
												py: '0.5rem',
												fontSize: { base: 'xs', md: 'sm' },
												borderRadius: 'sm',
												fontWeight: 'medium',
												flexShrink: 0,
												whiteSpace: 'nowrap',
											})}
											style={{
												backgroundColor: config.bg,
												color: config.color,
											}}
										>
											{config.label}
										</span>
										<span
											className={css({
												fontSize: { base: 'md', md: 'lg' },
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												whiteSpace: 'nowrap',
												flex: 1,
											})}
										>
											{result.name}
										</span>
									</Link>
								);
							})}
						</div>

						{/* ページネーション */}
						{totalPages > 1 && (
							<div
								className={css({
									display: 'flex',
									justifyContent: 'center',
									alignItems: 'center',
									gap: '2',
									mt: '2rem',
								})}
							>
								<button
									type="button"
									onClick={() => handlePageChange(currentPage - 1)}
									disabled={currentPage === 1}
									className={css({
										display: 'flex',
										alignItems: 'center',
										gap: '1',
										px: '3',
										py: '2',
										bg: currentPage === 1 ? 'gray.100' : 'white',
										color: currentPage === 1 ? 'gray.400' : 'gray.700',
										border: '1px solid',
										borderColor: 'gray.200',
										rounded: 'md',
										cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
										_hover: currentPage === 1 ? {} : { bg: 'gray.50' },
									})}
								>
									<ChevronLeft size={16} />
									前へ
								</button>

								<span className={css({ color: 'gray.600', fontSize: 'sm' })}>
									{currentPage} / {totalPages}
								</span>

								<button
									type="button"
									onClick={() => handlePageChange(currentPage + 1)}
									disabled={currentPage === totalPages}
									className={css({
										display: 'flex',
										alignItems: 'center',
										gap: '1',
										px: '3',
										py: '2',
										bg: currentPage === totalPages ? 'gray.100' : 'white',
										color: currentPage === totalPages ? 'gray.400' : 'gray.700',
										border: '1px solid',
										borderColor: 'gray.200',
										rounded: 'md',
										cursor:
											currentPage === totalPages ? 'not-allowed' : 'pointer',
										_hover: currentPage === totalPages ? {} : { bg: 'gray.50' },
									})}
								>
									次へ
									<ChevronRight size={16} />
								</button>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
};

const SearchResultsPage = () => {
	return (
		<Suspense
			fallback={
				<div className={css({ p: '2rem', textAlign: 'center' })}>
					読み込み中...
				</div>
			}
		>
			<SearchResultsContent />
		</Suspense>
	);
};

export default SearchResultsPage;
