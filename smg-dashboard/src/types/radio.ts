export type Radio = {
  radio_id: string;
  radio_name: string;
  image_url: string | null;
  radio_url: string | null;
  publish_start_at: string | null;
  publish_end_at: string | null;
  radio_description: string | null;
  is_draft: boolean | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type RadioFormData = {
  radio_name: string;
  image_url?: string;
  radio_url?: string;
  publish_start_at?: string;
  publish_end_at?: string;
  radio_description?: string;
  image?: File | null;
  selectedGroupIds?: string[];
  is_draft?: boolean;
};

export type RadioVisibleGroup = {
  id: string;
  radio_id: string;
  group_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
