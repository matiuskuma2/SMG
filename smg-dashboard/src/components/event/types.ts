import type {
  MstEvent,
  MstEventFile,
  MstEventType,
} from '@/lib/supabase/types';

export type Participant = {
  id: number;
  icon: string;
  name: string;
  userId: string;
  companyName: string;
  status: string;
  email: string;
  phone: string;
  memberNumber: string;
  userType: string;
  groupAffiliation: string; // 表示用（最初のグループまたは「未所属」）
  groupAffiliations?: string[]; // 複数グループ用（詳細表示用）
  profileImage: string;
  paymentStatus?: string; // 懇親会用の決済状況
  paymentIntentId?: string; // Stripe決済ID
  is_offline?: boolean;
  deleted_at?: string | null;
  is_urgent?: boolean; // 緊急相談フラグ
  is_first_consultation?: boolean; // 初回相談フラグ
  notes?: string; // 備考
};

// イベントリスト表示用の型
export interface Event extends MstEvent {
  attendees?: { count: number }[];
  has_archive?: boolean;
  archive_is_draft?: boolean | null;
}

// イベント区分の型
export type EventType = MstEventType;

// イベント表示グループの型
export type EventVisibleGroup = {
  id: string;
  event_id: string;
  group_id: string;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
};

// イベント基本情報の型
export type EventBasicInfoData = Partial<MstEvent> & {
  visible_groups?: EventVisibleGroup[];
};

// イベントファイルの型
export type EventFile = MstEventFile & {
  file?: File | null; // アップロード用の一時的なファイル
  isNew?: boolean; // 新規作成フラグ
};

// イベントフォーム入力データの型
export type EventFormData = Partial<MstEvent> & {
  files?: EventFile[];
  questions?: EventQuestionFormType[];
  visible_group_ids?: string[];
};

// イベントデータの型
export type EventData = MstEvent;

// 選択肢型 - 単純な文字列配列
export type EventQuestionOption = string;

// イベント質問トランザクション型
export type EventQuestion = {
  question_id: string;
  event_id: string;
  title: string;
  question_type: 'text' | 'boolean' | 'select' | 'multiple_select';
  options: EventQuestionOption[] | null;
  is_required: boolean;
  display_order: number;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
};

// イベント質問回答トランザクション型
export type EventQuestionAnswer = {
  answer_id: string;
  question_id: string;
  user_id: string;
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
export type EventQuestionFormType = {
  question_id?: string;
  title: string;
  question_type: 'text' | 'boolean' | 'select' | 'multiple_select';
  is_required: boolean;
  display_order: number;
  options?: EventQuestionOption[];
};

// 質問回答表示用型（APIレスポンス用）
export type EventQuestionAnswerWithQuestion = EventQuestionAnswer & {
  trn_event_question: {
    question_id: string;
    title: string;
    question_type: string;
    options: string[] | Record<string, string> | null;
    is_required: boolean;
    display_order?: number;
  };
};
