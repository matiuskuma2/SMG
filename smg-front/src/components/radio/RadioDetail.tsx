import { Card, CardContent } from '@/components/archive/Card';
import { RichContentDisplay } from '@/features/editer/RichContentDisplay';
import { useIsInstructor } from '@/hooks/useIsInstructor';
import { css } from '@/styled-system/css';
import { Box, Flex } from '@/styled-system/jsx';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { RadioData } from './types';

interface RadioDetailProps {
	radioData: RadioData;
	showEditButton?: boolean;
}

export const RadioDetail = ({
	radioData,
	showEditButton = true,
}: RadioDetailProps) => {
	const router = useRouter();
	const { isInstructor, loading: isInstructorLoading } = useIsInstructor();

	// 編集ボタンのハンドラー
	const handleEdit = () => {
		const dashboardUrl =
			process.env.NEXT_PUBLIC_DASHBOARD_URL ||
			'https://smg-dashboard.vercel.app';
		window.open(`${dashboardUrl}/radio/edit/${radioData.id}`, '_blank');
	};

	// 配信期間のフォーマット
	let registrationPeriod = '未設定';
	if (radioData.registrationStartAt && radioData.registrationEndAt) {
		const startDate = new Date(radioData.registrationStartAt);
		const endDate = new Date(radioData.registrationEndAt);
		const formattedStart = startDate.toLocaleDateString('ja-JP', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
		});
		const formattedEnd = endDate.toLocaleDateString('ja-JP', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
		});
		registrationPeriod = `${formattedStart} 〜 ${formattedEnd}`;
	}

	return (
		<Card className={css({ mb: '6' })}>
			<Box mt="6" />
			<Flex
				position="relative"
				px={{ base: '4', md: '6' }}
				mb="4"
				justifyContent="space-between"
				alignItems="center"
			>
				<button
					type="button"
					onClick={() => router.back()}
					className={css({
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						width: '40px',
						height: '40px',
						cursor: 'pointer',
						bg: 'transparent',
						border: 'none',
					})}
					aria-label="戻る"
				>
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						aria-hidden="true"
					>
						<title>戻る</title>
						<path
							d="M15.41 7.41L14 6L8 12L14 18L15.41 16.59L10.83 12L15.41 7.41Z"
							fill="currentColor"
						/>
					</svg>
				</button>
				{showEditButton && !isInstructorLoading && isInstructor && (
					<Box
						onClick={handleEdit}
						px="4"
						py="2"
						bg="blue.600"
						color="white"
						borderRadius="md"
						fontSize="sm"
						fontWeight="medium"
						cursor="pointer"
						transition="all 0.2s"
						_hover={{ bg: 'blue.700' }}
						_active={{ transform: 'scale(0.98)' }}
					>
						編集
					</Box>
				)}
			</Flex>

			<Box
				fontSize={{ base: 'xl', md: '2xl' }}
				fontWeight="bold"
				mb="4"
				px={{ base: '4', md: '6' }}
			>
				{radioData.name}
			</Box>

			{/* 配信期間 */}
			<Box
				px={{ base: '4', md: '6' }}
				fontSize={{ base: 'sm', md: 'md' }}
				color="gray.600"
				mb="4"
			>
				配信期間: {registrationPeriod}
			</Box>

			{/* 画像 */}
			{radioData.imageUrl && (
				<Box px={{ base: '4', md: '6' }} mb="4">
					<Box width="100%" borderRadius="md" overflow="hidden">
						<Image
							src={radioData.imageUrl}
							alt={radioData.name}
							width={1200}
							height={675}
							quality={100}
							unoptimized={true}
							style={{ width: '100%', height: 'auto', display: 'block' }}
						/>
					</Box>
				</Box>
			)}

			<CardContent className={css({ p: { base: '4', md: '6' } })}>
				{/* ラジオ音声 */}
				{radioData.radioUrl ? (
					<Box mb="6">
						<Box fontSize={{ base: 'md', md: 'lg' }} fontWeight="bold" mb="2">
							音声
						</Box>
						{/* biome-ignore lint/a11y/useMediaCaption: ラジオ音声には字幕が不要 */}
						<audio
							controls
							className={css({ width: '100%', maxWidth: '600px' })}
						>
							<source src={radioData.radioUrl} />
							お使いのブラウザはオーディオ再生に対応していません。
						</audio>
					</Box>
				) : (
					<Box mb="6" color="gray.500" fontSize="sm">
						音声ファイルはありません
					</Box>
				)}
			</CardContent>

			{/* 説明 */}
			<Box
				px={{ base: '4', md: '6' }}
				fontSize={{ base: 'sm', md: 'md' }}
				color="gray.700"
				mb="4"
			>
				<RichContentDisplay
					content={radioData.description || ''}
					isHtml={true}
				/>
			</Box>
		</Card>
	);
};
