'use client';
import { MaterialItem } from '@/components/archive/MaterialItem';
import type { EventFile } from '@/components/archive/types';
import EventApplicationButton from '@/components/events/EventApplicationButton';
import EventApplicationForm from '@/components/events/EventApplicationForm';
import ApplicationStatus from '@/components/events/EventApplicationStatus';
import { EventBanner } from '@/components/events/EventBanner';
import EventDetails from '@/components/events/EventDetails';
import { EventHeader } from '@/components/events/EventHeader';
import EventParticipationInfo from '@/components/events/EventParticipationInfo';
import { getEventFiles } from '@/lib/api/archive';
import { createClient } from '@/lib/supabase';
import { css } from '@/styled-system/css';
import { stack } from '@/styled-system/patterns';
import { container, flex } from '@/styled-system/patterns';
import { useParams, useRouter } from 'next/navigation';
import React from 'react';

const EventDetail = () => {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();
	const [event, setEvent] = React.useState<any>(null);
	const [loading, setLoading] = React.useState(true);
	const [isApplicationSubmitted, setIsApplicationSubmitted] =
		React.useState(false);
	const [isAttending, setIsAttending] = React.useState(false);
	const [participantCount, setParticipantCount] = React.useState(0);
	const [eventFiles, setEventFiles] = React.useState<EventFile[]>([]);
	const [isLoadingFiles, setIsLoadingFiles] = React.useState(false);
	const supabase = createClient();

	const generateGoogleCalendarUrl = (event: any) => {
		const startDate = new Date(event.event_start_datetime);
		const endDate = new Date(event.event_end_datetime);

		const formatDate = (date: Date) => {
			return date.toISOString().replace(/-|:|\.\d+/g, '');
		};

		const details = [
			event.event_description,
			`場所: ${event.event_location}`,
			`URL: ${window.location.href}`,
		].join('\n\n');

		return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.event_name)}&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(event.event_location)}`;
	};

	React.useEffect(() => {
		const fetchEventAndAttendance = async () => {
			setLoading(true);

			// Supabaseからイベントデータを取得
			const { data: eventData, error: eventError } = await supabase
				.from('mst_event')
				.select(`
					*,
					event_type:mst_event_type(event_type_name)
				`)
				.eq('event_id', id)
				.single();

			if (eventError) {
				console.error('Error fetching event:', eventError);
				setEvent(null);
			} else {
				console.log('取得したイベント情報:', eventData);
				setEvent(eventData);
			}

			// 参加者数を取得（オフライン参加者のみカウント）
			const { count, error: countError } = await supabase
				.from('trn_event_attendee')
				.select('*', { count: 'exact', head: true })
				.eq('event_id', id)
				.eq('is_offline', true)
				.is('deleted_at', null);

			if (!countError) {
				setParticipantCount(count || 0);
			}

			// ユーザーの申し込み状態を確認
			const {
				data: { user },
			} = await supabase.auth.getUser();

			if (user) {
				console.log('ユーザー認証情報:', user);

				// イベント参加の確認
				const { data: eventAttendanceData, error: eventAttendanceError } =
					await supabase
						.from('trn_event_attendee')
						.select('*')
						.eq('event_id', id)
						.eq('user_id', user.id)
						.is('deleted_at', null)
						.single();

				console.log('イベント参加情報:', {
					eventAttendanceData,
					eventAttendanceError,
				});

				// 懇親会参加の確認
				const { data: gatherAttendanceData, error: gatherAttendanceError } =
					await supabase
						.from('trn_gather_attendee')
						.select('*')
						.eq('event_id', id)
						.eq('user_id', user.id)
						.is('deleted_at', null)
						.single();

				console.log('懇親会参加情報:', {
					gatherAttendanceData,
					gatherAttendanceError,
				});

				if (
					(!eventAttendanceError && eventAttendanceData) ||
					(!gatherAttendanceError && gatherAttendanceData)
				) {
					console.log('参加状態をtrueに設定します');
					setIsAttending(true);
				} else {
					console.log('参加状態をfalseに設定します');
					setIsAttending(false);
				}
			}

			setLoading(false);
		};

		if (id) {
			fetchEventAndAttendance();
		}
	}, [id]);

	// イベント資料を取得
	React.useEffect(() => {
		const fetchEventFiles = async () => {
			if (!id) return;

			setIsLoadingFiles(true);
			try {
				const files = await getEventFiles(id);
				setEventFiles(files);
			} catch (error) {
				console.error('イベント資料の取得エラー:', error);
			} finally {
				setIsLoadingFiles(false);
			}
		};

		fetchEventFiles();
	}, [id]);

	// ボタン表示条件の取得
	const getButtonStatus = () => {
		// 申し込み済みの場合は期間に関係なくキャンセル
		if (isAttending) {
			return 'キャンセル';
		}

		const now = new Date();
		const startDate = new Date(event.registration_start_datetime);
		const endDate = new Date(event.registration_end_datetime);

		// 期間開始前の場合
		if (now < startDate) {
			return '申し込み前';
		}

		// 期間終了後の場合
		if (now > endDate) {
			return '申し込み期間終了';
		}

		// 期間内で未申し込みの場合は申し込み
		return '申し込む';
	};

	if (loading) {
		return (
			<div
				className={flex({
					justify: 'center',
					align: 'items-center',
					minH: 'screen',
				})}
			>
				読み込み中...
			</div>
		);
	}

	if (!event) {
		return (
			<div
				className={flex({
					justify: 'center',
					align: 'items-center',
					minH: 'screen',
				})}
			>
				イベントが見つかりませんでした。
			</div>
		);
	}

	// イベントセクションの作成
	const createEventSections = () => {
		const sections = [];

		// イベント本体のセクション

		// 懇親会のセクション（あれば）
		if (event.has_gather) {
			sections.push({
				title: '■懇親会',
				content: [
					`時間: ${new Date(event.gather_start_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}-${new Date(event.gather_end_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`,
					`会場: ${event.gather_location}`,
					`会費: ${event.gather_price}円`,
					`定員: ${event.gather_capacity}名`,
					'※申し込みフォームにチェックを入れてください。',
				],
			});
		}

		// 個別相談のセクション（あれば）
		if (event.has_consultation) {
			sections.push({
				title: '■個別相談',
				content: [
					// `定員: ${event.consultation_capacity}名`,
					'定員枠を超えた場合は抽選',
					'※個別相談は懇親会の途中に行います。',
					'※抽選結果は当日お知らせいたします。',
				],
			});
		}

		return sections;
	};

	const formatEventDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 (${['日', '月', '火', '水', '木', '金', '土'][date.getDay()]})`;
	};

	return (
		<div>
			<main
				className={container({
					px: { base: '4', md: '16' },
					py: { base: '8', md: '12' },
					bg: 'white',
					maxW: '3xl',
					shadow: 'md',
					my: { base: '4', md: '6' },
				})}
			>
				{/* 戻るボタンとイベントヘッダー */}
				<EventHeader
					date={`${new Date(event.event_start_datetime).getMonth() + 1}/${new Date(event.event_start_datetime).getDate()}`}
					event_name={event.event_name}
					event_location={event.event_location}
					onEdit={() => {
						const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL;
						window.open(`${dashboardUrl}/event/edit/${id}`, '_blank');
					}}
				/>

				{/* イベントバナー */}
				<EventBanner
					image_url={event.image_url}
					event_name={event.event_name}
				/>

				{/* 参加情報 - オンラインセミナー以外で表示 */}
				{event.event_type?.event_type_name !== 'オンラインセミナー' && (
					<EventParticipationInfo
						participants={participantCount}
						event_capacity={event.event_capacity}
					/>
				)}

				{/* 申し込みボタン */}
				<EventApplicationButton
					applicationStatus={getButtonStatus()}
					isApplicationSubmitted={isApplicationSubmitted}
					onButtonClick={() => {
						const formSection = document.getElementById('form-divider');
						if (formSection) {
							formSection.scrollIntoView({ behavior: 'smooth' });
						}
					}}
				/>

				{/* イベント詳細情報 */}
				<EventDetails
					fullDate={formatEventDate(event.event_start_datetime)}
					fullTime={`${new Date(event.event_start_datetime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}-${new Date(event.event_end_datetime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`}
					event_location={event.event_location}
					event_description={event.event_description}
					sections={createEventSections()}
					onGenerateCalendarUrl={() => generateGoogleCalendarUrl(event)}
					registration_start_datetime={event.registration_start_datetime}
					registration_end_datetime={event.registration_end_datetime}
				/>

				{/* イベント資料 */}
				{isLoadingFiles ? (
					<div className={css({ mb: '6', color: 'gray.500', fontSize: 'sm' })}>
						イベント資料を読み込み中...
					</div>
				) : (
					eventFiles.length > 0 && (
						<div className={css({ mb: '6' })}>
							<h2
								className={css({
									fontSize: { base: 'md', md: 'lg' },
									fontWeight: 'bold',
									mb: { base: '2', md: '4' },
								})}
							>
								イベント資料
							</h2>
							<div className={stack({ direction: 'column', gap: '2' })}>
								{eventFiles.map((file) => (
									<MaterialItem
										key={file.file_id}
										material={{
											id: file.file_id,
											fileUrl: file.file_url,
											title: file.file_name || `資料 ${file.display_order}`,
											description: file.file_description || undefined,
										}}
									/>
								))}
							</div>
						</div>
					)
				)}

				<div
					id="form-divider"
					className={css({
						borderBottom: '1px solid',
						borderColor: 'gray.200',
						mb: '4',
					})}
				></div>
				{/* 申し込みフォーム */}
				{(isAttending ||
					(new Date() >= new Date(event.registration_start_datetime) &&
						new Date() <= new Date(event.registration_end_datetime))) && (
					<div id="application-form">
						{isAttending ? (
							<ApplicationStatus
								event_id={event.event_id}
								event_type={event.event_type?.event_type_name}
								onReturn={() => setIsAttending(false)}
							/>
						) : (
							<EventApplicationForm
								supabase={supabase}
								event_id={event.event_id}
								event_name={event.event_name}
								has_gather={event.has_gather}
								has_consultation={event.has_consultation}
								onSuccess={() => setIsApplicationSubmitted(true)}
								event_type={event.event_type.event_type_name}
								event_location={event.event_location}
								event_city={event.event_city}
							/>
						)}
					</div>
				)}

				{/* 問い合わせ先 */}
				<div
					className={css({
						borderTop: '1px solid',
						borderColor: 'gray.200',
						pt: '4',
						fontSize: 'sm',
						color: 'gray.600',
					})}
				></div>
			</main>
		</div>
	);
};

export default EventDetail;
