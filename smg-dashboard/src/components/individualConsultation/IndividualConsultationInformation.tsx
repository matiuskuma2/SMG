import { css } from '@/styled-system/css';
import { vstack } from '@/styled-system/patterns';
import type { IndividualConsultationFormType } from '@/types/individualConsultation';

// thumbnailを文字列型として処理するためのヘルパー関数
const getThumbnailUrl = (
  image_url: string | File | null | undefined,
): string | null => {
  if (typeof image_url === 'string') {
    return image_url;
  }
  return null;
};

type IndividualConsultationInformationProps = {
  individualConsultation: IndividualConsultationFormType;
};

export const IndividualConsultationInformation = ({
  individualConsultation,
}: IndividualConsultationInformationProps) => {
  return (
    <div
      className={css({
        p: { base: '3', md: '6' },
        borderRadius: 'md',
        bg: 'white',
        boxShadow: 'sm',
        height: 'auto',
        display: 'flex',
        flexDirection: { base: 'column', md: 'row' },
        gap: { base: '4', md: '6' },
      })}
    >
      <div
        className={css({
          flex: { base: '1 1 auto', md: '0 0 300px' },
          height: { base: '200px', md: '100%' },
          bg: 'gray.100',
          borderRadius: 'md',
          overflow: 'hidden',
        })}
      >
        {getThumbnailUrl(individualConsultation.image_url) && (
          <img
            src={getThumbnailUrl(individualConsultation.image_url) || ''}
            alt={individualConsultation.title || ''}
            className={css({
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            })}
          />
        )}
      </div>
      <div
        className={vstack({
          gap: '4',
          alignItems: 'stretch',
          flex: '1',
          height: '100%',
          justifyContent: 'space-between',
        })}
      >
        <div>
          <h1
            className={css({
              fontSize: { base: 'xl', md: '2xl' },
              fontWeight: 'bold',
            })}
          >
            {individualConsultation.title}
          </h1>
          <p className={css({ fontSize: 'sm', color: 'gray.600', mb: 1 })}>
            講師名：{individualConsultation.instructor_name}
          </p>
          <p className={css({ fontSize: 'sm', color: 'gray.600' })}>
            申込期間：{individualConsultation.application_start_datetime} ～{' '}
            {individualConsultation.application_end_datetime}
          </p>
        </div>
      </div>
    </div>
  );
};
