/**
 * イベント参加者数をサーバーサイドAPIから取得するユーティリティ
 * RLSをバイパスして正確なカウントを返す
 */

export interface EventParticipantCounts {
  eventCount: number;
  offlineEventCount: number;
  gatherCount: number;
  consultationCount: number;
}

export async function fetchEventParticipantCounts(
  eventId: string
): Promise<EventParticipantCounts> {
  try {
    const response = await fetch(
      `/api/event-participant-count?event_id=${encodeURIComponent(eventId)}`
    );

    if (!response.ok) {
      console.error('参加者数API取得エラー:', response.status);
      return { eventCount: 0, offlineEventCount: 0, gatherCount: 0, consultationCount: 0 };
    }

    const data = await response.json();
    return {
      eventCount: data.eventCount || 0,
      offlineEventCount: data.offlineEventCount || 0,
      gatherCount: data.gatherCount || 0,
      consultationCount: data.consultationCount || 0,
    };
  } catch (error) {
    console.error('参加者数取得エラー:', error);
    return { eventCount: 0, offlineEventCount: 0, gatherCount: 0, consultationCount: 0 };
  }
}
