# 会員サイト再構築のための実装引き継ぎドキュメント（再利用ガイド）

最終更新: 2026-04-09
対象リポジトリ: `matiuskuma2/SMG`（モノレポ）

---

## 0. このドキュメントの目的

この文書は、**既存SMG会員サイト実装を別サーバー/別基盤（例: Cloudflare, 別VPS, 別PaaS）で新しい会員サイトを再構築する際の設計資産として再利用**するための引き継ぎ資料です。

- 依存関係
- API構造
- DB設計
- マイグレーション
- 認証/通知/決済などの主要機能

を、実装参照しやすい形で1つに統合しています。

> **方針**: 本資料では「Web会員サイト・管理画面」の再利用要素に集中し、**モバイルアプリ固有要素は対象外**です。

---

## 1. まず把握すべき全体像

### 1-1. システム構成（現行）

- `smg-front/` : 会員サイト（ユーザー向け）
- `smg-dashboard/` : 管理画面（運営/講師向け）
- 共通DB: Supabase(PostgreSQL + Auth + Storage + RLS)

### 1-2. 実運用で使っている外部サービス

- 認証/DB: Supabase
- 決済: Stripe
- メール: SendGrid
- 動画: Vimeo（主に管理画面側）
- デプロイ: Vercel（現行）

### 1-3. 調査した主要ドキュメント

- `/README.md`（全体）
- `/MIGRATION_INSTRUCTIONS.md`
- `/smg-front/docs/ARCHITECTURE.md`
- `/smg-front/docs/API_REFERENCE.md`
- `/smg-front/docs/DATABASE_SCHEMA.md`
- `/migrations/*.sql`
- `/sql/*.sql`
- `/rls_*.sql`

---

## 2. 技術スタック/依存関係（再利用優先度つき）

## 2-1. コア（高優先・再利用推奨）

- Next.js(App Router)
- React
- TypeScript
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- Stripe
- SendGrid

## 2-2. 会員サイト（smg-front）

主要依存（`smg-front/package.json`）
- `next@14.2.35`
- `react@18`, `react-dom@18`
- `@supabase/ssr`, `@supabase/supabase-js`
- `stripe`
- `@sendgrid/mail`
- `@tanstack/react-query`
- `pdfkit`, `sharp`, `dayjs`
- UI: PandaCSS, Ark UI, Quill系

## 2-3. 管理画面（smg-dashboard）

主要依存（`smg-dashboard/package.json`）
- `next@14.2.35`
- `react@18`, `react-dom@18`
- `@supabase/ssr`, `@supabase/supabase-js`
- `@sendgrid/mail`, `stripe`
- `google-auth-library`, `googleapis`（スプレッドシート連携）
- `@vimeo/vimeo`, `vimeo`
- `html2canvas`, `jspdf`
- UI: Radix UI

> 新規会員サイトで最初から全部持ち込まず、**認証・会員管理・イベント申込・通知**の4機能から段階移植が現実的です。

---

## 3. API構造（実装資産として重要）

## 3-1. API設計の基本パターン

- `src/app/api/**/route.ts` に集約
- 認証が必要なAPIは Supabase セッション前提
- RLS越えが必要な処理（Webhook/管理処理）は service_role クライアントを使用
- 参加申込等は **upsert + 論理削除復元**を基本に冪等化

## 3-2. 会員サイトAPI（smg-front）

代表エンドポイント（抜粋）
- 認証: `/api/auth/callback`, `/api/signup`
- 決済: `/api/create-checkout-session`, `/api/webhook`
- 通知: `/api/notifications/create`
- プロフィール: `/api/profile/get`, `/api/profile/update`
- タブ: `/api/tabs`
- 領収書: `/api/receipts/*`
- 座席: `/api/seating/*`

実装上の重要点:
1. `create-checkout-session` で定員/締切をサーバー側で再検証
2. `webhook` で `checkout.session.completed` を処理
3. `selectedTypes` に応じて以下へ分岐保存
   - `trn_event_attendee`
   - `trn_gather_attendee`
   - `trn_consultation_attendee`
4. 通知は重複Webhook判定後に実行

## 3-3. 管理画面API（smg-dashboard）

代表エンドポイント（抜粋）
- タブ管理: `/api/tabs`, `/api/tabs/[id]`, `/api/tabs/reorder`
- バナー管理: `/api/banners`, `/api/banners/[id]`, `/api/banners/reorder`
- ユーザー管理: `/api/users/*`
- 参加履歴管理: `/api/users/[id]/attendance`
- MyASP連携: `/api/myasp-webhook`
- 質問/テンプレート管理: `/api/questions*`, `/api/*-templates`

実装上の重要点:
- 管理画面APIは `createAdminClient()`（service_role）中心
- `myasp-webhook` は以下を実装済み
  - メールでユーザー検索/作成
  - statusごとのグループ付け替え（未決済/退会など）
  - phone重複時のリトライ
  - 論理削除ユーザー復帰

---

## 4. DB設計（再利用モデル）

## 4-1. 設計思想

- 命名規則: `mst_*`（マスタ）, `trn_*`（トランザクション）
- `deleted_at` による論理削除を標準採用
- RLSを全面適用し、通常は anon/authenticated、運営処理のみ service_role

## 4-2. 中核テーブル群（再利用推奨）

### 会員/認証
- `mst_user`
- `mst_group`
- `trn_group_user`

### イベント/申込
- `mst_event`
- `mst_event_type`
- `trn_event_attendee`
- `trn_gather_attendee`
- `trn_consultation_attendee`
- `trn_event_question_answer`

