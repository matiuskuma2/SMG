import { css } from "@/styled-system/css";
import { stack } from "@/styled-system/patterns";
import type { EventDetailsProps } from "@/types/event";
import React from 'react';
import { RichContentDisplay } from '@/features/editer/RichContentDisplay';

const parseTextWithLinks = (text: string): (string | JSX.Element)[] => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className={css({ color: 'blue.600', _hover: { textDecoration: 'underline' } })}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

const EventDetails: React.FC<EventDetailsProps> = ({
  fullDate,
  fullTime,
  event_location,
  event_description,
  sections,
  onGenerateCalendarUrl,
  registration_start_datetime,
  registration_end_datetime
}) => {

  // 申し込み期間のフォーマット
  const formatRegistrationPeriod = () => {
    if (!registration_start_datetime || !registration_end_datetime) {
      return null;
    }

    const startDate = new Date(registration_start_datetime);
    const endDate = new Date(registration_end_datetime);

    const formatDate = (date: Date) => {
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`;
    };

    return `${formatDate(startDate)} 〜 ${formatDate(endDate)}`;
  };

  return (
    <>
      <div className={css({
        borderBottom: '1px solid',
        borderColor: 'gray.200',
        mb: { base: '2', md: '4' }
      })}></div>
      <div className={stack({
        gap: { base: '4', md: '6' },
        mb: { base: '6', md: '8' }
      })}>
        {/* 申し込み期間の表示 */}
        {formatRegistrationPeriod() && (
          <div className={css({ width: '100%' })}>
            <div className={css({ textAlign: 'left' })}>
              <div className={css({ fontWeight: 'medium' })}>申し込み期間：{formatRegistrationPeriod()}</div>
            </div>
          </div>
        )}

        <div className={css({ width: '100%' })}>
          <div className={css({ textAlign: 'left' })}>
            <div className={css({ fontWeight: 'medium' })}>日時：{fullDate} {fullTime}</div>
            <a
              href={onGenerateCalendarUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className={css({ color: 'blue.600', fontSize: 'sm', _hover: { textDecoration: 'underline' } })}
            >
              Googleカレンダーに追加
            </a>
          </div>
        </div>

        <div className={css({ width: '100%' })}>
          <div className={css({ textAlign: 'left' })}>
            <div className={css({ fontWeight: 'medium' })}>場所：{event_location}</div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event_location)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={css({ color: 'blue.600', fontSize: 'sm', _hover: { textDecoration: 'underline' } })}
            >
              アクセス情報を見る
            </a>
          </div>
        </div>
      </div>
      <div className={css({ borderBottom: '1px solid', borderColor: 'gray.200', mb: '4' })}></div>

      {/* イベントの詳細説明 */}
      <div className={css({
        mb: { base: '6', md: '8' }
      })}>
        <h2 className={css({
          fontSize: { base: 'md', md: 'lg' },
          fontWeight: 'bold',
          mb: { base: '2', md: '4' }
        })}>イベントの説明</h2>
        <div className={css({ mb: '4', fontSize: 'md' })}>
          <RichContentDisplay content={event_description} isHtml={true} />
        </div>

        {sections && sections.map((section, index) => (
          <div key={index} className={css({
            mb: '6',
            p: '4',
            borderRadius: 'md',
          })}>
            <h3 className={css({
              fontWeight: 'bold',
              mb: '3',
              color: 'gray.700',
              borderBottom: '1px solid',
              borderColor: 'gray.200',
              pb: '2'
            })}>{section.title}</h3>
            {section.content.map((line, i) => {
              if ((section.title.includes('懇親会') || section.title.includes('個別相談')) && i === 0) {
                return (
                  <p key={i} className={css({ mb: '1', fontSize: 'sm', fontWeight: 'medium' })}>
                    {line}
                  </p>
                );
              }
              return (
                <p key={i} className={css({ mb: '1', fontSize: 'sm' })}>
                  {line.startsWith('http') ? (
                    <a
                      href={line}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={css({ color: 'blue.600', _hover: { textDecoration: 'underline' } })}
                    >
                      {line}
                    </a>
                  ) : (
                    line
                  )}
                </p>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
};

export default EventDetails;