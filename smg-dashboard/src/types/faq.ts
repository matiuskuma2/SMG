export type Faq = {
  faq_id: string;
  title: string;
  description: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type FaqInput = {
  title: string;
  description: string;
  display_order: number;
};
