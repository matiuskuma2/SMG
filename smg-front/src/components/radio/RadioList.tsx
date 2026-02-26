import { ListPagination } from '@/components/ui/ListPagination';
import { css } from '@/styled-system/css';
import RadioCard from './RadioCard';
import type { Radio } from './types';

type RadioListProps = {
	radios: Radio[];
	currentPage: number;
	totalPages: number;
	basePath: string;
	onPageChange: (page: number) => void;
	loading: boolean;
};

export default function RadioList({
	radios,
	currentPage,
	totalPages,
	basePath,
	onPageChange,
	loading,
}: RadioListProps) {
	if (loading) {
		return (
			<div className={css({ textAlign: 'center', py: '8', color: 'gray.500' })}>
				読み込み中...
			</div>
		);
	}

	return (
		<>
			<div className={css({ mt: '6' })}>
				{radios.length > 0 ? (
					radios.map((radio) => (
						<RadioCard key={radio.radio_id} radio={radio} />
					))
				) : (
					<div
						className={css({ textAlign: 'center', py: '8', color: 'gray.500' })}
					>
						該当するラジオがありません
					</div>
				)}
			</div>

			{/* ページネーション */}
			{totalPages > 1 && (
				<ListPagination
					currentPage={currentPage}
					totalPages={totalPages}
					basePath={basePath}
					onPageChange={onPageChange}
				/>
			)}
		</>
	);
}
