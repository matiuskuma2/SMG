import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * イベント申込データ復元エンドポイント
 *
 * Stripeの決済データとDBの参加者テーブルを突合し、
 * Stripeで決済完了しているがDBに反映されていないレコードを検出・復元する。
 *
 * POST /api/repair-attendees
 * Body: { mode: 'dry-run' | 'execute' }
 *
 * 認証: 管理者セッション（Supabase cookie）必須
 */

// Vercel Serverless Function の最大実行時間（秒）
// Stripe全決済セッションのスキャン + DB突合に時間がかかるため延長
export const maxDuration = 60;

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  throw new Error('環境変数STRIPE_SECRET_KEYが設定されていません');
}

const stripe = new Stripe(stripeKey, {
  apiVersion: '2025-05-28.basil',
});

// ---------- 型定義 ----------

interface SessionMeta {
  sessionId: string;
  paymentIntent: string;
  eventId: string;
  userId: string;
  selectedTypes: string[];
  participationType: string | null;
  amountTotal: number;
  createdAt: string;
}

interface MissingRecord {
  sessionId: string;
  paymentIntent: string;
  eventId: string;
  eventName: string;
  userId: string;
  userName: string;
  userEmail: string;
  selectedTypes: string[];
  participationType: string | null;
  amountTotal: number;
  paidAt: string;
  missingTables: string[];
}

interface RepairResult extends MissingRecord {
  repairedTables: { table: string; status: 'success' | 'error'; error?: string }[];
}

// ---------- ヘルパー ----------

/** Stripeからイベント関連の全決済セッションを取得 */
async function fetchAllPaidSessions(): Promise<SessionMeta[]> {
  const sessions: SessionMeta[] = [];
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const params: Stripe.Checkout.SessionListParams = {
      limit: 100,
      status: 'complete',
      expand: ['data.payment_intent'],
    };
    if (startingAfter) {
      params.starting_after = startingAfter;
    }

    const result = await stripe.checkout.sessions.list(params);

    for (const session of result.data) {
      // subscriptionモードは除外
      if (session.mode === 'subscription') continue;
      // metadataにevent_idがないものは除外
      const { event_id, selectedTypes, userId, participationType } =
        session.metadata || {};
      if (!event_id || !userId) continue;
      // 支払い完了のもののみ
      if (session.payment_status !== 'paid') continue;

      let parsedTypes: string[] = [];
      try {
        parsedTypes = selectedTypes ? JSON.parse(selectedTypes) : [];
      } catch {
        continue;
      }

      const paymentIntent =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id || '';

      sessions.push({
        sessionId: session.id,
        paymentIntent,
        eventId: event_id,
        userId,
        selectedTypes: parsedTypes,
        participationType: participationType || null,
        amountTotal: session.amount_total || 0,
        createdAt: new Date(session.created * 1000).toISOString(),
      });
    }

    hasMore = result.has_more;
    if (result.data.length > 0) {
      startingAfter = result.data[result.data.length - 1].id;
    }
  }

  return sessions;
}

/** DBに既存レコードがあるかチェックし、欠損テーブルを返す */
async function findMissingRecords(
  sessions: SessionMeta[],
): Promise<MissingRecord[]> {
  const supabase = createAdminClient();
  const missing: MissingRecord[] = [];

  // ユーザー情報のキャッシュ
  const userCache = new Map<string, { name: string; email: string }>();

  // イベント名のキャッシュ
  const eventCache = new Map<string, string>();

  for (const s of sessions) {
    const missingTables: string[] = [];

    // Networking -> trn_gather_attendee
    if (s.selectedTypes.includes('Networking')) {
      const { data } = await supabase
        .from('trn_gather_attendee')
        .select('event_id')
        .eq('event_id', s.eventId)
        .eq('user_id', s.userId)
        .is('deleted_at', null)
        .maybeSingle();
      if (!data) {
        missingTables.push('trn_gather_attendee');
      }
    }

    // Event -> trn_event_attendee
    if (s.selectedTypes.includes('Event')) {
      const { data } = await supabase
        .from('trn_event_attendee')
        .select('event_id')
        .eq('event_id', s.eventId)
        .eq('user_id', s.userId)
        .is('deleted_at', null)
        .maybeSingle();
      if (!data) {
        missingTables.push('trn_event_attendee');
      }
    }

    // Consultation -> trn_consultation_attendee
    if (s.selectedTypes.includes('Consultation')) {
      const { data } = await supabase
        .from('trn_consultation_attendee')
        .select('event_id')
        .eq('event_id', s.eventId)
        .eq('user_id', s.userId)
        .is('deleted_at', null)
        .maybeSingle();
      if (!data) {
        missingTables.push('trn_consultation_attendee');
      }
    }

    if (missingTables.length === 0) continue;

    // ユーザー名を取得
    if (!userCache.has(s.userId)) {
      const { data: userData } = await supabase
        .from('mst_user')
        .select('user_name, email')
        .eq('user_id', s.userId)
        .maybeSingle();
      userCache.set(s.userId, {
        name: userData?.user_name || '不明',
        email: userData?.email || '不明',
      });
    }
    const user = userCache.get(s.userId)!;

    // イベント名を取得
    if (!eventCache.has(s.eventId)) {
      const { data: eventData } = await supabase
        .from('mst_event')
        .select('event_name')
        .eq('event_id', s.eventId)
        .maybeSingle();
      eventCache.set(s.eventId, eventData?.event_name || '不明');
    }

    missing.push({
      sessionId: s.sessionId,
      paymentIntent: s.paymentIntent,
      eventId: s.eventId,
      eventName: eventCache.get(s.eventId)!,
      userId: s.userId,
      userName: user.name,
      userEmail: user.email,
      selectedTypes: s.selectedTypes,
      participationType: s.participationType,
      amountTotal: s.amountTotal,
      paidAt: s.createdAt,
      missingTables,
    });
  }

  return missing;
}

