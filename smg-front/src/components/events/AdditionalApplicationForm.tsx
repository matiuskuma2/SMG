import { Button } from '@/components/ui/button';
import { css } from '@/styled-system/css';
import React from 'react';

interface AdditionalApplicationFormProps {
  canAddEvent: boolean;
  canAddNetworking: boolean;
  canAddConsultation: boolean;
  isBookkeeping: boolean;
  isTokyoRegularMeeting: boolean;
  event_type?: string;
  additionalOptions: {
    Event: boolean;
    Networking: boolean;
    Consultation: boolean;
  };
  additionalParticipationType: string;
  eventParticipants: number;
  eventCapacity: number;
  gatherParticipants: number;
  gatherCapacity: number;
  consultationParticipants: number;
  consultationCapacity: number;
  hasGatheringApplied: boolean;
  onOptionsChange: (options: { Event: boolean; Networking: boolean; Consultation: boolean }) => void;
  onParticipationTypeChange: (type: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const AdditionalApplicationForm: React.FC<AdditionalApplicationFormProps> = ({
  canAddEvent,
  canAddNetworking,
  canAddConsultation,
  isBookkeeping,
  isTokyoRegularMeeting,
  event_type,
  additionalOptions,
  additionalParticipationType,
  eventParticipants,
  eventCapacity,
  gatherParticipants,
  gatherCapacity,
  consultationParticipants,
  consultationCapacity,
  hasGatheringApplied,
  onOptionsChange,
  onParticipationTypeChange,
  onSubmit,
  onCancel
}) => {

  const getEventLabel = () => {
    if (isBookkeeping) return '簿記講座';
    return event_type || 'イベント';
  };

  // 定員チェック
  const isEventFull = eventParticipants >= eventCapacity;
  const isGatherFull = gatherParticipants >= gatherCapacity;
  const isConsultationFull = consultationParticipants >= consultationCapacity;

  // イベントのdisabled判定
  // オンライン参加可能なイベント（簿記講座または東京定例会）の場合：イベントチェックボックスは常にクリック可能
  // オンライン参加不可能なイベントの場合：定員に達したらクリック不可
  const isEventDisabled = !canAddEvent || (!(isBookkeeping || isTokyoRegularMeeting) && isEventFull);

  // オフライン参加のラジオボタンのdisabled判定
  const isOfflineDisabled = isEventFull;

  // 個別相談のdisabled判定：定員チェック + 懇親会が選択されていない かつ 既に懇親会に申し込んでいない場合は無効
  const isConsultationDisabled = isConsultationFull || (!additionalOptions.Networking && !hasGatheringApplied);

  return (
    <div className={css({
      marginTop: '2rem',
      padding: '1.5rem',
      border: '1px solid',
      borderColor: 'blue.200',
      borderRadius: '1rem',
      backgroundColor: 'blue.50',
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
      })}>追加申し込み</h3>

      <div className={css({
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        marginBottom: '2rem',
        textAlign: 'left',
        maxWidth: '400px',
        margin: '0 auto 2rem'
      })}>
        {canAddEvent && (
          <>
            <div className={css({
              padding: '1rem',
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              border: '2px solid',
              borderColor: isEventDisabled ? 'gray.300' : 'blue.200',
              transition: 'all 0.2s ease-in-out',
              opacity: isEventDisabled ? 0.6 : 1,
              '&:hover': {
                transform: isEventDisabled ? 'none' : 'translateY(-2px)',
                boxShadow: isEventDisabled ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }
            })}>
              <label className={css({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: isEventDisabled ? 'not-allowed' : 'pointer'
              })}>
                <input
                  type="checkbox"
                  checked={additionalOptions.Event}
                  disabled={isEventDisabled}
                  onChange={() => !isEventDisabled && onOptionsChange({
                    ...additionalOptions,
                    Event: !additionalOptions.Event
                  })}
                  className={css({
                    width: '1.5rem',
                    height: '1.5rem',
                    borderRadius: '50%',
                    border: '2px solid blue.600',
                    appearance: 'none',
                    cursor: isEventDisabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:checked': {
                      backgroundColor: 'blue.600',
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'white\'%3E%3Cpath d=\'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z\'/%3E%3C/svg%3E")',
                      backgroundSize: '70%',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    },
                    '&:hover': {
                      borderColor: isEventDisabled ? 'blue.600' : 'blue.700',
                      boxShadow: isEventDisabled ? 'none' : '0 0 0 2px rgba(59, 130, 246, 0.2)'
                    },
                    '&:disabled': {
                      opacity: 0.5,
                      cursor: 'not-allowed'
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
                  <span className={css({
                    fontSize: '0.875rem',
                    color: 'gray.600'
                  })}>
                    {eventParticipants}/{eventCapacity}名
                    {isEventFull && (isBookkeeping || isTokyoRegularMeeting) && (
                      <span className={css({
                        color: 'gray.500',
                        fontWeight: 'medium',
                        marginLeft: '0.5rem'
                      })}>オフライン定員に達しました</span>
                    )}
                  </span>
                </div>
              </label>
            </div>

            {/* 簿記講座または東京開催の定例会の場合、参加方法を選択 */}
            {additionalOptions.Event && (isBookkeeping || isTokyoRegularMeeting) && (
              <div className={css({
                padding: '1rem',
                backgroundColor: 'white',
                borderRadius: '0.75rem',
                border: '2px solid',
                borderColor: 'blue.200',
                marginTop: '0.5rem'
              })}>
                <p className={css({
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  marginBottom: '0.75rem',
                  color: 'gray.800'
                })}>参加方法を選択してください</p>
                <div className={css({
                  display: 'flex',
                  gap: '1rem'
                })}>
                  <label className={css({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: isOfflineDisabled ? 'not-allowed' : 'pointer',
                    opacity: isOfflineDisabled ? 0.5 : 1
                  })}>
                    <input
                      type="radio"
                      name="additionalParticipationType"
                      value="Offline"
                      checked={additionalParticipationType === 'Offline'}
                      disabled={isOfflineDisabled}
                      onChange={(e) => onParticipationTypeChange(e.target.value)}
                      className={css({
                        width: '1.25rem',
                        height: '1.25rem',
                        cursor: isOfflineDisabled ? 'not-allowed' : 'pointer'
                      })}
                    />
                    <span className={css({
                      fontSize: '0.875rem',
                      color: 'gray.700'
                    })}>オフライン</span>
                  </label>
                  <label className={css({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer'
                  })}>
                    <input
                      type="radio"
                      name="additionalParticipationType"
                      value="Online"
                      checked={additionalParticipationType === 'Online'}
                      onChange={(e) => onParticipationTypeChange(e.target.value)}
                      className={css({
                        width: '1.25rem',
                        height: '1.25rem',
                        cursor: 'pointer'
                      })}
                    />
                    <span className={css({
                      fontSize: '0.875rem',
                      color: 'gray.700'
                    })}>オンライン</span>
                  </label>
                </div>
              </div>
            )}
          </>
        )}
        {canAddNetworking && (
          <div className={css({
            padding: '1rem',
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            border: '2px solid',
            borderColor: isGatherFull ? 'gray.300' : 'blue.200',
            transition: 'all 0.2s ease-in-out',
            opacity: isGatherFull ? 0.6 : 1,
            '&:hover': {
              transform: isGatherFull ? 'none' : 'translateY(-2px)',
              boxShadow: isGatherFull ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }
          })}>
            <label className={css({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: isGatherFull ? 'not-allowed' : 'pointer'
            })}>
              <input
                type="checkbox"
                checked={additionalOptions.Networking}
                disabled={isGatherFull}
                onChange={() => {
                  if (!isGatherFull) {
                    const newNetworkingValue = !additionalOptions.Networking;
                    // 懇親会のチェックを外す場合、個別相談のチェックも外す
                    onOptionsChange({
                      ...additionalOptions,
                      Networking: newNetworkingValue,
                      Consultation: newNetworkingValue ? additionalOptions.Consultation : false
                    });
                  }
                }}
                className={css({
                  width: '1.5rem',
                  height: '1.5rem',
                  borderRadius: '50%',
                  border: '2px solid blue.600',
                  appearance: 'none',
                  cursor: isGatherFull ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:checked': {
                    backgroundColor: 'blue.600',
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'white\'%3E%3Cpath d=\'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z\'/%3E%3C/svg%3E")',
                    backgroundSize: '70%',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  },
                  '&:hover': {
                    borderColor: isGatherFull ? 'blue.600' : 'blue.700',
                    boxShadow: isGatherFull ? 'none' : '0 0 0 2px rgba(59, 130, 246, 0.2)'
                  },
                  '&:disabled': {
                    opacity: 0.5,
                    cursor: 'not-allowed'
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
                })}>懇親会</p>
                <span className={css({
                  fontSize: '0.875rem',
                  color: 'gray.600'
                })}>
                  {gatherParticipants}/{gatherCapacity}名
                  {isGatherFull && (
                    <span className={css({
                      color: 'gray.500',
                      fontWeight: 'medium',
                      marginLeft: '0.5rem'
                    })}>定員に達しました</span>
                  )}
                </span>
              </div>
            </label>
          </div>
        )}

        {/* 個別相談が追加可能な場合 */}
        {canAddConsultation && (
          <div className={css({
            padding: '1rem',
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            border: '2px solid',
            borderColor: isConsultationDisabled ? 'gray.300' : 'blue.200',
            transition: 'all 0.2s ease-in-out',
            opacity: isConsultationDisabled ? 0.6 : 1,
            '&:hover': {
              transform: isConsultationDisabled ? 'none' : 'translateY(-2px)',
              boxShadow: isConsultationDisabled ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }
          })}>
            <label className={css({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: isConsultationDisabled ? 'not-allowed' : 'pointer'
            })}>
              <input
                type="checkbox"
                checked={additionalOptions.Consultation}
                disabled={isConsultationDisabled}
                onChange={() => !isConsultationDisabled && onOptionsChange({
                  ...additionalOptions,
                  Consultation: !additionalOptions.Consultation
                })}
                className={css({
                  width: '1.5rem',
                  height: '1.5rem',
                  borderRadius: '50%',
                  border: '2px solid blue.600',
                  appearance: 'none',
                  cursor: isConsultationDisabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:checked': {
                    backgroundColor: 'blue.600',
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'white\'%3E%3Cpath d=\'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z\'/%3E%3C/svg%3E")',
                    backgroundSize: '70%',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  },
                  '&:hover': {
                    borderColor: isConsultationDisabled ? 'blue.600' : 'blue.700',
                    boxShadow: isConsultationDisabled ? 'none' : '0 0 0 2px rgba(59, 130, 246, 0.2)'
                  },
                  '&:disabled': {
                    opacity: 0.5,
                    cursor: 'not-allowed'
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
                })}>個別相談会</p>
                <span className={css({
                  fontSize: '0.875rem',
                  color: 'gray.600'
                })}>
                  {consultationParticipants}/{consultationCapacity}名
                  {isConsultationFull && (
                    <span className={css({
                      color: 'gray.500',
                      fontWeight: 'medium',
                      marginLeft: '0.5rem'
                    })}>定員に達しました</span>
                  )}
                </span>
              </div>
            </label>
          </div>
        )}
      </div>

      <div className={css({
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem',
        marginTop: '1.5rem'
      })}>
        <Button
          onClick={onCancel}
          className={css({
            cursor: 'pointer',
            backgroundColor: 'gray.400',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            fontWeight: 'bold',
            fontSize: '1rem',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: 'gray.500',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            },
            '&:active': {
              transform: 'translateY(0)'
            }
          })}
        >
          キャンセル
        </Button>
        <Button
          onClick={onSubmit}
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
      </div>
    </div>
  );
};

export default AdditionalApplicationForm;
