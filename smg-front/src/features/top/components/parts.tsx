'use client';

import { useFilteredRoutes } from '@/hooks/useFilteredRoutes';
import { useBreakpoints } from '@/hooks/use-breakpoints';
import { css, cx, sva } from '@/styled-system/css';
import { Flex, styled } from '@/styled-system/jsx';
import type { BreakpointToken } from '@/styled-system/tokens';
import { Carousel, type CarouselRootProps } from '@ark-ui/react/carousel';
import { Dialog, dialogAnatomy } from '@ark-ui/react/dialog';
import { Portal } from '@ark-ui/react/portal';
import { Sawarabi_Mincho } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { LuAlignJustify, LuX } from 'react-icons/lu';
import { ROUTE_DEFINITION } from '../const';

const SawarabiMincho = Sawarabi_Mincho({
	weight: '400',
	subsets: ['latin'],
	display: 'swap',
});

export const Drawer = () => {
	const modalStyle = modal();
	const { routes } = useFilteredRoutes();

	return (
		<Dialog.Root lazyMount unmountOnExit>
			<Dialog.Trigger className={css({ hideFrom: 'md' })}>
				<LuAlignJustify size={20} />
			</Dialog.Trigger>
			<Portal>
				<Dialog.Backdrop className={modalStyle.backdrop} />
				<Dialog.Positioner
					className={cx(
						modalStyle.positioner,
						css({
							bg: 'zinc.900/95',
						}),
					)}
				>
					<Dialog.Content
						className={cx(
							SawarabiMincho.className,
							modalStyle.content,
							css({
								color: 'white',
								maxH: 'full',
								p: 6,
							}),
						)}
					>
						<Flex justify={'flex-end'}>
							<Dialog.CloseTrigger>
								<LuX color="white" size={24} />
							</Dialog.CloseTrigger>
						</Flex>
						<div className={css({ overflowY: 'auto', scrollbar: 'hidden' })}>
							{routes.map((d) => (
								<DrawerItem key={d.href}>
									{d.linkType === 'external' ? (
										<Dialog.CloseTrigger asChild>
											<a href={d.href} target="_blank" rel="noopener noreferrer">
												{d.label}
											</a>
										</Dialog.CloseTrigger>
									) : (
										<Dialog.CloseTrigger asChild>
											<Link href={d.href}>{d.label}</Link>
										</Dialog.CloseTrigger>
									)}
								</DrawerItem>
							))}
						</div>
					</Dialog.Content>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};

const DrawerItem = styled('div', {
	base: {
		py: 3.5,
	},
});

export const Information = () => {
	// フォールバックバナー（DBが未設定の場合に使用）
	const fallbackBanners = [
		{ src: '/top/banners/2_0.png', href: '/notice/23db5fa0-6554-4e37-a176-07ec34e41b64' },
		{ src: '/top/banners/3_0.png', href: '/beginner' },
		{ src: '/top/banners/4_0.png', href: '/events' },
		{ src: '/top/banners/5_0.png', href: '/archive' },
	];

	const [banners, setBanners] = useState(fallbackBanners);

	useEffect(() => {
		const fetchBanners = async () => {
			try {
				const res = await fetch('/api/banners');
				if (res.ok) {
					const data = await res.json();
					if (data.banners && data.banners.length > 0) {
						setBanners(
							data.banners.map((b: { image_url: string; href: string }) => ({
								src: b.image_url,
								href: b.href,
							})),
						);
					}
				}
			} catch (error) {
				// フォールバックを使用
				console.error('バナー取得エラー:', error);
			}
		};
		fetchBanners();
	}, []);

	return (
		<CarouselRoot
			className={css({ pos: 'relative' })}
			autoplay
			loop
			slidesPerPage={{
				'2xs': 1,
				xs: 1,
				sm: 1.5,
				md: 2,
				lg: 2.3,
				xl: 2.5,
				'2xl': 2.8,
			}}
			slidesPerMove={1}
			defaultPage={1}
			slideCount={banners.length}
		>
			<Carousel.ItemGroup>
				{banners.map((banner, index) => (
					<Carousel.Item
						className={css({ w: 'fit-content' })}
						snapAlign="center"
						// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
						key={index}
						index={index}
					>
						<Link href={banner.href}>
							{banner.src.startsWith('http') ? (
								<img
									width={750}
									height={212}
									src={banner.src}
									alt="top-banner"
									style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
								/>
							) : (
								<Image
									width={'750'}
									height={'212'}
									loading="eager"
									src={banner.src}
									alt="top-banner"
								/>
							)}
						</Link>
					</Carousel.Item>
				))}
			</Carousel.ItemGroup>
			<Carousel.IndicatorGroup
				className={css({
					pos: 'absolute',
					display: 'flex',
					w: 'full',
					justifyContent: 'center',
					gap: '2',
					bottom: '-4',
				})}
			>
				{banners.map((_, index) => (
					<Carousel.Indicator
						className={css({
							minW: 2,
							minH: 2,
							cursor: 'pointer',
							bg: { base: 'gray.400', _current: 'gray.800' },
							rounded: 'full',
							transition: 'background-color 0.2s ease-in-out',
						})}
						// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
						key={index}
						index={index}
					/>
				))}
			</Carousel.IndicatorGroup>
		</CarouselRoot>
	);
};

export const modal = sva({
	slots: dialogAnatomy.keys(),
	base: {
		backdrop: {
			pos: 'fixed',
			insetInlineStart: 0,
			top: 0,
			w: '100%',
			maxW: '',
			h: '100dvh',
			zIndex: 'overlay',
		},
		positioner: {
			pos: 'fixed',
			insetInlineStart: 0,
			top: 0,
			maxW: '',
			w: '100%',
			h: '100dvh',
			zIndex: 'modal',
			overscrollBehaviorY: 'none',
		},
		content: {
			display: 'flex',
			flexDirection: 'column',
			position: 'relative',
			maxW: '',
			width: '100%',
			zIndex: 'modal',
		},
	},
});

type RootProps = Omit<CarouselRootProps, 'slidesPerPage'> & {
	slidesPerPage: number | Record<BreakpointToken, number>;
};
export const CarouselRoot = ({
	slidesPerPage = 1,
	...props
}: React.PropsWithChildren<RootProps>) => {
	const { breakpoint } = useBreakpoints();

	const perPages = useMemo(() => {
		if (typeof slidesPerPage === 'number') return slidesPerPage;
		return slidesPerPage[breakpoint] ?? 1;
	}, [breakpoint, slidesPerPage]);

	return <Carousel.Root slidesPerPage={perPages} {...props} />;
};
