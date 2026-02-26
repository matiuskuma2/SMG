import { useIsInstructor } from '@/hooks/useIsInstructor';
import { stripHtmlTags } from '@/lib/utils/html';
import { css } from '@/styled-system/css';
import Image from 'next/image';
import Link from 'next/link';
import type { Radio } from './types';

type RadioCardProps = {
	radio: Radio;
};

export default function RadioCard({ radio }: RadioCardProps) {
	const { isInstructor, loading: isInstructorLoading } = useIsInstructor();

	const handleEdit = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		const dashboardUrl =
			process.env.NEXT_PUBLIC_DASHBOARD_URL ||
			'https://smg-dashboard.vercel.app';
		window.open(`${dashboardUrl}/radio/edit/${radio.radio_id}`, '_blank');
	};

	const hasImage =
		radio.image_url && radio.image_url !== '/placeholder-image.jpg';

	return (
		<div
			className={css({
				bg: 'white',
				p: '6',
				rounded: 'sm',
				shadow: 'sm',
				mb: '4',
				overflow: 'hidden',
				margin: '0 auto',
				transition: 'all 0.2s',
				position: 'relative',
				_hover: {
					shadow: 'md',
					transform: 'translateY(-2px)',
				},
			})}
		>
			{/* 編集ボタン */}
			{!isInstructorLoading && isInstructor && (
				<button
					type="button"
					onClick={handleEdit}
					className={css({
						position: 'absolute',
						top: '3',
						right: '3',
						px: '3',
						py: '1.5',
						bg: 'blue.600',
						color: 'white',
						borderRadius: 'md',
						fontSize: 'xs',
						fontWeight: 'medium',
						cursor: 'pointer',
						transition: 'all 0.2s',
						zIndex: 10,
						_hover: {
							bg: 'blue.700',
						},
						_active: {
							transform: 'scale(0.98)',
						},
					})}
				>
					編集
				</button>
			)}
			<Link href={`/radio/${radio.radio_id}`}>
				<div
					className={css({
						display: 'grid',
						gridTemplateColumns: { base: '1fr', md: '1.5fr 3fr' },
						gap: '4',
						alignItems: 'center',
					})}
				>
					{/* 左側：画像 */}
					<div
						className={css({
							w: 'full',
							h: { base: '180px', md: '200px' },
							bg: hasImage ? 'gray.100' : 'gray.300',
							rounded: 'md',
							overflow: 'hidden',
							position: 'relative',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						})}
					>
						{hasImage ? (
							<Image
								src={radio.image_url as string}
								alt={radio.radio_name}
								fill
								quality={100}
								unoptimized={true}
								style={{ objectFit: 'cover' }}
							/>
						) : (
							<span
								className={css({
									color: 'white',
									fontSize: { base: 'md', md: 'lg' },
									fontWeight: 'medium',
									zIndex: 1,
								})}
							>
								画像なし
							</span>
						)}
					</div>

					{/* 中央：タイトルと詳細 */}
					<div
						className={css({
							display: 'flex',
							flexDirection: 'column',
							gap: '2',
							textAlign: { base: 'center', md: 'left' },
						})}
					>
						<div
							className={css({
								display: 'flex',
								alignItems: 'center',
								gap: '2',
								justifyContent: { base: 'center', md: 'flex-start' },
							})}
						>
							<span
								className={css({
									px: '3',
									py: '1',
									rounded: 'full',
									fontSize: 'sm',
									fontWeight: 'medium',
									backgroundColor: '#8B5CF6',
									color: 'white',
								})}
							>
								ラジオ
							</span>
						</div>
						<h3
							className={css({
								fontWeight: 'bold',
								fontSize: { base: 'lg', md: 'xl' },
							})}
						>
							{radio.radio_name}
						</h3>
						<p
							className={css({
								fontSize: 'sm',
								color: 'gray.600',
								whiteSpace: 'pre-line',
								overflow: 'hidden',
								display: '-webkit-box',
								WebkitLineClamp: 3,
							})}
							style={{ WebkitBoxOrient: 'vertical' } as React.CSSProperties}
						>
							{stripHtmlTags(radio.radio_description || '')}
						</p>
					</div>
				</div>
			</Link>
		</div>
	);
}