### 通知
- `mst_notification`
- `mst_notification_settings`
- `trn_user_notification`

### 導線/コンテンツ
- `mst_tab`
- `trn_tab_visible_group`
- `mst_banner`

### その他運用
- `trn_receipt_history`
- `mst_inquiry`
- `mst_notice` / `trn_notice_*`

## 4-3. 代表リレーション

- `mst_user` 1:N `trn_event_attendee`, `trn_gather_attendee`, `trn_consultation_attendee`
- `mst_event` 1:N 上記参加系テーブル
- `mst_notification` 1:N `trn_user_notification`
- `mst_tab` 1:N `trn_tab_visible_group`
- `mst_group` 1:N `trn_group_user`, `trn_tab_visible_group`

---

## 5. マイグレーション資産

## 5-1. 現在確認できるSQL

### migrations/
1. `001_create_mst_banner.sql`
   - `mst_banner` 作成
   - banner storage bucket/policy
   - `mst_event.gather_registration_end_datetime` 追加

2. `002_add_show_in_event_list_to_event_type.sql`
   - `mst_event_type.show_in_event_list` 追加

### sql/
1. `001_create_tab_tables.sql`
   - `mst_tab`, `trn_tab_visible_group` 作成
   - index / RLS policy / updated_at trigger
2. `002_seed_tab_data.sql`
   - 初期タブデータ投入
   - グループ可視設定投入

### rls_*.sql
- `rls_step1_enable_rls.sql`
- `rls_step2_create_policies.sql`
- `rls_step3_trigger_and_indexes.sql`
- `rls_migration.sql`（統合版）
- `rls_rollback.sql`（戻し）
- `rls_verification.sql`（検証）

> **新環境移行時の推奨順序**
> 1) テーブル作成系 (`sql/*`, `migrations/*`)  
> 2) RLS有効化/ポリシー (`rls_step*`)  
> 3) seed投入  
> 4) 検証SQL実行 (`rls_verification.sql`)

---

## 6. 認証・権限・セキュリティ実装の要点

## 6-1. クライアント分離

- ブラウザ/通常サーバー: `anon key` クライアント
- 管理処理/Webhook: `service_role` クライアント

対象ファイル例:
- `smg-front/src/lib/supabase*.ts`
- `smg-dashboard/src/lib/supabase/{client,server,admin}.ts`

## 6-2. middlewareでの制御

- 未ログインはログイン画面へ
- 退会/未決済グループは強制ログアウト
- 管理画面は「講師」「運営」グループのみ許可

## 6-3. 冪等性・運用耐性

- webhookは重複受信前提（upsert + duplicate判定）
- 削除は物理削除でなく `deleted_at` 更新
- 再参加/復元は `deleted_at = null` で復帰

---

## 7. 機能別に再利用しやすい実装パターン

1. **会員申込 + 決済 + 参加確定**
   - checkout session生成 → webhookで確定書込
2. **通知センター**
   - 通知マスタ + ユーザー紐付け + 通知タイプ別ON/OFF
3. **権限付きナビゲーション**
   - `mst_tab` + `trn_tab_visible_group` で動的メニュー化
4. **グループ状態連動アクセス制御**
   - middlewareでグループタイトル判定（未決済/退会）
5. **外部会員基盤連携Webhook**
   - `myasp-webhook` のユーザー同期待ち受け方式

---

## 8. 新しい会員サイトを別基盤で作る際の推奨移植順

1. **認証基盤**（ユーザー/グループ/ログイン制御）
2. **会員マスタ + グループ制御付きメニュー**（`mst_tab`）
3. **イベント申込最小版**（イベント参加のみ）
4. **決済連携**（懇親会/追加オプション）
5. **通知機能**
6. **管理画面側の運用API**
7. **外部システムWebhook連携**

---

## 9. Cloudflare等へ再構築する場合の実装マッピング（設計指針）

- Next.js API Route → Cloudflare Workers/Hono APIへ移植
- Supabase継続利用ならDB/RLS設計はそのまま流用可能
- もしD1へ移行する場合:
  - `mst_* / trn_*` 命名と論理削除設計は維持
  - RLS相当はアプリ層で実装
  - webhook冪等性（重複耐性）は必須で再実装

---

## 10. 除外事項（今回の引き継ぎ対象外）

- モバイルアプリ固有機能
- Universal Link/アプリ連携専用実装
- アプリストア向け配布設定

---

## 11. 参照すべき実ファイル一覧（実装時ショートカット）

- 全体構成: `/README.md`
- フロント設計: `/smg-front/docs/ARCHITECTURE.md`
- API仕様: `/smg-front/docs/API_REFERENCE.md`
- DB概要: `/smg-front/docs/DATABASE_SCHEMA.md`
- 重要運用メモ: `/MIGRATION_INSTRUCTIONS.md`
- タブ設計SQL: `/sql/001_create_tab_tables.sql`, `/sql/002_seed_tab_data.sql`
- バナー/追加カラム: `/migrations/001_create_mst_banner.sql`
- イベント種別表示制御: `/migrations/002_add_show_in_event_list_to_event_type.sql`
- RLS一式: `/rls_*.sql`

---

## 12. 次アクション（この資料を活用する人向け）

1. まず本資料を基に「新サイトの必須機能スコープ」を確定
2. 既存DBを再利用するか、新規DBにモデル移植するか決定
3. APIを
   - そのまま移植
   - ドメイン単位に再設計
   のどちらで進めるか決定
4. 最小実装（認証 + 会員 + イベント申込）を先に立ち上げ
5. Stripe/Webhook/通知を後段で接続

---

（以上）
