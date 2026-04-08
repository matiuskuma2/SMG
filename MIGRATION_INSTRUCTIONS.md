# show_in_event_list マイグレーション: 開発者向け指示書

**作成日**: 2026-04-08
**対象者**: SMG開発チーム
**優先度**: 高（本番環境に未適用のDBマイグレーションあり）

---

## 1. 状況サマリ

`mst_event_type` テーブルに `show_in_event_list` (BOOLEAN, DEFAULT true) カラムを追加する機能が
コードベースには既にマージ済み（コミット `7376fc8`）だが、**本番Supabase DBへのDDLマイグレーション（002）が未適用**。

その結果、ダッシュボードの「イベントタイプ表示設定」ダイアログと、フロントエンドの
`getEvents()` / `getEventTypes()` フィルタリングは、本番環境ではカラムが存在しないため
正常に動作しない（PostgRESTが未知カラムを無視するためエラーにはならないが、フィルタが効かない）。

APIルート経由・Vercel Serverless経由・psql直接接続のいずれもサンドボックスからは実行不可
であったため、**Supabase SQL Editor での手動適用が必要**。

---

## 2. 分類: Keep / Discard / Stop

### KEEP（変更不要・そのまま維持）

以下のコードは正しく実装されており、マイグレーション002適用後に正常動作する。

| ファイル | 説明 |
|---------|------|
| `smg-dashboard/src/components/eventlist/EventTypeSettingsDialog.tsx` | イベントタイプ表示設定ダイアログ（チェックボックスUI）|
| `smg-dashboard/src/app/eventlist/page.tsx` (L494付近) | EventTypeSettingsDialogの呼び出し |
| `smg-dashboard/src/components/eventlist/EventListHeader.tsx` | 表示設定ボタン |
| `smg-front/src/lib/api/event-type.ts` | `getEventTypes()` - show_in_event_listフラグでフィルタリング |
| `smg-front/src/lib/api/event.ts` (L247-344付近) | `getEvents()` - show_in_event_list=falseのイベントタイプを除外 |
| `migrations/002_add_show_in_event_list_to_event_type.sql` | DDLマイグレーション定義（参照用。実行はSQL Editorで） |
| `migrations/001_create_mst_banner.sql` | 別機能のマイグレーション（影響なし） |

### DISCARD（既に削除済み）

以下は既にコミット `cd8e4ac` で削除済み。リポジトリ `matiuskuma2/SMG` の `main` ブランチにプッシュ済み。

| ファイル | 理由 |
|---------|------|
| `migrations/003_enable_bookkeeping_in_event_list.sql` | 002適用後は不要なワークアラウンドSQL |
| `smg-dashboard/src/app/api/migrate/route.ts` | 一時的マイグレーションAPI（セキュリティリスク）|

**関連コミット履歴**:
- `4968674` - `feat: 一時的マイグレーションAPI追加` → **これは不要だった**
- `0918907` - `fix: 簿記講座を講座・イベント予約一覧に表示するマイグレーション追加` → **003は不要**
- `cd8e4ac` - `security: 一時的マイグレーションAPI・003ワークアラウンドSQLを削除` → **クリーンアップ完了**

### STOP（即時停止・削除済み）

| 項目 | 状態 | 詳細 |
|------|------|------|
| 一時的マイグレーションAPI (`/api/migrate`) | **削除済み** | service_role keyをコード内にハードコードするリスクがあった |
| Vercelプロジェクト `smg-migration-runner` | **削除済み** | Vercel API経由で削除完了 (prj_n6athlRmPoGdMA5cDi2WVUE4xFRl) |
| Vercelプレビューデプロイ (複数) | **停止** | smg-migration-runner削除に伴い無効化 |

---

## 3. 短期修復手順（要対応）

### Step 1: 本番DBへのマイグレーション適用 [必須・最優先]

