-- ==============================================
-- タブ管理機能 マイグレーション
-- Supabase SQL Editorで実行してください
-- ==============================================

-- 1. タブマスタテーブル
CREATE TABLE IF NOT EXISTS mst_tab (
  tab_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL,
  link_type TEXT NOT NULL CHECK (link_type IN ('notice', 'shibu', 'event', 'external', 'internal')),
  link_value TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('public', 'draft')),
  is_visible_to_all BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_mst_tab_display_order ON mst_tab (display_order) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_mst_tab_status ON mst_tab (status) WHERE deleted_at IS NULL;

-- 2. タブ表示グループテーブル
CREATE TABLE IF NOT EXISTS trn_tab_visible_group (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tab_id UUID NOT NULL REFERENCES mst_tab(tab_id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES mst_group(group_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- 部分ユニーク制約（論理削除されていないレコードのみ）
CREATE UNIQUE INDEX IF NOT EXISTS idx_trn_tab_visible_group_unique
ON trn_tab_visible_group (tab_id, group_id) WHERE deleted_at IS NULL;

-- インデックス
CREATE INDEX IF NOT EXISTS idx_trn_tab_visible_group_tab ON trn_tab_visible_group (tab_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_trn_tab_visible_group_group ON trn_tab_visible_group (group_id) WHERE deleted_at IS NULL;

-- 3. RLS 有効化
ALTER TABLE mst_tab ENABLE ROW LEVEL SECURITY;
ALTER TABLE trn_tab_visible_group ENABLE ROW LEVEL SECURITY;

-- 4. RLS ポリシー
-- service_role は全操作可能
CREATE POLICY "service_role_all_mst_tab" ON mst_tab FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "authenticated_select_mst_tab" ON mst_tab FOR SELECT
  USING (auth.role() = 'authenticated' AND deleted_at IS NULL);

CREATE POLICY "service_role_all_trn_tab_visible_group" ON trn_tab_visible_group FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "authenticated_select_trn_tab_visible_group" ON trn_tab_visible_group FOR SELECT
  USING (auth.role() = 'authenticated' AND deleted_at IS NULL);

-- 5. updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_mst_tab_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_mst_tab_updated_at
  BEFORE UPDATE ON mst_tab
  FOR EACH ROW
  EXECUTE FUNCTION update_mst_tab_updated_at();
