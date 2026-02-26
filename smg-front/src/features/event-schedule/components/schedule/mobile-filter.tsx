'use client';

import { css } from '@/styled-system/css';
import { Checkbox, Dialog, Portal } from '@ark-ui/react';
import { useState } from 'react';
import { LuCheck, LuFilter, LuMapPin, LuMonitor, LuRotateCcw, LuSearch, LuTag, LuX } from 'react-icons/lu';
import { useScheduleContext } from '../../hooks/use-schedule';

type DraftFilters = {
	searchTerm: string;
	selectedCities: string[];
	selectedTypes: string[];
	selectedFormat: string[];
	isOnlyApplied: boolean;
};

export const MobileFilterButton = () => {
	const { fieldValues, setFieldByKey, eventTypes, eventCity } = useScheduleContext();
	const [open, setOpen] = useState(false);
	const [draft, setDraft] = useState<DraftFilters>({
		searchTerm: '',
		selectedCities: [],
		selectedTypes: [],
		selectedFormat: [],
		isOnlyApplied: false,
	});

	// アクティブなフィルター数を計算
	const activeCount = [
		fieldValues.selectedTypes.length > 0 && fieldValues.selectedTypes.length < eventTypes.length,
		fieldValues.selectedCities.length > 0 && fieldValues.selectedCities.length < eventCity.length,
		fieldValues.selectedFormat.length > 0 && fieldValues.selectedFormat.length < 2,
		fieldValues.isOnlyApplied,
		fieldValues.searchTerm.length > 0,
	].filter(Boolean).length;

	// ダイアログを開く時に現在の値をドラフトにコピー
	const handleOpenChange = (details: { open: boolean }) => {
		if (details.open) {
			setDraft({
				searchTerm: fieldValues.searchTerm,
				selectedCities: [...fieldValues.selectedCities],
				selectedTypes: [...fieldValues.selectedTypes],
				selectedFormat: [...fieldValues.selectedFormat],
				isOnlyApplied: fieldValues.isOnlyApplied,
			});
		}
		setOpen(details.open);
	};

	const setDraftField = <K extends keyof DraftFilters>(key: K, value: DraftFilters[K]) => {
		setDraft((prev) => ({ ...prev, [key]: value }));
	};

	// 絞り込みボタン押下時にグローバルステートへ反映してダイアログを閉じる
	const applyFilters = () => {
		setFieldByKey('searchTerm', draft.searchTerm);
		setFieldByKey('selectedCities', draft.selectedCities);
		setFieldByKey('selectedTypes', draft.selectedTypes);
		setFieldByKey('selectedFormat', draft.selectedFormat);
		setFieldByKey('isOnlyApplied', draft.isOnlyApplied);
		setOpen(false);
	};

	// ドラフトをリセット
	const resetDraft = () => {
		setDraft({
			searchTerm: '',
			selectedCities: [...eventCity],
			selectedTypes: eventTypes.map((t) => t.id),
			selectedFormat: ['offline', 'online'],
			isOnlyApplied: false,
		});
	};

	return (
		<Dialog.Root lazyMount unmountOnExit open={open} onOpenChange={handleOpenChange}>
			<Dialog.Trigger
				className={css({
					display: { base: 'flex', md: 'none' },
					alignItems: 'center',
					justifyContent: 'center',
					w: '10',
					h: '10',
					rounded: 'md',
					bg: 'white',
					border: '1px solid',
					borderColor: activeCount > 0 ? 'blue.500' : 'gray.200',
					position: 'relative',
					cursor: 'pointer',
				})}
			>
				<LuFilter size={20} />
				{activeCount > 0 && (
					<span
						className={css({
							position: 'absolute',
							top: '-1',
							right: '-1',
							w: '5',
							h: '5',
							bg: 'blue.500',
							color: 'white',
							fontSize: 'xs',
							rounded: 'full',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						})}
					>
						{activeCount}
					</span>
				)}
			</Dialog.Trigger>
			<Portal>
				<Dialog.Backdrop
					className={css({
						position: 'fixed',
						inset: 0,
						bg: 'black/50',
						zIndex: 'overlay',
					})}
				/>
				<Dialog.Positioner
					className={css({
						position: 'fixed',
						bottom: 0,
						left: 0,
						right: 0,
						zIndex: 'modal',
					})}
				>
					<Dialog.Content
						className={css({
							bg: 'white',
							roundedTop: 'xl',
							p: '4',
							maxH: '80vh',
							overflowY: 'auto',
						})}
					>
						<div className={css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '4' })}>
							<Dialog.Title className={css({ fontWeight: 'semibold', fontSize: 'lg' })}>
								フィルター
							</Dialog.Title>
							<Dialog.CloseTrigger className={css({ cursor: 'pointer', p: '1' })}>
								<LuX size={24} />
							</Dialog.CloseTrigger>
						</div>
						<div className={css({ display: 'flex', flexDir: 'column', gap: '4' })}>
							<MobileSearchField draft={draft} setDraftField={setDraftField} />
							<MobileEventCitySelector draft={draft} setDraftField={setDraftField} eventCity={eventCity} />
							<MobileEventTypeSelector draft={draft} setDraftField={setDraftField} eventTypes={eventTypes} />
							<MobileFormatSelector draft={draft} setDraftField={setDraftField} />
							<MobileAppliedToggle draft={draft} setDraftField={setDraftField} />
							<button
								type="button"
								onClick={applyFilters}
								className={css({
									w: 'full',
									py: '3',
									mt: '2',
									bg: 'primary',
									color: 'white',
									rounded: 'md',
									fontWeight: 'medium',
									cursor: 'pointer',
									fontSize: 'md',
									_hover: { opacity: 0.9 },
								})}
							>
								絞り込み
							</button>
							<button
								type="button"
								onClick={resetDraft}
								className={css({
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									gap: '2',
									w: 'full',
									py: '3',
									bg: 'gray.100',
									color: 'gray.700',
									rounded: 'md',
									fontWeight: 'medium',
									cursor: 'pointer',
									_hover: { bg: 'gray.200' },
								})}
							>
								<LuRotateCcw size={16} />
								フィルターをリセット
							</button>
						</div>
					</Dialog.Content>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};

