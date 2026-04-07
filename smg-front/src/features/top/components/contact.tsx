import { css, cx } from '@/styled-system/css';
import { Grid } from '@/styled-system/jsx';
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
					{/* ① 各講師へ 個別相談を申し込む */}
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
								alt="各講師へ 個別相談を申し込む"
							/>
						</div>
						<span className={contactLabelStyle}>
							<span className={contactLabelBold}>各講師へ</span>
							個別相談を申し込む
						</span>
					</Link>
					{/* ② 沢辺講師へ テキストで質問する */}
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
							src={'/top/icons/dm.png'}
							alt="沢辺講師へ テキストで質問する"
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
						<span className={contactLabelStyle}>
							<span className={contactLabelBold}>沢辺講師へ</span>
							テキストで質問する
						</span>
					</Link>
					{/* ③ 事務局へ DMで問い合わせる */}
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
							src={'/top/icons/ask.png'}
							alt="事務局へ DMで問い合わせる"
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
						<span className={contactLabelStyle}>
							<span className={contactLabelBold}>事務局へ</span>
							DMで問い合わせる
						</span>
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

const contactLabelStyle = css({
	d: 'flex',
	flexDir: 'column',
	alignItems: {
		base: 'center',
		mdDown: 'flex-start',
	},
	gap: 1,
	textStyle: {
		base: 'md',
		mdDown: 'lg',
	},
});

const contactLabelBold = css({
	fontWeight: 'bold',
	textStyle: {
		base: 'lg',
		mdDown: 'xl',
	},
});
