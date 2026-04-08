-- mst_event_type テーブルに show_in_event_list カラムを追加
-- イベントタイプごとに「講座・イベント予約一覧に表示するか」を制御するフラグ
-- デフォルトは true（既存のイベントタイプは一覧に表示される）
-- 簿記講座のような専用タブを持つイベントタイプは false に設定可能

ALTER TABLE mst_event_type
ADD COLUMN IF NOT EXISTS show_in_event_list BOOLEAN NOT NULL DEFAULT true;

-- コメント追加
COMMENT ON COLUMN mst_event_type.show_in_event_list IS 'trueの場合、講座・イベント予約一覧にも表示される。falseの場合は専用タブからのみアクセス可能。';

-- 注意: 簿記講座のshow_in_event_listをtrueにしたい場合は以下を実行:
-- UPDATE mst_event_type SET show_in_event_list = true WHERE event_type_name = '簿記講座';
-- ダッシュボードの管理画面からも変更可能。
