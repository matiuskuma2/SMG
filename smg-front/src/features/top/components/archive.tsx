import { css } from '@/styled-system/css';
import { Grid } from '@/styled-system/jsx';
import Link from 'next/link';
import { CenteredContainer, Container, SectionHeader } from './layout';

const ArchiveItem = ({
	type,
	imageUrl,
	href,
}: { type: string; imageUrl: string; href: string }) => (
	<Grid
		placeItems="center"
		gridTemplateColumns={'1fr'}
		gridTemplateRows={'auto'}
	>
		<Link
			href={href}
			className={css({
				color: 'black',
				d: 'flex',
				flexDirection: {
					base: 'column',
					mdDown: 'row',
				},
				alignItems: 'stretch',
				w: 'full',
				bg: 'white',
				rounded: 'lg',
				shadow: 'primary',
			})}
		>
			<img
				src={imageUrl}
				className={css({
					roundedTop: 'lg',
					mdDown: {
						roundedTopRight: 'unset',
						roundedLeft: 'lg',
						w: 120,
						h: 'full',
					},
					w: 'full',
					h: '200px',
					flexShrink: 0,
					objectFit: 'cover',
				})}
				alt={`${type}のアーカイブ`}
			/>

			<Grid placeItems="center" p={2} gap={1}>
				<p>
					{type}の<br />
					アーカイブはこちら
				</p>
			</Grid>
		</Link>
	</Grid>
);

export const Archive = () => {
	return (
		<Container className={css({ bg: 'bg-gray' })}>
			<CenteredContainer>
				<SectionHeader
					id="archive"
					title="動画・写真"
					subtitle="Archive"
					description="過去のセミナーや講座の動画・データはこちらから"
				/>
				<main
					className={css({
						d: 'grid',
						flexDir: 'column',
						gridTemplateColumns: {
							mdDown: '1fr',
							base: '1fr 1fr 1fr',
						},
						gap: 4,
						p: 4,
					})}
				>
					<ArchiveItem
						type="オンラインセミナー"
						imageUrl={'/top/archive/online-seminar.png'}
						href={'/archive/tabs/online-seminar'}
					/>
					<ArchiveItem
						type="特別セミナー"
						imageUrl={'/top/archive/special-seminar.png'}
						href={'/archive/tabs/special-seminar'}
					/>
					<ArchiveItem
						type="写真"
						imageUrl={'/top/archive/photos.png'}
						href={'/archive/tabs/photos'}
					/>
					<ArchiveItem
						type="ニュースレター"
						imageUrl={'/top/archive/newsletter.png'}
						href={'/archive/tabs/newsletter'}
					/>
					<ArchiveItem
						type="簿記講座"
						imageUrl={'/top/archive/bookkeeping.png'}
						href={'/archive/tabs/bookkeeping'}
					/>
					<ArchiveItem
						type="定例会"
						imageUrl={'/top/archive/regular.png'}
						href={'/archive/tabs/regular'}
					/>
					<ArchiveItem
						type="グループ相談会"
						imageUrl={'/top/archive/group-consultation.png'}
						href={'/archive/tabs/five-cities'}
					/>
					<ArchiveItem
						type="沢辺講師"
						imageUrl={'/top/archive/sawabe-instructor.png'}
						href={'/archive/tabs/sawabe-instructor'}
					/>
				</main>
			</CenteredContainer>
		</Container>
	);
};
