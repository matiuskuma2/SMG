import { Button } from '@/components/ui/button';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { createClient } from '@/lib/supabase';
import { css } from '@/styled-system/css';
import type { ApplicationStatusProps } from '@/types/event';
import React, { useEffect, useState } from 'react';
import AdditionalApplicationForm from './AdditionalApplicationForm';
import { EventQuestionModal } from './EventQuestionModal';
import { getEventQuestions, saveEventQuestionAnswers } from '@/lib/api/event';

const ApplicationStatus: React.FC<ApplicationStatusProps> = ({ event_id, event_type: propEventType, onReturn }) => {
  const [selectedOptions, setSelectedOptions] = useState({
    Event: false,
    Networking: false,
    Consultation: false
  });

  const [applicationStatus, setApplicationStatus] = useState<{
    Event?: boolean;
    Networking?: boolean;
    Consultation?: boolean;
  }>({});

  const [participationType, setParticipationType] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventType, setEventType] = useState<string>('');
  const [eventLocation, setEventLocation] = useState<string>('');
  const [eventCity, setEventCity] = useState<string>('');
  const [hasGather, setHasGather] = useState<boolean>(false);
  const [hasConsultation, setHasConsultation] = useState<boolean>(false);
  const [showAdditionalForm, setShowAdditionalForm] = useState(false);
  const [additionalOptions, setAdditionalOptions] = useState({
    Event: false,
    Networking: false,
    Consultation: false
  });
  const [additionalParticipationType, setAdditionalParticipationType] = useState<string>('Offline');
  const [eventCapacity, setEventCapacity] = useState<number>(0);
  const [gatherCapacity, setGatherCapacity] = useState<number>(0);
  const [consultationCapacity, setConsultationCapacity] = useState<number>(0);
  const [eventParticipants, setEventParticipants] = useState<number>(0);
  const [gatherParticipants, setGatherParticipants] = useState<number>(0);
  const [consultationParticipants, setConsultationParticipants] = useState<number>(0);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [questionAnswers, setQuestionAnswers] = useState<{ [key: string]: any }>({});
  const [eventName, setEventName] = useState<string>('');

  const supabase = createClient();

  const getEventLabel = () => {
    if (isBookkeeping) return '簿記講座';
    return propEventType || 'イベント';
  };

  useEffect(() => {
    const fetchApplicationStatus = async () => {
      console.log('申し込み状況の取得を開始:', { event_id });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('ユーザーが見つかりません');
        return;
      }
      console.log('ユーザーID:', user.id);

      // イベント情報の取得（イベントタイプと開催場所を取得するため）
      const { data: eventData, error: eventTypeError } = await supabase
        .from('mst_event')
        .select('*, event_type:mst_event_type(event_type_name), event_location, event_city, has_gather, has_consultation, event_capacity, gather_capacity, consultation_capacity')
        .eq('event_id', event_id)
        .single();

      if (eventData && eventData.event_type) {
        setEventType(eventData.event_type.event_type_name);
        setEventLocation(eventData.event_location);
        setEventCity(eventData.event_city || '');
        setHasGather(eventData.has_gather || false);
        setHasConsultation(eventData.has_consultation || false);
        setEventCapacity(eventData.event_capacity || 0);
        setGatherCapacity(eventData.gather_capacity || 0);
        setConsultationCapacity(eventData.consultation_capacity || 0);
        setEventName(eventData.event_name || '');
      }

      // 現在の参加者数を取得
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

      // イベント参加状況の取得（is_offlineフィールドも取得）
      const { data: eventAttendance, error: eventError } = await supabase
        .from('trn_event_attendee')
        .select('*, is_offline')
        .eq('event_id', event_id)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .maybeSingle();


      // 懇親会参加状況の取得
      const { data: gatherAttendance, error: gatherError } = await supabase
        .from('trn_gather_attendee')
        .select('*')
        .eq('event_id', event_id)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .maybeSingle();


      // 個別相談会参加状況の取得
      const { data: consultationAttendance, error: consultationError } = await supabase
        .from('trn_consultation_attendee')
        .select('*')
        .eq('event_id', event_id)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .maybeSingle();


      const status: {
        Event?: boolean;
        Networking?: boolean;
        Consultation?: boolean;
      } = {};

      if (eventAttendance) {
        status.Event = true;
        // 参加タイプを設定（is_offlineフィールドから）
        setParticipationType(eventAttendance.is_offline ? 'オフライン' : 'オンライン');
      }
      if (gatherAttendance) status.Networking = true;
      if (consultationAttendance) status.Consultation = true;

      setApplicationStatus(status);
    };

    fetchApplicationStatus();
  }, [event_id]);

  const handleCheckboxChange = (option: keyof typeof selectedOptions) => {
    setSelectedOptions(prev => {
      const newOptions = {
        ...prev,
        [option]: !prev[option]
      };

      // 懇親会が選択されている場合、個別相談会も必ず選択状態にする
      if (newOptions.Networking) {
        newOptions.Consultation = true;
      }

      return newOptions;
    });
  };

  const handleCancelClick = () => {
    const selectedItems = Object.entries(selectedOptions)
      .filter(([_, isSelected]) => isSelected)
      .map(([key]) => key);

    console.log('キャンセル対象の項目:', selectedItems);

    if (selectedItems.length === 0) {
      alert('キャンセルする項目を選択してください');
      return;
    }

    setIsModalOpen(true);
  };

  const handleCancelConfirm = async () => {
    try {
      console.log('キャンセル処理を開始');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('ユーザーが見つかりません');
        return;
      }

      const selectedItems = Object.entries(selectedOptions)
        .filter(([_, isSelected]) => isSelected)
        .map(([key]) => key);

      console.log('キャンセル対象の項目:', selectedItems);

      // 選択された項目に応じてキャンセル処理を実行
      for (const item of selectedItems) {
        console.log(`${item}のキャンセル処理を実行`);
        switch (item) {
          case 'Event':
            const { error: eventError } = await supabase
              .from('trn_event_attendee')
              .update({ deleted_at: new Date().toISOString() })
              .eq('event_id', event_id)
              .eq('user_id', user.id)
              .is('deleted_at', null);
            console.log('イベントキャンセル結果:', { eventError });
            break;
          case 'Networking':
            const { error: gatherError } = await supabase
              .from('trn_gather_attendee')
              .update({ deleted_at: new Date().toISOString() })
              .eq('event_id', event_id)
              .eq('user_id', user.id)
              .is('deleted_at', null);
            console.log('懇親会キャンセル結果:', { gatherError });
            break;
          case 'Consultation':
            const { error: consultationError } = await supabase
              .from('trn_consultation_attendee')
              .update({ deleted_at: new Date().toISOString() })
              .eq('event_id', event_id)
              .eq('user_id', user.id)
              .is('deleted_at', null);
            console.log('個別相談会キャンセル結果:', { consultationError });
            break;
        }
      }

      console.log('キャンセル処理が完了しました');
      setSelectedOptions({
        Event: false,
        Networking: false,
        Consultation: false
      });
      setIsModalOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('キャンセル処理中にエラーが発生:', error);
      alert('キャンセル中にエラーが発生しました');
    }
  };

  // 簿記講座かどうかを判定
  const isBookkeeping = eventType === '簿記講座';

  // 東京開催の定例会かどうかを判定
  const isTokyoRegularMeeting = eventType === '定例会' && eventCity?.includes('東京');

  // 参加方法を表示するかどうかの判定
  const showParticipationType = isBookkeeping || isTokyoRegularMeeting;

  // 追加申し込み可能かどうかの判定
  const canAddEvent = !applicationStatus.Event;
  const canAddNetworking = hasGather && !applicationStatus.Networking;
  const canAddConsultation = hasConsultation && !applicationStatus.Consultation;
  // 何か申し込んでいて、追加できるものがある場合にボタンを表示
  const hasAnyApplication = applicationStatus.Event || applicationStatus.Networking || applicationStatus.Consultation;
  const showAdditionalButton = !isBookkeeping && hasAnyApplication && (canAddEvent || canAddNetworking || canAddConsultation);

  // 追加申し込み処理 - 質問チェック
  const handleAdditionalApplication = async () => {
    if (!additionalOptions.Event && !additionalOptions.Networking && !additionalOptions.Consultation) {
      alert('追加申し込みする項目を選択してください');
      return;
    }

    // イベントが選択されている場合は質問をチェック
    if (additionalOptions.Event) {
      try {
        const questions = await getEventQuestions(event_id);
        if (questions.length > 0) {
          console.log('質問が存在するため質問モーダルを表示');
          setIsQuestionModalOpen(true);
          return;
        }
      } catch (error) {
        console.error('質問チェックに失敗:', error);
      }
    }

    // 質問がない場合は直接申し込み処理を実行
    await processAdditionalApplication(questionAnswers);
  };

  // 質問モーダルから回答を受け取って申し込み処理を実行
  const handleQuestionModalSubmit = async (answers: { [key: string]: any }) => {
    setQuestionAnswers(answers);
    setIsQuestionModalOpen(false);
    await processAdditionalApplication(answers);
  };

  // 追加申し込みの実際の処理
  const processAdditionalApplication = async (answers: { [key: string]: any }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('ユーザーが認証されていません');
        return;
      }

      // 懇親会が含まれる場合はStripe決済へ
      if (additionalOptions.Networking) {
        const selectedTypes = [];
        if (additionalOptions.Event) selectedTypes.push('Event');
        selectedTypes.push('Networking');
        if (additionalOptions.Consultation) selectedTypes.push('Consultation');

        console.log('追加申し込み決済処理開始:', { event_id, selectedTypes });
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_id,
            selectedTypes,
            participationType: (isBookkeeping || isTokyoRegularMeeting) ? additionalParticipationType : null,
            questionAnswers: answers,
          }),
        });

        if (!response.ok) {
          console.error('決済セッション作成エラー:', response);
          alert('決済処理の開始に失敗しました');
          return;
        }

        const data = await response.json();
        console.log('決済セッション作成成功:', data);

        if (data.url) {
          window.location.href = data.url;
        }
        return;
      }

      // イベントが含まれる場合は直接データベースに保存
      if (additionalOptions.Event) {
        console.log('イベント追加申し込み - データベースに直接保存');

        // オンラインセミナーの場合は強制的にオンライン参加
        // 定例会かつ東京の場合、または簿記講座の場合は選択に応じてオンライン/オフライン
        // その他のイベントは強制的にオフライン参加
        const isOnlineSeminar = eventType === 'オンラインセミナー';
        const is_offline = isOnlineSeminar ? false : ((isTokyoRegularMeeting || isBookkeeping) ? additionalParticipationType === 'Offline' : true);

        console.log('イベント追加申し込み情報:', {
          event_id,
          user_id: user.id,
          is_offline,
          additionalParticipationType,
          isTokyoRegularMeeting,
          isBookkeeping
        });

        const { error } = await supabase
          .from('trn_event_attendee')
          .upsert({
            event_id: event_id,
            user_id: user.id,
            is_offline: is_offline,
            deleted_at: null
          });

        if (error) {
          console.error('データベース更新エラー:', error);
          alert('イベント申し込みに失敗しました');
          return;
        }

        console.log('イベント追加申し込みが完了しました');

        // 質問回答を保存
        try {
          const answersToSave = Object.entries(answers)
            .filter(([_, answer]) => answer !== '' && answer !== null && answer !== undefined)
            .map(([questionId, answer]) => ({ question_id: questionId, answer }));

          if (answersToSave.length > 0) {
            await saveEventQuestionAnswers(event_id, answersToSave);
            console.log('質問回答が保存されました');
          }
        } catch (answerError) {
          console.error('質問回答の保存に失敗しました:', answerError);
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
              eventName: eventName,
              notificationType: 'event_application',
            }),
          });
        } catch (notificationError) {
          console.error('通知作成に失敗しました:', notificationError);
        }

        // 個別相談も含まれる場合は個別相談申し込みページにリダイレクト
        if (additionalOptions.Consultation) {
          window.location.href = `/off-line-consulations/${event_id}`;
          return;
        }

        alert('イベントの追加申し込みが完了しました');
        window.location.reload();
        return;
      }

      // 個別相談のみの場合は個別相談申し込みページにリダイレクト
      if (additionalOptions.Consultation) {
        window.location.href = `/off-line-consulations/${event_id}`;
        return;
      }
    } catch (error) {
      console.error('追加申し込み中にエラーが発生:', error);
      alert('追加申し込み中にエラーが発生しました');
    }
  };

  return (
    <>
      <div className={css({
        marginTop: '2rem',
        padding: '1.5rem',
        border: '1px solid',
        borderColor: 'gray.200',
        borderRadius: '1rem',
        backgroundColor: 'white',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      })}>
        <h3 className={css({
          fontSize: '1.25rem',
          fontWeight: 'bold',
          marginBottom: '1.5rem',
          color: 'gray.800',
          borderBottom: '2px solid',
          borderColor: 'blue.500',
          paddingBottom: '0.5rem'
        })}>申し込み状況</h3>

        <div className={css({
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          marginBottom: '2rem',
          textAlign: 'left',
          maxWidth: '400px',
          margin: '0 auto 2rem'
        })}>
          {applicationStatus.Event && (
            <div className={css({
              padding: '1rem',
              backgroundColor: 'blue.50',
              borderRadius: '0.75rem',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }
            })}>
              <label className={css({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer'
              })}>
                <input
                  type="checkbox"
                  checked={selectedOptions.Event}
                  onChange={() => handleCheckboxChange('Event')}
                  className={css({
                    width: '1.5rem',
                    height: '1.5rem',
                    borderRadius: '50%',
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    borderColor: 'blue.200',
                    appearance: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:checked': {
                      backgroundColor: 'blue.600',
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'white\'%3E%3Cpath d=\'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z\'/%3E%3C/svg%3E")',
                      backgroundSize: '70%',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    },
                    '&:hover': {
                      borderColor: 'blue.500',
                      boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)'
                    }
                  })}
                />
                <div className={css({
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                })}>
                  <p className={css({
                    fontWeight: 'bold',
                    fontSize: '1.125rem',
                    color: 'gray.800'
                  })}>{getEventLabel()}</p>
                  {showParticipationType && participationType && (
                    <div className={css({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    })}>
                      <span className={css({
                        fontSize: '0.875rem',
                        color: 'gray.600',
                        fontWeight: 'medium'
                      })}>
                        参加方法:
                      </span>
                      <span className={css({
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.375rem',
                        backgroundColor: participationType === 'オンライン' ? 'blue.100' : 'green.100',
                        color: participationType === 'オンライン' ? 'blue.700' : 'green.700',
                        border: '1px solid',
                        borderColor: participationType === 'オンライン' ? 'blue.300' : 'green.300'
                      })}>
                        {participationType}
                      </span>
                    </div>
                  )}
                </div>
              </label>
            </div>
          )}
          {applicationStatus.Networking && (
            <div className={css({
              padding: '1rem',
              backgroundColor: 'blue.50',
              borderRadius: '0.75rem',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }
            })}>
              <label className={css({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer'
              })}>
                <input
                  type="checkbox"
                  checked={selectedOptions.Networking}
                  onChange={() => handleCheckboxChange('Networking')}
                  className={css({
                    width: '1.5rem',
                    height: '1.5rem',
                    borderRadius: '50%',
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    borderColor: 'blue.200',
                    appearance: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:checked': {
                      backgroundColor: 'blue.600',
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'white\'%3E%3Cpath d=\'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z\'/%3E%3C/svg%3E")',
                      backgroundSize: '70%',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    },
                    '&:hover': {
                      borderColor: 'blue.500',
                      boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)'
                    }
                  })}
                />
                <p className={css({
                  fontWeight: 'bold',
                  fontSize: '1.125rem',
                  color: 'gray.800'
                })}>懇親会</p>
              </label>
            </div>
          )}
          {applicationStatus.Consultation && (
            <div className={css({
              padding: '1rem',
              backgroundColor: 'blue.50',
              borderRadius: '0.75rem',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }
            })}>
              <label className={css({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer'
              })}>
                <input
                  type="checkbox"
                  checked={selectedOptions.Consultation}
                  onChange={() => handleCheckboxChange('Consultation')}
                  className={css({
                    width: '1.5rem',
                    height: '1.5rem',
                    borderRadius: '50%',
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    borderColor: 'blue.200',
                    appearance: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:checked': {
                      backgroundColor: 'blue.600',
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'white\'%3E%3Cpath d=\'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z\'/%3E%3C/svg%3E")',
                      backgroundSize: '70%',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    },
                    '&:hover': {
                      borderColor: 'blue.500',
                      boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)'
                    }
                  })}
                />
                <p className={css({
                  fontWeight: 'bold',
                  fontSize: '1.125rem',
                  color: 'gray.800'
                })}>個別相談会</p>
              </label>
            </div>
          )}
        </div>

        {Object.keys(applicationStatus).length > 0 && (
          <div className={css({
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            marginTop: '1.5rem',
            flexWrap: 'wrap'
          })}>
            {showAdditionalButton && !showAdditionalForm && (
              <Button
                onClick={() => setShowAdditionalForm(true)}
                className={css({
                  cursor: 'pointer',
                  backgroundColor: 'blue.500',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: 'blue.600',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  },
                  '&:active': {
                    transform: 'translateY(0)'
                  }
                })}
              >
                追加申し込み
              </Button>
            )}
            <Button
              onClick={handleCancelClick}
              className={css({
                cursor: 'pointer',
                backgroundColor: 'red.500',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                fontWeight: 'bold',
                fontSize: '1rem',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: 'red.600',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                },
                '&:active': {
                  transform: 'translateY(0)'
                }
              })}
            >
              選択した項目をキャンセル
            </Button>
          </div>
        )}
      </div>

      {/* 追加申し込みフォーム */}
      {showAdditionalForm && (
        <AdditionalApplicationForm
          canAddEvent={canAddEvent}
          canAddNetworking={canAddNetworking}
          canAddConsultation={canAddConsultation}
          isBookkeeping={isBookkeeping}
          isTokyoRegularMeeting={isTokyoRegularMeeting}
          event_type={propEventType}
          additionalOptions={additionalOptions}
          additionalParticipationType={additionalParticipationType}
          eventParticipants={eventParticipants}
          eventCapacity={eventCapacity}
          gatherParticipants={gatherParticipants}
          gatherCapacity={gatherCapacity}
          consultationParticipants={consultationParticipants}
          consultationCapacity={consultationCapacity}
          hasGatheringApplied={!!applicationStatus.Networking}
          onOptionsChange={setAdditionalOptions}
          onParticipationTypeChange={setAdditionalParticipationType}
          onSubmit={handleAdditionalApplication}
          onCancel={() => {
            setShowAdditionalForm(false);
            setAdditionalOptions({ Event: false, Networking: false, Consultation: false });
            setAdditionalParticipationType('Offline');
          }}
        />
      )}


      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleCancelConfirm}
        title="キャンセルの確認"
        message="選択した項目をキャンセルしてもよろしいですか？この操作は取り消すことができません。"
      />

      {/* 質問モーダル */}
      <EventQuestionModal
        isOpen={isQuestionModalOpen}
        onClose={() => setIsQuestionModalOpen(false)}
        onSubmit={handleQuestionModalSubmit}
        eventId={event_id}
        initialAnswers={questionAnswers}
      />
    </>
  );
};

export default ApplicationStatus;