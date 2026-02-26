import { css } from '@/styled-system/css';
import { useRouter, useSearchParams } from 'next/navigation';
import { getFilterYears } from '@/lib/utils/year';

export default function RadioFilter() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const yearFilter = searchParams.get('year') || '';
	const sortOrder = searchParams.get('sort') || 'newest';

	const handleYearChange = (year: string) => {
		const params = new URLSearchParams(searchParams.toString());
		if (year) {
			params.set('year', year);
		} else {
			params.delete('year');
		}
		params.delete('page'); // 年を変更したらページをリセット
		router.push(`/radio?${params.toString()}`);
	};

	const handleSortChange = (order: string) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set('sort', order);
		params.delete('page'); // ソートを変更したらページをリセット
		router.push(`/radio?${params.toString()}`);
	};

	return (
		<div
			className={css({
				display: 'flex',
				alignItems: 'center',
				gap: '2',
				width: { base: '100%', md: 'auto' },
			})}
		>
			<select
				id="yearFilter"
				value={yearFilter}
				onChange={(e) => handleYearChange(e.target.value)}
				className={css({
					py: { base: '2', md: '1' },
					px: { base: '4', md: '3' },
					borderRadius: 'md',
					border: '1px solid',
					borderColor: 'gray.300',
					bg: 'white',
					cursor: 'pointer',
					outline: 'none',
					_focus: { borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' },
					fontSize: { base: '16px', md: 'inherit' },
					flex: { base: '1', md: 'auto' },
				})}
			>
				<option value="">年月</option>
				{getFilterYears().map((year) => (
					<option key={year} value={year}>
						{year}年
					</option>
				))}
			</select>

			<select
				id="sortOrder"
				value={sortOrder}
				onChange={(e) => handleSortChange(e.target.value)}
				className={css({
					py: { base: '2', md: '1' },
					px: { base: '4', md: '3' },
					borderRadius: 'md',
					border: '1px solid',
					borderColor: 'gray.300',
					bg: 'white',
					cursor: 'pointer',
					outline: 'none',
					_focus: { borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' },
					fontSize: { base: '16px', md: 'inherit' },
					flex: { base: '1', md: 'auto' },
				})}
			>
				<option value="newest">新しい順</option>
				<option value="oldest">古い順</option>
			</select>
		</div>
	);
}
