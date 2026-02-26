import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  createEventApplicationNotification,
  createGatherApplicationNotification,
  createConsultationApplicationNotification,
} from '@/lib/api/notification-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, eventId, eventName, notificationType, isEventConsultation } = body;

    // 必須パラメータの検証
    if (!userId || !eventId || !eventName || !notificationType) {
      return NextResponse.json(
        { error: '必須パラメータが不足しています' },
        { status: 400 }
      );
    }

    // 通知タイプに応じて適切な通知を作成
    let notificationId: string;
    
    switch (notificationType) {
      case 'event_application':
        notificationId = await createEventApplicationNotification(
          userId,
          eventId,
          eventName
        );
        break;
      case 'gather_application':
        notificationId = await createGatherApplicationNotification(
          userId,
          eventId,
          eventName
        );
        break;
      case 'consultation_application':
        notificationId = await createConsultationApplicationNotification(
          userId,
          eventId,
          eventName,
          isEventConsultation ?? false
        );
        break;
      default:
        return NextResponse.json(
          { error: '無効な通知タイプです' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      notificationId,
      message: '通知が正常に作成されました',
    });

  } catch (error) {
    console.error('通知作成APIエラー:', error);
    return NextResponse.json(
      { error: '通知の作成に失敗しました' },
      { status: 500 }
    );
  }
} 