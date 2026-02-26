'use client';

import { Centerize } from '@/components/layout';
import { css } from '@/styled-system/css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LuChevronLeft } from 'react-icons/lu';

const InquiryPage = () => {
	const router = useRouter();
	const [content, setContent] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState('');

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!content.trim()) {
			setError('お問い合わせ内容を入力してください。');
			return;
		}

		setIsSubmitting(true);
		setError('');

		try {
			const response = await fetch('/api/inquiry', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ content }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.error || 'お問い合わせの送信に失敗しました。',
				);
			}

			// 成功したらメッセージページにリダイレクト
			router.push('/message');
		} catch (err) {
			console.error('お問い合わせ送信エラー:', err);
			setError(
				err instanceof Error
					? err.message
					: 'お問い合わせの送信に失敗しました。',
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Centerize
			className={css({
				py: { base: '4', smDown: '0' },
			})}
			size="md"
		>
			<div
				className={css({
					bg: 'white',
					rounded: 'md',
					px: '4',
					py: '2',
					minH: '500px',
				})}
			>
				{/* Header */}
				<div className={css({ py: '4', textAlign: 'center', pos: 'relative' })}>
					<h2 className={css({ fontWeight: 'bold', fontSize: 'xl' })}>
						お問い合わせ
					</h2>
					<Link
						className={css({
							pos: 'absolute',
							top: '50%',
							left: 0,
							transform: 'translateY(-50%)',
						})}
						href="/"
					>
						<LuChevronLeft size={32} />
					</Link>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit}>
					<div className={css({ mt: '6' })}>
						<label
							htmlFor="inquiry-content"
							className={css({
								display: 'block',
								fontSize: 'sm',
								fontWeight: 'medium',
								color: 'gray.700',
								mb: '2',
							})}
						>
							お問い合わせ内容
						</label>
						<textarea
							id="inquiry-content"
							value={content}
							onChange={(e) => setContent(e.target.value)}
							placeholder="お問い合わせ内容を入力してください"
							rows={10}
							className={css({
								w: 'full',
								px: '3',
								py: '2',
								border: '1px solid',
								borderColor: 'gray.300',
								rounded: 'md',
								fontSize: 'sm',
								resize: 'vertical',
								_focus: {
									outline: 'none',
									borderColor: 'blue.500',
									ring: '1px',
									ringColor: 'blue.500',
								},
							})}
						/>
					</div>

					{error && (
						<div
							className={css({
								mt: '4',
								p: '3',
								bg: 'red.50',
								border: '1px solid',
								borderColor: 'red.200',
								rounded: 'md',
								color: 'red.800',
								fontSize: 'sm',
							})}
						>
							{error}
						</div>
					)}

					<div
						className={css({
							mt: '6',
							display: 'flex',
							justifyContent: 'center',
						})}
					>
						<button
							type="submit"
							disabled={isSubmitting}
							className={css({
								px: '6',
								py: '3',
								bg: 'blue.600',
								color: 'white',
								fontWeight: 'medium',
								rounded: 'md',
								cursor: 'pointer',
								_hover: {
									bg: 'blue.700',
								},
								_disabled: {
									bg: 'gray.400',
									cursor: 'not-allowed',
								},
							})}
						>
							{isSubmitting ? '送信中...' : '送信する'}
						</button>
					</div>
				</form>
			</div>
		</Centerize>
	);
};

export default InquiryPage;
