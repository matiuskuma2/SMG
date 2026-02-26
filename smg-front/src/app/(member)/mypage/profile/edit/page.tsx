'use client';

import {
	type ProfileData,
	type ProfileVisibility,
	useProfile,
} from '@/components/ProfileContext';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import { compressImage, formatFileSize } from '@/lib/utils/image';
import { css } from '@/styled-system/css';
import { ArrowLeft, Camera } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';

interface Errors {
	[key: string]: string;
}

interface SnsOption {
	key: keyof ProfileData['sns'];
	label: string;
	placeholder: string;
}

/* ========= 共通スタイル ========= */
const styles = {
	section: css({
		mt: '4',
	}),
	labelContainer: css({
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		mb: '2',
	}),
	label: css({
		fontSize: 'xs',
		color: 'gray.700',
		fontWeight: 'bold',
	}),
	requiredMark: css({
		color: 'red.500',
		ml: '1',
	}),
	visibilityButton: css({
		display: 'flex',
		alignItems: 'center',
		gap: '1',
		bg: 'transparent',
		border: 'none',
		color: 'gray.500',
		fontSize: 'xs',
		cursor: 'pointer',
		p: '1',
		rounded: 'sm',
		_hover: { bg: 'gray.100' },
	}),
	errorMessage: css({
		color: 'red.500',
		fontSize: 'xs',
		mt: '1',
	}),
	helperText: css({
		fontSize: 'xs',
		color: 'gray.500',
		mt: '1',
	}),
	input: css({
		w: 'full',
		p: '3',
		border: '1px solid',
		borderColor: 'gray.300',
		rounded: 'md',
		fontSize: 'sm',
		bg: 'white',
		_focus: {
			outline: 'none',
			borderColor: 'blue.500',
			boxShadow: '0 0 0 1px var(--colors-blue-500)',
		},
	}),
	toggleSwitch: css({
		position: 'relative',
		display: 'inline-block',
		w: '14',
		h: '8',
	}),
	toggleInput: css({
		opacity: '0',
		position: 'absolute',
		top: 0,
		left: 0,
		width: '100%',
		height: '100%',
		margin: 0,
		cursor: 'pointer',
	}),
	toggleSlider: (checked: boolean) =>
		css({
			position: 'absolute',
			cursor: 'pointer',
			top: '0',
			left: '0',
			right: '0',
			bottom: '0',
			bg: checked ? 'blue.500' : 'gray.200',
			transition: '.4s',
			rounded: 'full',
			_before: {
				position: 'absolute',
				content: '""',
				h: '6',
				w: '6',
				left: 0,
				bottom: '1',
				bg: 'white',
				transition: '.4s',
				rounded: '50%',
				transform: checked ? 'translateX(8px)' : 'none',
			},
		}),
	toggleLabel: css({
		display: 'flex',
		alignItems: 'center',
		gap: '3',
		fontSize: 'sm',
		color: 'gray.600',
	}),
} as const;

/* ========= サブコンポーネント ========= */
const FormLabel = ({
	htmlFor,
	required,
	children,
	visibility,
	onToggleVisibility,
}: {
	htmlFor: string;
	required?: boolean;
	children: React.ReactNode;
	visibility?: boolean;
	onToggleVisibility?: () => void;
}) => (
	<div className={styles.labelContainer}>
		<label htmlFor={htmlFor} className={styles.label}>
			{children}
			{required && <span className={styles.requiredMark}>*</span>}
		</label>
		{visibility !== undefined && onToggleVisibility && (
			<div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
				<ToggleSwitch checked={visibility} onChange={onToggleVisibility} />
				<span
					className={css({
						fontSize: 'xs',
						color: visibility ? '#003F74' : 'gray.500',
						minWidth: '40px',
						textAlign: 'left',
					})}
				>
					{visibility ? '公開' : '非公開'}
				</span>
			</div>
		)}
	</div>
);

