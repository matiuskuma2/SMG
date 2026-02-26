export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export type Database = {
	graphql_public: {
		Tables: {
			[_ in never]: never;
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			graphql: {
				Args: {
					extensions?: Json;
					operationName?: string;
					query?: string;
					variables?: Json;
				};
				Returns: Json;
			};
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
	public: {
		Tables: {
			mst_archive_type: {
				Row: {
					created_at: string | null;
					deleted_at: string | null;
					description: string | null;
					type_id: string;
					type_name: string;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string | null;
					deleted_at?: string | null;
					description?: string | null;
					type_id?: string;
					type_name: string;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string | null;
					deleted_at?: string | null;
					description?: string | null;
					type_id?: string;
					type_name?: string;
					updated_at?: string | null;
				};
				Relationships: [];
			};
			mst_beginner_guide_file: {
				Row: {
					created_at: string | null;
					deleted_at: string | null;
					file_id: string;
					file_name: string | null;
					file_path: string;
					guide_item_id: string | null;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string | null;
					deleted_at?: string | null;
					file_id?: string;
					file_name?: string | null;
					file_path: string;
					guide_item_id?: string | null;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string | null;
					deleted_at?: string | null;
					file_id?: string;
					file_name?: string | null;
					file_path?: string;
					guide_item_id?: string | null;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'mst_beginner_guide_file_guide_item_id_fkey';
						columns: ['guide_item_id'];
						isOneToOne: false;
						referencedRelation: 'mst_beginner_guide_item';
						referencedColumns: ['guide_item_id'];
					},
				];
			};
			mst_beginner_guide_item: {
				Row: {
					created_at: string | null;
					deleted_at: string | null;
					description: string | null;
					display_order: number | null;
					guide_item_id: string;
					is_draft: boolean | null;
					title: string;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string | null;
					deleted_at?: string | null;
					description?: string | null;
					display_order?: number | null;
					guide_item_id?: string;
					is_draft?: boolean | null;
					title: string;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string | null;
					deleted_at?: string | null;
					description?: string | null;
					display_order?: number | null;
					guide_item_id?: string;
					is_draft?: boolean | null;
					title?: string;
					updated_at?: string | null;
				};
				Relationships: [];
			};
			mst_beginner_guide_video: {
				Row: {
					created_at: string | null;
					deleted_at: string | null;
					file_path: string;
					guide_item_id: string | null;
					updated_at: string | null;
					video_id: string;
				};
				Insert: {
					created_at?: string | null;
					deleted_at?: string | null;
					file_path: string;
					guide_item_id?: string | null;
					updated_at?: string | null;
					video_id?: string;
				};
				Update: {
					created_at?: string | null;
					deleted_at?: string | null;
					file_path?: string;
					guide_item_id?: string | null;
					updated_at?: string | null;
					video_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'mst_beginner_guide_video_guide_item_id_fkey';
						columns: ['guide_item_id'];
						isOneToOne: false;
						referencedRelation: 'mst_beginner_guide_item';
						referencedColumns: ['guide_item_id'];
					},
				];
			};
			mst_consultation: {
				Row: {
					application_end_datetime: string;
					application_start_datetime: string;
					consultation_id: string;
					created_at: string | null;
					deleted_at: string | null;
					description: string | null;
					image_url: string | null;
					instructor_id: string;
					is_draft: boolean | null;
					publish_end_at: string | null;
					publish_start_at: string | null;
					spreadsheet_id: string | null;
					title: string | null;
					updated_at: string | null;
				};
				Insert: {
					application_end_datetime: string;
					application_start_datetime: string;
					consultation_id?: string;
					created_at?: string | null;
					deleted_at?: string | null;
					description?: string | null;
					image_url?: string | null;
					instructor_id: string;
					is_draft?: boolean | null;
					publish_end_at?: string | null;
					publish_start_at?: string | null;
					spreadsheet_id?: string | null;
					title?: string | null;
					updated_at?: string | null;
				};
				Update: {
					application_end_datetime?: string;
					application_start_datetime?: string;
					consultation_id?: string;
					created_at?: string | null;
					deleted_at?: string | null;
					description?: string | null;
					image_url?: string | null;
					instructor_id?: string;
					is_draft?: boolean | null;
					publish_end_at?: string | null;
					publish_start_at?: string | null;
					spreadsheet_id?: string | null;
					title?: string | null;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'mst_consultation_instructor_id_fkey';
						columns: ['instructor_id'];
						isOneToOne: false;
						referencedRelation: 'mst_user';
						referencedColumns: ['user_id'];
					},
				];
			};
			mst_consultation_schedule: {
				Row: {
					consultation_id: string;
					created_at: string | null;
					deleted_at: string | null;
					schedule_datetime: string;
					schedule_id: string;
					updated_at: string | null;
				};
				Insert: {
					consultation_id: string;
					created_at?: string | null;
					deleted_at?: string | null;
					schedule_datetime: string;
					schedule_id?: string;
					updated_at?: string | null;
				};
				Update: {
					consultation_id?: string;
					created_at?: string | null;
					deleted_at?: string | null;
					schedule_datetime?: string;
					schedule_id?: string;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'mst_consultation_schedule_consultation_id_fkey';
						columns: ['consultation_id'];
						isOneToOne: false;
						referencedRelation: 'mst_consultation';
						referencedColumns: ['consultation_id'];
					},
				];
			};
			mst_dm_label: {
				Row: {
					color: string | null;
					created_at: string | null;
					deleted_at: string | null;
					label_id: string;
					name: string;
					updated_at: string | null;
				};
				Insert: {
					color?: string | null;
					created_at?: string | null;
					deleted_at?: string | null;
					label_id?: string;
					name: string;
					updated_at?: string | null;
				};
				Update: {
					color?: string | null;
					created_at?: string | null;
					deleted_at?: string | null;
					label_id?: string;
					name?: string;
					updated_at?: string | null;
				};
				Relationships: [];
			};
			mst_dm_tag: {
				Row: {
					created_at: string | null;
					deleted_at: string | null;
					name: string;
					tag_id: string;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string | null;
					deleted_at?: string | null;
					name: string;
					tag_id?: string;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string | null;
					deleted_at?: string | null;
					name?: string;
					tag_id?: string;
					updated_at?: string | null;
				};
				Relationships: [];
			};
			mst_dm_thread: {
				Row: {
					created_at: string | null;
					deleted_at: string | null;
					is_admin_read: boolean | null;
					last_sent_at: string | null;
					thread_id: string;
					updated_at: string | null;
					user_id: string;
				};
				Insert: {
					created_at?: string | null;
					deleted_at?: string | null;
					is_admin_read?: boolean | null;
					last_sent_at?: string | null;
					thread_id?: string;
					updated_at?: string | null;
					user_id: string;
				};
				Update: {
					created_at?: string | null;
					deleted_at?: string | null;
					is_admin_read?: boolean | null;
					last_sent_at?: string | null;
					thread_id?: string;
					updated_at?: string | null;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'mst_dm_thread_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'mst_user';
						referencedColumns: ['user_id'];
					},
				];
			};
			mst_event: {
				Row: {
					consultation_capacity: number | null;
					created_at: string | null;
					deleted_at: string | null;
					event_capacity: number;
					event_city: string | null;
					event_description: string | null;
					event_end_datetime: string;
					event_id: string;
					event_location: string;
					event_name: string;
					event_start_datetime: string;
					event_type: string;
					gather_capacity: number | null;
					gather_end_time: string | null;
					gather_location: string | null;
					gather_price: number | null;
					gather_start_time: string | null;
					has_consultation: boolean | null;
					has_gather: boolean | null;
					image_url: string | null;
					is_draft: boolean | null;
					notification_sent: boolean;
					publish_end_at: string | null;
					publish_start_at: string | null;
					registration_end_datetime: string;
					registration_start_datetime: string;
					spreadsheet_id: string | null;
					updated_at: string | null;
				};
				Insert: {
					consultation_capacity?: number | null;
					created_at?: string | null;
					deleted_at?: string | null;
					event_capacity: number;
					event_city?: string | null;
					event_description?: string | null;
					event_end_datetime: string;
					event_id?: string;
					event_location: string;
					event_name: string;
					event_start_datetime: string;
					event_type: string;
					gather_capacity?: number | null;
					gather_end_time?: string | null;
					gather_location?: string | null;
					gather_price?: number | null;
					gather_start_time?: string | null;
					has_consultation?: boolean | null;
					has_gather?: boolean | null;
					image_url?: string | null;
					is_draft?: boolean | null;
					notification_sent?: boolean;
					publish_end_at?: string | null;
					publish_start_at?: string | null;
					registration_end_datetime: string;
					registration_start_datetime: string;
					spreadsheet_id?: string | null;
					updated_at?: string | null;
				};
				Update: {
					consultation_capacity?: number | null;
					created_at?: string | null;
					deleted_at?: string | null;
					event_capacity?: number;
					event_city?: string | null;
					event_description?: string | null;
					event_end_datetime?: string;
					event_id?: string;
					event_location?: string;
					event_name?: string;
					event_start_datetime?: string;
					event_type?: string;
					gather_capacity?: number | null;
					gather_end_time?: string | null;
					gather_location?: string | null;
					gather_price?: number | null;
					gather_start_time?: string | null;
					has_consultation?: boolean | null;
					has_gather?: boolean | null;
					image_url?: string | null;
					is_draft?: boolean | null;
					notification_sent?: boolean;
					publish_end_at?: string | null;
					publish_start_at?: string | null;
					registration_end_datetime?: string;
					registration_start_datetime?: string;
					spreadsheet_id?: string | null;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'mst_event_event_type_id_fkey';
						columns: ['event_type'];
						isOneToOne: false;
						referencedRelation: 'mst_event_type';
						referencedColumns: ['event_type_id'];
					},
				];
			};
			mst_event_archive: {
				Row: {
					archive_id: string;
					created_at: string | null;
					deleted_at: string | null;
					description: string | null;
					event_id: string | null;
					event_type_id: string;
					image_url: string | null;
					is_draft: boolean | null;
					notification_sent: boolean | null;
					publish_end_at: string | null;
					publish_start_at: string | null;
					title: string;
					type_id: string | null;
					updated_at: string | null;
				};
				Insert: {
					archive_id?: string;
					created_at?: string | null;
					deleted_at?: string | null;
					description?: string | null;
					event_id?: string | null;
					event_type_id: string;
					image_url?: string | null;
					is_draft?: boolean | null;
					notification_sent?: boolean | null;
					publish_end_at?: string | null;
					publish_start_at?: string | null;
					title: string;
					type_id?: string | null;
					updated_at?: string | null;
				};
				Update: {
					archive_id?: string;
					created_at?: string | null;
					deleted_at?: string | null;
					description?: string | null;
					event_id?: string | null;
					event_type_id?: string;
					image_url?: string | null;
					is_draft?: boolean | null;
					notification_sent?: boolean | null;
					publish_end_at?: string | null;
					publish_start_at?: string | null;
					title?: string;
					type_id?: string | null;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'mst_event_archive_event_id_fkey';
						columns: ['event_id'];
						isOneToOne: false;
						referencedRelation: 'mst_event';
						referencedColumns: ['event_id'];
					},
					{
						foreignKeyName: 'mst_event_archive_event_type_id_fkey';
						columns: ['event_type_id'];
						isOneToOne: false;
						referencedRelation: 'mst_event_type';
						referencedColumns: ['event_type_id'];
					},
					{
						foreignKeyName: 'mst_event_archive_type_id_fkey';
						columns: ['type_id'];
						isOneToOne: false;
						referencedRelation: 'mst_archive_type';
						referencedColumns: ['type_id'];
					},
				];
			};
			mst_event_file: {
				Row: {
					created_at: string | null;
					deleted_at: string | null;
					display_order: number | null;
					event_id: string;
					file_description: string | null;
					file_id: string;
					file_name: string | null;
					file_url: string;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string | null;
					deleted_at?: string | null;
					display_order?: number | null;
					event_id: string;
					file_description?: string | null;
					file_id?: string;
					file_name?: string | null;
					file_url: string;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string | null;
					deleted_at?: string | null;
					display_order?: number | null;
					event_id?: string;
					file_description?: string | null;
					file_id?: string;
					file_name?: string | null;
					file_url?: string;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'mst_event_file_event_id_fkey';
						columns: ['event_id'];
						isOneToOne: false;
						referencedRelation: 'mst_event';
						referencedColumns: ['event_id'];
					},
				];
			};
			mst_event_type: {
				Row: {
					created_at: string | null;
					deleted_at: string | null;
					event_type_id: string;
					event_type_name: string;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string | null;
					deleted_at?: string | null;
					event_type_id?: string;
					event_type_name: string;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string | null;
					deleted_at?: string | null;
					event_type_id?: string;
					event_type_name?: string;
					updated_at?: string | null;
				};
				Relationships: [];
			};
			mst_faq: {
				Row: {
					created_at: string | null;
					deleted_at: string | null;
					description: string | null;
					display_order: number;
					faq_id: string;
					title: string;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string | null;
					deleted_at?: string | null;
					description?: string | null;
					display_order: number;
					faq_id?: string;
					title: string;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string | null;
					deleted_at?: string | null;
					description?: string | null;
					display_order?: number;
					faq_id?: string;
					title?: string;
					updated_at?: string | null;
				};
				Relationships: [];
			};
			mst_group: {
				Row: {
					created_at: string | null;
					deleted_at: string | null;
					description: string;
					group_id: string;
					title: string;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string | null;
					deleted_at?: string | null;
					description: string;
					group_id?: string;
					title: string;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string | null;
					deleted_at?: string | null;
					description?: string;
					group_id?: string;
					title?: string;
					updated_at?: string | null;
				};
				Relationships: [];
			};
			mst_industry: {
				Row: {
					created_at: string | null;
					deleted_at: string | null;
					industry_id: string;
					industry_name: string;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string | null;
					deleted_at?: string | null;
					industry_id?: string;
					industry_name: string;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string | null;
					deleted_at?: string | null;
					industry_id?: string;
					industry_name?: string;
					updated_at?: string | null;
				};
				Relationships: [];
			};
			mst_inquiry: {
				Row: {
					content: string;
					created_at: string | null;
					deleted_at: string | null;
					inquiry_id: string;
					status: string;
					title: string;
					updated_at: string | null;
					user_id: string;
				};
				Insert: {
					content: string;
					created_at?: string | null;
					deleted_at?: string | null;
					inquiry_id?: string;
					status: string;
					title: string;
					updated_at?: string | null;
					user_id: string;
				};
				Update: {
					content?: string;
					created_at?: string | null;
					deleted_at?: string | null;
					inquiry_id?: string;
					status?: string;
					title?: string;
					updated_at?: string | null;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'mst_inquiry_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'mst_user';
						referencedColumns: ['user_id'];
					},
				];
			};
			mst_meeting_link: {
				Row: {
					created_at: string | null;
					deleted_at: string | null;
					meeting_link: string;
					meeting_link_id: string;
					title: string;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string | null;
					deleted_at?: string | null;
					meeting_link: string;
					meeting_link_id?: string;
					title: string;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string | null;
					deleted_at?: string | null;
					meeting_link?: string;
					meeting_link_id?: string;
					title?: string;
					updated_at?: string | null;
				};
				Relationships: [];
			};
			mst_notice: {
				Row: {
					category_id: string | null;
					content: string;
					created_at: string | null;
					deleted_at: string | null;
					is_draft: boolean | null;
					notice_id: string;
					publish_end_at: string | null;
					publish_start_at: string | null;
					title: string;
					updated_at: string | null;
				};
				Insert: {
					category_id?: string | null;
					content: string;
					created_at?: string | null;
					deleted_at?: string | null;
					is_draft?: boolean | null;
					notice_id?: string;
					publish_end_at?: string | null;
					publish_start_at?: string | null;
					title: string;
					updated_at?: string | null;
				};
				Update: {
					category_id?: string | null;
					content?: string;
					created_at?: string | null;
					deleted_at?: string | null;
					is_draft?: boolean | null;
					notice_id?: string;
					publish_end_at?: string | null;
					publish_start_at?: string | null;
					title?: string;
					updated_at?: string | null;
				};
				Relationships: [];
			};
			mst_notice_category: {
				Row: {
					category_id: string;
					category_name: string;
					created_at: string | null;
					deleted_at: string | null;
					description: string | null;
					updated_at: string | null;
				};
				Insert: {
					category_id?: string;
					category_name: string;
					created_at?: string | null;
					deleted_at?: string | null;
					description?: string | null;
					updated_at?: string | null;
				};
				Update: {
					category_id?: string;
					category_name?: string;
					created_at?: string | null;
					deleted_at?: string | null;
					description?: string | null;
					updated_at?: string | null;
				};
				Relationships: [];
			};
			mst_notification: {
				Row: {
					content: string | null;
					created_at: string | null;
					deleted_at: string | null;
					notification_id: string;
					notification_type: string | null;
					related_url: string | null;
					title: string | null;
					updated_at: string | null;
				};
				Insert: {
					content?: string | null;
					created_at?: string | null;
					deleted_at?: string | null;
					notification_id?: string;
					notification_type?: string | null;
					related_url?: string | null;
					title?: string | null;
					updated_at?: string | null;
				};
				Update: {
					content?: string | null;
					created_at?: string | null;
					deleted_at?: string | null;
					notification_id?: string;
					notification_type?: string | null;
					related_url?: string | null;
					title?: string | null;
					updated_at?: string | null;
				};
				Relationships: [];
			};
			mst_notification_settings: {
				Row: {
					created_at: string | null;
					deleted_at: string | null;
					is_enabled: boolean;
					notification_type: string;
					setting_id: string;
					updated_at: string | null;
					user_id: string;
				};
				Insert: {
					created_at?: string | null;
					deleted_at?: string | null;
					is_enabled?: boolean;
					notification_type: string;
					setting_id?: string;
					updated_at?: string | null;
					user_id: string;
				};
				Update: {
					created_at?: string | null;
					deleted_at?: string | null;
					is_enabled?: boolean;
					notification_type?: string;
					setting_id?: string;
					updated_at?: string | null;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'mst_notification_settings_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'mst_user';
						referencedColumns: ['user_id'];
					},
				];
			};
			mst_question_manual: {
				Row: {
					created_at: string | null;
					deleted_at: string | null;
					description: string | null;
					question_manual_id: string;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string | null;
					deleted_at?: string | null;
					description?: string | null;
					question_manual_id?: string;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string | null;
					deleted_at?: string | null;
					description?: string | null;
					question_manual_id?: string;
					updated_at?: string | null;
				};
				Relationships: [];
			};
			mst_radio: {
				Row: {
					created_at: string;
					deleted_at: string | null;
					image_url: string | null;
					is_draft: boolean | null;
					publish_end_at: string | null;
					publish_start_at: string | null;
					radio_description: string | null;
					radio_id: string;
					radio_name: string;
					radio_url: string | null;
					updated_at: string;
				};
				Insert: {
					created_at?: string;
					deleted_at?: string | null;
					image_url?: string | null;
					is_draft?: boolean | null;
					publish_end_at?: string | null;
					publish_start_at?: string | null;
					radio_description?: string | null;
					radio_id?: string;
					radio_name: string;
					radio_url?: string | null;
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					deleted_at?: string | null;
					image_url?: string | null;
					is_draft?: boolean | null;
					publish_end_at?: string | null;
					publish_start_at?: string | null;
					radio_description?: string | null;
					radio_id?: string;
					radio_name?: string;
					radio_url?: string | null;
					updated_at?: string;
				};
				Relationships: [];
			};
			mst_survey: {
				Row: {
					closing_datetime: string | null;
					created_at: string | null;
					deleted_at: string | null;
					description: string | null;
					event_id: string;
					survey_id: string;
					title: string;
					updated_at: string | null;
				};
				Insert: {
					closing_datetime?: string | null;
					created_at?: string | null;
					deleted_at?: string | null;
					description?: string | null;
					event_id: string;
					survey_id?: string;
					title: string;
					updated_at?: string | null;
				};
				Update: {
					closing_datetime?: string | null;
					created_at?: string | null;
					deleted_at?: string | null;
					description?: string | null;
					event_id?: string;
					survey_id?: string;
					title?: string;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'mst_survey_event_id_fkey';
						columns: ['event_id'];
						isOneToOne: false;
						referencedRelation: 'mst_event';
						referencedColumns: ['event_id'];
					},
				];
			};
			mst_survey_detail: {
				Row: {
					created_at: string | null;
					deleted_at: string | null;
					detail_id: string;
					detail_text: string;
					detail_type: string;
					display_order: number;
					is_required: boolean | null;
					options: Json | null;
					survey_id: string;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string | null;
					deleted_at?: string | null;
					detail_id?: string;
					detail_text: string;
					detail_type: string;
					display_order: number;
					is_required?: boolean | null;
					options?: Json | null;
					survey_id: string;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string | null;
					deleted_at?: string | null;
					detail_id?: string;
					detail_text?: string;
					detail_type?: string;
					display_order?: number;
					is_required?: boolean | null;
					options?: Json | null;
					survey_id?: string;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'mst_survey_detail_survey_id_fkey';
						columns: ['survey_id'];
						isOneToOne: false;
						referencedRelation: 'mst_survey';
						referencedColumns: ['survey_id'];
					},
				];
			};
			mst_theme: {
				Row: {
					created_at: string | null;
					deleted_at: string | null;
					description: string | null;
					theme_id: string;
					theme_name: string;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string | null;
					deleted_at?: string | null;
					description?: string | null;
					theme_id?: string;
					theme_name: string;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string | null;
					deleted_at?: string | null;
					description?: string | null;
					theme_id?: string;
					theme_name?: string;
					updated_at?: string | null;
				};
				Relationships: [];
			};
			mst_user: {
				Row: {
					bio: string | null;
					birth_date: string | null;
					company_address: string | null;
					company_name: string | null;
					company_name_kana: string | null;
					created_at: string | null;
					daihyosha_id: string | null;
					deleted_at: string | null;
					email: string;
					icon: string | null;
					industry_id: string | null;
					invite_link: string | null;
					is_bio_visible: boolean | null;
					is_birth_date_visible: boolean | null;
					is_company_address_visible: boolean | null;
					is_company_name_kana_visible: boolean | null;
					is_company_name_visible: boolean | null;
					is_email_visible: boolean | null;
					is_industry_id_visible: boolean | null;
					is_nickname_visible: boolean | null;
					is_phone_number_visible: boolean | null;
					is_profile_public: boolean | null;
					is_sns_visible: boolean | null;
					is_user_name_kana_visible: boolean | null;
					is_user_position_visible: boolean | null;
					is_user_type_visible: boolean | null;
					is_username_visible: boolean | null;
					is_website_url_visible: boolean | null;
					last_login_at: string | null;
					last_payment_date: string | null;
					nickname: string | null;
					phone_number: string | null;
					social_media_links: Json | null;
					updated_at: string | null;
					user_id: string;
					user_name_kana: string | null;
					user_position: string | null;
					user_type: string | null;
					username: string | null;
					website_url: string | null;
				};
				Insert: {
					bio?: string | null;
					birth_date?: string | null;
					company_address?: string | null;
					company_name?: string | null;
					company_name_kana?: string | null;
					created_at?: string | null;
					daihyosha_id?: string | null;
					deleted_at?: string | null;
					email: string;
					icon?: string | null;
					industry_id?: string | null;
					invite_link?: string | null;
					is_bio_visible?: boolean | null;
					is_birth_date_visible?: boolean | null;
					is_company_address_visible?: boolean | null;
					is_company_name_kana_visible?: boolean | null;
					is_company_name_visible?: boolean | null;
					is_email_visible?: boolean | null;
					is_industry_id_visible?: boolean | null;
					is_nickname_visible?: boolean | null;
					is_phone_number_visible?: boolean | null;
					is_profile_public?: boolean | null;
					is_sns_visible?: boolean | null;
					is_user_name_kana_visible?: boolean | null;
					is_user_position_visible?: boolean | null;
					is_user_type_visible?: boolean | null;
					is_username_visible?: boolean | null;
					is_website_url_visible?: boolean | null;
					last_login_at?: string | null;
					last_payment_date?: string | null;
					nickname?: string | null;
					phone_number?: string | null;
					social_media_links?: Json | null;
					updated_at?: string | null;
					user_id: string;
					user_name_kana?: string | null;
					user_position?: string | null;
					user_type?: string | null;
					username?: string | null;
					website_url?: string | null;
				};
				Update: {
					bio?: string | null;
					birth_date?: string | null;
					company_address?: string | null;
					company_name?: string | null;
					company_name_kana?: string | null;
					created_at?: string | null;
					daihyosha_id?: string | null;
					deleted_at?: string | null;
					email?: string;
					icon?: string | null;
					industry_id?: string | null;
					invite_link?: string | null;
					is_bio_visible?: boolean | null;
					is_birth_date_visible?: boolean | null;
					is_company_address_visible?: boolean | null;
					is_company_name_kana_visible?: boolean | null;
					is_company_name_visible?: boolean | null;
					is_email_visible?: boolean | null;
					is_industry_id_visible?: boolean | null;
					is_nickname_visible?: boolean | null;
					is_phone_number_visible?: boolean | null;
					is_profile_public?: boolean | null;
					is_sns_visible?: boolean | null;
					is_user_name_kana_visible?: boolean | null;
					is_user_position_visible?: boolean | null;
					is_user_type_visible?: boolean | null;
					is_username_visible?: boolean | null;
					is_website_url_visible?: boolean | null;
					last_login_at?: string | null;
					last_payment_date?: string | null;
					nickname?: string | null;
					phone_number?: string | null;
					social_media_links?: Json | null;
					updated_at?: string | null;
					user_id?: string;
					user_name_kana?: string | null;
					user_position?: string | null;
					user_type?: string | null;
					username?: string | null;
					website_url?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'mst_user_daihyosha_id_fkey';
						columns: ['daihyosha_id'];
						isOneToOne: false;
						referencedRelation: 'mst_user';
						referencedColumns: ['user_id'];
					},
					{
						foreignKeyName: 'mst_user_industry_id_fkey';
						columns: ['industry_id'];
						isOneToOne: false;
						referencedRelation: 'mst_industry';
						referencedColumns: ['industry_id'];
					},
				];
			};
			trn_answer: {
				Row: {
					answer_id: string;
					content: string;
					created_at: string | null;
					deleted_at: string | null;
					instructor_id: string;
					is_draft: boolean | null;
					question_id: string;
					updated_at: string | null;
				};
				Insert: {
					answer_id?: string;
					content: string;
					created_at?: string | null;
					deleted_at?: string | null;
					instructor_id: string;
					is_draft?: boolean | null;
					question_id: string;
					updated_at?: string | null;
				};
				Update: {
					answer_id?: string;
					content?: string;
					created_at?: string | null;
					deleted_at?: string | null;
					instructor_id?: string;
					is_draft?: boolean | null;
					question_id?: string;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'trn_answer_instructor_id_fkey';
						columns: ['instructor_id'];
						isOneToOne: false;
						referencedRelation: 'mst_user';
						referencedColumns: ['user_id'];
					},
					{
						foreignKeyName: 'trn_answer_question_id_fkey';
						columns: ['question_id'];
						isOneToOne: false;
						referencedRelation: 'trn_question';
						referencedColumns: ['question_id'];
					},
				];
			};
			trn_broadcast_history: {
				Row: {
					broadcast_id: string;
					content: string;
					created_at: string;
					deleted_at: string | null;
					is_sent: boolean;
					updated_at: string;
				};
				Insert: {
					broadcast_id?: string;
					content: string;
					created_at?: string;
					deleted_at?: string | null;
					is_sent?: boolean;
					updated_at?: string;
				};
				Update: {
					broadcast_id?: string;
					content?: string;
					created_at?: string;
					deleted_at?: string | null;
					is_sent?: boolean;
					updated_at?: string;
				};
				Relationships: [];
			};
			trn_broadcast_target_user: {
				Row: {
					broadcast_id: string;
					created_at: string;
					deleted_at: string | null;
					is_sent: boolean;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					broadcast_id: string;
					created_at?: string;
					deleted_at?: string | null;
					is_sent?: boolean;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					broadcast_id?: string;
					created_at?: string;
					deleted_at?: string | null;
					is_sent?: boolean;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'fk_broadcast';
						columns: ['broadcast_id'];
						isOneToOne: false;
						referencedRelation: 'trn_broadcast_history';
						referencedColumns: ['broadcast_id'];
					},
					{
						foreignKeyName: 'fk_user';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'mst_user';
						referencedColumns: ['user_id'];
					},
				];
			};
			trn_consultation_application: {
				Row: {
					application_id: string;
					consultation_id: string;
					created_at: string | null;
					deleted_at: string | null;
					is_first_consultation: boolean;
					is_urgent: boolean;
					notes: string | null;
					selected_candidate_id: string | null;
					selection_status: string;
					updated_at: string | null;
					user_id: string;
				};
				Insert: {
					application_id?: string;
					consultation_id: string;
					created_at?: string | null;
					deleted_at?: string | null;
					is_first_consultation?: boolean;
					is_urgent?: boolean;
					notes?: string | null;
					selected_candidate_id?: string | null;
					selection_status: string;
					updated_at?: string | null;
					user_id: string;
				};
				Update: {
					application_id?: string;
					consultation_id?: string;
					created_at?: string | null;
					deleted_at?: string | null;
					is_first_consultation?: boolean;
					is_urgent?: boolean;
					notes?: string | null;
					selected_candidate_id?: string | null;
					selection_status?: string;
					updated_at?: string | null;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'trn_consultation_application_consultation_id_fkey';
						columns: ['consultation_id'];
						isOneToOne: false;
						referencedRelation: 'mst_consultation';
						referencedColumns: ['consultation_id'];
					},
					{
						foreignKeyName: 'trn_consultation_application_selected_candidate_id_fkey';
						columns: ['selected_candidate_id'];
						isOneToOne: false;
						referencedRelation: 'mst_consultation_schedule';
						referencedColumns: ['schedule_id'];
					},
					{
						foreignKeyName: 'trn_consultation_application_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'mst_user';
						referencedColumns: ['user_id'];
					},
				];
			};
			trn_consultation_attendee: {
				Row: {
					created_at: string | null;
					deleted_at: string | null;
					event_id: string;
					is_first_consultation: boolean;
					is_urgent: boolean;
					notes: string | null;
					updated_at: string | null;
					user_id: string;
				};
				Insert: {
					created_at?: string | null;
					deleted_at?: string | null;
					event_id: string;
					is_first_consultation?: boolean;
					is_urgent?: boolean;
					notes?: string | null;
					updated_at?: string | null;
					user_id: string;
				};
				Update: {
					created_at?: string | null;
					deleted_at?: string | null;
					event_id?: string;
					is_first_consultation?: boolean;
					is_urgent?: boolean;
					notes?: string | null;
					updated_at?: string | null;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'trn_consultation_attendee_event_id_fkey';
						columns: ['event_id'];
						isOneToOne: false;
						referencedRelation: 'mst_event';
						referencedColumns: ['event_id'];
					},
					{
						foreignKeyName: 'trn_consultation_attendee_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'mst_user';
						referencedColumns: ['user_id'];
					},
				];
			};
			trn_consultation_question: {
				Row: {
					consultation_id: string;
					created_at: string | null;
					deleted_at: string | null;
					display_order: number;
					is_required: boolean | null;
					options: Json | null;
					question_id: string;
					question_type: string;
					title: string;
					updated_at: string | null;
				};
				Insert: {
					consultation_id: string;
					created_at?: string | null;
					deleted_at?: string | null;
					display_order: number;
					is_required?: boolean | null;
					options?: Json | null;
					question_id?: string;
					question_type: string;
					title: string;
					updated_at?: string | null;
				};
				Update: {
					consultation_id?: string;
					created_at?: string | null;
					deleted_at?: string | null;
					display_order?: number;
					is_required?: boolean | null;
					options?: Json | null;
					question_id?: string;
					question_type?: string;
					title?: string;
					updated_at?: string | null;
				};
				Relationships: [];
			};
			trn_consultation_question_answer: {
				Row: {
					answer: Json;
					answer_id: string;
					application_id: string;
					created_at: string | null;
					deleted_at: string | null;
					question_id: string;
					updated_at: string | null;
				};
				Insert: {
					answer: Json;
					answer_id?: string;
					application_id: string;
					created_at?: string | null;
					deleted_at?: string | null;
					question_id: string;
					updated_at?: string | null;
				};
				Update: {
					answer?: Json;
					answer_id?: string;
					application_id?: string;
					created_at?: string | null;
					deleted_at?: string | null;
					question_id?: string;
					updated_at?: string | null;
				};
				Relationships: [];
			};
			trn_consultation_schedule_candidate: {
				Row: {
					application_id: string;
					candidate_id: string;
					created_at: string | null;
					deleted_at: string | null;
					priority: number;
					updated_at: string | null;
				};
				Insert: {
					application_id: string;
					candidate_id: string;
					created_at?: string | null;
					deleted_at?: string | null;
					priority: number;
					updated_at?: string | null;
				};
				Update: {
					application_id?: string;
					candidate_id?: string;
					created_at?: string | null;
					deleted_at?: string | null;
					priority?: number;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'trn_consultation_schedule_candidate_application_id_fkey';
						columns: ['application_id'];
						isOneToOne: false;
						referencedRelation: 'trn_consultation_application';
						referencedColumns: ['application_id'];
					},
					{
						foreignKeyName: 'trn_consultation_schedule_candidate_candidate_id_fkey';
						columns: ['candidate_id'];
						isOneToOne: false;
						referencedRelation: 'mst_consultation_schedule';
						referencedColumns: ['schedule_id'];
					},
				];
			};
			trn_dm_memo: {
				Row: {
					assignee: string | null;
					content: string;
					created_at: string | null;
					deleted_at: string | null;
					memo_id: string;
					thread_id: string;
					title: string;
					updated_at: string | null;
				};
				Insert: {
					assignee?: string | null;
					content: string;
					created_at?: string | null;
					deleted_at?: string | null;
					memo_id?: string;
					thread_id: string;
					title: string;
					updated_at?: string | null;
				};
				Update: {
					assignee?: string | null;
					content?: string;
					created_at?: string | null;
					deleted_at?: string | null;
					memo_id?: string;
					thread_id?: string;
					title?: string;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'trn_dm_memo_assignee_fkey';
						columns: ['assignee'];
						isOneToOne: false;
						referencedRelation: 'mst_user';
						referencedColumns: ['user_id'];
					},
					{
						foreignKeyName: 'trn_dm_memo_thread_id_fkey';
						columns: ['thread_id'];
						isOneToOne: false;
						referencedRelation: 'mst_dm_thread';
						referencedColumns: ['thread_id'];
					},
				];
			};
			trn_dm_message: {
				Row: {
					content: string | null;
					created_at: string | null;
					deleted_at: string | null;
					is_inquiry: boolean;
					is_read: boolean | null;
					is_sent: boolean | null;
					message_id: string;
					thread_id: string;
					updated_at: string | null;
					user_id: string;
				};
				Insert: {
					content?: string | null;
					created_at?: string | null;
					deleted_at?: string | null;
					is_inquiry?: boolean;
					is_read?: boolean | null;
					is_sent?: boolean | null;
					message_id?: string;
					thread_id: string;
					updated_at?: string | null;
					user_id: string;
				};
				Update: {
					content?: string | null;
					created_at?: string | null;
					deleted_at?: string | null;
					is_inquiry?: boolean;
					is_read?: boolean | null;
					is_sent?: boolean | null;
					message_id?: string;
					thread_id?: string;
					updated_at?: string | null;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'trn_dm_message_thread_id_fkey';
						columns: ['thread_id'];
						isOneToOne: false;
						referencedRelation: 'mst_dm_thread';
						referencedColumns: ['thread_id'];
					},
					{
						foreignKeyName: 'trn_dm_message_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'mst_user';
						referencedColumns: ['user_id'];
					},
				];
			};
			trn_dm_message_image: {
				Row: {
					created_at: string | null;
					deleted_at: string | null;
					display_order: number;
					image_id: string;
					image_url: string;
					message_id: string;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string | null;
					deleted_at?: string | null;
					display_order: number;
					image_id?: string;
					image_url: string;
					message_id: string;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string | null;
					deleted_at?: string | null;
					display_order?: number;
					image_id?: string;
					image_url?: string;
					message_id?: string;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'trn_dm_message_image_message_id_fkey';
						columns: ['message_id'];
						isOneToOne: false;
						referencedRelation: 'trn_dm_message';
						referencedColumns: ['message_id'];
					},
				];
			};
			trn_dm_thread_label: {
				Row: {
					created_at: string | null;
					deleted_at: string | null;
					label_id: string;
					thread_id: string;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string | null;
					deleted_at?: string | null;
					label_id: string;
					thread_id: string;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string | null;
					deleted_at?: string | null;
					label_id?: string;
					thread_id?: string;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'trn_dm_thread_label_label_id_fkey';
						columns: ['label_id'];
						isOneToOne: false;
						referencedRelation: 'mst_dm_label';
						referencedColumns: ['label_id'];
					},
					{
						foreignKeyName: 'trn_dm_thread_label_thread_id_fkey';
						columns: ['thread_id'];
						isOneToOne: true;
						referencedRelation: 'mst_dm_thread';
						referencedColumns: ['thread_id'];
					},
				];
			};
			trn_dm_thread_tag: {
				Row: {
					created_at: string | null;
					deleted_at: string | null;
					tag_id: string;
					thread_id: string;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string | null;
					deleted_at?: string | null;
					tag_id: string;
					thread_id: string;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string | null;
					deleted_at?: string | null;
					tag_id?: string;
					thread_id?: string;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'trn_dm_thread_tag_tag_id_fkey';
						columns: ['tag_id'];
						isOneToOne: false;
						referencedRelation: 'mst_dm_tag';
						referencedColumns: ['tag_id'];
					},
					{
						foreignKeyName: 'trn_dm_thread_tag_thread_id_fkey';
						columns: ['thread_id'];
						isOneToOne: false;
						referencedRelation: 'mst_dm_thread';
						referencedColumns: ['thread_id'];
					},
				];
			};
			trn_event_archive_file: {
				Row: {
					archive_id: string;
					created_at: string | null;
					deleted_at: string | null;
					display_order: number;
					file_id: string;
					file_name: string | null;
					file_url: string;
					is_sawabe_instructor: boolean | null;
					theme_id: string | null;
					updated_at: string | null;
				};
				Insert: {
					archive_id: string;
					created_at?: string | null;
					deleted_at?: string | null;
					display_order: number;
					file_id?: string;
					file_name?: string | null;
					file_url: string;
					is_sawabe_instructor?: boolean | null;
					theme_id?: string | null;
					updated_at?: string | null;
				};
				Update: {
					archive_id?: string;
					created_at?: string | null;
					deleted_at?: string | null;
					display_order?: number;
					file_id?: string;
					file_name?: string | null;
					file_url?: string;
					is_sawabe_instructor?: boolean | null;
					theme_id?: string | null;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'trn_event_archive_file_archive_id_fkey';
						columns: ['archive_id'];
						isOneToOne: false;
						referencedRelation: 'mst_event_archive';
						referencedColumns: ['archive_id'];
					},
				];
			};
			trn_event_archive_video: {
				Row: {
					archive_id: string;
					created_at: string | null;
					deleted_at: string | null;
					display_order: number;
					is_sawabe_instructor: boolean | null;
					theme_id: string | null;
					updated_at: string | null;
					video_id: string;
					video_image_url: string | null;
					video_url: string;
				};
				Insert: {
					archive_id: string;
					created_at?: string | null;
					deleted_at?: string | null;
					display_order: number;
					is_sawabe_instructor?: boolean | null;
					theme_id?: string | null;
					updated_at?: string | null;
					video_id?: string;
					video_image_url?: string | null;
					video_url: string;
				};
				Update: {
					archive_id?: string;
					created_at?: string | null;
					deleted_at?: string | null;
					display_order?: number;
					is_sawabe_instructor?: boolean | null;
					theme_id?: string | null;
					updated_at?: string | null;
					video_id?: string;
					video_image_url?: string | null;
					video_url?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'trn_event_archive_video_archive_id_fkey';
						columns: ['archive_id'];
						isOneToOne: false;
						referencedRelation: 'mst_event_archive';
						referencedColumns: ['archive_id'];
					},
				];
			};
			trn_event_archive_visible_group: {
				Row: {
					archive_id: string;
					created_at: string;
					deleted_at: string | null;
					group_id: string;
					id: string;
					updated_at: string;
				};
				Insert: {
					archive_id: string;
					created_at?: string;
					deleted_at?: string | null;
					group_id: string;
					id?: string;
					updated_at?: string;
				};
				Update: {
					archive_id?: string;
					created_at?: string;
					deleted_at?: string | null;
					group_id?: string;
					id?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			trn_event_attendee: {
				Row: {
					created_at: string | null;
					deleted_at: string | null;
					event_id: string;
					is_offline: boolean;
					updated_at: string | null;
					user_id: string;
				};
				Insert: {
					created_at?: string | null;
					deleted_at?: string | null;
					event_id: string;
					is_offline: boolean;
					updated_at?: string | null;
					user_id: string;
				};
				Update: {
					created_at?: string | null;
					deleted_at?: string | null;
					event_id?: string;
					is_offline?: boolean;
					updated_at?: string | null;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'trn_event_attendee_event_id_fkey';
						columns: ['event_id'];
						isOneToOne: false;
						referencedRelation: 'mst_event';
						referencedColumns: ['event_id'];
					},
					{
						foreignKeyName: 'trn_event_attendee_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'mst_user';
						referencedColumns: ['user_id'];
					},
				];
			};
			trn_event_question: {
				Row: {
					created_at: string | null;
					deleted_at: string | null;
					display_order: number;
					event_id: string;
					is_required: boolean | null;
					options: Json | null;
					question_id: string;
					question_type: string;
					title: string;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string | null;
					deleted_at?: string | null;
					display_order: number;
					event_id: string;
					is_required?: boolean | null;
					options?: Json | null;
					question_id?: string;
					question_type: string;
					title: string;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string | null;
					deleted_at?: string | null;
					display_order?: number;
					event_id?: string;
					is_required?: boolean | null;
					options?: Json | null;
					question_id?: string;
					question_type?: string;
					title?: string;
					updated_at?: string | null;
				};
				Relationships: [];
			};
			trn_event_question_answer: {
				Row: {
					answer: Json;
					answer_id: string;
					created_at: string | null;
					deleted_at: string | null;
					question_id: string;
					updated_at: string | null;
					user_id: string;
				};
				Insert: {
					answer: Json;
					answer_id?: string;
					created_at?: string | null;
					deleted_at?: string | null;
					question_id: string;
					updated_at?: string | null;
					user_id: string;
				};
				Update: {
					answer?: Json;
					answer_id?: string;
					created_at?: string | null;
					deleted_at?: string | null;
					question_id?: string;
					updated_at?: string | null;
					user_id?: string;
				};
				Relationships: [];
			};
			trn_event_visible_group: {
				Row: {
					created_at: string | null;
					deleted_at: string | null;
					event_id: string;
					group_id: string;
					id: string;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string | null;
					deleted_at?: string | null;
					event_id: string;
					group_id: string;
					id?: string;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string | null;
					deleted_at?: string | null;
					event_id?: string;
					group_id?: string;
					id?: string;
					updated_at?: string | null;
				};
				Relationships: [];
			};
			trn_gather_attendee: {
				Row: {
					created_at: string | null;
					deleted_at: string | null;
					event_id: string;
					payment_amount: number;
					payment_date: string | null;
					receipt_download_count: number | null;
					stripe_payment_intent_id: string;
					stripe_payment_status: string | null;
					updated_at: string | null;
					user_id: string;
				};
				Insert: {
					created_at?: string | null;
					deleted_at?: string | null;
					event_id: string;
					payment_amount: number;
					payment_date?: string | null;
					receipt_download_count?: number | null;
					stripe_payment_intent_id: string;
					stripe_payment_status?: string | null;
					updated_at?: string | null;
					user_id: string;
				};
				Update: {
					created_at?: string | null;
					deleted_at?: string | null;
					event_id?: string;
					payment_amount?: number;
					payment_date?: string | null;
					receipt_download_count?: number | null;
					stripe_payment_intent_id?: string;
					stripe_payment_status?: string | null;
					updated_at?: string | null;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'trn_gather_attendee_event_id_fkey';
						columns: ['event_id'];
						isOneToOne: false;
						referencedRelation: 'mst_event';
						referencedColumns: ['event_id'];
					},
					{
						foreignKeyName: 'trn_gather_attendee_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'mst_user';
						referencedColumns: ['user_id'];
					},
				];
			};
			trn_group_user: {
				Row: {
					created_at: string | null;
					deleted_at: string | null;
					group_id: string;
					updated_at: string | null;
					user_id: string;
				};
				Insert: {
					created_at?: string | null;
					deleted_at?: string | null;
					group_id: string;
					updated_at?: string | null;
					user_id: string;
				};
				Update: {
					created_at?: string | null;
					deleted_at?: string | null;
					group_id?: string;
					updated_at?: string | null;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'trn_group_user_group_id_fkey';
						columns: ['group_id'];
						isOneToOne: false;
						referencedRelation: 'mst_group';
						referencedColumns: ['group_id'];
					},
					{
						foreignKeyName: 'trn_group_user_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'mst_user';
						referencedColumns: ['user_id'];
					},
				];
			};
			trn_inquiry_answer: {
				Row: {
					admin_id: string;
					answer_id: string;
					content: string;
					created_at: string | null;
					deleted_at: string | null;
					inquiry_id: string;
					updated_at: string | null;
				};
				Insert: {
					admin_id: string;
					answer_id?: string;
					content: string;
					created_at?: string | null;
					deleted_at?: string | null;
					inquiry_id: string;
					updated_at?: string | null;
				};
				Update: {
					admin_id?: string;
					answer_id?: string;
					content?: string;
					created_at?: string | null;
					deleted_at?: string | null;
					inquiry_id?: string;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'trn_inquiry_answer_admin_id_fkey';
						columns: ['admin_id'];
						isOneToOne: false;
						referencedRelation: 'mst_user';
						referencedColumns: ['user_id'];
					},
					{
						foreignKeyName: 'trn_inquiry_answer_inquiry_id_fkey';
						columns: ['inquiry_id'];
						isOneToOne: false;
						referencedRelation: 'mst_inquiry';
						referencedColumns: ['inquiry_id'];
					},
				];
			};
			trn_invite: {
				Row: {
					created_at: string;
					deleted_at: string | null;
					invite_link: string;
					inviter_id: string;
					recipient_id: string;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string;
					deleted_at?: string | null;
					invite_link: string;
					inviter_id: string;
					recipient_id: string;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string;
					deleted_at?: string | null;
					invite_link?: string;
					inviter_id?: string;
					recipient_id?: string;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'trn_invite_invite_link_fkey';
						columns: ['invite_link'];
						isOneToOne: false;
						referencedRelation: 'mst_user';
						referencedColumns: ['invite_link'];
					},
					{
						foreignKeyName: 'trn_invite_inviter_id_fkey';
						columns: ['inviter_id'];
						isOneToOne: false;
						referencedRelation: 'mst_user';
						referencedColumns: ['user_id'];
					},
					{
						foreignKeyName: 'trn_invite_recipient_id_fkey';
						columns: ['recipient_id'];
						isOneToOne: false;
						referencedRelation: 'mst_user';
						referencedColumns: ['user_id'];
					},
				];
			};
			trn_nfc_exchange: {
				Row: {
					created_at: string | null;
					deleted_at: string | null;
					event_id: string | null;
					updated_at: string | null;
					user_id_1: string;
					user_id_2: string;
				};
				Insert: {
					created_at?: string | null;
					deleted_at?: string | null;
					event_id?: string | null;
					updated_at?: string | null;
					user_id_1: string;
					user_id_2: string;
				};
				Update: {
					created_at?: string | null;
					deleted_at?: string | null;
					event_id?: string | null;
					updated_at?: string | null;
					user_id_1?: string;
					user_id_2?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'trn_nfc_exchange_event_id_fkey';
						columns: ['event_id'];
						isOneToOne: false;
						referencedRelation: 'mst_event';
						referencedColumns: ['event_id'];
					},
					{
						foreignKeyName: 'trn_nfc_exchange_user_id_1_fkey';
						columns: ['user_id_1'];
						isOneToOne: false;
						referencedRelation: 'mst_user';
						referencedColumns: ['user_id'];
					},
					{
						foreignKeyName: 'trn_nfc_exchange_user_id_2_fkey';
						columns: ['user_id_2'];
						isOneToOne: false;
						referencedRelation: 'mst_user';
						referencedColumns: ['user_id'];
					},
				];
			};
			trn_notice_file: {
				Row: {
					created_at: string | null;
					deleted_at: string | null;
					display_order: number;
					file_id: string;
					file_name: string | null;
					file_url: string;
					notice_id: string;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string | null;
					deleted_at?: string | null;
					display_order: number;
					file_id?: string;
					file_name?: string | null;
					file_url: string;
					notice_id: string;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string | null;
					deleted_at?: string | null;
					display_order?: number;
					file_id?: string;
					file_name?: string | null;
					file_url?: string;
					notice_id?: string;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'trn_notice_file_notice_id_fkey';
						columns: ['notice_id'];
						isOneToOne: false;
						referencedRelation: 'mst_notice';
						referencedColumns: ['notice_id'];
					},
				];
			};
			trn_notice_visible_group: {
				Row: {
					created_at: string | null;
					deleted_at: string | null;
					group_id: string;
					id: string;
					notice_id: string;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string | null;
					deleted_at?: string | null;
					group_id: string;
					id?: string;
					notice_id: string;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string | null;
					deleted_at?: string | null;
					group_id?: string;
					id?: string;
					notice_id?: string;
					updated_at?: string | null;
				};
				Relationships: [];
			};
			trn_question: {
				Row: {
					content: string;
					created_at: string | null;
					deleted_at: string | null;
					instructor_id: string;
					is_anonymous: boolean | null;
					is_hidden: boolean | null;
					question_id: string;
					status: string;
					updated_at: string | null;
					user_id: string;
				};
				Insert: {
					content: string;
					created_at?: string | null;
					deleted_at?: string | null;
					instructor_id: string;
					is_anonymous?: boolean | null;
					is_hidden?: boolean | null;
					question_id?: string;
					status?: string;
					updated_at?: string | null;
					user_id: string;
				};
				Update: {
					content?: string;
					created_at?: string | null;
					deleted_at?: string | null;
					instructor_id?: string;
					is_anonymous?: boolean | null;
					is_hidden?: boolean | null;
					question_id?: string;
					status?: string;
					updated_at?: string | null;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'trn_question_instructor_id_fkey';
						columns: ['instructor_id'];
						isOneToOne: false;
						referencedRelation: 'mst_user';
						referencedColumns: ['user_id'];
					},
					{
						foreignKeyName: 'trn_question_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'mst_user';
						referencedColumns: ['user_id'];
					},
				];
			};
			trn_radio_visible_group: {
				Row: {
					created_at: string;
					deleted_at: string | null;
					group_id: string;
					id: string;
					radio_id: string;
					updated_at: string;
				};
				Insert: {
					created_at?: string;
					deleted_at?: string | null;
					group_id: string;
					id?: string;
					radio_id: string;
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					deleted_at?: string | null;
					group_id?: string;
					id?: string;
					radio_id?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'fk_group';
						columns: ['group_id'];
						isOneToOne: false;
						referencedRelation: 'mst_group';
						referencedColumns: ['group_id'];
					},
					{
						foreignKeyName: 'fk_radio';
						columns: ['radio_id'];
						isOneToOne: false;
						referencedRelation: 'mst_radio';
						referencedColumns: ['radio_id'];
					},
				];
			};
			trn_receipt_history: {
				Row: {
					amount: number;
					created_at: string | null;
					deleted_at: string | null;
					description: string | null;
					is_dashboard_issued: boolean | null;
					is_email_issued: boolean | null;
					name: string;
					notes: string | null;
					number: string;
					receipt_id: string;
					stripe_payment_intent_id: string | null;
					updated_at: string | null;
					user_id: string;
				};
				Insert: {
					amount: number;
					created_at?: string | null;
					deleted_at?: string | null;
					description?: string | null;
					is_dashboard_issued?: boolean | null;
					is_email_issued?: boolean | null;
					name: string;
					notes?: string | null;
					number: string;
					receipt_id?: string;
					stripe_payment_intent_id?: string | null;
					updated_at?: string | null;
					user_id: string;
				};
				Update: {
					amount?: number;
					created_at?: string | null;
					deleted_at?: string | null;
					description?: string | null;
					is_dashboard_issued?: boolean | null;
					is_email_issued?: boolean | null;
					name?: string;
					notes?: string | null;
					number?: string;
					receipt_id?: string;
					stripe_payment_intent_id?: string | null;
					updated_at?: string | null;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'trn_receipt_history_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'mst_user';
						referencedColumns: ['user_id'];
					},
				];
			};
			trn_survey_answer: {
				Row: {
					answer: Json;
					answer_id: string;
					created_at: string | null;
					deleted_at: string | null;
					detail_id: string;
					is_anonymous: boolean | null;
					survey_id: string;
					updated_at: string | null;
					user_id: string;
				};
				Insert: {
					answer: Json;
					answer_id?: string;
					created_at?: string | null;
					deleted_at?: string | null;
					detail_id: string;
					is_anonymous?: boolean | null;
					survey_id: string;
					updated_at?: string | null;
					user_id: string;
				};
				Update: {
					answer?: Json;
					answer_id?: string;
					created_at?: string | null;
					deleted_at?: string | null;
					detail_id?: string;
					is_anonymous?: boolean | null;
					survey_id?: string;
					updated_at?: string | null;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'trn_survey_answer_detail_id_fkey';
						columns: ['detail_id'];
						isOneToOne: false;
						referencedRelation: 'mst_survey_detail';
						referencedColumns: ['detail_id'];
					},
					{
						foreignKeyName: 'trn_survey_answer_survey_id_fkey';
						columns: ['survey_id'];
						isOneToOne: false;
						referencedRelation: 'mst_survey';
						referencedColumns: ['survey_id'];
					},
					{
						foreignKeyName: 'trn_survey_answer_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'mst_user';
						referencedColumns: ['user_id'];
					},
				];
			};
			trn_user_guide_progress: {
				Row: {
					created_at: string | null;
					deleted_at: string | null;
					guide_item_id: string | null;
					is_completed: boolean | null;
					progress_id: string;
					updated_at: string | null;
					user_id: string | null;
				};
				Insert: {
					created_at?: string | null;
					deleted_at?: string | null;
					guide_item_id?: string | null;
					is_completed?: boolean | null;
					progress_id?: string;
					updated_at?: string | null;
					user_id?: string | null;
				};
				Update: {
					created_at?: string | null;
					deleted_at?: string | null;
					guide_item_id?: string | null;
					is_completed?: boolean | null;
					progress_id?: string;
					updated_at?: string | null;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'trn_user_guide_progress_guide_item_id_fkey';
						columns: ['guide_item_id'];
						isOneToOne: false;
						referencedRelation: 'mst_beginner_guide_item';
						referencedColumns: ['guide_item_id'];
					},
					{
						foreignKeyName: 'trn_user_guide_progress_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'mst_user';
						referencedColumns: ['user_id'];
					},
				];
			};
			trn_user_notification: {
				Row: {
					created_at: string | null;
					deleted_at: string | null;
					notification_id: string;
					read_at: string | null;
					updated_at: string | null;
					user_id: string;
					user_notification_id: string;
				};
				Insert: {
					created_at?: string | null;
					deleted_at?: string | null;
					notification_id: string;
					read_at?: string | null;
					updated_at?: string | null;
					user_id: string;
					user_notification_id?: string;
				};
				Update: {
					created_at?: string | null;
					deleted_at?: string | null;
					notification_id?: string;
					read_at?: string | null;
					updated_at?: string | null;
					user_id?: string;
					user_notification_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'trn_user_notification_notification_id_fkey';
						columns: ['notification_id'];
						isOneToOne: false;
						referencedRelation: 'mst_notification';
						referencedColumns: ['notification_id'];
					},
					{
						foreignKeyName: 'trn_user_notification_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'mst_user';
						referencedColumns: ['user_id'];
					},
				];
			};
		};
		Views: {
			test_results: {
				Row: {
					count: string | null;
					item: string | null;
				};
				Relationships: [];
			};
		};
		Functions: {
			app_get_event_detail: { Args: { p_event_id: string }; Returns: Json };
			apply_event_registration:
				| {
						Args: {
							p_allow_revive?: boolean;
							p_dry_run?: boolean;
							p_event_id: string;
							p_idempotency_key?: string;
							p_is_offline_text: string;
						};
						Returns: Json;
				  }
				| {
						Args: {
							p_allow_revive?: boolean;
							p_answers?: Json;
							p_dry_run?: boolean;
							p_event_id: string;
							p_idempotency_key?: string;
							p_is_offline_text: string;
						};
						Returns: Json;
				  };
			check_consultation_required_answers: {
				Args: { p_answers: Json };
				Returns: Json;
			};
			count_active_notices: { Args: never; Returns: number };
			create_application_with_candidates: {
				Args: {
					p_answers: Json;
					p_candidate_ids: string[];
					p_consultation_id: string;
					p_is_first_consultation: boolean;
					p_is_urgent: boolean;
					p_notes: string;
				};
				Returns: {
					application_id: string;
					consultation_id: string;
					created_at: string;
					inserted_answers: number;
					inserted_candidates: number;
					is_first_consultation: boolean;
					is_urgent: boolean;
					notes: string;
					selected_candidate_id: string;
					selection_status: string;
					updated_at: string;
					user_id: string;
				}[];
			};
			create_consultation_application: {
				Args: {
					p_consultation_id: string;
					p_is_first_consultation: boolean;
					p_is_urgent: boolean;
					p_notes?: string;
				};
				Returns: string;
			};
			create_consultation_with_candidates: {
				Args: {
					p_candidates: Json;
					p_consultation_id: string;
					p_is_first_consultation: boolean;
					p_is_urgent: boolean;
					p_notes: string;
				};
				Returns: {
					application_id: string;
					inserted_candidates: number;
					selection_status: string;
				}[];
			};
			event_attendee_canse: {
				Args: {
					p_delete_consultation: boolean;
					p_delete_event: boolean;
					p_delete_gather: boolean;
					p_event_id: string;
					p_user_id: string;
				};
				Returns: Json;
			};
			fetch_dm_page_data: {
				Args: {
					p_current_user_id: string;
					p_limit?: number;
					p_offset?: number;
				};
				Returns: Json;
			};
			get_event_city: {
				Args: never;
				Returns: {
					event_city: string;
				}[];
			};
			get_lecturer_options: {
				Args: { p_include_all?: boolean };
				Returns: {
					label: string;
					value: string;
				}[];
			};
			get_mst_consultations_now: {
				Args: never;
				Returns: {
					application_end_datetime: string;
					application_start_datetime: string;
					consultation_id: string;
					created_at: string | null;
					deleted_at: string | null;
					description: string | null;
					image_url: string | null;
					instructor_id: string;
					is_draft: boolean | null;
					publish_end_at: string | null;
					publish_start_at: string | null;
					spreadsheet_id: string | null;
					title: string | null;
					updated_at: string | null;
				}[];
				SetofOptions: {
					from: '*';
					to: 'mst_consultation';
					isOneToOne: false;
					isSetofReturn: true;
				};
			};
			get_my_groups: { Args: never; Returns: Json };
			get_my_memberships: { Args: never; Returns: string[] };
			get_unread_notification_count: {
				Args: { p_user_id: string };
				Returns: number;
			};
			get_user_attended_events: { Args: { p_user_id: string }; Returns: Json };
			get_user_group: { Args: { p_user_id: string }; Returns: Json };
			home_event_offline: {
				Args: never;
				Returns: {
					event_end_datetime: string;
					event_id: string;
					event_location: string;
					event_name: string;
					event_start_datetime: string;
					image_url: string;
				}[];
			};
			home_event_online: {
				Args: never;
				Returns: {
					event_end_datetime: string;
					event_id: string;
					event_location: string;
					event_name: string;
					event_start_datetime: string;
					image_url: string;
				}[];
			};
			insert_consultation_answers: {
				Args: { p_answers: Json; p_application_id: string };
				Returns: {
					inserted_count: number;
				}[];
			};
			insert_consultation_application: {
				Args: {
					p_answers: Json;
					p_candidate_ids: string[];
					p_consultation_id: string;
					p_is_first_consultation: boolean;
					p_is_urgent: boolean;
					p_notes: string;
				};
				Returns: {
					application_id: string;
					consultation_id: string;
					created_at: string;
					inserted_answers: number;
					inserted_candidates: number;
					is_first_consultation: boolean;
					is_urgent: boolean;
					notes: string;
					selected_candidate_id: string;
					selection_status: string;
					updated_at: string;
					user_id: string;
				}[];
			};
			is_member_of_boki: { Args: never; Returns: boolean };
			is_notification_enabled_for_user: {
				Args: { p_notification_type: string; p_user_id: string };
				Returns: boolean;
			};
			list_bookkeeping_events: {
				Args: {
					cities?: string[];
					joined?: string;
					order_key?: string;
					p_limit?: number;
					p_offset?: number;
					q_title?: string;
				};
				Returns: {
					attendee_count: number;
					event_capacity: number;
					event_city: string;
					event_description: string;
					event_end_datetime: string;
					event_files: Json;
					event_id: string;
					event_location: string;
					event_name: string;
					event_start_datetime: string;
					event_type: string;
					has_questions: boolean;
					image_url: string;
					is_joined: boolean;
					is_offline: boolean;
					is_offline_full: boolean;
					offline_attendee_count: number;
					publish_end_at: string;
					publish_start_at: string;
					registration_end_datetime: string;
					registration_start_datetime: string;
					registration_status_code: number;
					spreadsheet_id: string;
					total_count: number;
				}[];
			};
			list_events_latest: {
				Args: {
					limit_count?: number;
					login_user_id?: string;
					offset_count?: number;
					tz?: string;
				};
				Returns: {
					apply_status: number;
					attendee_count: number;
					consultation_capacity: number;
					event_capacity: number;
					event_city: string;
					event_description: string;
					event_end_datetime: string;
					event_id: string;
					event_location: string;
					event_name: string;
					event_start_datetime: string;
					event_type: string;
					event_type_name: string;
					files: Json;
					gather_capacity: number;
					gather_end_time: string;
					gather_location: string;
					gather_price: number;
					gather_start_time: string;
					has_consultation: boolean;
					has_gather: boolean;
					image_url: string;
					is_full: boolean;
					is_joined: boolean;
					publish_end_at: string;
					publish_start_at: string;
					registration_end_datetime: string;
					registration_start_datetime: string;
					spreadsheet_id: string;
					total_count: number;
				}[];
			};
			mark_event_attendee_deleted: {
				Args: { p_event_id: string; p_user_id: string };
				Returns: boolean;
			};
			process_archive_notifications_cron: { Args: never; Returns: Json };
			process_event_notifications_cron: { Args: never; Returns: Json };
			rpc_get_event_archives: {
				Args: {
					p_event_type_name?: string;
					p_sort?: string;
					p_year_filter?: string;
				};
				Returns: {
					archive_id: string;
					created_at: string;
					description: string;
					event_id: string;
					event_start_date_str: string;
					event_start_datetime: string;
					event_type_id: number;
					event_type_name: string;
					file_count: number;
					image_url: string;
					publish_end_at: string;
					publish_start_at: string;
					title: string;
					video_count: number;
				}[];
			};
			rpc_get_event_detail: { Args: { p_event_id: string }; Returns: Json };
			rpc_get_event_questions: {
				Args: { p_event_id: string };
				Returns: {
					display_order: number;
					event_id: string;
					is_required: boolean;
					options: Json;
					question_id: string;
					question_type: string;
					title: string;
				}[];
			};
			rpc_get_event_questions_with_answer: {
				Args: { p_event_id: string };
				Returns: {
					answer: string;
					answer_id: string;
					answerList: string[];
					display_order: number;
					event_id: string;
					is_required: boolean;
					options: Json;
					question_id: string;
					question_type: string;
					title: string;
				}[];
			};
			rpc_get_regular_meetings: {
				Args: {
					p_event_type_name?: string;
					p_sort?: string;
					p_year_filter?: string;
				};
				Returns: {
					archive_id: string;
					created_at: string;
					description: string;
					event_id: string;
					event_start_date_str: string;
					event_start_datetime: string;
					event_type_id: string;
					event_type_name: string;
					file_count: number;
					image_url: string;
					publish_end_at: string;
					publish_start_at: string;
					title: string;
					video_count: number;
				}[];
			};
			rpc_get_visible_notices: {
				Args: { p_user_id: string };
				Returns: {
					category_id: string;
					category_name: string;
					content: string;
					created_at: string;
					files: Json;
					notice_id: string;
					publish_end_at: string;
					publish_start_at: string;
					title: string;
				}[];
			};
			rpc_list_regular_meeting_years: {
				Args: never;
				Returns: {
					year: number;
				}[];
			};
			search_event_archive_by_type:
				| {
						Args: { p_type_name: string };
						Returns: {
							archive_id: string;
							description: string;
							file_count: number;
							title: string;
							video_count: number;
						}[];
				  }
				| {
						Args: { p_sort?: string; p_type_name: string };
						Returns: {
							archive_id: string;
							description: string;
							file_count: number;
							title: string;
							video_count: number;
						}[];
				  }
				| {
						Args: {
							p_sort?: string;
							p_type_name: string;
							p_year_filter?: string;
						};
						Returns: {
							archive_id: string;
							description: string;
							file_count: number;
							title: string;
							video_count: number;
						}[];
				  };
			search_event_archives: {
				Args: {
					p_limit?: number;
					p_offset?: number;
					p_sort?: string;
					p_type_name: string;
					p_year_filter?: string;
				};
				Returns: {
					created_at: string;
					description: string;
					event_id: string;
					event_start_date_str: string;
					event_start_datetime: string;
					file_count: number;
					publish_end_at: string;
					publish_start_at: string;
					title: string;
					type_id: string;
					type_name: string;
					video_count: number;
				}[];
			};
			search_events: {
				Args: {
					cities?: string[];
					event_type_ids?: string[];
					formats?: string[];
					joined_filter?: string;
					limit_count?: number;
					login_user_id?: string;
					offset_count?: number;
					search_text?: string;
					sort?: string;
				};
				Returns: {
					apply_status: number;
					attendee_count: number;
					consultation_capacity: number;
					event_capacity: number;
					event_city: string;
					event_description: string;
					event_end_datetime: string;
					event_id: string;
					event_location: string;
					event_name: string;
					event_start_datetime: string;
					event_type: string;
					event_type_name: string;
					files: Json;
					gather_capacity: number;
					gather_end_time: string;
					gather_location: string;
					gather_price: number;
					gather_start_time: string;
					has_consultation: boolean;
					has_gather: boolean;
					image_url: string;
					is_full: boolean;
					is_joined: boolean;
					publish_end_at: string;
					publish_start_at: string;
					registration_end_datetime: string;
					registration_start_datetime: string;
					spreadsheet_id: string;
					total_count: number;
				}[];
			};
			soft_delete_consultation_application: {
				Args: { p_application_id: string };
				Returns: Json;
			};
			soft_delete_event_attendee: {
				Args: { _event_id: string; _user_id?: string };
				Returns: boolean;
			};
			update_consultation_bundle_flat: {
				Args: {
					p_answers?: Json;
					p_application_id: string;
					p_candidate_ids: string[];
					p_consultation_id: string;
					p_is_first_consultation: boolean;
					p_is_urgent: boolean;
					p_notes: string;
					p_previous_updated_at?: string;
				};
				Returns: {
					application_id: string;
					consultation_id: string;
					created_at: string;
					inserted_candidates: number;
					is_first_consultation: boolean;
					is_urgent: boolean;
					notes: string;
					updated_answers: number;
					updated_at: string;
					user_id: string;
				}[];
			};
			upsert_event_survey_answers: {
				Args: { p_answers: Json; p_event_id: string };
				Returns: Json;
			};
			validate_required: { Args: { items: Json }; Returns: Json };
			whoami: { Args: never; Returns: Json };
			your_function_name:
				| {
						Args: { p_event_type_name?: string };
						Returns: {
							created_at: string;
							description: string;
							event_id: number;
							event_start_date_str: string;
							event_start_datetime: string;
							event_type_id: number;
							event_type_name: string;
							file_count: number;
							image_url: string;
							publish_end_at: string;
							publish_start_at: string;
							title: string;
							video_count: number;
						}[];
				  }
				| {
						Args: {
							p_event_type_name?: string;
							p_limit: number;
							p_now: string;
							p_offset: number;
							p_sort?: string;
							p_year: number;
						};
						Returns: {
							created_at: string;
							description: string;
							event_id: number;
							event_start_date_str: string;
							event_start_datetime: string;
							event_type_id: number;
							event_type_name: string;
							file_count: number;
							image_url: string;
							publish_end_at: string;
							publish_start_at: string;
							title: string;
							video_count: number;
						}[];
				  };
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
	keyof Database,
	'public'
>];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
				DefaultSchema['Views'])
		? (DefaultSchema['Tables'] &
				DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema['Tables']
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema['Tables']
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
		| keyof DefaultSchema['Enums']
		| { schema: keyof DatabaseWithoutInternals },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
		: never = never,
> = DefaultSchemaEnumNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
		? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema['CompositeTypes']
		| { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
		: never = never,
> = PublicCompositeTypeNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
		? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
		: never;

export const Constants = {
	graphql_public: {
		Enums: {},
	},
	public: {
		Enums: {},
	},
} as const;

// Schema: graphql_public
// Functions
export type ArgsGraphql =
	Database['graphql_public']['Functions']['graphql']['Args'];
export type ReturnTypeGraphql =
	Database['graphql_public']['Functions']['graphql']['Returns'];

// Schema: public
// Tables
export type MstArchiveType =
	Database['public']['Tables']['mst_archive_type']['Row'];
export type InsertMstArchiveType =
	Database['public']['Tables']['mst_archive_type']['Insert'];
export type UpdateMstArchiveType =
	Database['public']['Tables']['mst_archive_type']['Update'];

export type MstBeginnerGuideFile =
	Database['public']['Tables']['mst_beginner_guide_file']['Row'];
export type InsertMstBeginnerGuideFile =
	Database['public']['Tables']['mst_beginner_guide_file']['Insert'];
export type UpdateMstBeginnerGuideFile =
	Database['public']['Tables']['mst_beginner_guide_file']['Update'];

export type MstBeginnerGuideItem =
	Database['public']['Tables']['mst_beginner_guide_item']['Row'];
export type InsertMstBeginnerGuideItem =
	Database['public']['Tables']['mst_beginner_guide_item']['Insert'];
export type UpdateMstBeginnerGuideItem =
	Database['public']['Tables']['mst_beginner_guide_item']['Update'];

export type MstBeginnerGuideVideo =
	Database['public']['Tables']['mst_beginner_guide_video']['Row'];
export type InsertMstBeginnerGuideVideo =
	Database['public']['Tables']['mst_beginner_guide_video']['Insert'];
export type UpdateMstBeginnerGuideVideo =
	Database['public']['Tables']['mst_beginner_guide_video']['Update'];

export type MstConsultation =
	Database['public']['Tables']['mst_consultation']['Row'];
export type InsertMstConsultation =
	Database['public']['Tables']['mst_consultation']['Insert'];
export type UpdateMstConsultation =
	Database['public']['Tables']['mst_consultation']['Update'];

export type MstConsultationSchedule =
	Database['public']['Tables']['mst_consultation_schedule']['Row'];
export type InsertMstConsultationSchedule =
	Database['public']['Tables']['mst_consultation_schedule']['Insert'];
export type UpdateMstConsultationSchedule =
	Database['public']['Tables']['mst_consultation_schedule']['Update'];

export type MstDmLabel = Database['public']['Tables']['mst_dm_label']['Row'];
export type InsertMstDmLabel =
	Database['public']['Tables']['mst_dm_label']['Insert'];
export type UpdateMstDmLabel =
	Database['public']['Tables']['mst_dm_label']['Update'];

export type MstDmTag = Database['public']['Tables']['mst_dm_tag']['Row'];
export type InsertMstDmTag =
	Database['public']['Tables']['mst_dm_tag']['Insert'];
export type UpdateMstDmTag =
	Database['public']['Tables']['mst_dm_tag']['Update'];

export type MstDmThread = Database['public']['Tables']['mst_dm_thread']['Row'];
export type InsertMstDmThread =
	Database['public']['Tables']['mst_dm_thread']['Insert'];
export type UpdateMstDmThread =
	Database['public']['Tables']['mst_dm_thread']['Update'];

export type MstEvent = Database['public']['Tables']['mst_event']['Row'];
export type InsertMstEvent =
	Database['public']['Tables']['mst_event']['Insert'];
export type UpdateMstEvent =
	Database['public']['Tables']['mst_event']['Update'];

export type MstEventArchive =
	Database['public']['Tables']['mst_event_archive']['Row'];
export type InsertMstEventArchive =
	Database['public']['Tables']['mst_event_archive']['Insert'];
export type UpdateMstEventArchive =
	Database['public']['Tables']['mst_event_archive']['Update'];

export type MstEventFile =
	Database['public']['Tables']['mst_event_file']['Row'];
export type InsertMstEventFile =
	Database['public']['Tables']['mst_event_file']['Insert'];
export type UpdateMstEventFile =
	Database['public']['Tables']['mst_event_file']['Update'];

export type MstEventType =
	Database['public']['Tables']['mst_event_type']['Row'];
export type InsertMstEventType =
	Database['public']['Tables']['mst_event_type']['Insert'];
export type UpdateMstEventType =
	Database['public']['Tables']['mst_event_type']['Update'];

export type MstFaq = Database['public']['Tables']['mst_faq']['Row'];
export type InsertMstFaq = Database['public']['Tables']['mst_faq']['Insert'];
export type UpdateMstFaq = Database['public']['Tables']['mst_faq']['Update'];

export type MstGroup = Database['public']['Tables']['mst_group']['Row'];
export type InsertMstGroup =
	Database['public']['Tables']['mst_group']['Insert'];
export type UpdateMstGroup =
	Database['public']['Tables']['mst_group']['Update'];

export type MstIndustry = Database['public']['Tables']['mst_industry']['Row'];
export type InsertMstIndustry =
	Database['public']['Tables']['mst_industry']['Insert'];
export type UpdateMstIndustry =
	Database['public']['Tables']['mst_industry']['Update'];

export type MstInquiry = Database['public']['Tables']['mst_inquiry']['Row'];
export type InsertMstInquiry =
	Database['public']['Tables']['mst_inquiry']['Insert'];
export type UpdateMstInquiry =
	Database['public']['Tables']['mst_inquiry']['Update'];

export type MstMeetingLink =
	Database['public']['Tables']['mst_meeting_link']['Row'];
export type InsertMstMeetingLink =
	Database['public']['Tables']['mst_meeting_link']['Insert'];
export type UpdateMstMeetingLink =
	Database['public']['Tables']['mst_meeting_link']['Update'];

export type MstNotice = Database['public']['Tables']['mst_notice']['Row'];
export type InsertMstNotice =
	Database['public']['Tables']['mst_notice']['Insert'];
export type UpdateMstNotice =
	Database['public']['Tables']['mst_notice']['Update'];

export type MstNoticeCategory =
	Database['public']['Tables']['mst_notice_category']['Row'];
export type InsertMstNoticeCategory =
	Database['public']['Tables']['mst_notice_category']['Insert'];
export type UpdateMstNoticeCategory =
	Database['public']['Tables']['mst_notice_category']['Update'];

export type MstNotification =
	Database['public']['Tables']['mst_notification']['Row'];
export type InsertMstNotification =
	Database['public']['Tables']['mst_notification']['Insert'];
export type UpdateMstNotification =
	Database['public']['Tables']['mst_notification']['Update'];

export type MstNotificationSettings =
	Database['public']['Tables']['mst_notification_settings']['Row'];
export type InsertMstNotificationSettings =
	Database['public']['Tables']['mst_notification_settings']['Insert'];
export type UpdateMstNotificationSettings =
	Database['public']['Tables']['mst_notification_settings']['Update'];

export type MstQuestionManual =
	Database['public']['Tables']['mst_question_manual']['Row'];
export type InsertMstQuestionManual =
	Database['public']['Tables']['mst_question_manual']['Insert'];
export type UpdateMstQuestionManual =
	Database['public']['Tables']['mst_question_manual']['Update'];

export type MstRadio = Database['public']['Tables']['mst_radio']['Row'];
export type InsertMstRadio =
	Database['public']['Tables']['mst_radio']['Insert'];
export type UpdateMstRadio =
	Database['public']['Tables']['mst_radio']['Update'];

export type MstSurvey = Database['public']['Tables']['mst_survey']['Row'];
export type InsertMstSurvey =
	Database['public']['Tables']['mst_survey']['Insert'];
export type UpdateMstSurvey =
	Database['public']['Tables']['mst_survey']['Update'];

export type MstSurveyDetail =
	Database['public']['Tables']['mst_survey_detail']['Row'];
export type InsertMstSurveyDetail =
	Database['public']['Tables']['mst_survey_detail']['Insert'];
export type UpdateMstSurveyDetail =
	Database['public']['Tables']['mst_survey_detail']['Update'];

export type MstTheme = Database['public']['Tables']['mst_theme']['Row'];
export type InsertMstTheme =
	Database['public']['Tables']['mst_theme']['Insert'];
export type UpdateMstTheme =
	Database['public']['Tables']['mst_theme']['Update'];

export type MstUser = Database['public']['Tables']['mst_user']['Row'];
export type InsertMstUser = Database['public']['Tables']['mst_user']['Insert'];
export type UpdateMstUser = Database['public']['Tables']['mst_user']['Update'];

export type TrnAnswer = Database['public']['Tables']['trn_answer']['Row'];
export type InsertTrnAnswer =
	Database['public']['Tables']['trn_answer']['Insert'];
export type UpdateTrnAnswer =
	Database['public']['Tables']['trn_answer']['Update'];

export type TrnBroadcastHistory =
	Database['public']['Tables']['trn_broadcast_history']['Row'];
export type InsertTrnBroadcastHistory =
	Database['public']['Tables']['trn_broadcast_history']['Insert'];
export type UpdateTrnBroadcastHistory =
	Database['public']['Tables']['trn_broadcast_history']['Update'];

export type TrnBroadcastTargetUser =
	Database['public']['Tables']['trn_broadcast_target_user']['Row'];
export type InsertTrnBroadcastTargetUser =
	Database['public']['Tables']['trn_broadcast_target_user']['Insert'];
export type UpdateTrnBroadcastTargetUser =
	Database['public']['Tables']['trn_broadcast_target_user']['Update'];

export type TrnConsultationApplication =
	Database['public']['Tables']['trn_consultation_application']['Row'];
export type InsertTrnConsultationApplication =
	Database['public']['Tables']['trn_consultation_application']['Insert'];
export type UpdateTrnConsultationApplication =
	Database['public']['Tables']['trn_consultation_application']['Update'];

export type TrnConsultationAttendee =
	Database['public']['Tables']['trn_consultation_attendee']['Row'];
export type InsertTrnConsultationAttendee =
	Database['public']['Tables']['trn_consultation_attendee']['Insert'];
export type UpdateTrnConsultationAttendee =
	Database['public']['Tables']['trn_consultation_attendee']['Update'];

export type TrnConsultationQuestion =
	Database['public']['Tables']['trn_consultation_question']['Row'];
export type InsertTrnConsultationQuestion =
	Database['public']['Tables']['trn_consultation_question']['Insert'];
export type UpdateTrnConsultationQuestion =
	Database['public']['Tables']['trn_consultation_question']['Update'];

export type TrnConsultationQuestionAnswer =
	Database['public']['Tables']['trn_consultation_question_answer']['Row'];
export type InsertTrnConsultationQuestionAnswer =
	Database['public']['Tables']['trn_consultation_question_answer']['Insert'];
export type UpdateTrnConsultationQuestionAnswer =
	Database['public']['Tables']['trn_consultation_question_answer']['Update'];

export type TrnConsultationScheduleCandidate =
	Database['public']['Tables']['trn_consultation_schedule_candidate']['Row'];
export type InsertTrnConsultationScheduleCandidate =
	Database['public']['Tables']['trn_consultation_schedule_candidate']['Insert'];
export type UpdateTrnConsultationScheduleCandidate =
	Database['public']['Tables']['trn_consultation_schedule_candidate']['Update'];

export type TrnDmMemo = Database['public']['Tables']['trn_dm_memo']['Row'];
export type InsertTrnDmMemo =
	Database['public']['Tables']['trn_dm_memo']['Insert'];
export type UpdateTrnDmMemo =
	Database['public']['Tables']['trn_dm_memo']['Update'];

export type TrnDmMessage =
	Database['public']['Tables']['trn_dm_message']['Row'];
export type InsertTrnDmMessage =
	Database['public']['Tables']['trn_dm_message']['Insert'];
export type UpdateTrnDmMessage =
	Database['public']['Tables']['trn_dm_message']['Update'];

export type TrnDmMessageImage =
	Database['public']['Tables']['trn_dm_message_image']['Row'];
export type InsertTrnDmMessageImage =
	Database['public']['Tables']['trn_dm_message_image']['Insert'];
export type UpdateTrnDmMessageImage =
	Database['public']['Tables']['trn_dm_message_image']['Update'];

export type TrnDmThreadLabel =
	Database['public']['Tables']['trn_dm_thread_label']['Row'];
export type InsertTrnDmThreadLabel =
	Database['public']['Tables']['trn_dm_thread_label']['Insert'];
export type UpdateTrnDmThreadLabel =
	Database['public']['Tables']['trn_dm_thread_label']['Update'];

export type TrnDmThreadTag =
	Database['public']['Tables']['trn_dm_thread_tag']['Row'];
export type InsertTrnDmThreadTag =
	Database['public']['Tables']['trn_dm_thread_tag']['Insert'];
export type UpdateTrnDmThreadTag =
	Database['public']['Tables']['trn_dm_thread_tag']['Update'];

export type TrnEventArchiveFile =
	Database['public']['Tables']['trn_event_archive_file']['Row'];
export type InsertTrnEventArchiveFile =
	Database['public']['Tables']['trn_event_archive_file']['Insert'];
export type UpdateTrnEventArchiveFile =
	Database['public']['Tables']['trn_event_archive_file']['Update'];

export type TrnEventArchiveVideo =
	Database['public']['Tables']['trn_event_archive_video']['Row'];
export type InsertTrnEventArchiveVideo =
	Database['public']['Tables']['trn_event_archive_video']['Insert'];
export type UpdateTrnEventArchiveVideo =
	Database['public']['Tables']['trn_event_archive_video']['Update'];

export type TrnEventArchiveVisibleGroup =
	Database['public']['Tables']['trn_event_archive_visible_group']['Row'];
export type InsertTrnEventArchiveVisibleGroup =
	Database['public']['Tables']['trn_event_archive_visible_group']['Insert'];
export type UpdateTrnEventArchiveVisibleGroup =
	Database['public']['Tables']['trn_event_archive_visible_group']['Update'];

export type TrnEventAttendee =
	Database['public']['Tables']['trn_event_attendee']['Row'];
export type InsertTrnEventAttendee =
	Database['public']['Tables']['trn_event_attendee']['Insert'];
export type UpdateTrnEventAttendee =
	Database['public']['Tables']['trn_event_attendee']['Update'];

export type TrnEventQuestion =
	Database['public']['Tables']['trn_event_question']['Row'];
export type InsertTrnEventQuestion =
	Database['public']['Tables']['trn_event_question']['Insert'];
export type UpdateTrnEventQuestion =
	Database['public']['Tables']['trn_event_question']['Update'];

export type TrnEventQuestionAnswer =
	Database['public']['Tables']['trn_event_question_answer']['Row'];
export type InsertTrnEventQuestionAnswer =
	Database['public']['Tables']['trn_event_question_answer']['Insert'];
export type UpdateTrnEventQuestionAnswer =
	Database['public']['Tables']['trn_event_question_answer']['Update'];

export type TrnEventVisibleGroup =
	Database['public']['Tables']['trn_event_visible_group']['Row'];
export type InsertTrnEventVisibleGroup =
	Database['public']['Tables']['trn_event_visible_group']['Insert'];
export type UpdateTrnEventVisibleGroup =
	Database['public']['Tables']['trn_event_visible_group']['Update'];

export type TrnGatherAttendee =
	Database['public']['Tables']['trn_gather_attendee']['Row'];
export type InsertTrnGatherAttendee =
	Database['public']['Tables']['trn_gather_attendee']['Insert'];
export type UpdateTrnGatherAttendee =
	Database['public']['Tables']['trn_gather_attendee']['Update'];

export type TrnGroupUser =
	Database['public']['Tables']['trn_group_user']['Row'];
export type InsertTrnGroupUser =
	Database['public']['Tables']['trn_group_user']['Insert'];
export type UpdateTrnGroupUser =
	Database['public']['Tables']['trn_group_user']['Update'];

export type TrnInquiryAnswer =
	Database['public']['Tables']['trn_inquiry_answer']['Row'];
export type InsertTrnInquiryAnswer =
	Database['public']['Tables']['trn_inquiry_answer']['Insert'];
export type UpdateTrnInquiryAnswer =
	Database['public']['Tables']['trn_inquiry_answer']['Update'];

export type TrnInvite = Database['public']['Tables']['trn_invite']['Row'];
export type InsertTrnInvite =
	Database['public']['Tables']['trn_invite']['Insert'];
export type UpdateTrnInvite =
	Database['public']['Tables']['trn_invite']['Update'];

export type TrnNfcExchange =
	Database['public']['Tables']['trn_nfc_exchange']['Row'];
export type InsertTrnNfcExchange =
	Database['public']['Tables']['trn_nfc_exchange']['Insert'];
export type UpdateTrnNfcExchange =
	Database['public']['Tables']['trn_nfc_exchange']['Update'];

export type TrnNoticeFile =
	Database['public']['Tables']['trn_notice_file']['Row'];
export type InsertTrnNoticeFile =
	Database['public']['Tables']['trn_notice_file']['Insert'];
export type UpdateTrnNoticeFile =
	Database['public']['Tables']['trn_notice_file']['Update'];

export type TrnNoticeVisibleGroup =
	Database['public']['Tables']['trn_notice_visible_group']['Row'];
export type InsertTrnNoticeVisibleGroup =
	Database['public']['Tables']['trn_notice_visible_group']['Insert'];
export type UpdateTrnNoticeVisibleGroup =
	Database['public']['Tables']['trn_notice_visible_group']['Update'];

export type TrnQuestion = Database['public']['Tables']['trn_question']['Row'];
export type InsertTrnQuestion =
	Database['public']['Tables']['trn_question']['Insert'];
export type UpdateTrnQuestion =
	Database['public']['Tables']['trn_question']['Update'];

export type TrnRadioVisibleGroup =
	Database['public']['Tables']['trn_radio_visible_group']['Row'];
export type InsertTrnRadioVisibleGroup =
	Database['public']['Tables']['trn_radio_visible_group']['Insert'];
export type UpdateTrnRadioVisibleGroup =
	Database['public']['Tables']['trn_radio_visible_group']['Update'];

export type TrnReceiptHistory =
	Database['public']['Tables']['trn_receipt_history']['Row'];
export type InsertTrnReceiptHistory =
	Database['public']['Tables']['trn_receipt_history']['Insert'];
export type UpdateTrnReceiptHistory =
	Database['public']['Tables']['trn_receipt_history']['Update'];

export type TrnSurveyAnswer =
	Database['public']['Tables']['trn_survey_answer']['Row'];
export type InsertTrnSurveyAnswer =
	Database['public']['Tables']['trn_survey_answer']['Insert'];
export type UpdateTrnSurveyAnswer =
	Database['public']['Tables']['trn_survey_answer']['Update'];

export type TrnUserGuideProgress =
	Database['public']['Tables']['trn_user_guide_progress']['Row'];
export type InsertTrnUserGuideProgress =
	Database['public']['Tables']['trn_user_guide_progress']['Insert'];
export type UpdateTrnUserGuideProgress =
	Database['public']['Tables']['trn_user_guide_progress']['Update'];

export type TrnUserNotification =
	Database['public']['Tables']['trn_user_notification']['Row'];
export type InsertTrnUserNotification =
	Database['public']['Tables']['trn_user_notification']['Insert'];
export type UpdateTrnUserNotification =
	Database['public']['Tables']['trn_user_notification']['Update'];

// Views
export type TestResults = Database['public']['Views']['test_results']['Row'];

// Functions
export type ArgsFetchDmPageData =
	Database['public']['Functions']['fetch_dm_page_data']['Args'];
export type ReturnTypeFetchDmPageData =
	Database['public']['Functions']['fetch_dm_page_data']['Returns'];

export type ArgsGetEventCity =
	Database['public']['Functions']['get_event_city']['Args'];
export type ReturnTypeGetEventCity =
	Database['public']['Functions']['get_event_city']['Returns'];

export type ArgsIsNotificationEnabledForUser =
	Database['public']['Functions']['is_notification_enabled_for_user']['Args'];
export type ReturnTypeIsNotificationEnabledForUser =
	Database['public']['Functions']['is_notification_enabled_for_user']['Returns'];

export type ArgsGetMstConsultationsNow =
	Database['public']['Functions']['get_mst_consultations_now']['Args'];
export type ReturnTypeGetMstConsultationsNow =
	Database['public']['Functions']['get_mst_consultations_now']['Returns'];

export type ArgsGetMyGroups =
	Database['public']['Functions']['get_my_groups']['Args'];
export type ReturnTypeGetMyGroups =
	Database['public']['Functions']['get_my_groups']['Returns'];

export type ArgsGetMyMemberships =
	Database['public']['Functions']['get_my_memberships']['Args'];
export type ReturnTypeGetMyMemberships =
	Database['public']['Functions']['get_my_memberships']['Returns'];

export type ArgsGetUnreadNotificationCount =
	Database['public']['Functions']['get_unread_notification_count']['Args'];
export type ReturnTypeGetUnreadNotificationCount =
	Database['public']['Functions']['get_unread_notification_count']['Returns'];

export type ArgsGetUserAttendedEvents =
	Database['public']['Functions']['get_user_attended_events']['Args'];
export type ReturnTypeGetUserAttendedEvents =
	Database['public']['Functions']['get_user_attended_events']['Returns'];

export type ArgsGetUserGroup =
	Database['public']['Functions']['get_user_group']['Args'];
export type ReturnTypeGetUserGroup =
	Database['public']['Functions']['get_user_group']['Returns'];

export type ArgsHomeEventOffline =
	Database['public']['Functions']['home_event_offline']['Args'];
export type ReturnTypeHomeEventOffline =
	Database['public']['Functions']['home_event_offline']['Returns'];

export type ArgsHomeEventOnline =
	Database['public']['Functions']['home_event_online']['Args'];
export type ReturnTypeHomeEventOnline =
	Database['public']['Functions']['home_event_online']['Returns'];

export type ArgsInsertConsultationAnswers =
	Database['public']['Functions']['insert_consultation_answers']['Args'];
export type ReturnTypeInsertConsultationAnswers =
	Database['public']['Functions']['insert_consultation_answers']['Returns'];

export type ArgsInsertConsultationApplication =
	Database['public']['Functions']['insert_consultation_application']['Args'];
export type ReturnTypeInsertConsultationApplication =
	Database['public']['Functions']['insert_consultation_application']['Returns'];

export type ArgsIsMemberOfBoki =
	Database['public']['Functions']['is_member_of_boki']['Args'];
export type ReturnTypeIsMemberOfBoki =
	Database['public']['Functions']['is_member_of_boki']['Returns'];

export type ArgsListBookkeepingEvents =
	Database['public']['Functions']['list_bookkeeping_events']['Args'];
export type ReturnTypeListBookkeepingEvents =
	Database['public']['Functions']['list_bookkeeping_events']['Returns'];

export type ArgsListEventsLatest =
	Database['public']['Functions']['list_events_latest']['Args'];
export type ReturnTypeListEventsLatest =
	Database['public']['Functions']['list_events_latest']['Returns'];

export type ArgsMarkEventAttendeeDeleted =
	Database['public']['Functions']['mark_event_attendee_deleted']['Args'];
export type ReturnTypeMarkEventAttendeeDeleted =
	Database['public']['Functions']['mark_event_attendee_deleted']['Returns'];

export type ArgsProcessArchiveNotificationsCron =
	Database['public']['Functions']['process_archive_notifications_cron']['Args'];
export type ReturnTypeProcessArchiveNotificationsCron =
	Database['public']['Functions']['process_archive_notifications_cron']['Returns'];

export type ArgsProcessEventNotificationsCron =
	Database['public']['Functions']['process_event_notifications_cron']['Args'];
export type ReturnTypeProcessEventNotificationsCron =
	Database['public']['Functions']['process_event_notifications_cron']['Returns'];

export type ArgsRpcGetEventArchives =
	Database['public']['Functions']['rpc_get_event_archives']['Args'];
export type ReturnTypeRpcGetEventArchives =
	Database['public']['Functions']['rpc_get_event_archives']['Returns'];

export type ArgsRpcGetEventDetail =
	Database['public']['Functions']['rpc_get_event_detail']['Args'];
export type ReturnTypeRpcGetEventDetail =
	Database['public']['Functions']['rpc_get_event_detail']['Returns'];

export type ArgsRpcGetEventQuestions =
	Database['public']['Functions']['rpc_get_event_questions']['Args'];
export type ReturnTypeRpcGetEventQuestions =
	Database['public']['Functions']['rpc_get_event_questions']['Returns'];

export type ArgsRpcGetEventQuestionsWithAnswer =
	Database['public']['Functions']['rpc_get_event_questions_with_answer']['Args'];
export type ReturnTypeRpcGetEventQuestionsWithAnswer =
	Database['public']['Functions']['rpc_get_event_questions_with_answer']['Returns'];

export type ArgsRpcGetRegularMeetings =
	Database['public']['Functions']['rpc_get_regular_meetings']['Args'];
export type ReturnTypeRpcGetRegularMeetings =
	Database['public']['Functions']['rpc_get_regular_meetings']['Returns'];

export type ArgsRpcGetVisibleNotices =
	Database['public']['Functions']['rpc_get_visible_notices']['Args'];
export type ReturnTypeRpcGetVisibleNotices =
	Database['public']['Functions']['rpc_get_visible_notices']['Returns'];

export type ArgsRpcListRegularMeetingYears =
	Database['public']['Functions']['rpc_list_regular_meeting_years']['Args'];
export type ReturnTypeRpcListRegularMeetingYears =
	Database['public']['Functions']['rpc_list_regular_meeting_years']['Returns'];

export type ArgsSearchEventArchiveByType =
	Database['public']['Functions']['search_event_archive_by_type']['Args'];
export type ReturnTypeSearchEventArchiveByType =
	Database['public']['Functions']['search_event_archive_by_type']['Returns'];

export type ArgsSearchEventArchives =
	Database['public']['Functions']['search_event_archives']['Args'];
export type ReturnTypeSearchEventArchives =
	Database['public']['Functions']['search_event_archives']['Returns'];

export type ArgsSearchEvents =
	Database['public']['Functions']['search_events']['Args'];
export type ReturnTypeSearchEvents =
	Database['public']['Functions']['search_events']['Returns'];

export type ArgsSoftDeleteConsultationApplication =
	Database['public']['Functions']['soft_delete_consultation_application']['Args'];
export type ReturnTypeSoftDeleteConsultationApplication =
	Database['public']['Functions']['soft_delete_consultation_application']['Returns'];

export type ArgsSoftDeleteEventAttendee =
	Database['public']['Functions']['soft_delete_event_attendee']['Args'];
export type ReturnTypeSoftDeleteEventAttendee =
	Database['public']['Functions']['soft_delete_event_attendee']['Returns'];

export type ArgsUpdateConsultationBundleFlat =
	Database['public']['Functions']['update_consultation_bundle_flat']['Args'];
export type ReturnTypeUpdateConsultationBundleFlat =
	Database['public']['Functions']['update_consultation_bundle_flat']['Returns'];

export type ArgsUpsertEventSurveyAnswers =
	Database['public']['Functions']['upsert_event_survey_answers']['Args'];
export type ReturnTypeUpsertEventSurveyAnswers =
	Database['public']['Functions']['upsert_event_survey_answers']['Returns'];

export type ArgsValidateRequired =
	Database['public']['Functions']['validate_required']['Args'];
export type ReturnTypeValidateRequired =
	Database['public']['Functions']['validate_required']['Returns'];

export type ArgsWhoami = Database['public']['Functions']['whoami']['Args'];
export type ReturnTypeWhoami =
	Database['public']['Functions']['whoami']['Returns'];

export type ArgsYourFunctionName =
	Database['public']['Functions']['your_function_name']['Args'];
export type ReturnTypeYourFunctionName =
	Database['public']['Functions']['your_function_name']['Returns'];
