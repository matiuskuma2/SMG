import {
	type ConsultationQuestion,
	getConsultationQuestions,
} from '@/lib/api/consultation';
import { css } from '@/styled-system/css';
import { useEffect, useState } from 'react';

interface ConsultationQuestionsProps {
	consultationId: string;
	answers: { [key: string]: string | boolean | string[] };
	onAnswerChange: (
		questionId: string,
		answer: string | boolean | string[],
	) => void;
	isReadOnly?: boolean;
}

export function ConsultationQuestions({
	consultationId,
	answers,
	onAnswerChange,
	isReadOnly = false,
}: ConsultationQuestionsProps) {
	const [questions, setQuestions] = useState<ConsultationQuestion[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchQuestions = async () => {
			try {
				const data = await getConsultationQuestions(consultationId);
				setQuestions(data);
			} catch (err) {
				setError('質問の取得に失敗しました');
				console.error('Failed to fetch questions:', err);
			} finally {
				setIsLoading(false);
			}
		};

		fetchQuestions();
	}, [consultationId]);

	if (isLoading) {
		return (
			<div className={css({ textAlign: 'center', py: '4' })}>
				質問を読み込み中...
			</div>
		);
	}

	if (error) {
		return (
			<div className={css({ color: 'red.500', textAlign: 'center', py: '4' })}>
				{error}
			</div>
		);
	}

	if (questions.length === 0) {
		return null;
	}

	const containerStyles = css({
		mb: '6',
		mt: '6',
	});

	const titleStyles = css({
		fontSize: 'lg',
		fontWeight: 'semibold',
		mb: '4',
		pb: '2',
		borderBottom: '1px solid',
		borderColor: 'gray.200',
	});

	const questionItemStyles = css({
		mb: '4',
		p: '2',
	});

	const questionTextStyles = css({
		fontSize: 'sm',
		fontWeight: 'medium',
		mb: '2',
		display: 'flex',
		alignItems: 'center',
		gap: '1',
	});

	const requiredBadgeStyles = css({
		fontSize: 'xs',
		px: '2',
		py: '0.5',
		bg: 'red.100',
		color: 'red.700',
		borderRadius: 'sm',
		fontWeight: 'medium',
		whiteSpace: 'nowrap',
	});

	const inputStyles = css({
		width: '100%',
		p: '2',
		border: '1px solid',
		borderColor: 'gray.300',
		borderRadius: 'md',
		fontSize: 'sm',
		_focus: {
			outline: 'none',
			borderColor: 'blue.500',
			boxShadow: '0 0 0 1px rgba(59, 130, 246, 0.1)',
		},
		_disabled: {
			bg: 'gray.100',
			cursor: 'not-allowed',
		},
	});

	const textareaStyles = css({
		width: '100%',
		p: '2',
		border: '1px solid',
		borderColor: 'gray.300',
		borderRadius: 'md',
		fontSize: 'sm',
		minHeight: '80px',
		resize: 'vertical',
		_focus: {
			outline: 'none',
			borderColor: 'blue.500',
			boxShadow: '0 0 0 1px rgba(59, 130, 246, 0.1)',
		},
		_disabled: {
			bg: 'gray.100',
			cursor: 'not-allowed',
		},
	});

	const radioGroupStyles = css({
		display: 'flex',
		gap: '4',
		mt: '2',
	});

	const radioOptionStyles = css({
		display: 'flex',
		alignItems: 'center',
		gap: '2',
		fontSize: 'sm',
	});

	const radioInputStyles = css({
		_disabled: {
			cursor: 'not-allowed',
		},
	});

	const selectStyles = css({
		width: '100%',
		p: '2',
		border: '1px solid',
		borderColor: 'gray.300',
		borderRadius: 'md',
		fontSize: 'sm',
		_focus: {
			outline: 'none',
			borderColor: 'blue.500',
			boxShadow: '0 0 0 1px rgba(59, 130, 246, 0.1)',
		},
		_disabled: {
			bg: 'gray.100',
			cursor: 'not-allowed',
		},
	});

	const checkboxGroupStyles = css({
		display: 'flex',
		flexDirection: 'column',
		gap: '2',
		mt: '2',
	});

	const checkboxOptionStyles = css({
		display: 'flex',
		alignItems: 'center',
		gap: '2',
		fontSize: 'sm',
	});

	const renderQuestionInput = (question: ConsultationQuestion) => {
		const questionId = question.question_id;
		const currentAnswer = answers[questionId];

		switch (question.question_type) {
			case 'text':
				return (
					<textarea
						className={textareaStyles}
						value={(currentAnswer as string) || ''}
						onChange={(e) => onAnswerChange(questionId, e.target.value)}
						placeholder="回答を入力してください"
						disabled={isReadOnly}
					/>
				);

			case 'boolean':
				return (
					<div className={radioGroupStyles}>
						<label className={radioOptionStyles}>
							<input
								type="radio"
								name={`question_${questionId}`}
								value="true"
								checked={currentAnswer === true}
								onChange={() => onAnswerChange(questionId, true)}
								disabled={isReadOnly}
								className={radioInputStyles}
							/>
							<span>はい</span>
						</label>
						<label className={radioOptionStyles}>
							<input
								type="radio"
								name={`question_${questionId}`}
								value="false"
								checked={currentAnswer === false}
								onChange={() => onAnswerChange(questionId, false)}
								disabled={isReadOnly}
								className={radioInputStyles}
							/>
							<span>いいえ</span>
						</label>
					</div>
				);

			case 'select':
				return (
					<select
						className={selectStyles}
						value={(currentAnswer as string) || ''}
						onChange={(e) => onAnswerChange(questionId, e.target.value)}
						disabled={isReadOnly}
					>
						<option value="">選択してください</option>
						{question.options?.map((option) => (
							<option key={option} value={option}>
								{option}
							</option>
						))}
					</select>
				);

			case 'multiple_select': {
				const selectedOptions = Array.isArray(currentAnswer)
					? (currentAnswer as string[])
					: [];
				return (
					<div className={checkboxGroupStyles}>
						{question.options?.map((option) => (
							<label key={option} className={checkboxOptionStyles}>
								<input
									type="checkbox"
									checked={selectedOptions.includes(option)}
									onChange={(e) => {
										if (e.target.checked) {
											onAnswerChange(questionId, [...selectedOptions, option]);
										} else {
											onAnswerChange(
												questionId,
												selectedOptions.filter((item) => item !== option),
											);
										}
									}}
									disabled={isReadOnly}
								/>
								<span>{option}</span>
							</label>
						))}
					</div>
				);
			}

			default:
				return <div>未対応の質問タイプです</div>;
		}
	};

	return (
		<div className={containerStyles}>
			<h3 className={titleStyles}>質問</h3>

			{questions.map((question, index) => (
				<div key={question.question_id} className={questionItemStyles}>
					<div className={questionTextStyles}>
						<span>
							Q{index + 1}. {question.title}
						</span>
						{question.is_required && (
							<span className={requiredBadgeStyles}>必須</span>
						)}
					</div>

					{renderQuestionInput(question)}
				</div>
			))}
		</div>
	);
}
