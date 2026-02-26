import { css } from '@/styled-system/css';
import { Flex, styled } from '@/styled-system/jsx';
import Image from 'next/image';
import Link from 'next/link';
import { NavLink } from '.';

export const SPFooter = () => (
	<footer
		className={css({
			d: 'flex',
			justifyContent: 'space-between',
			bg: 'bg-black',
			color: 'white',
			px: 2,
			position: 'sticky',
			bottom: 0,
			zIndex: 50,
			h: '56px',
			hideFrom: 'md',
		})}
	>
		<NavLink label="検索" href="/search" iconUrl="/top/icons/search.png" />
		<NavLink
			label="予約一覧"
			href="/mypage?tab=application-history"
			iconUrl="/top/icons/event.png"
		/>
		<NavLink
			label="予約"
			href="/events"
			iconUrl="/top/icons/calendar.png"
			active
		/>
		<NavLink
			label="動画"
			href="/archive/tabs/regular"
			iconUrl="/top/icons/archive.png"
		/>
		<NavLink
			label="マイページ"
			href="/mypage"
			iconUrl="/top/icons/mypage.png"
		/>
	</footer>
);

export const PCFooter = () => (
	<footer
		className={css({
			d: 'flex',
			justifyContent: 'space-between',
			bg: 'bg-gray',
			hideBelow: 'md',
			py: 12,
		})}
	>
		<Flex flexDir={'column'} gap={6} maxW="1000px" mx="auto" w="full" px={6}>
			<Image src="/logo-footer.svg" alt="smg経営塾" width={200} height={32} />
			<Flex gap={6} flexWrap="wrap" justifyContent="space-between">
				<div>
					<Title>ご利用ガイド</Title>
					<Ul>
						<Li>
							<Link href="/beginner?item=76e72a88-1926-4fef-a36e-7a66c6a97623">
								【必読】入会注意事項
							</Link>
						</Li>
						<Li>
							<Link href="/beginner?item=4a121b66-8742-40cf-be5e-dd4656ad13ea">
								目的とコンセプト
							</Link>
						</Li>
						<Li>
							<Link href="/beginner?item=c9498e72-b63b-4abd-b1df-4f8086bddffc">
								- 質問の仕方
							</Link>
						</Li>
						<Li>
							<Link href="/beginner?item=bd02374e-8b31-4710-8768-6172bb0ff379">
								- お知らせ用公式LINE
							</Link>
						</Li>
						<Li>
							<Link href="/beginner?item=1729d0f7-2aa7-46d9-85e3-3e49a65324fd">
								- 会員サイトの操作方法について
							</Link>
						</Li>
						<Li>
							<Link href="/beginner?item=7c27b7f9-5434-486c-803e-87a349fd9b5d">
								- オリエンテーション動画
							</Link>
						</Li>
						<Li>
							<Link href="/beginner?item=b9758ee8-12fd-48fc-922d-15cc006ce2e9">
								- 沢辺講師ブログ
							</Link>
						</Li>
						<Li>
							<Link href="/beginner?item=4bf0ed5c-b1d4-4f79-99a2-fc7cb0180d8e">
								- 菅原先生各種SNS
							</Link>
						</Li>
					</Ul>
				</div>
				<div>
					<Title>お知らせ</Title>
					<Ul>
						<Li>
							<Link href="/notice?sort=date_desc&category=291be2fb-98c5-446b-995b-088ffab264c1&page=1">
								- 毎月のお知らせ・スケジュール
							</Link>
						</Li>
						<Li>
							<Link href="/notice?sort=date_desc&category=c17aac1d-afae-4258-99e3-0280ebd1aa8e&page=1">
								- ニュースレター
							</Link>
						</Li>
						<Li>
							<Link href="/notice?sort=date_desc&category=ce97cc0b-c9d5-47b3-82c4-075ffef8655d&page=1">
								- トピックス
							</Link>
						</Li>
						<Li>
							<Link href="/notice?sort=date_desc&category=d5d5b2fe-1766-4bec-8764-fac51a0cb8c7&page=1">
								- ロードマップ
							</Link>
						</Li>
						<Li>
							<Link href="/notice?sort=date_desc&category=dbfc42e6-a6b1-44a9-b697-c4d7c5b899ea&page=1">
								- オリエンテーション
							</Link>
						</Li>
					</Ul>
				</div>
				<div>
					<Title>イベント</Title>
					<Ul>
						<Li>
							<Link href="/events?eventTypes=1926b50a-6f4f-4ff0-bdb6-fabe3ab8ed21">
								- 定例会
							</Link>
						</Li>
						<Li>
							<Link href="/events?eventTypes=110061e0-2bc9-48b2-aa84-a174ac63f631">
								- PDCA実施会議
							</Link>
						</Li>
						<Li>
							<Link href="/events?eventTypes=b5921d88-6281-4db3-90cf-814fff439c5e">
								- 5大都市グループ会議
							</Link>
						</Li>
						<Li>
							<Link href="/bookkeeping">- 簿記講座</Link>
						</Li>
						<Li>
							<Link href="/events?eventTypes=8b38e69c-42ef-4409-88bb-6b994271cd9b">
								- オンラインセミナー
							</Link>
						</Li>
						<Li>
							<Link href="/events?eventTypes=1d9f11b4-9938-456e-9cf3-6d65386edad6">
								- 特別セミナー
							</Link>
						</Li>
					</Ul>
				</div>
				<div>
					<Title>アーカイブ</Title>
					<Ul>
						<Li>
							<Link href="/archive/tabs/regular">- 定例会</Link>
						</Li>
						<Li>
							<Link href="/archive/tabs/bookkeeping">- 簿記講座</Link>
						</Li>
						<Li>
							<Link href="/archive/tabs/five-cities">- グループ相談会</Link>
						</Li>
						<Li>
							<Link href="/archive/tabs/online-seminar">
								- オンラインセミナー
							</Link>
						</Li>
						<Li>
							<Link href="/archive/tabs/special-seminar">- 特別セミナー</Link>
						</Li>
						<Li>
							<Link href="/archive/tabs/photos">- 写真</Link>
						</Li>
						<Li>
							<Link href="/archive/tabs/newsletter">- ニュースレター</Link>
						</Li>
						<Li>
							<Link href="/archive/tabs/sawabe-instructor">- 沢辺講師</Link>
						</Li>
					</Ul>
				</div>
				<Flex flexDir={'column'} gap={6}>
					<Link href="/">TOP</Link>
					<Link href="/radio">SMGラジオ</Link>
					<Link href="/bookkeeping">簿記講座</Link>
					<Link href="/questions">質問・相談</Link>
				</Flex>
			</Flex>
		</Flex>
	</footer>
);

const Title = styled('div', {
	base: {
		px: 2,
		py: 1,
		textStyle: 'lg',
		borderBottom: '1px soLid black',
	},
});

const Ul = styled('ul', {
	base: {
		py: '4',
	},
});

const Li = styled('li', {
	base: {
		py: 1,
		listStyle: '- outside',
	},
});

export const Footer = () => (
	<>
		<SPFooter />
		<PCFooter />
	</>
);
