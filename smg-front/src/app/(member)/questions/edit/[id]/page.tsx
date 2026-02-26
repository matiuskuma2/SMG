'use client';

import QuestionForm, {
	type Instructor,
	type QuestionFormValues,
} from '@/components/questions/QuestionForm';
import { BackButton } from '@/components/ui/BackButton';
import { createClient } from '@/lib/supabase';
import { css } from '@/styled-system/css';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';

const QuestionEditPage = ({ params }: { params: { id: string } }) => {
	const router = useRouter();
	const supabase = createClient();
	const questionId = params.id;

	const [initialValues, setInitialValues] = useState<QuestionFormValues>({
		publicTarget: '',
		selectedTeacher: '',
		content: '',
	});
	const [instructors, setInstructors] = useState<Instructor[]>([]);
	const [userId, setUserId] = useState<string | null>(null);
	const [isDataLoading, setIsDataLoading] = useState<boolean>(true);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

	// ログインユーザー、講師一覧、質問データを取得
	useEffect(() => {
		const fetchData = async () => {
			try {
				// ログインユーザーの取得
				const {
					data: { user },
				} = await supabase.auth.getUser();

				if (user) {
					setUserId(user.id);
				} else {
					// ログインしていない場合はログインページにリダイレクト
					router.push('/login');
					return;
				}

				// 講師グループのIDを取得
				const { data: groupData, error: groupError } = await supabase
					.from('mst_group')
					.select('group_id')
					.eq('title', '講師_質問受付グループ')
					.is('deleted_at', null)
					.single();
				if (groupError) {
					console.error('講師グループの取得に失敗しました:', groupError);
					return;
				}

				// 講師ユーザーの情報を取得（JOINを使用してクエリを最適化）
				const { data: instructorsData, error: instructorsError } =
					await supabase
						.from('trn_group_user')
						.select(`
						user_id,
						mst_user!inner (
							user_id,
							username
						)
					`)
						.eq('group_id', groupData.group_id)
						.is('deleted_at', null)
						.is('mst_user.deleted_at', null);
				if (instructorsError) {
					console.error('講師データの取得に失敗しました:', instructorsError);
					return;
				}

				if (instructorsData) {
					setInstructors(
						instructorsData.map((item) => ({
							id: item.mst_user.user_id,
							username: item.mst_user.username,
						})),
					);
				} // 質問データの取得 - question_idを使用
				const { data: questionData, error: questionError } = await supabase
					.from('trn_question')
					.select('*')
					.eq('question_id', questionId)
					.is('deleted_at', null)
					.single();

				if (questionError) {
					console.error('質問データの取得に失敗しました:', questionError);
					alert('質問データの取得に失敗しました。');
					router.push('/questions');
					return;
				}

				if (questionData) {
					// 編集権限チェック（自分の質問かどうか）
					if (questionData.user_id !== user.id) {
						alert('この質問を編集する権限がありません。');
						router.push('/questions');
						return;
					}

					// フォームに質問データをセット
					setInitialValues({
						content: questionData.content || '',
						selectedTeacher: questionData.instructor_id || '',
						publicTarget: questionData.is_anonymous ? 'private' : 'public',
					});
				}
			} catch (error) {
				console.error('データの取得中にエラーが発生しました:', error);
			} finally {
				setIsDataLoading(false);
			}
		};

		fetchData();
	}, [supabase, router, questionId]);

	const handleSubmit = async (values: QuestionFormValues) => {
		if (!userId) {
			alert('ユーザー情報が取得できません。再度ログインしてください。');
			return;
		}

		setIsSubmitting(true);

		try {
			// 質問を更新 - question_idを使用
			const { error } = await supabase
				.from('trn_question')
				.update({
					instructor_id: values.selectedTeacher,
					content: values.content,
					is_anonymous: values.publicTarget === 'private',
					updated_at: new Date().toISOString(),
				})
				.eq('question_id', questionId);

			if (error) {
				console.error('質問の更新に失敗しました:', error);
				alert('質問の更新に失敗しました。もう一度お試しください。');
				return;
			}

			// 成功したら質問一覧ページに遷移
			alert('質問が正常に更新されました。');
			router.push('/questions');
		} catch (error) {
			console.error('質問更新中にエラーが発生しました:', error);
			alert('エラーが発生しました。もう一度お試しください。');
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isDataLoading) {
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
						bg: 'white',
						p: '6',
						rounded: 'lg',
						shadow: 'md',
						mb: '4',
						textAlign: 'center',
					})}
				>
					データを読み込み中...
				</div>
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
			{/* 戻るボタン */}
			<BackButton />

			<div
				className={css({
					bg: 'white',
					p: '6',
					rounded: 'lg',
					shadow: 'md',
					mb: '4',
				})}
			>
				<h1
					className={css({
						fontSize: '2xl',
						fontWeight: 'bold',
						mb: '6',
						textAlign: 'center',
					})}
				>
					質問編集フォーム
				</h1>

				<QuestionForm
					initialValues={initialValues}
					instructors={instructors}
					onSubmit={handleSubmit}
					submitButtonText="更新する"
					isLoading={isSubmitting}
				/>
			</div>
		</div>
	);
};

export default QuestionEditPage;