type DraftProps = {
	draft: DraftFilters;
	setDraftField: <K extends keyof DraftFilters>(key: K, value: DraftFilters[K]) => void;
};

const MobileSearchField = ({ draft, setDraftField }: DraftProps) => {
	return (
		<div>
			<label className={mobileFilterLabelStyle}>
				<LuSearch size={16} />
				イベント名で検索
			</label>
			<input
				type="text"
				placeholder="キーワードを入力"
				value={draft.searchTerm}
				onChange={(e) => setDraftField('searchTerm', e.target.value)}
				className={css({
					w: 'full',
					px: '3',
					py: '2.5',
					border: '1px solid',
					borderColor: 'gray.300',
					rounded: 'md',
					fontSize: 'md',
					_focus: {
						outline: 'none',
						borderColor: 'blue.400',
						ring: '2px',
						ringColor: 'blue.100',
					},
				})}
			/>
		</div>
	);
};

const mobileFilterLabelStyle = css({
	display: 'flex',
	alignItems: 'center',
	gap: '1',
	fontSize: 'sm',
	fontWeight: 'medium',
	mb: '2',
	color: 'gray.700',
});

const checkboxGridStyle = css({
	display: 'grid',
	gridTemplateColumns: 'repeat(2, 1fr)',
	gap: '2',
	p: '3',
	bg: 'gray.50',
	rounded: 'md',
});

const checkboxListStyle = css({
	display: 'flex',
	flexDir: 'column',
	gap: '2',
	p: '3',
	bg: 'gray.50',
	rounded: 'md',
	maxH: '200px',
	overflowY: 'auto',
});

