'use client';

import {
	ConsultationFilters,
	ConsultationList,
} from '@/components/consultations';
import Banner from '@/components/events/Banner';
import { ListPagination } from '@/components/ui/ListPagination';
import {
	type Consultation,
	type ConsultationWithApplicationStatus,
	checkUserApplications,
	getConsultations,
} from '@/lib/api/consultation';
import { css } from '@/styled-system/css';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

function ConsultationsContent() {
	const searchParams = useSearchParams();
	const router = useRouter();

	// URLクエリパラメータから取得
	const currentPage = Math.max(
		1,
		Number.parseInt(searchParams.get('page') || '1', 10),
	);
	const instructorParam = searchParams.get('instructor') || undefined;
	const sortParam = (searchParams.get('sort') || 'asc') as 'asc' | 'desc';

	const [consultations, setConsultations] = useState<
		ConsultationWithApplicationStatus[]
	>([]);
	const [instructors, setInstructors] = useState<string[]>([]);
	const [totalCount, setTotalCount] = useState(0);
	const [isLoading, setIsLoading] = useState(true);

	const itemsPerPage = 5;

	// 講師一覧を取得（初回のみ）
	useEffect(() => {
		const fetchInstructors = async () => {
			try {
				const { consultations: allConsultations } = await getConsultations();
				const uniqueInstructors = Array.from(
					new Set(
						allConsultations
							.map((item) => item.instructor.username)
							.filter((username): username is string => username !== null),
					),
				);
				setInstructors(uniqueInstructors);
			} catch (error) {
				console.error('Failed to fetch instructors:', error);
			}
		};
		fetchInstructors();
	}, []);

	// データの読み込み
	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true);
			try {
				const { consultations: data, totalCount: total } =
					await getConsultations(
						instructorParam,
						sortParam,
						currentPage,
						itemsPerPage,
					);

				// 申し込み状況を取得
				const consultationIds = data.map((c) => c.consultation_id);
				const applicationStatus = await checkUserApplications(consultationIds);

				// 申し込み状況を含めたデータを作成
				const consultationsWithStatus = data.map((c) => ({
					...c,
					is_applied: applicationStatus[c.consultation_id] || false,
				}));

				setConsultations(consultationsWithStatus);
				setTotalCount(total);
			} catch (error) {
				console.error('Failed to fetch consultations:', error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchData();
	}, [instructorParam, sortParam, currentPage]);

	const totalPages = Math.ceil(totalCount / itemsPerPage);

	const updateUrlParams = useCallback(
		(params: { instructor?: string; sort?: string; page?: string }) => {
			const newParams = new URLSearchParams(searchParams.toString());

			for (const [key, value] of Object.entries(params)) {
				if (value) {
					newParams.set(key, value);
				} else {
					newParams.delete(key);
				}
			}

			router.push(`/consultations?${newParams.toString()}`);
		},
		[router, searchParams],
	);

	const handleInstructorChange = useCallback(
		(event: React.ChangeEvent<HTMLSelectElement>) => {
			const instructor = event.target.value;
			updateUrlParams({
				instructor: instructor || undefined,
				sort: sortParam,
				page: '1',
			});
		},
		[updateUrlParams, sortParam],
	);

	const handleSortChange = useCallback(
		(event: React.ChangeEvent<HTMLSelectElement>) => {
			const sort = event.target.value;
			updateUrlParams({
				instructor: instructorParam,
				sort,
				page: '1',
			});
		},
		[updateUrlParams, instructorParam],
	);

	const handlePageChange = useCallback(
		(page: number) => {
			updateUrlParams({
				instructor: instructorParam,
				sort: sortParam,
				page: page.toString(),
			});
		},
		[updateUrlParams, instructorParam, sortParam],
	);

	useEffect(() => {
		if (
			currentPage < 1 ||
			(totalPages > 0 && currentPage > totalPages) ||
			Number.isNaN(currentPage)
		) {
			updateUrlParams({
				instructor: instructorParam,
				sort: sortParam,
				page: '1',
			});
		}
	}, [currentPage, totalPages, instructorParam, sortParam, updateUrlParams]);

	return (
		<>
			{isLoading ? (
				<div
					className={css({
						textAlign: 'center',
						padding: '2rem',
					})}
				>
					読み込み中...
				</div>
			) : (
				<>
					<ConsultationFilters
						instructors={instructors}
						selectedInstructor={instructorParam || ''}
						sortOrder={sortParam}
						onInstructorChange={handleInstructorChange}
						onSortChange={handleSortChange}
					/>

					<ConsultationList consultations={consultations} />

					{totalPages > 1 && (
						<ListPagination
							currentPage={currentPage}
							totalPages={totalPages}
							onPageChange={handlePageChange}
						/>
					)}
				</>
			)}
		</>
	);
}

export default function ConsultationsPage() {
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
			<h1
				className={css({
					fontSize: '1.875rem',
					fontWeight: 'bold',
					marginBottom: '1.5rem',
				})}
			>
				個別相談一覧
			</h1>

			<Suspense
				fallback={
					<div
						className={css({
							textAlign: 'center',
							padding: '2rem',
						})}
					>
						読み込み中...
					</div>
				}
			>
				<ConsultationsContent />
			</Suspense>
		</div>
	);
}
