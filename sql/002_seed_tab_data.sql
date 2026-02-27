-- ==============================================
-- タブ管理機能 初期データ投入
-- 001_create_tab_tables.sql 実行後に実行してください
-- ==============================================

-- 既存の静的ルート定義をDBに移行
INSERT INTO mst_tab (display_name, link_type, link_value, display_order, status, is_visible_to_all) VALUES
  ('TOP', 'internal', '/', 1, 'public', true),
  ('講座・イベント予約', 'event', '/events', 2, 'public', true),
  ('ご利用ガイド', 'internal', '/beginner', 3, 'public', true),
  ('お知らせ', 'notice', '/notice', 4, 'public', true),
  ('個別相談予約', 'internal', '/consultations', 5, 'public', true),
  ('動画・写真', 'internal', '/archive', 6, 'public', true),
  ('SMGラジオ', 'internal', '/radio', 7, 'public', true),
  ('講師に質問', 'internal', '/questions', 8, 'public', true),
  ('よくある質問', 'internal', '/faq', 9, 'public', true),
  ('簿記3期', 'internal', '/bookkeeping', 10, 'public', false),
  ('支部', 'shibu', '/shibu', 11, 'public', false),
  ('マスター講座', 'internal', '/master-course', 12, 'public', false);

-- グループ制限付きタブの visible_group を設定
-- 簿記3期
INSERT INTO trn_tab_visible_group (tab_id, group_id)
SELECT t.tab_id, g.group_id
FROM mst_tab t, mst_group g
WHERE t.display_name = '簿記3期' AND t.deleted_at IS NULL
  AND g.title = '簿記3期' AND g.deleted_at IS NULL;

-- 支部
INSERT INTO trn_tab_visible_group (tab_id, group_id)
SELECT t.tab_id, g.group_id
FROM mst_tab t, mst_group g
WHERE t.display_name = '支部' AND t.deleted_at IS NULL
  AND g.title = '支部' AND g.deleted_at IS NULL;

-- マスター講座
INSERT INTO trn_tab_visible_group (tab_id, group_id)
SELECT t.tab_id, g.group_id
FROM mst_tab t, mst_group g
WHERE t.display_name = 'マスター講座' AND t.deleted_at IS NULL
  AND g.title = 'マスター講座' AND g.deleted_at IS NULL;
