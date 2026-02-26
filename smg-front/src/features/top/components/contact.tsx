import { css, cx } from '@/styled-system/css';
import { Grid } from '@/styled-system/jsx';
import Image from 'next/image';
import Link from 'next/link';
import { CenteredContainer, Container, SectionHeader } from './layout';

export const Contact = () => (
	<Container color={'white'} bg={'bg-black'}>
		<CenteredContainer>
			<SectionHeader
				id="contact"
				title="相談する"
				subtitle="Contact"
				description="講師に相談する場を用意しています"
			/>
			<main
				className={css({
					d: 'grid',
					flexDir: 'column',
					gap: '2',
					p: '4',
				})}
			>
				<Grid
					placeItems="center"
					gridTemplateColumns={{
						mdDown: '1fr',
						base: '1fr 1fr 1fr',
					}}
					gridAutoRows={'minmax(0, 1fr)'}
				>
					<Link
						href={'/consultations'}
						className={cx(
							baseStyle,
							css({
								backgroundImage: 'url(/top/box-consult.png)',
							}),
						)}
					>
						<div className={css({ mdDown: { w: '90px' } })}>
							<img
								src={'/top/icons/consult.png'}
								className={css({
									mx: 'auto',
									maxW: {
										base: 'auto',
										mdDown: '90px',
									},
									maxH: {
										base: '90px',
										mdDown: 'auto',
									},
								})}
								alt="個別相談"
							/>
						</div>
						個別相談する
					</Link>
					<Link
						href={'/message'}
						className={cx(
							baseStyle,
							css({
								backgroundImage: 'url(/top/box-dm.png)',
							}),
						)}
					>
						<img
							src={'/top/icons/dm.png'}
							alt="DM"
							className={css({
								w: {
									base: 'auto',
									mdDown: '90px',
								},
								maxH: {
									base: '90px',
									mdDown: 'auto',
								},
							})}
						/>
						DMで問い合わせする
					</Link>
					<Link
						href={'/questions'}
						className={cx(
							baseStyle,
							css({
								backgroundImage: 'url(/top/box-ask-sawabe.png)',
							}),
						)}
					>
						<img
							src={'/top/icons/ask.png'}
							alt="沢辺講師に質問する"
							className={css({
								w: {
									base: 'auto',
									mdDown: '90px',
								},
								maxH: {
									base: '90px',
									mdDown: 'auto',
								},
							})}
						/>
						沢辺講師に質問する
					</Link>
				</Grid>
			</main>
		</CenteredContainer>
	</Container>
);

const baseStyle = css({
	color: 'primary',
	d: 'inline-flex',
	gap: 4,
	alignItems: 'center',
	flexDirection: {
		base: 'column',
		mdDown: 'row',
	},
	px: '4',
	py: {
		mdDown: 2,
		base: 6,
	},
	w: 'full',
	h: 'full',
	textStyle: {
		base: 'xl',
		mdDown: '2xl',
	},
	backgroundSize: 'cover',
});