const FormInput = ({
	id,
	type = 'text',
	value,
	onChange,
	placeholder,
	error,
	helperText,
	readOnly = false,
}: {
	id: string;
	type?: string;
	value: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	placeholder?: string;
	error?: string;
	helperText?: string;
	readOnly?: boolean;
}) => (
	<>
		<input
			id={id}
			type={type}
			value={value}
			onChange={onChange}
			className={
				readOnly
					? css({
							w: 'full',
							p: '3',
							border: '1px solid',
							borderColor: 'gray.300',
							rounded: 'md',
							fontSize: 'sm',
							bg: 'gray.100',
							cursor: 'not-allowed',
							color: 'gray.600',
							_focus: {
								outline: 'none',
								borderColor: 'gray.300',
							},
						})
					: styles.input
			}
			placeholder={placeholder}
			readOnly={readOnly}
		/>
		{error && <p className={styles.errorMessage}>{error}</p>}
		{helperText && <p className={styles.helperText}>{helperText}</p>}
	</>
);

const FormSection = ({
	title,
	required,
	visibility,
	onToggleVisibility,
	children,
}: {
	title: string;
	required?: boolean;
	visibility?: boolean;
	onToggleVisibility?: () => void;
	children: React.ReactNode;
}) => (
	<section className={styles.section}>
		<FormLabel
			htmlFor={title.toLowerCase()}
			required={required}
			visibility={visibility}
			onToggleVisibility={onToggleVisibility}
		>
			{title}
		</FormLabel>
		{children}
	</section>
);

interface Industry {
	industry_id: string;
	industry_name: string;
}

