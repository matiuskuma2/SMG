import { createClient } from '@/lib/supabase/server';
import { type NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const { question_id, is_hidden } = body;

    if (question_id === undefined || is_hidden === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // 質問の表示/非表示を更新
    const { data, error } = await supabase
      .from('trn_question')
      .update({ is_hidden })
      .eq('question_id', question_id)
      .select();

    if (error) {
      console.error('Error updating question visibility:', error);
      return NextResponse.json(
        { error: 'Failed to update question visibility' },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: data[0] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
