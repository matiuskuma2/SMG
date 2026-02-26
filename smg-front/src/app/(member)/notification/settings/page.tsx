'use client';

import {
	ARCHIVE_CATEGORIES,
	EVENT_PUBLISHED_TYPES,
	NOTIFICATION_TYPES,
	getNotificationSettings,
	updateNotificationSetting,
} from '@/lib/api/notification-settings';
import type { NotificationSettingsGroup } from '@/lib/api/notification-settings';
import { css } from '@/styled-system/css';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// トグルスイッチコンポーネント
function ToggleSwitch({
	isEnabled,
	isUpdating,
	onToggle,
}: {
	isEnabled: boolean;
	isUpdating: boolean;
	onToggle: () => void;
}) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={isEnabled}
			disabled={isUpdating}
			onClick={onToggle}
			className={css({
				position: 'relative',
				display: 'inline-flex',
				h: '6',
				w: '11',
				flexShrink: 0,
				cursor: isUpdating ? 'wait' : 'pointer',
				rounded: 'full',
				border: '2px solid transparent',
				transition: 'colors 0.2s',
				bg: isEnabled ? 'blue.600' : 'gray.200',
				opacity: isUpdating ? 0.5 : 1,
				_focus: {
					outline: 'none',
					ring: '2',
					ringColor: 'blue.600',
					ringOffset: '2',
				},
			})}
		>
			<span
				className={css({
					pointerEvents: 'none',
					display: 'inline-block',
					h: '5',
					w: '5',
					transform: isEnabled ? 'translateX(20px)' : 'translateX(0)',
					rounded: 'full',
					bg: 'white',
					shadow: 'lg',
					transition: 'transform 0.2s',
				})}
			/>
		</button>
	);
}

// 設定アイテムコンポーネント
function SettingItem({
	label,
	description,
	isEnabled,
	isUpdating,
	onToggle,
	isLast = false,
}: {
	label: string;
	description: string;
	isEnabled: boolean;
	isUpdating: boolean;
	onToggle: () => void;
	isLast?: boolean;
}) {
	return (
		<div
			className={css({
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				px: '4',
				py: '4',
				borderBottom: isLast ? 'none' : '1px solid',
				borderColor: 'gray.100',
			})}
		>
			<div className={css({ flex: '1', pr: '4' })}>
				<div
					className={css({
						fontSize: 'sm',
						fontWeight: 'medium',
						mb: '1',
					})}
				>
					{label}
				</div>
				<div
					className={css({
						fontSize: 'xs',
						color: 'gray.500',
					})}
				>
					{description}
				</div>
			</div>
			<ToggleSwitch
				isEnabled={isEnabled}
				isUpdating={isUpdating}
				onToggle={onToggle}
			/>
		</div>
	);
}

// セクションヘッダーコンポーネント
function SectionHeader({ title }: { title: string }) {
	return (
		<div
			className={css({
				px: '4',
				py: '3',
				bg: 'gray.50',
				borderBottom: '1px solid',
				borderColor: 'gray.200',
			})}
		>
			<h2
				className={css({
					fontSize: 'sm',
					fontWeight: 'bold',
					color: 'gray.700',
				})}
			>
				{title}
			</h2>
		</div>
	);
}

