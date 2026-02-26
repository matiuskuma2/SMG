'use client';

import { ListPagination } from '@/components/ui/ListPagination';
import { createClient } from '@/lib/supabase';
import { createTextSummary } from '@/lib/utils/html';
import { css } from '@/styled-system/css';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { AiOutlineInfoCircle, AiOutlineQuestionCircle } from 'react-icons/ai';
import { QuestionManualModal } from './QuestionManualModal';
import type { Question } from './types';

// 表示用に整形された質問型（基本のQuestion型を拡張）
interface QuestionWithDisplay extends Question {
	title: string;
	instructor_name: string;
}

// 親コンポーネント
export const QuestionsPublicPage = () => {
	return (
		<Suspense
			fallback={
				<div className={css({ textAlign: 'center', py: '10' })}>
					読み込み中...
				</div>
			}
		>
			<QuestionsPage />
		</Suspense>
	);
};

// 子コンポーネント
export const QuestionsPage = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [questions, setQuestions] = useState<QuestionWithDisplay[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isManualModalOpen, setIsManualModalOpen] = useState(false);

	// クエリパラメータからページ番号を取得（デフォルトは1）
	const pageParam = searchParams.get('page');
	const currentPage = pageParam ? Number.parseInt(pageParam) : 1;

	const itemsPerPage = 10;

	// Supabaseからデータを取得
	useEffect(() => {
		const fetchQuestions = async () => {
			try {
				setIsLoading(true);
				const supabase = createClient();

				// 公開されている質問を取得（削除されていないもの）
				const { data, error } = await supabase
					.from('trn_question')
					.select(`
            question_id,
            user_id,
            instructor_id,
            content,
            is_anonymous,
            is_hidden,
            status,
            created_at,
            updated_at,
            deleted_at,
            mst_user!trn_question_user_id_fkey (
              user_id,
              username
            )
          `)
					.is('deleted_at', null)
					.eq('is_anonymous', false)
					.eq('is_hidden', false)
					.order('updated_at', { ascending: false })
					.range(
						(currentPage - 1) * itemsPerPage,
						currentPage * itemsPerPage - 1,
					);

				if (error) throw error;

				// データを整形
				const formattedQuestions =
					data?.map((q) => {
						// 質問内容から要約タイトルを生成
						const title = createTextSummary(q.content, 80);

						// mst_userが配列の場合は最初の要素を使用し、そうでない場合はそのまま使用
						const questionUser = Array.isArray(q.mst_user)
							? q.mst_user[0]
							: q.mst_user;

						return {
							question_id: q.question_id,
							user_id: q.user_id,
							instructor_id: q.instructor_id,
							content: q.content,
							is_anonymous: q.is_anonymous,
							is_hidden: q.is_hidden,
							status: q.status,
							created_at: q.created_at,
							updated_at: q.updated_at,
							deleted_at: q.deleted_at,
							title,
							instructor_name: questionUser?.username || '不明な質問者',
						} as QuestionWithDisplay;
					}) || [];

				setQuestions(formattedQuestions);

				// 全体の質問数を取得してページ数を計算
				const { count } = await supabase
					.from('trn_question')
					.select('*', { count: 'exact', head: true })
					.is('deleted_at', null)
					.eq('is_anonymous', false)
					.eq('is_hidden', false);

				if (count !== null) {
					setTotalItems(count);
				}
			} catch (err) {
				console.error('質問データの取得に失敗しました:', err);
				setError('質問データの取得に失敗しました');
			} finally {
				setIsLoading(false);
			}
		};

		fetchQuestions();
	}, [currentPage]);

	// 総項目数と総ページ数
	const [totalItems, setTotalItems] = useState(0);
	const totalPages = Math.ceil(totalItems / itemsPerPage);

	// ページ変更時の処理
	const handlePageChange = (page: number) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set('page', page.toString());
		router.push(`/questions?${params.toString()}`);
	};

	if (isLoading) {
		return (
			<div className={css({ textAlign: 'center', py: '10' })}>
				読み込み中...
			</div>
		);
	}

	if (error) {
		return (
			<div className={css({ textAlign: 'center', py: '10', color: 'red.500' })}>
				{error}
			</div>
		);
	}

	return (
		<div
			className={css({
				maxW: '4xl',
				mx: 'auto',
				py: '8',
				px: { base: '4', md: '6' },
			})}
		>
		<div
			className={css({
				display: 'flex',
				flexDirection: { base: 'column', sm: 'row' },
				justifyContent: 'space-between',
				alignItems: { base: 'flex-start', sm: 'center' },
				gap: { base: '3', sm: '0' },
				mb: '6',
			})}
		>
			<h1 className={css({ fontSize: '2xl', fontWeight: 'bold' })}>
				質問一覧
			</h1>

			<div
				className={css({
					display: 'flex',
					alignItems: 'center',
					gap: { base: '2', md: '2' },
					flexWrap: 'wrap',
					width: { base: '100%', sm: 'auto' },
				})}
			>
				<button
					type="button"
					className={css({
						bg: 'gray.100',
						color: 'gray.700',
						px: { base: '3', md: '4' },
						py: { base: '2', md: '2' },
						rounded: 'md',
						fontWeight: 'medium',
						cursor: 'pointer',
						_hover: { bg: 'gray.200' },
						transition: 'background-color 0.2s',
						display: 'flex',
						alignItems: 'center',
						gap: '1',
						fontSize: { base: 'xs', sm: 'sm', md: 'md' },
						whiteSpace: 'nowrap',
						flex: { base: '1', sm: '0 0 auto' },
					})}
					onClick={() => setIsManualModalOpen(true)}
				>
					<AiOutlineQuestionCircle size={16} />
					<span className={css({ display: { base: 'none', sm: 'inline' } })}>質問ページの</span>使い方
				</button>

				<button
					type="button"
					className={css({
						bg: '#9D7636',
						color: 'white',
						px: { base: '3', md: '4' },
						py: { base: '2', md: '2' },
						rounded: 'md',
						fontWeight: 'medium',
						cursor: 'pointer',
						_hover: { bg: '#8A6A2F' },
						transition: 'background-color 0.2s',
						display: 'flex',
						alignItems: 'center',
						gap: '1',
						fontSize: { base: 'xs', sm: 'sm', md: 'md' },
						whiteSpace: 'nowrap',
						flex: { base: '1', sm: '0 0 auto' },
					})}
					onClick={() => router.push('/questions/post')}
				>
					質問する
				</button>
			</div>
		</div>

			<div
				className={css({
					backgroundColor: 'amber.50',
					border: '1px solid',
					borderColor: 'amber.200',
					borderRadius: 'lg',
					padding: '12px',
					marginBottom: '24px',
				})}
			>
				<div
					className={css({
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						fontSize: 'sm',
						color: 'amber.800',
					})}
				>
					<AiOutlineInfoCircle
						className={css({
							width: '16px',
							height: '16px',
							color: 'amber.600',
						})}
					/>
					<span>投稿した質問はマイページから編集・削除できます</span>
				</div>
			</div>

			{/* 質問テーブル */}
			<div
				className={css({
					display: 'flex',
					flexDirection: 'column',
					gap: '2',
					mb: '6',
				})}
			>
				{questions.length === 0 ? (
					<div
						className={css({
							textAlign: 'center',
							py: '8',
							color: 'gray.500',
							border: '1px solid',
							borderColor: 'gray.200',
							rounded: 'lg',
							bg: 'white',
						})}
					>
						表示できる質問がありません
					</div>
				) : (
					questions.map((question) => {
						// 日付フォーマット
						const date = question.updated_at
							? new Date(question.updated_at)
							: new Date();
						const formattedDate = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;

						return (
							<button
								type="button"
								key={question.question_id}
								className={css({
									bg: 'white',
									rounded: 'lg',
									shadow: 'md',
									p: '4',
									cursor: 'pointer',
									border: 'none',
									width: '100%',
									textAlign: 'left',
									_hover: { bg: 'gray.50' },
									transition: 'background-color 0.2s',
								})}
								onClick={() =>
									router.push(`/questions/${question.question_id}`)
								}
							>
								<div
									className={css({
										display: 'flex',
										justifyContent: 'space-between',
										mb: '2',
									})}
								>
									<div
										className={css({
											fontSize: 'xs',
											color: 'gray.500',
											display: 'flex',
											alignItems: 'center',
											gap: '2',
										})}
									>
										<span>{question.instructor_name}</span>
									</div>
									<div
										className={css({
											fontSize: 'xs',
											display: 'flex',
											alignItems: 'center',
											gap: '2',
										})}
									>
										<span className={css({ color: 'gray.500' })}>
											{formattedDate}
										</span>
									</div>
								</div>

								<h2
									className={css({
										fontWeight: 'medium',
										mb: '2',
										lineHeight: 'tight',
									})}
								>
									{question.title}
								</h2>
							</button>
						);
					})
				)}
			</div>

			{/* ページネーション */}
			{totalPages > 1 && (
				<ListPagination
					currentPage={currentPage}
					totalPages={totalPages}
					onPageChange={handlePageChange}
				/>
			)}

			{/* 質問マニュアルモーダル */}
			<QuestionManualModal
				isOpen={isManualModalOpen}
				onClose={() => setIsManualModalOpen(false)}
			/>
		</div>
	);
};