export default function ProfileEditPage(): JSX.Element {
	const router = useRouter();
	const {
		profileData: contextProfileData,
		visibility: contextVisibility,
		loading: profileLoading,
		updateProfile,
	} = useProfile();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [formData, setFormData] = useState<ProfileData>(contextProfileData);
	const [visibility, setVisibility] =
		useState<ProfileVisibility>(contextVisibility);
	const [errors, setErrors] = useState<Errors>({});
	const [profileImagePreview, setProfileImagePreview] =
		useState<string>('/profile-icon.jpg');
	const [industries, setIndustries] = useState<Industry[]>([]);
	const [industriesLoading, setIndustriesLoading] = useState<boolean>(true);
	const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
	const [saving, setSaving] = useState<boolean>(false);
	const [compressing, setCompressing] = useState<boolean>(false);

	// 業界一覧を取得
	useEffect(() => {
		const fetchIndustries = async () => {
			try {
				const response = await fetch('/api/industries');
				if (response.ok) {
					const data = await response.json();
					setIndustries(data);
				} else {
					console.error('業界一覧の取得に失敗しました');
				}
			} catch (error) {
				console.error('業界一覧取得エラー:', error);
			} finally {
				setIndustriesLoading(false);
			}
		};

		fetchIndustries();
	}, []);

	// Contextからデータを初期化
	useEffect(() => {
		if (!profileLoading) {
			setFormData(contextProfileData);
			setVisibility(contextVisibility);
			setProfileImagePreview(
				contextProfileData.profileImage || '/profile-icon.jpg',
			);
		}
	}, [contextProfileData, contextVisibility, profileLoading]);

	const snsOptions: SnsOption[] = [
		{ key: 'instagram', label: 'Instagram', placeholder: '@username' },
		{ key: 'facebook', label: 'Facebook', placeholder: 'プロフィールURL' },
		{ key: 'tiktok', label: 'TikTok', placeholder: '@username' },
		{ key: 'x', label: 'X', placeholder: '@username' },
		{ key: 'youtube', label: 'YouTube', placeholder: 'チャンネル名' },
		{ key: 'other', label: 'その他', placeholder: 'URL' },
	];

	const handleInputChange = (field: keyof ProfileData, value: string): void => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));

		if (errors[field]) {
			setErrors((prev) => ({
				...prev,
				[field]: '',
			}));
		}
	};

	const handleSnsChange = (
		platform: keyof ProfileData['sns'],
		value: string,
	): void => {
		setFormData((prev) => ({
			...prev,
			sns: {
				...prev.sns,
				[platform]: value,
			},
		}));
	};

	const toggleVisibility = (field: keyof ProfileVisibility): void => {
		setVisibility((prev) => ({
			...prev,
			[field]: !prev[field],
		}));
	};

	const validateForm = (): boolean => {
		const newErrors: Errors = {};

		if (!formData.name.trim()) {
			newErrors.name = '名前は必須項目です';
		}

		if (!formData.nameKana.trim()) {
			newErrors.nameKana = 'ふりがなは必須項目です';
		}

		if (!formData.companyName.trim()) {
			newErrors.companyName = '会社名は必須項目です';
		}

		if (!formData.companyNameKana.trim()) {
			newErrors.companyNameKana = '会社名ふりがなは必須項目です';
		}

		if (formData.introduction.length > 500) {
			newErrors.introduction = '自己紹介文は500文字以内で入力してください';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (): Promise<void> => {
		if (!validateForm()) return;

		try {
			setSaving(true);

			// 画像が選択されている場合は先にアップロード
			if (selectedImageFile) {
				const formData = new FormData();
				formData.append('file', selectedImageFile);

				const response = await fetch('/api/profile/upload-icon', {
					method: 'POST',
					body: formData,
				});

				if (response.ok) {
					const data = await response.json();
					// フォームデータのprofileImageを更新
					setFormData((prev) => ({
						...prev,
						profileImage: data.iconUrl,
					}));
				} else {
					const errorData = await response.json();
					alert(`画像のアップロードに失敗しました: ${errorData.error}`);
					return;
				}
			}

			// プロフィール情報を保存
			const result = await updateProfile(formData, visibility);
			if (result.success) {
				alert('プロフィールを保存しました');
				router.back();
			} else {
				alert(result.error || 'プロフィールの保存に失敗しました');
			}
		} catch (error) {
			console.error('保存エラー:', error);
			alert('保存中にエラーが発生しました');
		} finally {
			setSaving(false);
		}
	};

	const handleBack = (): void => {
		router.back();
	};

	const handleImageUpload = async (
		event: React.ChangeEvent<HTMLInputElement>,
	): Promise<void> => {
		const file = event.target.files?.[0];
		if (!file) return;

		// ファイルサイズチェック（10MB以下に変更）
		if (file.size > 10 * 1024 * 1024) {
			alert(
				`ファイルサイズは10MB以下にしてください。現在のサイズ: ${formatFileSize(file.size)}`,
			);
			return;
		}

		// ファイル形式チェック
		if (!file.type.startsWith('image/')) {
			alert('画像ファイルを選択してください');
			return;
		}

		// 画像圧縮処理
		setCompressing(true);
		try {
			const result = await compressImage(file);
			console.log(
				`プロフィール画像圧縮: ${file.name} - 元サイズ: ${formatFileSize(result.originalSize)}, 圧縮後: ${formatFileSize(result.compressedSize)}, 圧縮率: ${result.compressionRatio}%`,
			);

			// 圧縮された画像を保存
			setSelectedImageFile(result.file);

			// プレビュー用のURLを作成（圧縮前の画像でプレビュー用）
			const reader = new FileReader();
			reader.onload = (e) => {
				const result = e.target?.result as string;
				setProfileImagePreview(result);
			};
			reader.readAsDataURL(file);
		} catch (error) {
			console.error('プロフィール画像圧縮処理中にエラーが発生しました:', error);
			// エラー時は元の画像をそのまま使用
			setSelectedImageFile(file);

			// プレビュー用のURLを作成
			const reader = new FileReader();
			reader.onload = (e) => {
				const result = e.target?.result as string;
				setProfileImagePreview(result);
			};
			reader.readAsDataURL(file);
		} finally {
			setCompressing(false);
		}

		// ファイル選択をリセット（同じファイルを連続で選択できるように）
		event.target.value = '';
	};

	const handleCameraClick = (): void => {
		if (compressing || saving) return;
		fileInputRef.current?.click();
	};

	// ローディング中の表示
	if (profileLoading) {
		return (
			<div
				className={css({
					minHeight: '100vh',
					bg: 'gray.90',
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					py: '4',
				})}
			>
				<div className={css({ textAlign: 'center', color: 'gray.600' })}>
					<div className={css({ fontSize: 'lg', mb: '2' })}>
						プロフィール情報を読み込み中...
					</div>
				</div>
			</div>
		);
	}

	return (
		<div
			className={css({
				minHeight: '100vh',
				bg: 'gray.90',
				display: 'flex',
				justifyContent: 'center',
				py: '4',
			})}
		>
			<main
				className={css({
					maxWidth: '600px',
					width: '100%',
					mx: '4',
					bg: 'white',
					rounded: 'lg',
					shadow: 'md',
					height: 'fit-content',
				})}
			>
				{/* ヘッダー */}
				<section
					className={css({
						pt: '4',
						pb: '3',
						textAlign: 'center',
						position: 'relative',
						borderBottomWidth: '1px',
						borderColor: 'gray.200',
					})}
				>
					<span
						className={css({
							position: 'absolute',
							top: '13px',
							left: '5px',
						})}
					>
						<button
							onClick={handleBack}
							className={css({
								w: '12',
								h: '12',
								bg: 'transparent',
								border: 'none',
								rounded: 'full',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								cursor: 'pointer',
								color: 'gray.700',
								_hover: { bg: 'gray.100' },
							})}
							type="button"
						>
							<ArrowLeft size={26} />
						</button>
					</span>
					<span
						className={css({
							fontSize: 'lg',
							fontWeight: 'semibold',
							color: 'gray.900',
						})}
					>
						プロフィール
					</span>
				</section>

				{/* フォーム */}
				<form className={css({ p: '4' })}>
					{/* プロフィール画像セクション */}
					<section className={css({ mt: '3', textAlign: 'center' })}>
						<div className={css({ mt: '3', mx: 'auto', w: '150px' })}>
							<div
								className={css({
									position: 'relative',
									display: 'block',
									margin: '0 auto',
									textAlign: 'center',
									w: '100px',
									overflow: 'hidden',
								})}
							>
								<div
									className={css({
										w: '100px',
										h: '100px',
										rounded: 'full',
										overflow: 'hidden',
										bg: 'gray.300',
									})}
								>
									<img
										src={profileImagePreview}
										alt="プロフィール画像"
										className={css({
											w: 'full',
											h: 'full',
											objectFit: 'cover',
											objectPosition: 'center center',
										})}
									/>
								</div>
								<button
									onClick={handleCameraClick}
									disabled={saving || compressing}
									className={css({
										position: 'absolute',
										bottom: '0',
										right: '0',
										w: '8',
										h: '8',
										bg: saving || compressing ? 'gray.400' : '#003F74',
										rounded: 'full',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										color: 'white',
										border: '2px solid white',
										cursor: saving || compressing ? 'not-allowed' : 'pointer',
										_hover: {
											bg: saving || compressing ? 'gray.400' : '#002D56',
										},
									})}
									type="button"
								>
									<Camera size={16} />
								</button>
								{/* 隠しファイル入力 */}
								<input
									id="website"
									ref={fileInputRef}
									type="file"
									accept="image/*"
									onChange={handleImageUpload}
									className={css({ display: 'none' })}
								/>
								{/* 圧縮中の表示 */}
								{compressing && (
									<div
										className={css({
											position: 'absolute',
											top: '0',
											left: '0',
											right: '0',
											bottom: '0',
											bg: 'rgba(255, 255, 255, 0.8)',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											rounded: 'full',
											zIndex: 10,
										})}
									>
										<div
											className={css({
												fontSize: 'xs',
												color: 'blue.600',
												textAlign: 'center',
											})}
										>
											画像を
											<br />
											圧縮中...
										</div>
									</div>
								)}
							</div>
						</div>
					</section>

					{/* 氏名 */}
					<FormSection
						title="氏名"
						required
						visibility={visibility.name}
						onToggleVisibility={() => toggleVisibility('name')}
					>
						<FormInput
							id="display-name"
							value={formData.name}
							onChange={(e) => handleInputChange('name', e.target.value)}
							placeholder="氏名を入力"
							error={errors.name}
						/>
					</FormSection>

					{/* 氏名ふりがな */}
					<FormSection
						title="氏名ふりがな"
						required
						visibility={visibility.nameKana}
						onToggleVisibility={() => toggleVisibility('nameKana')}
					>
						<FormInput
							id="name-kana"
							value={formData.nameKana}
							onChange={(e) => handleInputChange('nameKana', e.target.value)}
							placeholder="ふりがなを入力"
							error={errors.nameKana}
						/>
					</FormSection>

					{/* ユーザー名 */}
					<FormSection
						title="ユーザー名"
						visibility={visibility.nickname}
						onToggleVisibility={() => toggleVisibility('nickname')}
					>
						<FormInput
							id="nickname"
							value={formData.nickname}
							onChange={(e) => handleInputChange('nickname', e.target.value)}
							placeholder="ユーザー名を入力"
						/>
					</FormSection>

					{/* メールアドレス */}
					<FormSection
						title="メールアドレス"
						visibility={visibility.email}
						onToggleVisibility={() => toggleVisibility('email')}
					>
						<FormInput
							id="email"
							type="email"
							value={formData.email}
							onChange={() => {}} // 編集不可のため空の関数
							placeholder="メールアドレス（変更不可）"
							readOnly={true}
						/>
					</FormSection>

					{/* 携帯番号 */}
					<FormSection
						title="携帯番号"
						visibility={visibility.phoneNumber}
						onToggleVisibility={() => toggleVisibility('phoneNumber')}
					>
						<FormInput
							id="phone-number"
							type="tel"
							value={formData.phoneNumber}
							onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
							placeholder="携帯番号を入力"
						/>
					</FormSection>

					{/* 肩書 */}
					<FormSection
						title="肩書"
						visibility={visibility.userPosition}
						onToggleVisibility={() => toggleVisibility('userPosition')}
					>
						<FormInput
							id="user-position"
							value={formData.userPosition}
							onChange={(e) =>
								handleInputChange('userPosition', e.target.value)
							}
							placeholder="肩書を入力してください（例：代表取締役、部長、マネージャーなど）"
						/>
					</FormSection>

					{/* 生年月日 */}
					<FormSection
						title="生年月日"
						required={false}
						visibility={visibility.birthday}
						onToggleVisibility={() => toggleVisibility('birthday')}
					>
						<FormInput
							id="birthday"
							type="date"
							value={formData.birthday}
							onChange={(e) => handleInputChange('birthday', e.target.value)}
							placeholder="生年月日を入力"
						/>
					</FormSection>

					{/* 会社名 */}
					<FormSection
						title="会社名"
						required
						visibility={visibility.companyName}
						onToggleVisibility={() => toggleVisibility('companyName')}
					>
						<FormInput
							id="company-name"
							value={formData.companyName}
							onChange={(e) => handleInputChange('companyName', e.target.value)}
							placeholder="会社名を入力"
							helperText="※ 個人事業主で屋号がない方は本名"
							error={errors.companyName}
						/>
					</FormSection>

					{/* 会社名ふりがな */}
					<FormSection
						title="会社名ふりがな"
						required
						visibility={visibility.companyNameKana}
						onToggleVisibility={() => toggleVisibility('companyNameKana')}
					>
						<FormInput
							id="company-name-kana"
							value={formData.companyNameKana}
							onChange={(e) =>
								handleInputChange('companyNameKana', e.target.value)
							}
							placeholder="会社名ふりがなを入力"
							error={errors.companyNameKana}
						/>
					</FormSection>

					{/* 会社所在地 */}
					<FormSection
						title="会社所在地"
						visibility={visibility.companyAddress}
						onToggleVisibility={() => toggleVisibility('companyAddress')}
					>
						<FormInput
							id="company-address"
							value={formData.companyAddress}
							onChange={(e) =>
								handleInputChange('companyAddress', e.target.value)
							}
							placeholder="会社所在地を入力"
						/>
					</FormSection>

					{/* 業界選択 */}
					<FormSection
						title="あなたの業界（業種別開催イベントの際などに参考にさせていただきます）"
						visibility={visibility.industry}
						onToggleVisibility={() => toggleVisibility('industry')}
					>
						{industriesLoading ? (
							<div
								className={css({
									p: '3',
									textAlign: 'center',
									color: 'gray.500',
								})}
							>
								業界一覧を読み込み中...
							</div>
						) : (
							<>
								<select
									id="industry-select"
									value={formData.industryId}
									onChange={(e) => {
										const selectedIndustryId = e.target.value;
										const selectedIndustry = industries.find(
											(industry) => industry.industry_id === selectedIndustryId,
										);
										handleInputChange('industryId', selectedIndustryId);
										handleInputChange(
											'industry',
											selectedIndustry?.industry_name || '',
										);
									}}
									className={styles.input}
								>
									<option value="">業種を選択してください</option>
									{industries
										.filter((industry) => industry.industry_name !== 'その他')
										.map((industry) => (
											<option
												key={industry.industry_id}
												value={industry.industry_id}
											>
												{industry.industry_name}
											</option>
										))}
									{industries
										.filter((industry) => industry.industry_name === 'その他')
										.map((industry) => (
											<option
												key={industry.industry_id}
												value={industry.industry_id}
											>
												{industry.industry_name}
											</option>
										))}
								</select>
							</>
						)}
					</FormSection>

					{/* 自己紹介 */}
					<FormSection
						title="自己紹介（500文字以内）"
						visibility={visibility.introduction}
						onToggleVisibility={() => toggleVisibility('introduction')}
					>
						<textarea
							id="introduction"
							value={formData.introduction}
							onChange={(e) =>
								handleInputChange('introduction', e.target.value)
							}
							rows={6}
							className={styles.input}
							placeholder="自己紹介を入力してください"
						/>
						<div
							className={css({
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								mt: '1',
							})}
						>
							{errors.introduction && (
								<p className={styles.errorMessage}>{errors.introduction}</p>
							)}
							<p
								className={css({
									fontSize: 'xs',
									color:
										formData.introduction.length > 500 ? 'red.500' : 'gray.500',
									ml: 'auto',
								})}
							>
								{formData.introduction.length}/500文字
							</p>
						</div>
					</FormSection>

					{/* ウェブサイト */}
					<FormSection
						title="ウェブサイト"
						visibility={visibility.website}
						onToggleVisibility={() => toggleVisibility('website')}
					>
						<FormInput
							id="website"
							type="url"
							value={formData.website}
							onChange={(e) => handleInputChange('website', e.target.value)}
							placeholder="https://example.com"
						/>
					</FormSection>

					{/* SNS */}
					<FormSection
						title="SNS"
						visibility={visibility.sns}
						onToggleVisibility={() => toggleVisibility('sns')}
					>
						<div
							className={css({
								display: 'flex',
								flexDirection: 'column',
								gap: '3',
							})}
						>
							{snsOptions.map((option) => (
								<div key={option.key}>
									<label
										htmlFor={option.key}
										className={css({
											display: 'block',
											fontSize: 'xs',
											color: 'gray.600',
											mb: '1',
										})}
									>
										{option.label}
									</label>
									<FormInput
										id={option.key}
										value={formData.sns[option.key]}
										onChange={(e) =>
											handleSnsChange(option.key, e.target.value)
										}
										placeholder={option.placeholder}
									/>
								</div>
							))}
						</div>
					</FormSection>

					{/* 保存ボタン */}
					<section className={css({ mt: '8', textAlign: 'center' })}>
						<button
							onClick={handleSubmit}
							disabled={saving || compressing}
							className={css({
								w: '50%',
								bg: saving || compressing ? 'gray.400' : '#9E7631',
								color: 'white',
								border: 'none',
								rounded: 'md',
								py: '3',
								px: '6',
								fontSize: 'sm',
								fontWeight: 'medium',
								cursor: saving || compressing ? 'not-allowed' : 'pointer',
								_hover: { bg: saving || compressing ? 'gray.400' : '#8A6A2F' },
							})}
							type="button"
						>
							{compressing
								? '画像圧縮中...'
								: saving
									? '保存中...'
									: '保存する'}
						</button>
					</section>
				</form>
			</main>
		</div>
	);
}
