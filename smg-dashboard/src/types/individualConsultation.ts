import type {
  MstConsultation,
  MstConsultationSchedule,
} from '../lib/supabase/types';
import type { MstUser } from '../lib/supabase/types';

// 個別相談リスト表示用の型
export type IndividualConsultationType = MstConsultation & {
  instructorName: string; // 講師名（表示用）
  applicants: number; // 申込者数
};

// 個別相談フォーム用の型
export type IndividualConsultationFormType = Omit<
  Partial<MstConsultation>,
  'image_url'
> & {
  schedule_datetime?: string[];
  image_url?: File | string | null;
  instructor_name?: string;
  spreadsheet_id?: string;
  questions?: ConsultationQuestionFormType[];
};

// Supabaseからのレスポンス型
export interface SupabaseConsultationData extends MstConsultation {
  mst_user: {
    user_id: string;
    username: string;
  } | null;
  mst_consultation_schedule:
    | {
        schedule_id: string;
        schedule_datetime: string;
      }[]
    | null;
  applications_count: { count: number };
}

// 候補日時リスト型
export type CandidateDateAndTimeList = (MstConsultationSchedule & {
  candidateRanking?: number; // 既存の機能を維持するためにオプショナルとして残す
})[];

// 参加者データ型
export type Participant = MstUser & {
  application_id: string; // 申込ID
  priority: number; // 優先度（0: 優先度高, 1: 優先度中, 2: 優先度低）
  remarks: string; // 備考
  firstTime: boolean; // 初回かどうか
  candidateDateAndTime: CandidateDateAndTimeList; // 候補日時
  group_id: string | null;
  group_titles: string[]; // グループ名の配列
  selected_candidate_id: string | null; // 選択された候補日時のID
  consultation_id: string; // 個別相談ID
};

// 講師情報型
export type Instructor = MstUser;

// 選択肢型 - 単純な文字列配列
export type ConsultationQuestionOption = string;

// 個別相談質問トランザクション型
export type ConsultationQuestion = {
  question_id: string;
  consultation_id: string;
  title: string;
  question_type: 'text' | 'boolean' | 'select' | 'multiple_select';
  options: ConsultationQuestionOption[] | null;
  is_required: boolean;
  display_order: number;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
};

// 個別相談質問回答トランザクション型
export type ConsultationQuestionAnswer = {
  answer_id: string;
  question_id: string;
  application_id: string;
  answer:
    | string
    | boolean
    | string[]
    | number
    | {
        text?: string;
        value?: string | number | boolean;
        boolean?: boolean;
        selected?: string[];
      }
    | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
};

// 質問フォーム型
export type ConsultationQuestionFormType = {
  question_id?: string;
  title: string;
  question_type: 'text' | 'boolean' | 'select' | 'multiple_select';
  is_required: boolean;
  display_order: number;
  options?: ConsultationQuestionOption[];
};

// 質問回答表示用型（APIレスポンス用）
export type ConsultationQuestionAnswerWithQuestion = {
  answer_id: string | null;
  question_id: string;
  application_id: string;
  answer:
    | string
    | boolean
    | string[]
    | number
    | {
        text?: string;
        value?: string | number | boolean;
        boolean?: boolean;
        selected?: string[];
      }
    | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
  trn_consultation_question: {
    question_id: string;
    title: string;
    question_type: string;
    options: string[] | Record<string, string> | null;
    is_required: boolean;
    display_order?: number;
  };
};
