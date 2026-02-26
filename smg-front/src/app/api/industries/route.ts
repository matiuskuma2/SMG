import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
	try {
		const supabase = createClient();

		// 業界一覧を取得
		const { data: industries, error } = await supabase
			.from('mst_industry')
			.select('industry_id, industry_name')
			.is('deleted_at', null)
			.order('created_at');

		if (error) {
			console.error('業界一覧取得エラー:', error);
			return NextResponse.json(
				{ error: '業界一覧の取得に失敗しました' },
				{ status: 500 }
			);
		}

		return NextResponse.json(industries || []);
	} catch (error) {
		console.error('API エラー:', error);
		return NextResponse.json(
			{ error: 'サーバーエラーが発生しました' },
			{ status: 500 }
		);
	}
} 