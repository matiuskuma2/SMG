import { css } from '@/styled-system/css';
import React from 'react';
import { ConsultationCard } from './ConsultationCard';
import { ConsultationWithApplicationStatus } from '@/lib/api/consultation';

type ConsultationListProps = {
  consultations: ConsultationWithApplicationStatus[];
};

export const ConsultationList = ({ consultations }: ConsultationListProps) => {
  return (
    <div className={css({
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '1.5rem',
    })}>
      {consultations.length === 0 ? (
        <div className={css({
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: 'gray.50',
          borderRadius: '0.5rem',
        })}>
          条件に一致する相談がありません
        </div>
      ) : (
        consultations.map((consultation) => (
          <ConsultationCard
            key={consultation.consultation_id}
            consultation_id={consultation.consultation_id}
            instructor_id={consultation.instructor_id}
            title={consultation.title}
            description={consultation.description}
            instructor={consultation.instructor}
            image_url={consultation.image_url}
            application_start_datetime={consultation.application_start_datetime}
            application_end_datetime={consultation.application_end_datetime}
            is_applied={consultation.is_applied}
          />
        ))
      )}
    </div>
  );
}; 