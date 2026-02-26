import { EventQuestionModal } from '@/components/events/EventQuestionModal';
import EventTypeCheckbox from '@/components/events/EventTypeCheckbox';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getEventQuestionAnswers, getEventQuestions, saveEventQuestionAnswers } from '@/lib/api/event';
import { css } from '@/styled-system/css';
import type { EventApplicationFormProps } from '@/types/event';
import React, { useEffect, useState } from 'react';

const EventApplicationForm: React.FC<EventApplicationFormProps> = ({
  supabase,
  event_id,
  event_name,
  has_gather = false,
  has_consultation = false,
  event_type = '',
  event_location = '',
  event_city = '',
  onSuccess
}) => {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [participationType, setParticipationType] = useState<string>('Offline');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [eventCapacity, setEventCapacity] = useState<number>(0);
  const [gatherCapacity, setGatherCapacity] = useState<number>(0);
  const [consultationCapacity, setConsultationCapacity] = useState<number>(0);
  const [eventParticipants, setEventParticipants] = useState<number>(0);
  const [gatherParticipants, setGatherParticipants] = useState<number>(0);
  const [consultationParticipants, setConsultationParticipants] = useState<number>(0);
  const [questionAnswers, setQuestionAnswers] = useState<{ [key: string]: any }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // 定例会かつ東京開催のイベントかどうかを判定
  const isRegularMeeting = event_type === '定例会';
  const isTokyoRegularMeeting = (isRegularMeeting && event_city?.includes('東京')) || event_type === '簿記講座';
  const isOnlineSeminar = event_type === 'オンラインセミナー';
  const isBookkeeping = event_type === '簿記講座';

  console.log('=== イベント詳細情報 ===');
  console.log('event_type:', event_type);
  console.log('event_location:', event_location);
  console.log('event_city:', event_city);
  console.log('isTokyoRegularMeeting:', isTokyoRegularMeeting);
  console.log('isOnlineSeminar:', isOnlineSeminar);
  console.log('isBookkeeping:', isBookkeeping);
  console.log('selectedTypes:', selectedTypes);
  console.log('participationType:', participationType);
  console.log('eventParticipants:', eventParticipants);
  console.log('eventCapacity:', eventCapacity);
  console.log('EventTypeCheckbox disabled条件:', eventParticipants >= eventCapacity);
  console.log('=== イベント詳細情報終了 ===');

  useEffect(() => {
    // オンラインセミナーの場合は自動的にオンライン参加に設定
    if (isOnlineSeminar) {
      setParticipationType('Online');
    } else if ((isTokyoRegularMeeting || isBookkeeping) && eventParticipants >= eventCapacity) {
      // オンライン参加可能なイベントでオフライン定員満了の場合、オンライン参加を自動選択
      console.log('オフライン定員満了のため、オンライン参加を自動選択');
      setParticipationType('Online');
    } else {
      // それ以外の場合はオフライン参加に設定
      setParticipationType('Offline');
    }

    // 簿記講座の場合は自動的にイベント参加を選択
    if (isBookkeeping) {
      setSelectedTypes(['Event']);
    }
  }, [isOnlineSeminar, isBookkeeping, isTokyoRegularMeeting, eventParticipants, eventCapacity]);

  // 既存の質問回答を読み込み
  useEffect(() => {
    const fetchExistingAnswers = async () => {
      try {
        const answers = await getEventQuestionAnswers(event_id);
        const answerMap: { [key: string]: any } = {};
        answers.forEach(answer => {
          answerMap[answer.question_id] = answer.answer;
        });
        setQuestionAnswers(answerMap);
      } catch (err) {
        console.error('Failed to fetch existing answers:', err);
      }
    };

    fetchExistingAnswers();
  }, [event_id]);

  // 定員数と参加者数を取得
  useEffect(() => {
    const fetchCapacityData = async () => {
      try {
        // イベントの定員数を取得
        const { data: eventData, error: eventError } = await supabase
          .from('mst_event')
          .select('event_capacity, gather_capacity, consultation_capacity')
          .eq('event_id', event_id)
          .single();

        if (eventError) {
          console.error('定員数の取得に失敗:', eventError);
          return;
        }

        setEventCapacity(eventData.event_capacity || 0);
        setGatherCapacity(eventData.gather_capacity || 0);
        setConsultationCapacity(eventData.consultation_capacity || 0);

        // 現在の参加者数を取得（オフライン参加者のみ）
        const [eventCountResult, gatherCountResult, consultationCountResult] = await Promise.all([
          supabase
            .from('trn_event_attendee')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event_id)
            .eq('is_offline', true)
            .is('deleted_at', null),
          supabase
            .from('trn_gather_attendee')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event_id)
            .is('deleted_at', null),
          supabase
            .from('trn_consultation_attendee')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event_id)
            .is('deleted_at', null)
        ]);

        setEventParticipants(eventCountResult.count || 0);
        setGatherParticipants(gatherCountResult.count || 0);
        setConsultationParticipants(consultationCountResult.count || 0);

      } catch (error) {
        console.error('定員数・参加者数の取得に失敗:', error);
      }
    };

    fetchCapacityData();
  }, [event_id, supabase]);

  const handleTypeChange = (type: string) => {
    if (type === "Consultation" && !selectedTypes.includes("Networking")) {
      setIsAlertOpen(true);
      return;
    }

    setSelectedTypes(prev => {
      if (prev.includes(type)) {
        if (type === "Networking") {
          return prev.filter(t => t !== type && t !== "Consultation");
        }
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  const handleParticipationTypeChange = (type: string) => {
    console.log('参加タイプを変更:', type);
    setParticipationType(type);
  };

  const handleQuestionAnswerChange = (questionId: string, answer: any) => {
    setQuestionAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleQuestionModalSubmit = (answers: { [key: string]: any }) => {
    console.log('質問回答を受信:', answers);
    setQuestionAnswers(answers);
    setIsQuestionModalOpen(false);
    // 質問回答後、確認モーダルを開く
    setIsDialogOpen(true);
  };

  const handleQuestionModalClose = () => {
    setIsQuestionModalOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log('=== 申し込み処理開始 ===');
    console.log('selectedTypes:', selectedTypes);
    console.log('participationType:', participationType);
    console.log('isBookkeeping:', isBookkeeping);
    console.log('eventParticipants:', eventParticipants);
    console.log('eventCapacity:', eventCapacity);
    console.log('gatherParticipants:', gatherParticipants);
    console.log('gatherCapacity:', gatherCapacity);
    console.log('consultationParticipants:', consultationParticipants);
    console.log('consultationCapacity:', consultationCapacity);

    // 簿記講座の場合はチェック不要（常にイベント参加が選択されている）
    if (!isBookkeeping && selectedTypes.length === 0) {
      console.log('エラー: イベントタイプが未選択');
      toast({
        title: "エラー",
        description: "イベントタイプを選択してください",
        variant: "destructive",
      });
      return;
    }

    if (selectedTypes.includes("Consultation") && !selectedTypes.includes("Networking")) {
      console.log('アラート: 個別相談のみ選択');
      setIsAlertOpen(true);
      return;
    }

    // 定員数チェック
    if (isBookkeeping || selectedTypes.includes("Event")) {
      // オンライン参加が可能なイベントの場合
      if (isOnlineSeminar || isTokyoRegularMeeting || isBookkeeping) {
        // オフライン参加の場合のみ定員チェック
        if (participationType === "Offline") {
          console.log('定員チェック実行 - オンライン参加可能イベントのオフライン参加');
          if (eventParticipants >= eventCapacity) {
            console.log('定員オーバー:', eventParticipants, '>=', eventCapacity);
            toast({
              title: "申し込み不可",
              description: "オフライン参加の定員に達しています",
              variant: "destructive",
            });
            return;
          }
        } else {
          console.log('定員チェックスキップ - オンライン参加可能イベントのオンライン参加');
        }
      } else {
        // オンライン参加が不可能なイベントの場合は常に定員チェック
        console.log('定員チェック実行 - オンライン参加不可イベント');
        if (eventParticipants >= eventCapacity) {
          console.log('定員オーバー:', eventParticipants, '>=', eventCapacity);
          toast({
            title: "申し込み不可",
            description: "イベントの定員に達しています",
            variant: "destructive",
          });
          return;
        }
      }
    }

    if (selectedTypes.includes("Networking")) {
      console.log('懇親会定員チェック:', gatherParticipants, '>=', gatherCapacity);
      if (gatherParticipants >= gatherCapacity) {
        console.log('懇親会定員オーバー');
        toast({
          title: "申し込み不可",
          description: "懇親会の定員に達しています",
          variant: "destructive",
        });
        return;
      }
    }

    if (selectedTypes.includes("Consultation")) {
      console.log('個別相談定員チェック:', consultationParticipants, '>=', consultationCapacity);
      if (consultationParticipants >= consultationCapacity) {
        console.log('個別相談定員オーバー');
        toast({
          title: "申し込み不可",
          description: "個別相談の定員に達しています",
          variant: "destructive",
        });
        return;
      }
    }

    console.log('すべてのチェック通過 - 質問チェック開始');
    checkQuestionsAndProceed();
  };

  const checkQuestionsAndProceed = async () => {
    try {
      // イベント参加が選択されている場合（または簿記講座の場合）のみ質問をチェック
      const shouldCheckQuestions = isBookkeeping || selectedTypes.includes("Event");

      if (shouldCheckQuestions) {
        // イベントに質問があるかチェック
        const questions = await getEventQuestions(event_id);

        if (questions.length > 0) {
          console.log('質問が存在するため質問モーダルを表示');
          setIsQuestionModalOpen(true);
        } else {
          console.log('質問が存在しないため確認ダイアログを表示');
          setIsDialogOpen(true);
        }
      } else {
        // イベント参加が選択されていない場合は質問をスキップ
        console.log('イベント参加が選択されていないため質問をスキップ');
        setIsDialogOpen(true);
      }
    } catch (error) {
      console.error('質問チェックに失敗:', error);
      // エラーの場合も確認ダイアログを表示
      setIsDialogOpen(true);
    }
  };

  const confirmSubmission = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    // モーダルは閉じない（処理中状態を表示するため）

    console.log('申し込み確認処理開始:', {
      selectedTypes,
      isTokyoRegularMeeting,
      isOnlineSeminar,
      isBookkeeping,
      participationType
    });

    // 申し込み確定前にも定員数の再チェック
    try {
      console.log('最終定員チェック開始');
      const [eventCountResult, gatherCountResult, consultationCountResult] = await Promise.all([
        supabase
          .from('trn_event_attendee')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event_id)
          .eq('is_offline', true)
          .is('deleted_at', null),
        supabase
          .from('trn_gather_attendee')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event_id)
          .is('deleted_at', null),
        supabase
          .from('trn_consultation_attendee')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event_id)
          .is('deleted_at', null)
      ]);

      const currentEventParticipants = eventCountResult.count || 0;
      const currentGatherParticipants = gatherCountResult.count || 0;
      const currentConsultationParticipants = consultationCountResult.count || 0;

      console.log('最終定員チェック結果:', {
        currentEventParticipants,
        eventCapacity,
        currentGatherParticipants,
        gatherCapacity,
        currentConsultationParticipants,
        consultationCapacity
      });

      // 最終定員数チェック
      if (isBookkeeping || selectedTypes.includes("Event")) {
        // オンライン参加が可能なイベントの場合
        if (isOnlineSeminar || isTokyoRegularMeeting || isBookkeeping) {
          // オフライン参加の場合のみ定員チェック
          if (participationType === "Offline") {
            console.log('最終定員チェック実行 - オンライン参加可能イベントのオフライン参加');
            if (currentEventParticipants >= eventCapacity) {
              console.log('最終定員オーバー:', currentEventParticipants, '>=', eventCapacity);
              toast({
                title: "申し込み不可",
                description: "オフライン参加の定員に達しています",
                variant: "destructive",
              });
              setIsSubmitting(false);
              return;
            }
          } else {
            console.log('最終定員チェックスキップ - オンライン参加可能イベントのオンライン参加');
          }
        } else {
          // オンライン参加が不可能なイベントの場合は常に定員チェック
          console.log('最終定員チェック実行 - オンライン参加不可イベント');
          if (currentEventParticipants >= eventCapacity) {
            console.log('最終定員オーバー:', currentEventParticipants, '>=', eventCapacity);
            toast({
              title: "申し込み不可",
              description: "イベントの定員に達しています",
              variant: "destructive",
            });
            setIsSubmitting(false);
            return;
          }
        }
      }

      if (selectedTypes.includes("Networking")) {
        console.log('最終懇親会定員チェック:', currentGatherParticipants, '>=', gatherCapacity);
        if (currentGatherParticipants >= gatherCapacity) {
          console.log('最終懇親会定員オーバー');
          toast({
            title: "申し込み不可",
            description: "懇親会の定員に達しています",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }

      if (selectedTypes.includes("Consultation")) {
        console.log('最終個別相談定員チェック:', currentConsultationParticipants, '>=', consultationCapacity);
        if (currentConsultationParticipants >= consultationCapacity) {
          console.log('最終個別相談定員オーバー');
          toast({
            title: "申し込み不可",
            description: "個別相談の定員に達しています",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }
    } catch (error) {
      console.error('定員数チェック中にエラーが発生:', error);
      toast({
        title: "エラー",
        description: "定員数の確認に失敗しました",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (!isBookkeeping && (selectedTypes.includes("Networking") || selectedTypes.includes("Consultation"))) {
      // Stripe公式の決済ページにリダイレクト
      try {
        console.log('決済処理開始 - 懇親会または個別相談が選択');
        console.log('決済データ:', {
          event_id,
          selectedTypes,
          participationType: isOnlineSeminar ? 'Online' : (isTokyoRegularMeeting || isBookkeeping) ? participationType : 'Offline'
        });
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_id,
            selectedTypes,
            participationType: isTokyoRegularMeeting ? participationType : null,
            questionAnswers,
          }),
        });

        if (!response.ok) {
          throw new Error(`エラー: ${response.status}`);
        }

        const { url } = await response.json();

        // Stripe Checkoutページにリダイレクト
        window.location.href = url;
      } catch (error) {
        console.error('決済ページへのリダイレクトに失敗しました', error);
        toast({
          title: "エラー",
          description: "決済ページへのリダイレクトに失敗しました",
          variant: "destructive",
        });
        setIsSubmitting(false);
      }
      return;
    }

    // イベントのみが選択されている場合、または簿記講座の場合の処理
    if (isBookkeeping || (selectedTypes.includes("Event") && !selectedTypes.includes("Networking") && !selectedTypes.includes("Consultation"))) {
      try {
        console.log('イベントのみが選択されている、または簿記講座のため、直接データベースに保存します');
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          throw new Error('ユーザーが認証されていません');
        }

        // オンラインセミナーの場合は強制的にオンライン参加
        // 定例会かつ東京の場合、または簿記講座の場合は選択に応じてオンライン/オフライン
        // その他のイベントは強制的にオフライン参加
        const is_offline = isOnlineSeminar ? false : ((isTokyoRegularMeeting || isBookkeeping) ? participationType === 'Offline' : true);

        console.log('イベント申し込み情報:', {
          event_id,
          user_id: user.id,
          is_offline,
          participationType,
          isTokyoRegularMeeting,
          isOnlineSeminar,
          isBookkeeping
        });

        const { error } = await supabase
          .from('trn_event_attendee')
          .upsert({
            event_id: event_id,
            user_id: user.id,
            is_offline: is_offline,
            deleted_at: null // 論理削除を解除
          });

        if (error) {
          console.error('データベース更新エラー:', error);
          throw error;
        }

        console.log('イベント申し込みが完了しました');

        // 質問回答を保存
        try {
          const answersToSave = Object.entries(questionAnswers)
            .filter(([_, answer]) => answer !== '' && answer !== null && answer !== undefined)
            .map(([questionId, answer]) => ({ question_id: questionId, answer }));

          if (answersToSave.length > 0) {
            await saveEventQuestionAnswers(event_id, answersToSave);
            console.log('質問回答が保存されました');
          }
        } catch (answerError) {
          console.error('質問回答の保存に失敗しました:', answerError);
          // 質問回答の保存に失敗しても申し込み自体は成功しているので、エラーは表示しない
        }

        // 通知を作成
        try {
          await fetch('/api/notifications/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.id,
              eventId: event_id,
              eventName: event_name,
              notificationType: 'event_application',
            }),
          });
          console.log('イベント申し込み通知が作成されました');
        } catch (notificationError) {
          console.error('通知作成に失敗しました:', notificationError);
          // 通知作成に失敗しても申し込み自体は成功しているので、エラーは表示しない
        }

        toast({
          title: "申し込み完了",
          description: "イベントの申し込みが完了しました",
        });
        onSuccess?.();
        // ページをリロード
        window.location.reload();
      } catch (error) {
        console.error('申し込み処理に失敗しました', error);
        toast({
          title: "エラー",
          description: "申し込み処理に失敗しました",
          variant: "destructive",
        });
        setIsSubmitting(false);
      }
      return;
    }

    setIsSubmitting(false);
  };


  return (
    <div className={css({
      mt: '8',
      rounded: 'xl',
      p: '8',
      bg: 'white',
      mb: '10',
      maxW: 'md',
      mx: 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxShadow: 'sm',
      borderWidth: '1px',
      borderColor: 'gray.200'
    })}>
      <h2 className={css({
        fontSize: 'xl',
        fontWeight: 'bold',
        mb: '4',
        color: 'gray.800',
        textAlign: 'center'
      })}>申し込みフォーム</h2>

      <form onSubmit={handleSubmit} className={css({ width: '100%' })}>
        <div className={css({ mb: '5' })}>
          <p className={css({
            mb: '4',
            color: 'gray.600',
            fontSize: 'sm',
            textAlign: 'center'
          })}>
            {isBookkeeping
              ? '参加方法を選択して、申し込みボタンをクリックしてください。'
              : '申し込み内容にチェックを入れ、申し込みボタンをクリックしてください。'}
          </p>

          {/* 簿記講座の場合、定員情報を表示 */}
          {isBookkeeping && (
            <div className={css({
              mb: '4',
              borderRadius: 'md',
              borderWidth: '1px',
              borderColor: 'green.300',
              p: '4',
              bg: 'green.50'
            })}>
              <div className={css({
                textAlign: 'center',
                fontSize: 'md',
                fontWeight: 'medium',
                color: 'green.700',
                mb: '2'
              })}>
                簿記講座参加
              </div>
              <div className={css({
                textAlign: 'center',
                fontSize: 'xs',
                color: 'gray.600'
              })}>
                {eventParticipants >= eventCapacity ? (
                  <div>
                    <div>オフライン定員: {eventParticipants}/{eventCapacity}名</div>
                    <div className={css({ color: 'green.600', fontWeight: 'medium', mt: '1' })}>
                      オンライン参加可能
                    </div>
                  </div>
                ) : (
                  `${eventParticipants}/${eventCapacity}名`
                )}
              </div>
            </div>
          )}

          {/* 簿記講座でない場合のみイベント参加チェックボックスを表示 */}
          {!isBookkeeping && (
            <EventTypeCheckbox
              event_type={event_type}
              checked={selectedTypes.includes("Event")}
              onChange={() => handleTypeChange("Event")}
              disabled={(() => {
                const shouldDisable = (isOnlineSeminar || isTokyoRegularMeeting) ? false : (eventParticipants >= eventCapacity);
                console.log('EventTypeCheckbox disabled判定:', {
                  isOnlineSeminar,
                  isTokyoRegularMeeting,
                  eventParticipants,
                  eventCapacity,
                  shouldDisable
                });
                return shouldDisable;
              })()}
              participantCount={
                // オンラインセミナーの場合は定員表示なし
                isOnlineSeminar ? undefined : eventParticipants
              }
              capacity={
                // オンラインセミナーの場合は定員表示なし
                isOnlineSeminar ? undefined : eventCapacity
              }
            />
          )}

          {/* 参加方法選択セクション */}
          {((isBookkeeping) || (!isBookkeeping && selectedTypes.includes("Event") && (isTokyoRegularMeeting || isOnlineSeminar))) && (
            <div className={css({
              mb: '4',
              borderRadius: 'md',
              borderWidth: '1px',
              borderColor: 'gray.200',
              p: '4'
            })}>
              {eventParticipants >= eventCapacity && (isTokyoRegularMeeting || isBookkeeping) ? (
                <p className={css({
                  fontSize: 'sm',
                  fontWeight: 'bold',
                  mb: '2'
                })}>オフライン参加の定員に達しました</p>
              ) : (
                <p className={css({
                  fontSize: 'sm',
                  fontWeight: 'medium',
                  mb: '2',
                  color: 'gray.700'
                })}>参加方法を選択してください</p>
              )}

              <div className={css({
                display: 'flex',
                flexDirection: 'column',
                gap: '2'
              })}>
                {/* オンラインセミナーの場合はオフラインを選択不可に */}
                {!isOnlineSeminar && (
                  <label className={css({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2',
                    cursor: eventParticipants >= eventCapacity ? 'not-allowed' : 'pointer',
                    opacity: eventParticipants >= eventCapacity ? 0.6 : 1
                  })}>
                    <input
                      type="radio"
                      name="participationType"
                      value="Offline"
                      checked={participationType === "Offline"}
                      onChange={() => handleParticipationTypeChange("Offline")}
                      className={css({
                        cursor: eventParticipants >= eventCapacity ? 'not-allowed' : 'pointer'
                      })}
                      disabled={isOnlineSeminar || eventParticipants >= eventCapacity}
                    />
                    <span className={css({ fontSize: 'sm' })}>
                      オフライン参加
                      {eventParticipants >= eventCapacity && (
                        <span className={css({
                          fontSize: 'xs',
                          color: 'red.600',
                          ml: '2',
                          fontWeight: 'medium'
                        })}>（定員満了）</span>
                      )}
                    </span>
                  </label>
                )}

                <label className={css({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2',
                  cursor: 'pointer'
                })}>
                  <input
                    type="radio"
                    name="participationType"
                    value="Online"
                    checked={participationType === "Online"}
                    onChange={() => handleParticipationTypeChange("Online")}
                    className={css({
                      cursor: 'pointer'
                    })}
                  />
                  <span className={css({ fontSize: 'sm' })}>
                    オンライン参加
                    {eventParticipants >= eventCapacity && (isTokyoRegularMeeting || isBookkeeping) && (
                      <span className={css({
                        fontSize: 'xs',
                        color: 'green.700',
                        ml: '2',
                        fontWeight: 'medium'
                      })}>（申し込み可能）</span>
                    )}
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* 簿記講座でない場合のみ懇親会と個別相談チェックボックスを表示 */}
          {!isBookkeeping && (
            <>
              <EventTypeCheckbox
                event_type="Networking"
                checked={selectedTypes.includes("Networking")}
                onChange={() => handleTypeChange("Networking")}
                disabled={!has_gather || (gatherCapacity > 0 && gatherParticipants >= gatherCapacity)}
                participantCount={gatherParticipants}
                capacity={gatherCapacity}
                isRegularMeeting={isRegularMeeting}
              />

              <EventTypeCheckbox
                event_type="Consultation"
                checked={selectedTypes.includes("Consultation")}
                onChange={() => handleTypeChange("Consultation")}
                disabled={!has_consultation || !has_gather || (consultationCapacity > 0 && consultationParticipants >= consultationCapacity)}
                participantCount={consultationParticipants}
                capacity={consultationCapacity}
              />
            </>
          )}

          <div className={css({
            display: 'flex',
            justifyContent: 'center',
            mt: '5'
          })}>
            <Button
              type="submit"
              disabled={isBookkeeping && participationType === 'Offline' && eventParticipants >= eventCapacity}
              className={css({
                w: '100%',
                py: '3',
                bg: isBookkeeping && participationType === 'Offline' && eventParticipants >= eventCapacity ? 'gray.400' : 'blue.500',
                color: 'white',
                rounded: 'full',
                fontSize: 'md',
                fontWeight: 'semibold',
                _hover: {
                  bg: isBookkeeping && participationType === 'Offline' && eventParticipants >= eventCapacity ? 'gray.400' : 'blue.600'
                },
                cursor: isBookkeeping && participationType === 'Offline' && eventParticipants >= eventCapacity ? 'not-allowed' : 'pointer',
                opacity: isBookkeeping && participationType === 'Offline' && eventParticipants >= eventCapacity ? 0.5 : 1,
              })}
            >
              {isBookkeeping && participationType === 'Offline' && eventParticipants >= eventCapacity ? 'オフライン定員に達しました' : '申し込む'}
            </Button>
          </div>
        </div>
      </form>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          // 送信中は勝手に閉じないようにする
          if (!isSubmitting) {
            setIsDialogOpen(open);
          }
        }}
        onOutSideClick={() => {
          // 送信中は外側クリックで閉じないようにする
          if (!isSubmitting) {
            setIsDialogOpen(false);
          }
        }}
      >
        <DialogContent
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          className={css({
          maxWidth: { base: '90%', md: 'md' },
          width: { base: '100%', md: 'auto' },
          padding: { base: '4', md: '6' },
          borderRadius: 'xl',
          '@media (max-width: 640px)': {
            borderRadius: 'xl'
          }
        })}>
          <DialogHeader>
            <DialogTitle className={css({
              textAlign: 'center',
              fontSize: { base: 'lg', md: 'xl' },
              mb: { base: '3', md: '4' }
            })}>申し込み内容が正しければ確定ボタンを押してください。</DialogTitle>
          </DialogHeader>

          <div className={css({
            display: 'flex',
            flexDirection: 'column',
            gap: { base: '3', md: '4' },
            mb: { base: '4', md: '6' }
          })}>
            {/* 簿記講座の場合は「イベント名」と「参加方法」のみ表示 */}
            {isBookkeeping ? (
              <>
                <div className={css({
                  textAlign: 'center',
                  fontSize: { base: 'md', md: 'lg' }
                })}>
                  簿記講座: 参加
                </div>
                <div className={css({
                  textAlign: 'center',
                  fontSize: { base: 'md', md: 'lg' }
                })}>
                  参加方法：{participationType === 'Online' ? 'オンライン' : 'オフライン'}
                </div>
              </>
            ) : (
              <>
                {selectedTypes.includes('Event') && (
                  <div className={css({
                    textAlign: 'center',
                    fontSize: { base: 'md', md: 'lg' }
                  })}>
                    イベント：参加
                  </div>
                )}

                {/* 定例会かつ東京の場合、参加方法も表示 */}
                {isTokyoRegularMeeting && selectedTypes.includes('Event') && (
                  <div className={css({
                    textAlign: 'center',
                    fontSize: { base: 'md', md: 'lg' }
                  })}>
                    参加方法：{participationType === 'Online' ? 'オンライン' : 'オフライン'}
                  </div>
                )}

                {selectedTypes.includes('Networking') && (
                  <div className={css({
                    textAlign: 'center',
                    fontSize: { base: 'md', md: 'lg' }
                  })}>
                    懇親会参加：参加
                  </div>
                )}
                {selectedTypes.includes('Consultation') && (
                  <div className={css({
                    textAlign: 'center',
                    fontSize: { base: 'md', md: 'lg' }
                  })}>
                    個別相談会：参加
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter className={css({
            display: 'flex',
            justifyContent: 'center',
            gap: { base: '3', md: '4' },
            width: '100%'
          })}>
            <div className={css({
              display: 'flex',
              flexDirection: { base: 'column', md: 'row' },
              justifyContent: 'center',
              gap: { base: '3', md: '4' },
              width: '100%'
            })}>
              <Button
                onClick={confirmSubmission}
                disabled={isSubmitting}
                className={css({
                  bg: isSubmitting ? 'gray.400' : 'blue.500',
                  color: 'white',
                  px: { base: '6', md: '8' },
                  py: { base: '2', md: '2' },
                  rounded: 'full',
                  _hover: { bg: isSubmitting ? 'gray.400' : 'blue.600' },
                  minWidth: { base: '100%', md: '120px' },
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                })}
              >
                {isSubmitting ? '処理中...' : '確定'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
                className={css({
                  px: { base: '6', md: '8' },
                  py: { base: '2', md: '2' },
                  rounded: 'full',
                  borderColor: 'gray.300',
                  borderWidth: '1px',
                  minWidth: { base: '100%', md: '120px' },
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.5 : 1,
                })}
              >
                前ページへ戻る
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className={css({
          borderRadius: 'xl'
        })}>
          <AlertDialogHeader>
            <AlertDialogTitle>注意</AlertDialogTitle>
            <AlertDialogDescription>
        懇親会を申し込まないと個別相談は申し込めません。先に懇親会を申し込んでください。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsAlertOpen(false)}>閉じる</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 質問モーダル */}
      <EventQuestionModal
        isOpen={isQuestionModalOpen}
        onClose={handleQuestionModalClose}
        onSubmit={handleQuestionModalSubmit}
        eventId={event_id}
        initialAnswers={questionAnswers}
      />
    </div>
  );
};

export default EventApplicationForm;