import { Avatar } from '@/components/ui/Avatar';
import { css } from '@/styled-system/css';
import { hstack, vstack } from '@/styled-system/patterns';
import type { Participant } from './types';

type ConsultationDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  participant: Participant | null;
};

export const ConsultationDetailModal = ({
  isOpen,
  onClose,
  participant,
}: ConsultationDetailModalProps) => {
  if (!isOpen || !participant) return null;

  const handleBackdropKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleContentKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className={css({
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bg: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      })}
      onClick={onClose}
      onKeyDown={handleBackdropKeyDown}
      tabIndex={-1}
    >
      <div
        className={css({
          bg: 'white',
          p: '6',
          borderRadius: 'lg',
          maxW: 'lg',
          w: 'full',
          mx: '4',
          maxH: '90vh',
          overflowY: 'auto',
        })}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleContentKeyDown}
        tabIndex={-1}
      >
        <div className={vstack({ gap: '4', alignItems: 'stretch' })}>
          {/* ユーザー基本情報 */}
          <div
            className={css({
              p: '4',
              borderRadius: 'md',
              border: '1px solid #e2e8f0',
              bg: 'gray.50',
            })}
          >
            <div className={hstack({ gap: '4', mb: '3' })}>
              <Avatar
                src={participant.profileImage}
                alt={participant.name}
                size="lg"
              />
              <div className={vstack({ alignItems: 'flex-start', gap: '1' })}>
                <h3
                  className={css({
                    fontSize: 'lg',
                    fontWeight: 'bold',
                    color: 'gray.900',
                  })}
                >
                  {participant.name}
                </h3>
                <p className={css({ fontSize: 'sm', color: 'gray.600' })}>
                  {participant.companyName}
                </p>
              </div>
            </div>
          </div>

          {/* 詳細情報 */}
          <div className={vstack({ gap: '3', alignItems: 'stretch' })}>
            <h3
              className={css({
                fontSize: 'md',
                fontWeight: 'semibold',
                color: 'gray.900',
                pb: '2',
                borderBottom: '1px solid #e2e8f0',
              })}
            >
              申し込み詳細
            </h3>

            {/* 連絡先情報 */}
            <div className={vstack({ gap: '2', alignItems: 'stretch' })}>
              <div className={hstack({ justifyContent: 'space-between' })}>
                <span
                  className={css({
                    fontSize: 'sm',
                    color: 'gray.600',
                    fontWeight: 'medium',
                  })}
                >
                  メールアドレス:
                </span>
                <span className={css({ fontSize: 'sm', color: 'gray.900' })}>
                  {participant.email}
                </span>
              </div>
              <div className={hstack({ justifyContent: 'space-between' })}>
                <span
                  className={css({
                    fontSize: 'sm',
                    color: 'gray.600',
                    fontWeight: 'medium',
                  })}
                >
                  電話番号:
                </span>
                <span className={css({ fontSize: 'sm', color: 'gray.900' })}>
                  {participant.phone || '未入力'}
                </span>
              </div>
              <div className={hstack({ justifyContent: 'space-between' })}>
                <span
                  className={css({
                    fontSize: 'sm',
                    color: 'gray.600',
                    fontWeight: 'medium',
                  })}
                >
                  属性:
                </span>
                <span className={css({ fontSize: 'sm', color: 'gray.900' })}>
                  {participant.userType || '未設定'}
                </span>
              </div>
              <div className={hstack({ justifyContent: 'space-between' })}>
                <span
                  className={css({
                    fontSize: 'sm',
                    color: 'gray.600',
                    fontWeight: 'medium',
                  })}
                >
                  所属グループ:
                </span>
                <span className={css({ fontSize: 'sm', color: 'gray.900' })}>
                  {participant.groupAffiliation || '未設定'}
                </span>
              </div>
            </div>

            {/* 相談会固有情報 */}
            <div
              className={vstack({ gap: '2', alignItems: 'stretch', mt: '2' })}
            >
              <div className={hstack({ justifyContent: 'space-between' })}>
                <span
                  className={css({
                    fontSize: 'sm',
                    color: 'gray.600',
                    fontWeight: 'medium',
                  })}
                >
                  緊急相談:
                </span>
                <span
                  className={css({
                    fontSize: 'sm',
                    px: '2',
                    py: '1',
                    borderRadius: 'full',
                    bg: participant.is_urgent ? 'green.100' : 'gray.100',
                    color: participant.is_urgent ? 'green.700' : 'gray.700',
                    fontWeight: 'medium',
                  })}
                >
                  {participant.is_urgent ? 'はい' : 'いいえ'}
                </span>
              </div>
              <div className={hstack({ justifyContent: 'space-between' })}>
                <span
                  className={css({
                    fontSize: 'sm',
                    color: 'gray.600',
                    fontWeight: 'medium',
                  })}
                >
                  初回相談:
                </span>
                <span
                  className={css({
                    fontSize: 'sm',
                    px: '2',
                    py: '1',
                    borderRadius: 'full',
                    bg: participant.is_first_consultation
                      ? 'green.100'
                      : 'gray.100',
                    color: participant.is_first_consultation
                      ? 'green.700'
                      : 'gray.700',
                    fontWeight: 'medium',
                  })}
                >
                  {participant.is_first_consultation ? 'はい' : 'いいえ'}
                </span>
              </div>
            </div>

            {/* 備考 */}
            {participant.notes && (
              <div
                className={vstack({ gap: '2', alignItems: 'stretch', mt: '2' })}
              >
                <div
                  className={hstack({
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  })}
                >
                  <span
                    className={css({
                      fontSize: 'sm',
                      color: 'gray.600',
                      fontWeight: 'medium',
                      minWidth: '80px',
                    })}
                  >
                    備考:
                  </span>
                  <span
                    className={css({
                      fontSize: 'sm',
                      color: 'gray.900',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      textAlign: 'right',
                      flex: 1,
                      ml: '3',
                    })}
                  >
                    {participant.notes}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* フッター */}
          <div
            className={css({
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '3',
              mt: '4',
              pt: '4',
              borderTop: '1px solid #e2e8f0',
            })}
          >
            <button
              type="button"
              onClick={onClose}
              className={css({
                px: '4',
                py: '2',
                borderRadius: 'md',
                bg: 'blue.500',
                color: 'white',
                _hover: { bg: 'blue.600' },
                fontWeight: 'medium',
              })}
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
