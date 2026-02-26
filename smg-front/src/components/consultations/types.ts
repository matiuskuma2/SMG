import { type Consultation, type ConsultationSchedule, type ConsultationApplicationDetail } from "@/lib/api/consultation";

// コンポーネントのProps型定義
export interface ConsultationHeaderProps {
  title: string | null;
  instructor: string | null;
  imageUrl: string | null;
}

export interface ConsultationInfoProps {
  startDate: string;
  endDate: string;
  description?: string | null;
}

export interface ConsultationDatesProps {
  schedules: ConsultationSchedule[];
  selectedDates: string[];
  onDateChange: (id: string, checked: boolean) => void;
  disabled?: boolean;
}

export interface UrgentCheckboxProps {
  isUrgent: boolean;
  setIsUrgent: (value: boolean) => void;
}

export interface SelectedDatesProps {
  selectedDates: string[];
  schedules: ConsultationSchedule[];
}

export interface RemarksFieldProps {
  remarks: string;
  setRemarks: (value: string) => void;
}

export interface SubmitButtonProps {
  isSubmitting: boolean;
  isBeforeStart: boolean;
  isAfterEnd: boolean;
  buttonText?: string;
}

export interface CancelButtonProps {
  isCancelling: boolean;
  onCancel: () => void;
}

export interface ApplicationStatusProps {
  applicationDetail: ConsultationApplicationDetail;
  consultation: Consultation;
}

// 型の再エクスポート（後方互換性のため）
export type { Consultation, ConsultationSchedule, ConsultationApplicationDetail }; 