**Supabase SQL Editor** ( https://supabase.com/dashboard → プロジェクト `zjeyqpwkpbkycyltxirr` → SQL Editor ) で以下を実行:

```sql
-- ===== マイグレーション 002: show_in_event_list カラム追加 =====
-- 冪等性あり: IF NOT EXISTS により二重実行しても安全

ALTER TABLE mst_event_type
ADD COLUMN IF NOT EXISTS show_in_event_list BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN mst_event_type.show_in_event_list
IS 'trueの場合、講座・イベント予約一覧にも表示される。falseの場合は専用タブからのみアクセス可能。';
```

### Step 2: 簿記講座の表示フラグ確認・更新

カラム追加後、DEFAULT true が適用されるため、通常は追加のUPDATEは不要。
ただし念のため確認:

```sql
-- 確認
SELECT event_type_id, event_type_name, show_in_event_list
FROM mst_event_type
WHERE deleted_at IS NULL
ORDER BY created_at;

-- 簿記講座がfalseになっている場合のみ実行:
UPDATE mst_event_type
SET show_in_event_list = true
WHERE event_type_name = '簿記講座'
  AND deleted_at IS NULL;
```

### Step 3: 適用確認

SQL Editor で以下を実行し、全行に `show_in_event_list` が表示されることを確認:

```sql
SELECT event_type_id, event_type_name, show_in_event_list, created_at
FROM mst_event_type
WHERE deleted_at IS NULL
ORDER BY created_at;
```

**期待される結果**: 全6レコードに `show_in_event_list = true` が設定されていること。

### Step 4: フロントエンド動作確認

1. https://www.smgkeieijuku.com/ にアクセス
2. 「講座・イベント予約」一覧に簿記講座が表示されることを確認
3. https://dashboard.smgkeieijuku.com/ にアクセス
4. 「講座・イベント」→ 「表示設定」ボタン → イベントタイプ表示設定ダイアログが正常表示されることを確認

---

## 4. セキュリティ対応（キーローテーション）[推奨]

今回の作業中に以下のクレデンシャルがサンドボックス環境・Vercel一時プロジェクトで使用された。
漏洩の証拠はないが、予防措置としてローテーションを推奨。

### 4-1. Supabase Service Role Key のローテーション

1. Supabase Dashboard → プロジェクト `zjeyqpwkpbkycyltxirr` → Settings → API
2. Service Role Key の「Regenerate」を実行
3. 新しいキーを以下に反映:
   - **Vercel環境変数** (`smg_dashboard` プロジェクト) → `SUPABASE_SERVICE_ROLE_KEY`
   - **ローカル開発** → `smg-dashboard/.env.local`
4. Vercel で smg_dashboard を再デプロイ

### 4-2. Vercel Token のローテーション

1. Vercel Dashboard → Settings → Tokens
2. 今回使用したトークン（`vcp_` で始まるもの）を無効化
3. 必要に応じて新しいトークンを発行

---

## 5. リポジトリ構成に関する注意事項

| リポジトリ | 用途 | 備考 |
|-----------|------|------|
| `HogWorks/smg_dashboard` | 本番ダッシュボード | Vercelと連携。本番デプロイはこちら |
| `HogWorks/smg_front` | 本番フロントエンド | Vercelと連携 |
| `matiuskuma2/SMG` | 開発用モノレポ | smg-dashboard + smg-front + migrations 等 |

**重要**: `matiuskuma2/SMG` への push は `HogWorks/smg_dashboard` の Vercel 自動デプロイをトリガーしない。
本番にデプロイする場合は `HogWorks/smg_dashboard` リポジトリへの反映が必要。

---

## 6. 現在の mst_event_type テーブル構造

### 現行（マイグレーション002適用前）
| カラム | 型 |
|--------|-----|
| event_type_id | UUID (PK) |
| event_type_name | TEXT |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |
| deleted_at | TIMESTAMP (nullable) |

### 目標（マイグレーション002適用後）
| カラム | 型 | 備考 |
|--------|-----|------|
| event_type_id | UUID (PK) | |
| event_type_name | TEXT | |
| **show_in_event_list** | **BOOLEAN NOT NULL DEFAULT true** | **新規追加** |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP (nullable) | |

### 現在のレコード一覧（6件）
| event_type_name | event_type_id |
|-----------------|---------------|
| 定例会 | 1926b50a-6f4f-4ff0-bdb6-fabe3ab8ed21 |
| PDCA会議実践講座 | 110061e0-2bc9-48b2-aa84-a174ac63f631 |
| 5大都市グループ相談会&交流会 | b5921d88-6281-4db3-90cf-814fff439c5e |
| 簿記講座 | a3a431cd-3943-4b06-ab3d-a71559d13738 |
| オンラインセミナー | 8b38e69c-42ef-4409-88bb-6b994271cd9b |
| 特別セミナー | 1d9f11b4-9938-456e-9cf3-6d65386edad6 |

---

## 7. チェックリスト

- [ ] Supabase SQL Editor でマイグレーション002を実行
- [ ] 全レコードの `show_in_event_list` が `true` であることを確認
- [ ] フロントエンド ( www.smgkeieijuku.com ) で簿記講座がイベント一覧に表示されることを確認
- [ ] ダッシュボード ( dashboard.smgkeieijuku.com ) でイベントタイプ表示設定ダイアログが動作することを確認
- [ ] [推奨] Supabase Service Role Key をローテーション
- [ ] [推奨] Vercel Token をローテーション
- [ ] `matiuskuma2/SMG` の変更を `HogWorks/smg_dashboard` に反映（必要に応じて）
