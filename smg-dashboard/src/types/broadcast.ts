export type BroadcastHistory = {
  broadcast_id: string;
  is_sent: boolean;
  content: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type BroadcastTargetUser = {
  broadcast_id: string;
  user_id: string;
  is_sent: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type BroadcastInput = {
  content: string;
  user_ids: string[];
};

export type BroadcastHistoryWithTargets = BroadcastHistory & {
  target_count: number;
  target_users?: {
    user_id: string;
    name: string;
    email: string;
  }[];
};

export type BroadcastDetail = BroadcastHistory & {
  target_users: {
    user_id: string;
    username: string;
    email: string;
    company_name: string | null;
    is_sent: boolean;
  }[];
  success_count: number;
  failure_count: number;
};