/** 欠損レコードをDBにupsert */
async function repairRecords(
  records: MissingRecord[],
): Promise<RepairResult[]> {
  const supabase = createAdminClient();
  const results: RepairResult[] = [];

  for (const record of records) {
    const repairedTables: RepairResult['repairedTables'] = [];

    // trn_gather_attendee
    if (record.missingTables.includes('trn_gather_attendee')) {
      const { error } = await supabase.from('trn_gather_attendee').upsert({
        event_id: record.eventId,
        user_id: record.userId,
        stripe_payment_intent_id: record.paymentIntent,
        stripe_payment_status: 'succeeded',
        payment_amount: record.amountTotal,
        payment_date: record.paidAt,
        deleted_at: null,
      });
      repairedTables.push({
        table: 'trn_gather_attendee',
        status: error ? 'error' : 'success',
        ...(error ? { error: error.message } : {}),
      });
    }

    // trn_event_attendee
    if (record.missingTables.includes('trn_event_attendee')) {
      const { error } = await supabase.from('trn_event_attendee').upsert({
        event_id: record.eventId,
        user_id: record.userId,
        is_offline: record.participationType
          ? record.participationType === 'Offline'
          : true,
        deleted_at: null,
      });
      repairedTables.push({
        table: 'trn_event_attendee',
        status: error ? 'error' : 'success',
        ...(error ? { error: error.message } : {}),
      });
    }

    // trn_consultation_attendee
    if (record.missingTables.includes('trn_consultation_attendee')) {
      const { error } = await supabase
        .from('trn_consultation_attendee')
        .upsert({
          event_id: record.eventId,
          user_id: record.userId,
          deleted_at: null,
        });
      repairedTables.push({
        table: 'trn_consultation_attendee',
        status: error ? 'error' : 'success',
        ...(error ? { error: error.message } : {}),
      });
    }

    results.push({ ...record, repairedTables });
  }

  return results;
}

// ---------- ルートハンドラ ----------

export async function POST(request: Request) {
  try {
    // 認証チェック（管理者セッション必須）
    const serverClient = createClient();
    const {
      data: { user },
    } = await serverClient.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const mode: string = body.mode || 'dry-run';

    if (mode !== 'dry-run' && mode !== 'execute') {
      return NextResponse.json(
        { error: 'mode は "dry-run" または "execute" を指定してください' },
        { status: 400 },
      );
    }

    console.log(`[repair-attendees] mode=${mode}, user=${user.email}`);

    // Step 1: Stripeから全決済セッションを取得
    console.log('[repair-attendees] Stripeから決済セッションを取得中...');
    const sessions = await fetchAllPaidSessions();
    console.log(`[repair-attendees] ${sessions.length}件の決済セッションを取得`);

    // Step 2: DBとの差分チェック
    console.log('[repair-attendees] DB差分チェック中...');
    const missingRecords = await findMissingRecords(sessions);
    console.log(
      `[repair-attendees] ${missingRecords.length}件の未反映データを検出`,
    );

    // dry-run: 差分レポートのみ返す
    if (mode === 'dry-run') {
      return NextResponse.json({
        mode: 'dry-run',
        totalStripeSessions: sessions.length,
        missingCount: missingRecords.length,
        missingRecords,
      });
    }

    // execute: 実際にupsert
    console.log('[repair-attendees] データ復元を実行中...');
    const results = await repairRecords(missingRecords);

    const successCount = results.filter((r) =>
      r.repairedTables.every((t) => t.status === 'success'),
    ).length;
    const errorCount = results.filter((r) =>
      r.repairedTables.some((t) => t.status === 'error'),
    ).length;

    console.log(
      `[repair-attendees] 復元完了: 成功=${successCount}, エラー=${errorCount}`,
    );

    return NextResponse.json({
      mode: 'execute',
      totalStripeSessions: sessions.length,
      repairedCount: results.length,
      successCount,
      errorCount,
      results,
    });
  } catch (error) {
    console.error('[repair-attendees] エラー:', error);
    return NextResponse.json(
      {
        error: 'データ復元処理に失敗しました',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
