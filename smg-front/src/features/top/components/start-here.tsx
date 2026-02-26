import { START_HERE_ITEM_IDS } from '@/features/top/const';
import { css } from '@/styled-system/css';
import { Grid } from '@/styled-system/jsx';
import Link, { type LinkProps } from 'next/link';
import type { PropsWithChildren } from 'react';
import { CenteredContainer, Container, SectionHeader } from './layout';

export const StartHere = () => (
	<Container className={css({ bg: 'bg-gray' })}>
		<CenteredContainer>
			<SectionHeader
				id="start-here"
				title="初めての方へ"
				subtitle="Start Here"
			/>
			<main
				className={css({
					d: 'grid',
					flexDir: 'column',
					p: 4,
				})}
			>
				<Grid
					placeItems="center"
					gridTemplateColumns={{
						mdDown: '1fr',
						base: '1fr 1fr 1fr',
					}}
					gap={4}
					gridTemplateRows={'auto'}
				>
					<LinkCard href={`/beginner?item=${START_HERE_ITEM_IDS.GUIDE}`}>
						<img
							src={'/top/guide.png'}
							className={linkCardImg}
							alt="個別相談"
						/>
						<p
							className={css({
								textAlign: 'center',
								flex: 1,
								textStyle: 'lg',
								py: 2,
								fontWeight: 'medium',
							})}
						>
							初めての方へ
							<br />
							-ご利用ガイド-
						</p>
					</LinkCard>
					<LinkCard
						href={'/beginner?item=4a121b66-8742-40cf-be5e-dd4656ad13ea'}
					>
						<img src={'/top/philosophy.png'} className={linkCardImg} alt="DM" />
						<p
							className={css({
								textAlign: 'center',
								flex: 1,
								py: 2,
								textStyle: 'lg',
							})}
						>
							SMG経営塾とは
							<br />
							-私たちの思い-
						</p>
					</LinkCard>
					<LinkCard href={'/faq'}>
						<img
							src={'/top/faq.png'}
							className={linkCardImg}
							alt="よくあるご質問"
						/>
						<p
							className={css({
								textAlign: 'center',
								flex: 1,
								py: 2,
								textStyle: 'lg',
							})}
						>
							よくあるご質問
						</p>
					</LinkCard>
				</Grid>
			</main>
		</CenteredContainer>
	</Container>
);

const linkCardImg = css({
	w: {
		mdDown: '40%',
		base: 'full',
	},
	maxH: '200px',
	objectFit: 'cover',
});

const LinkCard = (props: PropsWithChildren<LinkProps>) => (
	<Link
		className={css({
			color: 'primary',
			d: 'inline-flex',
			gap: '4',
			alignItems: 'center',
			w: 'full',
			h: 'full',
			bg: 'white',
			shadow: 'primary',
			flexDirection: {
				base: 'column',
				mdDown: 'row',
			},
		})}
		{...props}
	/>
);
