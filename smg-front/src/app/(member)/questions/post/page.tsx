'use client';

import QuestionForm from '@/components/questions/QuestionForm';
import type {
	Instructor,
	QuestionFormValues,
} from '@/components/questions/QuestionForm';
import { QuestionManualModal } from '@/components/questions/QuestionManualModal';
import { BackButton } from '@/components/ui/BackButton';
import { createClient } from '@/lib/supabase';
import { css } from '@/styled-system/css';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { AiOutlineQuestionCircle } from 'react-icons/ai';

const QuestionPostPage = () => {
	const router = useRouter();
	const supabase = createClient();

	const [instructors, setInstructors] = useState<Instructor[]>([]);
	const [userId, setUserId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [isManualModalOpen, setIsManualModalOpen] = useState(false);

	// ログインユーザーと講師一覧を取得
	useEffect(() => {
		const fetchUserAndInstructors = async () => {
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
				}
			} catch (error) {
				console.error('データの取得中にエラーが発生しました:', error);
			}
		};

		fetchUserAndInstructors();
	}, [supabase, router]);

	const handleSubmit = async (values: QuestionFormValues) => {
		if (!userId) {
			alert('ユーザー情報が取得できません。再度ログインしてください。');
			return;
		}

		setIsLoading(true);

		try {
			// 質問をデータベースに保存
			const { data, error } = await supabase
				.from('trn_question')
				.insert([
					{
						user_id: userId,
						instructor_id: values.selectedTeacher,
						content: values.content,
						is_anonymous: values.publicTarget === 'private', // 非公開の場合は匿名として扱う
					},
				])
				.select();

			if (error) {
				console.error('質問の投稿に失敗しました:', error);
				alert('質問の投稿に失敗しました。もう一度お試しください。');
				return;
			}

			// 成功したら質問一覧ページに遷移
			alert('質問が正常に投稿されました。');
			router.push('/questions');
		} catch (error) {
			console.error('質問投稿中にエラーが発生しました:', error);
			alert('エラーが発生しました。もう一度お試しください。');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div
			className={css({
				w: '100%',
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
			<div
				className={css({
					display: 'flex',
					flexDirection: { base: 'column', sm: 'row' },
					justifyContent: { base: 'flex-start', sm: 'space-between' },
					alignItems: { base: 'flex-start', sm: 'center' },
					gap: { base: '3', sm: '0' },
					mb: '6',
				})}
			>
				<h1
					className={css({
						fontSize: '2xl',
						fontWeight: 'bold',
					})}
				>
					質問作成フォーム
				</h1>

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
					})}
					onClick={() => setIsManualModalOpen(true)}
				>
					<AiOutlineQuestionCircle size={16} />
					<span className={css({ display: { base: 'none', sm: 'inline' } })}>質問ページの</span>使い方
				</button>
			</div>

				<QuestionForm
					initialValues={{
						publicTarget: '',
						selectedTeacher:
							process.env.NEXT_PUBLIC_DEFAULT_INSTRUCTOR_ID || '',
						content: '',
					}}
					instructors={instructors}
					onSubmit={handleSubmit}
					submitButtonText="質問する"
					isLoading={isLoading}
				/>
			</div>

			{/* 質問マニュアルモーダル */}
			<QuestionManualModal
				isOpen={isManualModalOpen}
				onClose={() => setIsManualModalOpen(false)}
			/>
		</div>
	);
};

export default QuestionPostPage;
