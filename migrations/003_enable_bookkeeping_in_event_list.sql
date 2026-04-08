-- 簿記講座を講座・イベント予約一覧にも表示するように設定
-- 以前のマイグレーション(002)でshow_in_event_listカラムを追加した際、
-- DEFAULT trueで追加されたが、簿記講座が専用タブのみ表示(false)のまま
-- 運用されていたため、明示的にtrueへ変更する。
--
-- ダッシュボードの「イベントタイプ表示設定」からも変更可能。
-- 再度非表示にしたい場合はダッシュボードからチェックを外すこと。

UPDATE mst_event_type
SET show_in_event_list = true
WHERE event_type_name = '簿記講座'
  AND deleted_at IS NULL;
