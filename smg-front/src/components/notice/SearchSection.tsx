'use client';

import { css } from '@/styled-system/css';
import type React from 'react';
import { Input } from '../ui/input';
import { styles } from '../ui/searchsectionstyles';
import { Select, SelectItem } from '../ui/select';
import { CategoryFilter } from './CategoryFilter';
import type { NoticeSearchSectionParams } from './types';

const SearchSection: React.FC<NoticeSearchSectionParams> = ({
	searchQuery,
	sortOption,
	selectedCategoryId,
	categories,
	onSearchQueryChange,
	onSortChange,
	onCategoryChange,
	onSearch,
}) => {
	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter' && onSearch) {
			onSearch();
		}
	};

	const handleSearchClick = () => {
		if (onSearch) {
			onSearch();
		}
	};

	return (
		<div className={styles.searchContainer}>
			{/* 検索ワード */}
			<div className={styles.searchInputContainer}>
				<div
					className={css({
						display: 'flex',
						gap: '2',
						alignItems: 'center',
					})}
				>
					<Input
						type="text"
						className={styles.input}
						value={searchQuery}
						onChange={onSearchQueryChange}
						onKeyDown={handleKeyDown}
						placeholder="お知らせタイトルやキーワードで検索"
					/>
					<button
						type="button"
						onClick={handleSearchClick}
						className={css({
							px: '6',
							py: '2',
							bg: '#9D7636',
							color: 'white',
							borderRadius: 'md',
							fontWeight: 'medium',
							fontSize: 'sm',
							cursor: 'pointer',
							transition: 'background-color 0.2s',
							whiteSpace: 'nowrap',
							_hover: {
								bg: '#8A6A2F',
							},
							_active: {
								bg: '#7A5D28',
							},
						})}
					>
						検索
					</button>
				</div>
			</div>

			<div className={styles.bottomRow}>
				{/* カテゴリーフィルター */}
				<CategoryFilter
					categories={categories}
					selectedCategoryId={selectedCategoryId}
					onCategoryChange={onCategoryChange}
				/>

				{/* ソート */}
				<div
					className={css({ display: 'flex', alignItems: 'center', gap: '2' })}
				>
					<span
						className={css({
							fontSize: 'sm',
							color: 'gray.600',
							fontWeight: 'medium',
							whiteSpace: 'nowrap',
						})}
					>
						並び順:
					</span>
					<Select
						value={sortOption}
						onChange={(e) => {
							const value = e.target.value;
							if (value === 'date_desc' || value === 'date_asc') {
								onSortChange(value);
							}
						}}
						className={css({
							width: '180px',
							bg: 'white',
							border: '1px solid',
							borderColor: 'gray.200',
							rounded: 'md',
							_focus: {
								borderColor: 'green.500',
								boxShadow: '0 0 0 1px green.500',
							},
						})}
					>
						<SelectItem value="date_desc">日付順（新しい順）</SelectItem>
						<SelectItem value="date_asc">日付順（古い順）</SelectItem>
					</Select>
				</div>
			</div>
		</div>
	);
};

export default SearchSection;
