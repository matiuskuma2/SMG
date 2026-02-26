import type { SupabaseClient } from '@supabase/supabase-js';
import type { MstEvent } from '../lib/supabase/types';

// イベントの基本型定義
export type Event = MstEvent & {
	is_applied?: boolean;
	event_type_name?: string;
	participants_count?: number;
};

// EventCardProps（src/components/events/EventCard.tsx用）
export type EventCardProps = MstEvent & {
	participants_count?: number;
};

// ホームページ用EventCardProps（src/components/home/EventCard.tsx用）
export interface HomeEventCardProps extends MstEvent {
	isOnline: boolean;
}

// EventBannerProps
export interface EventBannerProps {
	image_url: string | null;
	event_name: string;
}

// EventHeaderProps
export interface EventHeaderProps {
	date: string;
	event_name: string;
	event_location: string;
}

// EventDetailsProps
export interface EventDetailsProps {
	fullDate: string;
	fullTime: string;
	event_location: string;
	event_description: string;
	sections?: Array<{
		title: string;
		content: string[];
	}>;
	onGenerateCalendarUrl: () => string;
	registration_start_datetime?: string;
	registration_end_datetime?: string;
}

// EventParticipationInfoProps
export interface EventParticipationInfoProps {
	participants: number;
	event_capacity: number;
}

// EventTypeCheckboxProps
export interface EventTypeCheckboxProps {
	event_type: string;
	checked: boolean;
	onChange: () => void;
	disabled?: boolean;
	participantCount?: number;
	capacity?: number;
	isRegularMeeting?: boolean;
}

// EventApplicationFormProps
export interface EventApplicationFormProps {
	supabase: SupabaseClient;
	event_id: string;
	event_name: string;
	has_gather?: boolean;
	has_consultation?: boolean;
	event_type?: string;
	event_location?: string;
	event_city?: string;
	onSuccess?: () => void;
}

// EventApplicationButtonProps
export interface EventApplicationButtonProps {
	applicationStatus: string;
	isApplicationSubmitted: boolean;
	onButtonClick: () => void;
}

// EventNotesProps
export interface EventNotesProps {
	notes: string[];
}

// EventData（ホームページのイベントセクション用）
export interface EventData {
	events: HomeEventCardProps[];
}

// ApplicationStatusProps
export interface ApplicationStatusProps {
	event_id: string;
	event_type?: string;
	onReturn: () => void;
}
