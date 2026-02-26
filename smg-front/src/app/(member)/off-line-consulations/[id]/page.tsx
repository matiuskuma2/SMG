'use client'
import { useState, useEffect } from "react";
import { css } from "@/styled-system/css";
import { UrgentCheckbox } from "@/components/consultations/UrgentCheckbox";
import { FirstTimeCheckbox } from "@/components/consultations/FirstTimeCheckbox";
import { RemarksField } from "@/components/consultations/RemarksField";
import { SubmitButton } from "@/components/consultations/SubmitButton";
import { OfflineConsultationHeader } from "@/components/consultations/OfflineConsultationHeader";
import { createClient } from "@/lib/supabase";
import { useParams } from "next/navigation";

export default function ConsultationForm() {
  const [isUrgent, setIsUrgent] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const params = useParams();
  const eventId = params.id as string;

  if (!eventId) {
    return (
      <div className={css({ p: "4", textAlign: "center" })}>
        <h1>ページが見つかりません</h1>
        <p>指定されたイベントIDが無効です。</p>
      </div>
    );
  }

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Error fetching user:', error);
        setErrorMessage('ユーザー情報の取得に失敗しました。');
        return;
      }

      if (!user) {
        setErrorMessage('ログインが必要です。');
        return;
      }

      setUserId(user.id);
    };

    fetchUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    if (!userId) {
      setErrorMessage('ユーザー情報が取得できません。再度ログインしてください。');
      setIsSubmitting(false);
      return;
    }

    try {
      const supabase = createClient();
      
      // 既存のレコードを確認
      const { data: existingRecord, error: fetchError } = await supabase
        .from('trn_consultation_attendee')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116はレコードが見つからない場合のエラー
        throw fetchError;
      }

      if (existingRecord) {
        // 既存のレコードがある場合は更新
        const { error: updateError } = await supabase
          .from('trn_consultation_attendee')
          .update({
            is_urgent: isUrgent,
            is_first_consultation: isFirstTime,
            notes: remarks,
            deleted_at: null
          })
          .eq('event_id', eventId)
          .eq('user_id', userId);

        if (updateError) throw updateError;
      } else {
        // 新規レコードの場合は挿入
        const { error: insertError } = await supabase
          .from('trn_consultation_attendee')
          .insert({
            event_id: eventId,
            user_id: userId,
            is_urgent: isUrgent,
            is_first_consultation: isFirstTime,
            notes: remarks
          });

        if (insertError) throw insertError;
      }

      // 通知を作成
      try {
        // イベント名を取得
        const { data: eventData } = await supabase
          .from('mst_event')
          .select('event_name')
          .eq('event_id', eventId)
          .single();

        if (eventData?.event_name) {
          await fetch('/api/notifications/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: userId,
              eventId: eventId,
              eventName: eventData.event_name,
              notificationType: 'consultation_application',
              isEventConsultation: true,
            }),
          });
          console.log('個別相談通知が作成されました');
        }
      } catch (notificationError) {
        console.error('通知作成に失敗しました:', notificationError);
      }

      // 成功時の処理
      alert('相談の申し込みが完了しました。');
      // 現在の履歴を/eventsに置き換えてからイベント詳細ページに遷移
      // これにより、詳細ページで「戻る」を押すとイベント一覧に行く
      window.history.replaceState(null, '', '/events');
      window.location.href = `/events/${eventId}`;
    } catch (error: any) {
      console.error('Error submitting consultation:', error);
      setErrorMessage(
        `申し込みの処理中にエラーが発生しました。\n` +
        `エラーコード: ${error.code || '不明'}\n` +
        `エラーメッセージ: ${error.message || '不明なエラー'}\n` +
        `詳細: ${error.details || '詳細情報なし'}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formStyles = css({
    bg: "white",
    p: "6",
    border: "1px solid",
    borderColor: "gray.200",
    borderRadius: "0 0 lg lg",
    boxShadow: "sm",
  });

  const formTitleStyles = css({
    fontSize: "lg",
    fontWeight: "semibold",
    mb: "6",
  });

  const containerStyles = css({
    mx: "auto",
    px: "4",
    py: "8",
    maxW: "2xl",
  });

  const checkboxContainerStyles = css({
    display: "flex",
    flexDirection: "column",
    gap: "4",
    mb: "6",
  });

  const errorMessageStyles = css({
    color: "red.500",
    bg: "red.50",
    p: "4",
    rounded: "md",
    mb: "4",
    whiteSpace: "pre-line",
  });

  return (
    <div className={containerStyles}>
      <OfflineConsultationHeader />
      <form onSubmit={handleSubmit} className={formStyles}>
        <h2 className={formTitleStyles}>申請フォーム</h2>
        
        {errorMessage && (
          <div className={errorMessageStyles}>
            {errorMessage}
          </div>
        )}

        <div className={checkboxContainerStyles}>
          <UrgentCheckbox 
            isUrgent={isUrgent} 
            setIsUrgent={setIsUrgent} 
          />

          <FirstTimeCheckbox
            isFirstTime={isFirstTime}
            setIsFirstTime={setIsFirstTime}
          />
        </div>

        <RemarksField 
          remarks={remarks} 
          setRemarks={setRemarks} 
        />

        <SubmitButton 
          isSubmitting={isSubmitting}
          isBeforeStart={false}
          isAfterEnd={false}
        />
      </form>
    </div>
  );
} 