const MobileFormatSelector = ({ draft, setDraftField }: DraftProps) => {
	const formats = [
		{ label: 'オフライン', value: 'offline' },
		{ label: 'オンライン', value: 'online' },
	];

	const toggleFormat = (value: string) => {
		if (draft.selectedFormat.includes(value)) {
			setDraftField('selectedFormat', draft.selectedFormat.filter((v) => v !== value));
		} else {
			setDraftField('selectedFormat', [...draft.selectedFormat, value]);
		}
	};

	return (
		<div>
			<label className={mobileFilterLabelStyle}>
				<LuMonitor size={16} />
				開催形式
			</label>
			<div className={checkboxGridStyle}>
				{formats.map((item) => (
					<Checkbox.Root
						key={item.value}
						checked={draft.selectedFormat.includes(item.value)}
						onCheckedChange={() => toggleFormat(item.value)}
						className={css({
							display: 'flex',
							alignItems: 'center',
							gap: '2',
							px: '3',
							py: '2.5',
							rounded: 'md',
							cursor: 'pointer',
							bg: 'white',
							border: '1px solid',
							borderColor: { base: 'gray.200', _checked: 'blue.400' },
							_hover: { bg: 'gray.50' },
						})}
					>
						<Checkbox.Control
							className={css({
								w: '5',
								h: '5',
								border: '2px solid',
								rounded: 'sm',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								bg: { _checked: 'blue.500', base: 'white' },
								borderColor: { _checked: 'blue.500', base: 'gray.300' },
								flexShrink: 0,
							})}
						>
							<Checkbox.Indicator className={css({ color: 'white' })}>
								<LuCheck size={14} />
							</Checkbox.Indicator>
						</Checkbox.Control>
						<Checkbox.Label className={css({ fontSize: 'sm', color: 'gray.700' })}>
							{item.label}
						</Checkbox.Label>
						<Checkbox.HiddenInput />
					</Checkbox.Root>
				))}
			</div>
		</div>
	);
};

