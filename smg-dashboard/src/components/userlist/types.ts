import type { Json, MstUser } from '@/lib/supabase/types';

// Supabaseのmst_userテーブル型をベースにした基本User型
export type BaseUser = MstUser;

// 表示用のUser型（MstUserをベースに拡張）
export interface User extends MstUser {
  // フロントエンド用の追加フィールド（下位互換性のため）
  id?: string;
  displayName?: string;
  memberNumber?: string;
  role?: '代表者' | 'パートナー';
  groups?: string[];
  joinedDate?: string;
  lastAccess?: string;
  updatedAt?: string;
  companyName?: string;
  company?: string;
  profileImage?: string;
  userName?: string;
  phoneNumber?: string;
  createdAt?: string;
  companyNameKana?: string;
}

// フォームデータ用の型定義（ユーザー作成・編集用）
export interface UserFormData {
  id?: string;
  profileImage?: string;
  displayName?: string;
  userName: string;
  userNameKana?: string;
  email: string;
  phoneNumber?: string;
  memberNumber?: string;
  role?: '代表者' | 'パートナー';
  userType?: '代表者' | 'パートナー';
  daihyoshaId?: string;
  groups?: string[];
  joinedDate?: string;
  lastAccess?: string;
  createdAt?: string;
  updatedAt?: string;
  companyName: string | null;
  companyNameKana: string | null;
  password?: string;
  bio?: string;
  birthDate?: string;
  companyAddress?: string;
  industryId?: string;
  nickname?: string;
  websiteUrl?: string;
  socialMediaLinks?: Json | null;
  isProfilePublic?: boolean;
  isBioVisible?: boolean;
  isCompanyNameVisible?: boolean;
  isIndustryIdVisible?: boolean;
  isNicknameVisible?: boolean;
  isSnsVisible?: boolean;
  isUsernameVisible?: boolean;
  isWebsiteUrlVisible?: boolean;
}

// ユーザー一覧表示用の型定義（MstUserから必要なフィールドのみ抽出）
export type UserListItem = Pick<
  MstUser,
  | 'user_id'
  | 'icon'
  | 'username'
  | 'email'
  | 'phone_number'
  | 'user_type'
  | 'company_name'
  | 'created_at'
  | 'last_login_at'
  | 'updated_at'
> & {
  // グループ情報を追加
  trn_group_user?: Array<{
    mst_group: {
      title: string;
    } | null;
  }> | null;
};

// ユーザー検索・フィルタリング用の型定義
export interface UserSearchFilters {
  searchQuery?: string;
  userType?: string;
  companyName?: string;
  industryId?: string;
  isProfilePublic?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

// ユーザーソート用の型定義
export type UserSortField =
  | 'username'
  | 'email'
  | 'created_at'
  | 'last_login_at'
  | 'company_name'
  | 'user_type';

export type SortDirection = 'asc' | 'desc';

export interface UserSortOptions {
  field: UserSortField;
  direction: SortDirection;
}

// Supabase操作用の型定義
export type CreateUserData = Omit<
  MstUser,
  'user_id' | 'created_at' | 'updated_at' | 'deleted_at'
>;
export type UpdateUserData = Partial<CreateUserData>;

// ユーザー権限・ロール関連の型定義
export type UserRole = '代表者' | 'パートナー' | '管理者' | '一般';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'deleted';

// グループ関連（既存のgrouplistとの互換性のため）
export interface UserWithGroups extends User {
  groups?: string[];
}

// 統計・集計用の型定義
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  usersByType: Record<string, number>;
  usersByCompany: Record<string, number>;
}

// ページネーション用の型定義
export interface UserPaginationResult {
  users: User[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// API レスポンス用の型定義
export interface UserApiResponse {
  success: boolean;
  data?: User | User[];
  error?: string;
  message?: string;
}

// ユーザー活動ログ用の型定義
export interface UserActivityLog {
  log_id: string;
  user_id: string;
  activity_type:
    | 'login'
    | 'logout'
    | 'profile_update'
    | 'password_change'
    | 'other';
  description: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}
