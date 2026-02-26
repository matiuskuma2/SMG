import { createClient } from "@/lib/supabase";
import type { Database } from "@/lib/supabase/types";

/**
 * FAQ情報の型定義
 */
export type FaqItem = {
  id: string; // UUID
  title: string;
  description: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

/**
 * FAQデータを取得する
 */
export async function getFaqs(searchTerm?: string): Promise<FaqItem[]> {
  const supabase = createClient();

  let query = supabase
    .from("mst_faq")
    .select("faq_id, title, description, display_order, created_at, updated_at")
    .is("deleted_at", null)
    .order("display_order", { ascending: true });

  // 検索条件がある場合はフィルタリング
  if (searchTerm?.trim()) {
    query = query.or(
      `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching FAQs:", error);
    throw new Error("FAQの取得に失敗しました");
  }

  return (
    data?.map((faq) => ({
      id: faq.faq_id,
      title: faq.title,
      description: faq.description || "",
      displayOrder: faq.display_order,
      createdAt: faq.created_at || "",
      updatedAt: faq.updated_at || "",
    })) || []
  );
}

/**
 * 特定のFAQを取得する
 */
export async function getFaqById(id: string): Promise<FaqItem | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("mst_faq")
    .select("faq_id, title, description, display_order, created_at, updated_at")
    .eq("faq_id", id)
    .is("deleted_at", null)
    .single();

  if (error) {
    console.error("Error fetching FAQ:", error);
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.faq_id,
    title: data.title,
    description: data.description || "",
    displayOrder: data.display_order,
    createdAt: data.created_at || "",
    updatedAt: data.updated_at || "",
  };
}
