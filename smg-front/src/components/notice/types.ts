import type { MstNotice } from '@/lib/supabase/types';

// Supabaseの型をベースにしたお知らせの型定義
export type NoticeData = MstNotice & {
	attachments?: NoticeAttachment[];
	mst_notice_category?: {
		category_id: string;
		category_name: string;
		description: string | null;
	} | null;
};

// Supabaseのmst_noticeテーブルの型を拡張した表示用の型
export type NoticeListItem = {
	id: number;
	date: string;
	title: string;
	details: string;
};

// 添付ファイルの型定義（将来の拡張用）
export interface NoticeAttachment {
	id: string;
	title: string;
	fileUrl: string;
	fileSize: string;
}

// お知らせファイルの型定義（trn_notice_file）
export interface NoticeFile {
	file_id: string;
	notice_id: string;
	file_url: string;
	file_name: string | null;
	display_order: number;
	created_at: string | null;
	updated_at: string | null;
	deleted_at: string | null;
}

// NoticeAccordion用の型定義
export type NoticeAccordionItem = {
	id: number;
	noticeId: string; // UUID形式の元のID
	date: string;
	title: string;
	details: string;
	category?: {
		id: string;
		name: string;
		description?: string;
	};
};

export type NoticeAccordionProps = NoticeAccordionItem & {
	isOpen: boolean;
	onToggle: (id: number) => void;
};

// SearchSection用の型定義
export type NoticeSortOption = 'date_desc' | 'date_asc';

export interface NoticeSearchSectionParams {
	searchQuery: string;
	sortOption: NoticeSortOption;
	selectedCategoryId?: string;
	categories: { id: string; name: string; description?: string }[];
	onSearchQueryChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onSortChange: (value: NoticeSortOption) => void;
	onCategoryChange: (categoryId: string | undefined) => void;
	onSearch?: () => void;
}

// ページ用の検索パラメータの型定義
export type NoticePageSearchParams = {
	searchTerm: string;
	sortOption: NoticeSortOption;
	categoryId?: string;
};
