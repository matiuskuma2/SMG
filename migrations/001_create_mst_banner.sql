-- Create mst_banner table for managing top page carousel banners
CREATE TABLE IF NOT EXISTS public.mst_banner (
  banner_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  image_url text NOT NULL,
  href text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Enable RLS
ALTER TABLE public.mst_banner ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active banners (for frontend)
CREATE POLICY "Allow public read for active banners" ON public.mst_banner
  FOR SELECT USING (is_active = true AND deleted_at IS NULL);

-- Allow service_role full access (for admin dashboard)  
CREATE POLICY "Allow service_role full access on banners" ON public.mst_banner
  FOR ALL USING (true) WITH CHECK (true);

-- Create storage bucket for banner images
INSERT INTO storage.buckets (id, name, public)
VALUES ('banner_image', 'banner_image', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: allow public read
CREATE POLICY "Allow public read for banner images" ON storage.objects
  FOR SELECT USING (bucket_id = 'banner_image');

-- Storage policy: allow authenticated users to upload
CREATE POLICY "Allow authenticated upload for banner images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'banner_image');

-- Storage policy: allow authenticated update
CREATE POLICY "Allow authenticated update for banner images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'banner_image');

-- Storage policy: allow authenticated delete
CREATE POLICY "Allow authenticated delete for banner images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'banner_image');

-- Insert initial banner data (matching current hardcoded values)
INSERT INTO public.mst_banner (title, image_url, href, sort_order) VALUES
  ('定例会 ゲスト講師一覧', '/top/banners/2_0.png', '/notice/23db5fa0-6554-4e37-a176-07ec34e41b64', 1),
  ('初めての方、使い方に不安がある方', '/top/banners/3_0.png', '/beginner', 2),
  ('イベント・各種お申し込み一覧', '/top/banners/4_0.png', '/events', 3),
  ('アーカイブ動画はこちらから', '/top/banners/5_0.png', '/archive', 4);

-- ==========================================
-- 懇親会の申込締切日を別に設定可能にする
-- ==========================================
ALTER TABLE public.mst_event 
ADD COLUMN IF NOT EXISTS gather_registration_end_datetime timestamptz;

COMMENT ON COLUMN public.mst_event.gather_registration_end_datetime IS '懇親会専用の申込締切日時。NULLの場合はregistration_end_datetimeを使用';
