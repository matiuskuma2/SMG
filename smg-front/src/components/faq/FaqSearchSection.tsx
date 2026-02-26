'use client';

import { css } from '@/styled-system/css';
import { Search } from 'lucide-react';
import type React from 'react';
import { Input } from '../ui/input';
import { styles } from '../ui/searchsectionstyles';

interface FaqSearchSectionProps {
	searchQuery: string;
	onSearchQueryChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const FaqSearchSection: React.FC<FaqSearchSectionProps> = ({
	searchQuery,
	onSearchQueryChange,
}) => {
	return (
		<div className={styles.searchContainer}>
			{/* 検索ワード */}
			<div className={styles.searchInputContainer}>
				<div className={styles.searchInputWrapper}>
					<Input
						type="text"
						className={styles.input}
						value={searchQuery}
						onChange={onSearchQueryChange}
						placeholder="よくある質問のタイトルやキーワードで検索"
					/>
					<Search
						className={css({
							position: 'absolute',
							right: '3',
							top: '50%',
							transform: 'translateY(-50%)',
							color: 'gray.400',
							pointerEvents: 'none',
							width: '20px',
							height: '20px',
						})}
					/>
				</div>
			</div>
		</div>
	);
};

export default FaqSearchSection;
