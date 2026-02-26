import { css } from '@/styled-system/css';
import { Grid } from '@/styled-system/jsx';
import { Carousel } from '@ark-ui/react/carousel';
import Image from 'next/image';
import Link from 'next/link';
import { LuChevronRight } from 'react-icons/lu';
import { fetchRadios } from '../actions/radio';
import {
	CenteredContainer,
	Container,
	SectionFooter,
	SectionHeader,
} from './layout';
import { CarouselRoot } from './parts';

export const Radio = async () => {
	const data = await fetchRadios();

	return (
		<Container
			className={css({
				backgroundImage: {
					base: 'url(/top/bg-radio-pc.png)',
					mdDown: 'url(/top/bg-radio.png)',
				},
				color: 'white',
				backgroundPositionX: 'center',
				backgroundSize: 'cover',
				backgroundRepeat: 'no-repeat',
				h: {
					base: '600px',
					mdDown: 'auto',
				},
				display: 'flex',
			})}
		>
			<CenteredContainer my={'auto'}>
				<SectionHeader
					id="radio"
					title="SMGラジオ"
					subtitle="Radio"
					description={
						<>
							沢辺講師によるSMGラジオの
							<br />
							アーカイブを聞くことができます
						</>
					}
				/>
				{data && (
					<main
						className={css({
							paddingInline: 4,
							paddingBlock: 6,
						})}
					>
						{/* 要調整：slidesPerPage */}
						<CarouselRoot
							defaultPage={0}
							slideCount={data.length}
							slidesPerPage={{
								'2xs': 1,
								xs: 1,
								sm: 2,
								md: 3,
								lg: 3,
								xl: 3,
								'2xl': 3,
							}}
							allowMouseDrag
						>
							<Carousel.ItemGroup>
								{data.map((item, i) => (
									<Carousel.Item
										key={item.id}
										index={i}
										className={css({ display: 'grid', placeItems: 'center' })}
										snapAlign="center"
									>
										<Link href={`/radio/${item.id}`}>
											<Grid
												bg={'bg-gray'}
												fontFamily={'notosansjp'}
												rounded={'sm'}
												w={'240px'}
												h={'120px'}
												placeItems={'center'}
												overflow={'hidden'}
											>
												{item.imageUrl ? (
													<img
														src={item.imageUrl ?? ''}
														alt={item.name}
														className={css({
															maxH: 'auto',
															rounded: 'sm',
															w: 'full',
															color: 'white',
															bg: 'bg-black',
															aspectRatio: '16 / 9',
															objectFit: 'cover',
														})}
													/>
												) : (
													<div
														className={css({
															boxSizing: 'border-box',
															p: 2,
															color: 'bg-black',
														})}
													>
														{item.name}
													</div>
												)}
											</Grid>
										</Link>
									</Carousel.Item>
								))}
							</Carousel.ItemGroup>
						</CarouselRoot>
					</main>
				)}

				<SectionFooter href={'/radio'}>
					ラジオ一覧へ{' '}
					<LuChevronRight
						className={css({ display: 'inline', hideFrom: 'md' })}
					/>
					<Image
						src="/icons/arrow-up.svg"
						alt=""
						width={24}
						height={24}
						className={css({ display: 'inline', hideBelow: 'md' })}
					/>
				</SectionFooter>
			</CenteredContainer>
		</Container>
	);
};
