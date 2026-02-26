'use client';

import { css } from '@/styled-system/css';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LuSearch } from 'react-icons/lu';

export const SearchForm = () => {
	const [searchQuery, setSearchQuery] = useState('');
	const router = useRouter();

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (searchQuery.trim()) {
			router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className={css({
				display: 'flex',
				alignItems: 'center',
				gap: '0.5rem',
				bg: 'gray.100',
				borderRadius: 'md',
				padding: '0.5rem 1rem',
				width: '100%',
				height: '100%',
			})}
		>
			<button
				type="submit"
				className={css({
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					bg: 'transparent',
					border: 'none',
					cursor: 'pointer',
					padding: 0,
					flexShrink: 0,
				})}
			>
				<LuSearch size={20} className={css({ color: 'gray.500' })} />
			</button>
			<input
				type="text"
				value={searchQuery}
				onChange={(e) => setSearchQuery(e.target.value)}
				placeholder="検索..."
				className={css({
					flex: 1,
					bg: 'transparent',
					border: 'none',
					outline: 'none',
					fontSize: 'md',
					color: 'gray.900',
					'&::placeholder': {
						color: 'gray.500',
					},
				})}
			/>
		</form>
	);
};
