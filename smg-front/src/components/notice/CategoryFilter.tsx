import type { NoticeCategoryOption } from '@/lib/api/notice-category';
import { css } from '@/styled-system/css';
import type React from 'react';
import { useCallback } from 'react';
import { Select, SelectItem } from '../ui/select';

interface CategoryFilterProps {
	categories: NoticeCategoryOption[];
	selectedCategoryId: string | undefined;
	onCategoryChange: (categoryId: string | undefined) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
	categories,
	selectedCategoryId,
	onCategoryChange,
}) => {
	const handleCategoryChange = useCallback(
		(e: React.ChangeEvent<HTMLSelectElement>) => {
			const value = e.target.value;
			onCategoryChange(value === '' ? undefined : value);
		},
		[onCategoryChange],
	);

	return (
		<div
			className={css({
				display: 'flex',
				alignItems: 'center',
				gap: '2',
			})}
		>
			<span
				className={css({
					fontSize: 'sm',
					color: 'gray.600',
					fontWeight: 'medium',
					whiteSpace: 'nowrap',
				})}
			>
				カテゴリー:
			</span>

			<div
				className={css({
					width: '250px',
				})}
			>
				<Select
					value={selectedCategoryId || ''}
					onChange={handleCategoryChange}
				>
					<SelectItem value="">すべてのカテゴリー</SelectItem>
					{categories.map((category) => (
						<SelectItem key={category.id} value={category.id}>
							{category.name}
						</SelectItem>
					))}
				</Select>
			</div>
		</div>
	);
};