const MobileEventTypeSelector = ({
	draft,
	setDraftField,
	eventTypes,
}: DraftProps & { eventTypes: { id: string; name: string }[] }) => {
	const toggleType = (value: string) => {
		if (draft.selectedTypes.includes(value)) {
			setDraftField('selectedTypes', draft.selectedTypes.filter((v) => v !== value));
		} else {
			setDraftField('selectedTypes', [...draft.selectedTypes, value]);
		}
	};

	const selectAll = () => {
		setDraftField('selectedTypes', eventTypes.map((t) => t.id));
	};

	const clearAll = () => {
		setDraftField('selectedTypes', []);
	};

	return (
		<div>
			<div className={css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' })}>
				<label className={mobileFilterLabelStyle}>
					<LuTag size={16} />
					イベント種類
				</label>
				<div className={css({ display: 'flex', gap: '2', fontSize: 'xs' })}>
					<button type="button" onClick={selectAll} className={css({ color: 'blue.500', cursor: 'pointer' })}>全選択</button>
					<button type="button" onClick={clearAll} className={css({ color: 'gray.500', cursor: 'pointer' })}>全解除</button>
				</div>
			</div>
			<div className={checkboxListStyle}>
				{eventTypes.map((item) => (
					<Checkbox.Root
						key={item.id}
						checked={draft.selectedTypes.includes(item.id)}
						onCheckedChange={() => toggleType(item.id)}
						className={css({
							display: 'flex',
							alignItems: 'center',
							gap: '2',
							px: '3',
							py: '2.5',
							rounded: 'md',
							cursor: 'pointer',
							bg: 'white',
							border: '1px solid',
							borderColor: { base: 'gray.200', _checked: 'blue.400' },
							_hover: { bg: 'gray.50' },
						})}
					>
						<Checkbox.Control
							className={css({
								w: '5',
								h: '5',
								border: '2px solid',
								rounded: 'sm',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								bg: { _checked: 'blue.500', base: 'white' },
								borderColor: { _checked: 'blue.500', base: 'gray.300' },
								flexShrink: 0,
							})}
						>
							<Checkbox.Indicator className={css({ color: 'white' })}>
								<LuCheck size={14} />
							</Checkbox.Indicator>
						</Checkbox.Control>
						<Checkbox.Label className={css({ fontSize: 'sm', color: 'gray.700' })}>
							{item.name}
						</Checkbox.Label>
						<Checkbox.HiddenInput />
					</Checkbox.Root>
				))}
			</div>
		</div>
	);
};

const MobileEventCitySelector = ({
	draft,
	setDraftField,
	eventCity,
}: DraftProps & { eventCity: string[] }) => {
	const toggleCity = (value: string) => {
		if (draft.selectedCities.includes(value)) {
			setDraftField('selectedCities', draft.selectedCities.filter((v) => v !== value));
		} else {
			setDraftField('selectedCities', [...draft.selectedCities, value]);
		}
	};

	const selectAll = () => {
		setDraftField('selectedCities', [...eventCity]);
	};

	const clearAll = () => {
		setDraftField('selectedCities', []);
	};

	return (
		<div>
			<div className={css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' })}>
				<label className={mobileFilterLabelStyle}>
					<LuMapPin size={16} />
					開催地
				</label>
				<div className={css({ display: 'flex', gap: '2', fontSize: 'xs' })}>
					<button type="button" onClick={selectAll} className={css({ color: 'blue.500', cursor: 'pointer' })}>全選択</button>
					<button type="button" onClick={clearAll} className={css({ color: 'gray.500', cursor: 'pointer' })}>全解除</button>
				</div>
			</div>
			<div className={checkboxGridStyle}>
				{eventCity.map((city) => (
					<Checkbox.Root
						key={city}
						checked={draft.selectedCities.includes(city)}
						onCheckedChange={() => toggleCity(city)}
						className={css({
							display: 'flex',
							alignItems: 'center',
							gap: '2',
							px: '3',
							py: '2.5',
							rounded: 'md',
							cursor: 'pointer',
							bg: 'white',
							border: '1px solid',
							borderColor: { base: 'gray.200', _checked: 'blue.400' },
							_hover: { bg: 'gray.50' },
						})}
					>
						<Checkbox.Control
							className={css({
								w: '5',
								h: '5',
								border: '2px solid',
								rounded: 'sm',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								bg: { _checked: 'blue.500', base: 'white' },
								borderColor: { _checked: 'blue.500', base: 'gray.300' },
								flexShrink: 0,
							})}
						>
							<Checkbox.Indicator className={css({ color: 'white' })}>
								<LuCheck size={14} />
							</Checkbox.Indicator>
						</Checkbox.Control>
						<Checkbox.Label className={css({ fontSize: 'sm', color: 'gray.700' })}>
							{city}
						</Checkbox.Label>
						<Checkbox.HiddenInput />
					</Checkbox.Root>
				))}
			</div>
		</div>
	);
};

const MobileAppliedToggle = ({ draft, setDraftField }: DraftProps) => {
	return (
		<Checkbox.Root
			className={css({
				display: 'flex',
				alignItems: 'center',
				gap: '3',
				px: '3',
				py: '3',
				bg: 'gray.50',
				rounded: 'md',
				cursor: 'pointer',
			})}
			checked={draft.isOnlyApplied}
			onCheckedChange={(v) => setDraftField('isOnlyApplied', !!v.checked)}
		>
			<Checkbox.Control
				className={css({
					w: '5',
					h: '5',
					border: '2px solid',
					rounded: 'sm',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					bg: { _checked: 'blue.500', base: 'white' },
					borderColor: { _checked: 'blue.500', base: 'gray.300' },
					flexShrink: 0,
				})}
			>
				<Checkbox.Indicator className={css({ color: 'white' })}>
					<LuCheck size={14} />
				</Checkbox.Indicator>
			</Checkbox.Control>
			<Checkbox.Label className={css({ fontSize: 'md', color: 'gray.700' })}>
				申し込み済みのみ表示
			</Checkbox.Label>
			<Checkbox.HiddenInput />
		</Checkbox.Root>
	);
};