export default function NotificationSettingsPage() {
	const router = useRouter();
	const [settings, setSettings] = useState<NotificationSettingsGroup>({
		general: [],
		eventPublished: [],
		archivePublished: [],
	});
	const [isLoading, setIsLoading] = useState(true);
	const [updatingType, setUpdatingType] = useState<string | null>(null);

	useEffect(() => {
		const fetchSettings = async () => {
			try {
				const data = await getNotificationSettings();
				setSettings(data);
			} catch (error) {
				console.error('通知設定の取得に失敗しました:', error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchSettings();
	}, []);

	const handleToggle = async (notificationType: string) => {
		const allSettings = [
			...settings.general,
			...settings.eventPublished,
			...settings.archivePublished,
		];
		const currentSetting = allSettings.find(
			(s) => s.notification_type === notificationType,
		);
		if (!currentSetting) return;

		const newValue = !currentSetting.is_enabled;
		setUpdatingType(notificationType);

		try {
			await updateNotificationSetting(notificationType, newValue);
			setSettings((prev) => ({
				general: prev.general.map((s) =>
					s.notification_type === notificationType
						? { ...s, is_enabled: newValue }
						: s,
				),
				eventPublished: prev.eventPublished.map((s) =>
					s.notification_type === notificationType
						? { ...s, is_enabled: newValue }
						: s,
				),
				archivePublished: prev.archivePublished.map((s) =>
					s.notification_type === notificationType
						? { ...s, is_enabled: newValue }
						: s,
				),
			}));
		} catch (error) {
			console.error('通知設定の更新に失敗しました:', error);
		} finally {
			setUpdatingType(null);
		}
	};

	const generalTypes = Object.entries(NOTIFICATION_TYPES);
	const eventPublishedTypes = Object.entries(EVENT_PUBLISHED_TYPES);
	const archiveCategories = Object.entries(ARCHIVE_CATEGORIES);

	return (
		<div
			className={css({ display: 'flex', flexDirection: 'column', h: 'full' })}
		>
			<div
				className={css({
					flex: '1',
					overflowY: 'auto',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
				})}
			>
				<div
					className={css({
						maxW: 'lg',
						w: '90%',
						mx: 'auto',
						border: '1px solid',
						borderColor: 'gray.200',
						bg: 'white',
						mb: '4',
						mt: '4',
					})}
				>
					<div
						className={css({
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							px: '3',
							py: '2',
							borderBottom: '1px solid',
							borderColor: 'gray.200',
						})}
					>
						<button type="button" onClick={() => router.back()}>
							<ChevronLeft size={24} strokeWidth={2.5} />
						</button>
						<h1
							className={css({ fontSize: 'xl', fontWeight: 'bold', py: '2' })}
						>
							通知設定
						</h1>
						<div className={css({ w: '6' })} />
					</div>

					{isLoading ? (
						<div className={css({ py: '8', textAlign: 'center' })}>
							読み込み中...
						</div>
					) : (
						<div>
							{/* 一般通知設定 */}
							<SectionHeader title="一般通知" />
							{generalTypes.map(([key, typeInfo], index) => {
								const setting = settings.general.find(
									(s) => s.notification_type === key,
								);
								const isEnabled = setting?.is_enabled ?? true;
								const isUpdating = updatingType === key;

								return (
									<SettingItem
										key={key}
										label={typeInfo.label}
										description={typeInfo.description}
										isEnabled={isEnabled}
										isUpdating={isUpdating}
										onToggle={() => handleToggle(key)}
										isLast={index === generalTypes.length - 1}
									/>
								);
							})}

							{/* イベント種類別通知設定 */}
							<SectionHeader title="新規イベント公開通知（種類別）" />
							<p
								className={css({
									px: '4',
									py: '2',
									fontSize: 'xs',
									color: 'gray.500',
									borderBottom: '1px solid',
									borderColor: 'gray.100',
								})}
							>
								イベントの種類ごとに公開通知のオン/オフを設定できます。
							</p>
							{eventPublishedTypes.map(([key, typeInfo], index) => {
								const setting = settings.eventPublished.find(
									(s) => s.notification_type === key,
								);
								const isEnabled = setting?.is_enabled ?? true;
								const isUpdating = updatingType === key;

								return (
									<SettingItem
										key={key}
										label={typeInfo.label}
										description={typeInfo.description}
										isEnabled={isEnabled}
										isUpdating={isUpdating}
										onToggle={() => handleToggle(key)}
										isLast={index === eventPublishedTypes.length - 1}
									/>
								);
							})}

							{/* アーカイブ区分別通知設定 */}
							<SectionHeader title="アーカイブ公開通知（区分別）" />
							<p
								className={css({
									px: '4',
									py: '2',
									fontSize: 'xs',
									color: 'gray.500',
									borderBottom: '1px solid',
									borderColor: 'gray.100',
								})}
							>
								アーカイブの区分ごとに公開通知のオン/オフを設定できます。
							</p>
							{archiveCategories.map(([key, categoryInfo], index) => {
								const setting = settings.archivePublished.find(
									(s) => s.notification_type === categoryInfo.key,
								);
								const isEnabled = setting?.is_enabled ?? true;
								const isUpdating = updatingType === categoryInfo.key;

								return (
									<SettingItem
										key={key}
										label={categoryInfo.label}
										description={categoryInfo.description}
										isEnabled={isEnabled}
										isUpdating={isUpdating}
										onToggle={() => handleToggle(categoryInfo.key)}
										isLast={index === archiveCategories.length - 1}
									/>
								);
							})}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
