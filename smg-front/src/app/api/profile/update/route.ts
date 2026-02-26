import { createClient } from '@/lib/supabase-server';
import { type NextRequest, NextResponse } from 'next/server';

interface ProfileUpdateRequest {
	name: string;
	nameKana: string;
	nickname?: string;
	email?: string;
	phoneNumber?: string;
	userPosition?: string;
	birthday?: string;
	companyName: string;
	companyNameKana: string;
	companyAddress?: string;
	industryId?: string;
	customIndustry?: string;
	introduction?: string;
	website?: string;
	sns: {
		instagram?: string;
		facebook?: string;
		tiktok?: string;
		x?: string;
		youtube?: string;
		other?: string;
	};
	visibility: {
		name: boolean;
		nameKana: boolean;
		nickname: boolean;
		email: boolean;
		phoneNumber: boolean;
		userPosition: boolean;
		birthday: boolean;
		companyName: boolean;
		companyNameKana: boolean;
		companyAddress: boolean;
		industry: boolean;
		introduction: boolean;
		website: boolean;
		sns: boolean;
	};
}

export async function PUT(request: NextRequest) {
	try {
		const supabase = createClient();

		// 認証されたユーザーを取得
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
		}

		// リクエストボディを取得
		const body: ProfileUpdateRequest = await request.json();

		// バリデーション
		if (
			!body.name ||
			!body.nameKana ||
			!body.companyName ||
			!body.companyNameKana
		) {
			return NextResponse.json(
				{ error: '必須項目が入力されていません' },
				{ status: 400 },
			);
		}

		// 業界IDの処理
		let finalIndustryId = body.industryId || undefined;

		// カスタム業界が入力されている場合は、新しい業界を作成または既存のものを検索
		if (body.customIndustry && body.customIndustry.trim()) {
			// 既存の業界を検索
			const { data: existingIndustry } = await supabase
				.from('mst_industry')
				.select('industry_id')
				.eq('industry_name', body.customIndustry.trim())
				.single();

			if (existingIndustry) {
				finalIndustryId = existingIndustry.industry_id;
			} else {
				// 新しい業界を作成
				const { data: newIndustry, error: industryError } = await supabase
					.from('mst_industry')
					.insert({
						industry_name: body.customIndustry.trim(),
					})
					.select('industry_id')
					.single();

				if (industryError) {
					console.error('業界作成エラー:', industryError);
				} else if (newIndustry) {
					finalIndustryId = newIndustry.industry_id;
				}
			}
		}

		// 空文字列を適切に処理するヘルパー関数
		const processEmptyValue = (
			value: string | undefined,
		): string | undefined => {
			if (!value || value.trim() === '') {
				return undefined;
			}
			return value.trim();
		};

		// 更新データを構築
		const updateData: any = {
			username: body.name,
			user_name_kana: body.nameKana,
			company_name: body.companyName,
			company_name_kana: body.companyNameKana,
			industry_id: finalIndustryId,
			social_media_links: body.sns,
			is_username_visible: body.visibility.name,
			is_nickname_visible: body.visibility.nickname,
			is_company_name_visible: body.visibility.companyName,
			is_company_address_visible: body.visibility.companyAddress,
			is_industry_id_visible: body.visibility.industry,
			is_bio_visible: body.visibility.introduction,
			is_website_url_visible: body.visibility.website,
			is_sns_visible: body.visibility.sns,
			is_user_position_visible: body.visibility.userPosition,
			is_email_visible: body.visibility.email,
			is_phone_number_visible: body.visibility.phoneNumber,
			is_user_name_kana_visible: body.visibility.nameKana,
			is_birth_date_visible: body.visibility.birthday,
			is_company_name_kana_visible: body.visibility.companyNameKana,
			updated_at: new Date().toISOString(),
		};

		// 空の値をNULLに設定するフィールド
		const optionalFields = [
			{ key: 'nickname', value: body.nickname },
			{ key: 'email', value: body.email },
			{ key: 'phone_number', value: body.phoneNumber },
			{ key: 'user_position', value: body.userPosition },
			{ key: 'birth_date', value: body.birthday },
			{ key: 'company_address', value: body.companyAddress },
			{ key: 'bio', value: body.introduction },
			{ key: 'website_url', value: body.website },
		];

		// 各フィールドを処理
		for (const field of optionalFields) {
			const processedValue = processEmptyValue(field.value);
			if (processedValue === undefined) {
				// 空の場合は明示的にNULLを設定
				updateData[field.key] = null;
			} else {
				updateData[field.key] = processedValue;
			}
		}

		// プロフィール情報を更新
		const { error: updateError } = await supabase
			.from('mst_user')
			.update(updateData)
			.eq('user_id', user.id);

		if (updateError) {
			console.error('プロフィール更新エラー:', updateError);

			// 一意制約違反（重複エラー）の判定
			if (updateError.code === '23505') {
				// エラーメッセージから重複したフィールドを特定
				const errorMessage = updateError.message || '';
				const errorDetail = updateError.details || '';

				if (
					errorMessage.includes('phone_number') ||
					errorDetail.includes('phone_number')
				) {
					return NextResponse.json(
						{
							error:
								'入力された携帯番号は既に他のユーザーに登録されています。別の携帯番号を入力してください。',
							field: 'phoneNumber',
						},
						{ status: 409 },
					);
				}
				if (errorMessage.includes('email') || errorDetail.includes('email')) {
					return NextResponse.json(
						{
							error:
								'入力されたメールアドレスは既に他のユーザーに登録されています。別のメールアドレスを入力してください。',
							field: 'email',
						},
						{ status: 409 },
					);
				}
				if (
					errorMessage.includes('nickname') ||
					errorDetail.includes('nickname')
				) {
					return NextResponse.json(
						{
							error:
								'入力されたニックネームは既に他のユーザーに使用されています。別のニックネームを入力してください。',
							field: 'nickname',
						},
						{ status: 409 },
					);
				}
				// 特定できない場合の一般的な重複エラーメッセージ
				return NextResponse.json(
					{
						error:
							'入力された情報の中に、既に他のユーザーに登録されている項目があります。入力内容をご確認ください。',
					},
					{ status: 409 },
				);
			}

			return NextResponse.json(
				{ error: 'プロフィール情報の更新に失敗しました' },
				{ status: 500 },
			);
		}

		return NextResponse.json({
			message: 'プロフィールが正常に更新されました',
			success: true,
		});
	} catch (error) {
		console.error('API エラー:', error);
		return NextResponse.json(
			{ error: 'サーバーエラーが発生しました' },
			{ status: 500 },
		);
	}
}
