'use client';

import { Button } from '@/components/ui/button';
import { Select, SelectItem } from '@/components/ui/select';
import { css } from '@/styled-system/css';
import { RichTextEditor } from '@/features/editer/RichTextEditor';
import type React from 'react';
import { useState } from 'react';

const selectStyles = css({
	border: '1px solid',
	borderColor: 'gray.400',
});

const errorStyle = css({
	color: 'red.500',
	fontSize: 'sm',
	mt: '1',
});

export type Instructor = {
	id: string;
	username: string | null;
};

export type QuestionFormValues = {
	publicTarget: string;
	selectedTeacher: string;
	content: string;
};

type QuestionFormProps = {
	initialValues: QuestionFormValues;
	instructors: Instructor[];
	onSubmit: (values: QuestionFormValues) => Promise<void>;
	submitButtonText: string;
	isLoading: boolean;
};

const QuestionForm: React.FC<QuestionFormProps> = ({
	initialValues,
	instructors,
	onSubmit,
	submitButtonText,
	isLoading,
}) => {
	const [publicTarget, setPublicTarget] = useState<string>(
		initialValues.publicTarget,
	);
	const [selectedTeacher, setSelectedTeacher] = useState<string>(
		initialValues.selectedTeacher,
	);
	const [content, setContent] = useState<string>(initialValues.content);
	const [errors, setErrors] = useState<{
		publicTarget: string;
		selectedTeacher: string;
		content: string;
	}>({
		publicTarget: '',
		selectedTeacher: '',
		content: '',
	});

	const validateForm = (): boolean => {
		const newErrors = {
			publicTarget: publicTarget ? '' : '公開先を選択してください',
			selectedTeacher: selectedTeacher ? '' : '先生を選択してください',
			content: content.trim() ? '' : '質問内容を入力してください',
		};

		setErrors(newErrors);

		return !Object.values(newErrors).some((error) => error !== '');
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (validateForm()) {
			await onSubmit({
				publicTarget,
				selectedTeacher,
				content,
			});
		} else {
			console.log('入力エラーがあります');
		}
	};

	return (
		<form onSubmit={handleSubmit}>
			<div className={css({ mb: '4' })}>
				<label
					htmlFor="publicTarget"
					className={css({
						display: 'block',
						mb: '2',
						fontSize: 'sm',
						fontWeight: 'medium',
					})}
				>
					公開先を選択してください
				</label>
				<Select
					id="publicTarget"
					value={publicTarget}
					onChange={(e) => setPublicTarget(e.target.value)}
					className={selectStyles}
				>
					<SelectItem value="">選択してください</SelectItem>
					<SelectItem value="public">公開</SelectItem>
					<SelectItem value="private">非公開</SelectItem>
				</Select>
				{errors.publicTarget && (
					<p className={errorStyle}>{errors.publicTarget}</p>
				)}
			</div>

			<div className={css({ mb: '4' })}>
				<label
					htmlFor="teacher"
					className={css({
						display: 'block',
						mb: '2',
						fontSize: 'sm',
						fontWeight: 'medium',
					})}
				>
					質問先講師を選択してください
				</label>
				<Select
					id="teacher"
					value={selectedTeacher}
					onChange={(e) => setSelectedTeacher(e.target.value)}
					className={selectStyles}
				>
					<SelectItem value="">選択してください</SelectItem>
					{instructors.map((instructor) => (
						<SelectItem key={instructor.id} value={instructor.id}>
							{instructor.username || '講師'}
						</SelectItem>
					))}
				</Select>
				{errors.selectedTeacher && (
					<p className={errorStyle}>{errors.selectedTeacher}</p>
				)}
			</div>

			<div className={css({ mb: '6' })}>
				<label
					htmlFor="content"
					className={css({
						display: 'block',
						mb: '2',
						fontSize: 'sm',
						fontWeight: 'medium',
					})}
				>
					質問の内容を記入してください
				</label>
				<RichTextEditor
					value={content}
					onChange={setContent}
					placeholder="質問の内容を記入してください..."
					disabled={isLoading}
				/>
				{errors.content && <p className={errorStyle}>{errors.content}</p>}
			</div>

			<div className={css({ display: 'flex', justifyContent: 'center' })}>
				<Button
					type="submit"
					disabled={isLoading}
					className={css({
						bg: 'blue.500',
						color: 'white',
						px: '6',
						py: '2',
						rounded: 'md',
						fontWeight: 'medium',
						_hover: { bg: 'blue.600' },
						transition: 'background-color 0.2s',
						opacity: isLoading ? 0.7 : 1,
						cursor: isLoading ? 'not-allowed' : 'pointer',
					})}
				>
					{isLoading ? '送信中...' : submitButtonText}
				</Button>
			</div>
		</form>
	);
};

export default QuestionForm;
