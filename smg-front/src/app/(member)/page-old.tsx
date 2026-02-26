'use client';

import { EventSection } from '@/components/home/EventSection';
import type { NewsItemProps } from '@/components/home/NewsItem';
import { NewsSection } from '@/components/home/NewsSection';
import type { TopicCardProps } from '@/components/home/TopicCard';
import { TopicSection } from '@/components/home/TopicSection';
import { Centerize } from '@/components/layout';
import { getNotices } from '@/lib/api/notice';
import { createClient } from '@/lib/supabase';
import { css } from '@/styled-system/css';
import type { HomeEventCardProps } from '@/types/event';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';

const Page = () => {
	const [news, setNews] = useState<NewsItemProps[]>([]);
	const [allNews, setAllNews] = useState<NewsItemProps[]>([]);
	const [showAllNews, setShowAllNews] = useState(false);
	const [events, setEvents] = useState<HomeEventCardProps[]>([]);
	const [loading, setLoading] = useState(true);

	// Supabaseからお知らせを取得
	useEffect(() => {
		const fetchNews = async () => {
			try {
				setLoading(true);
				const result = await getNotices('', 'date_desc');
				const convertedNews: NewsItemProps[] = result.notices.map((notice) => {
					return {
						id: notice.id,
						date: notice.date,
						text: notice.title,
					};
				});

				setAllNews(convertedNews);
				// 最初は5件だけ表示
				setNews(convertedNews.slice(0, 5));
			} catch (error) {
				console.error('お知らせの取得に失敗しました:', error);
				// エラー時は空配列
				setNews([]);
				setAllNews([]);
			} finally {
				setLoading(false);
			}
		};

		fetchNews();
	}, []);

	// もっと見るボタンのハンドラー
	const handleShowMore = () => {
		setShowAllNews(true);
		setNews(allNews);
	};

	// 表示件数を戻すハンドラー
	const handleShowLess = () => {
		setShowAllNews(false);
		setNews(allNews.slice(0, 5));
	};

	// Supabaseからイベントデータを取得
	useEffect(() => {
		const fetchEvents = async () => {
			try {
				const supabase = createClient();

				// ホームページに表示するイベント件数（オンライン・オフラインそれぞれ）
				const maxDisplayEventsPerType = 4;

				// 簿記講座のイベントタイプIDを取得
				const { data: bookkeepingTypeData } = await supabase
					.from('mst_event_type')
					.select('event_type_id')
					.eq('event_type_name', '簿記講座')
					.is('deleted_at', null);

				const bookkeepingTypeId = bookkeepingTypeData?.[0]?.event_type_id || '';

				// オンラインセミナーのイベントタイプIDを取得
				const { data: onlineSeminarTypeData } = await supabase
					.from('mst_event_type')
					.select('event_type_id')
					.eq('event_type_name', 'オンラインセミナー')
					.is('deleted_at', null);

				const onlineSeminarTypeId =
					onlineSeminarTypeData?.[0]?.event_type_id || '';

				// イベントデータを取得（簿記講座以外）
				const { data: eventData, error: eventError } = await supabase
					.from('mst_event')
					.select(`
						*,
						mst_event_type (
							event_type_name
						)
					`)
					.neq('event_type', bookkeepingTypeId) // 簿記講座を除外
					.is('deleted_at', null)
					.eq('is_draft', false)
					.lte('publish_start_at', new Date().toISOString())
					.gte('publish_end_at', new Date().toISOString());

				if (eventError) {
					console.error('Error fetching events:', eventError);
					return;
				}

				// 現在時刻
				const currentTime = new Date();

				// publish_start_atが現在時刻に近い順にソート
				const sortedEventData = eventData.sort((a, b) => {
					const aTime = new Date(a.publish_start_at || new Date());
					const bTime = new Date(b.publish_start_at || new Date());
					const aDiff = Math.abs(currentTime.getTime() - aTime.getTime());
					const bDiff = Math.abs(currentTime.getTime() - bTime.getTime());
					return aDiff - bDiff;
				});

				// オンラインとオフラインイベントを分けて、それぞれ最大4件まで取得
				const onlineEvents = sortedEventData
					.filter((event) => event.event_type === onlineSeminarTypeId)
					.slice(0, maxDisplayEventsPerType);

				const offlineEvents = sortedEventData
					.filter((event) => event.event_type !== onlineSeminarTypeId)
					.slice(0, maxDisplayEventsPerType);

				// オンラインとオフラインを結合してデータを変換（HomeEventCardProps形式に）
				const combinedEvents = [...onlineEvents, ...offlineEvents];
				const formattedEvents: HomeEventCardProps[] = combinedEvents.map(
					(event) => {
						return {
							...event,
							isOnline: event.event_type === onlineSeminarTypeId, // オンラインセミナーのみをオンラインとして判定
						};
					},
				);

				setEvents(formattedEvents);
			} catch (error) {
				console.error('Error fetching events:', error);
				setEvents([]);
			}
		};

		fetchEvents();
	}, []);

	// トピックカードのデータ
	const topicCards: TopicCardProps[] = [
		{
			imageSrc:
				'https://storage.googleapis.com/users-cuuf/env/production/brandId/2053/b8f9c7f0-547c-11ef-a25b-7b2f39259f56.png',
			link: '/beginner',
		},
		{
			imageSrc:
				'https://storage.googleapis.com/users-cuuf/env/production/brandId/2053/a9000cc0-cb36-11ef-b994-735ad499c5fc.png',
			link: '/events',
		},
		{
			imageSrc:
				'https://storage.googleapis.com/users-cuuf/env/production/brandId/2053/c0264220-cb36-11ef-b994-735ad499c5fc.png',
			link: '/archive/tabs/regular',
		},
		// {
		// 	imageSrc:
		// 		'https://storage.googleapis.com/users-cuuf/env/production/brandId/2053/cd7b3110-cb36-11ef-b994-735ad499c5fc.png',
		// 	link: '/team-building',
		// },
	];

	return (
		<>
			<picture>
				<img
					src={'/banner.png'}
					alt="banner"
					className={css({ w: 'full', h: 'auto' })}
				/>
			</picture>

			<Centerize>
				{/* トピックカードセクション */}
				<TopicSection topics={topicCards} />

				{/* お知らせセクション */}
				{loading ? (
					<section className={css({ px: '2rem', pb: '1.5rem', maxW: '100%' })}>
						<h2
							className={css({ fontSize: 'md', fontWeight: 'bold', mb: '2' })}
						>
							お知らせ
						</h2>
						<div
							className={css({
								p: '3',
								rounded: 'md',
								textAlign: 'center',
								color: 'gray.500',
							})}
						>
							読み込み中...
						</div>
					</section>
				) : (
					<NewsSection
						news={news}
						showAllNews={showAllNews}
						totalCount={allNews.length}
						onShowMore={handleShowMore}
						onShowLess={handleShowLess}
					/>
				)}

				{/* イベント予約セクション */}
				<EventSection events={events} />
			</Centerize>

			<footer
				className={css({
					bg: '#2c2a2a',
					color: 'white',
					p: '2rem',
					gap: '.5rem',
					fontWeight: 'bold',
				})}
			>
				<div
					className={css({
						maxW: 'breakpoint-xl',
						mx: 'auto',
						display: 'flex',
					})}
				></div>
			</footer>
		</>
	);
};

export default Page;
