# SMG経営塾 既知の問題・注意点

最終更新: 2026-04-06

## 解決済みの重要な問題

### 1. メール通知デフォルトOFF問題 (解決: 2026-04-06)
- **症状:** イベント予約時のメール通知が全ユーザーに届かない
- **原因:** サーバー側判定が `false` デフォルト、UI表示は `true` デフォルトで不一致
- **修正:** `notification-server.ts` と `notification-settings.ts` のデフォルトを `true` に統一
- **コミット:** `478653b`

### 2. 個別相談の緊急/初回フラグ問題 (解決: 2026-04-06)
- **症状:** 全員が「緊急相談：いいえ」「初回相談：いいえ」で表示
- **原因:** フォームにチェックボックスなし、Webhook保存時にフラグ未設定
- **修正:** チェックボックスUI追加、Stripeメタデータ経由でWebhookに伝達
- **コミット:** `478653b`
- **注意:** 2026-04-06以前の既存データは修正されない（全て `false` のまま）

### 3. RLSによる講師情報非表示問題 (解決: 2026-04-06)
- **症状:** 質問ページで講師選択肢が塾生に表示されない
- **原因:** `mst_user` テーブルのRLSが `is_profile_public = false` の講師をブロック
- **修正:** `/api/question-instructors` API追加 (AdminClient使用)
- **コミット:** `c21a473`

### 4. Webhook RLSバイパス問題 (解決: 2026-03-xx)
- **症状:** Stripe Webhook経由でDBレコードが保存されない
- **原因:** WebhookにはユーザーCookieがなくRLSがブロック
- **修正:** `createAdminClient()` (service_role) に変更
- **コミット:** `413121b`

---

## 注意が必要な技術的ポイント

### 1. Supabase RLS
- **全テーブルにRLSが設定されている。** サーバーサイドでユーザーCookieなしのコンテキスト（Webhook、Cron等）は必ず `createAdminClient()` を使用すること。
- RLSバイパスが必要な既知のケース:
  - Stripe Webhook (`/api/webhook`)
  - 通知作成 (`notification-server.ts`)
  - 講師情報取得 (`/api/question-instructors`)
  - NFCプロフィール (`/api/user-profile/[userId]`)

### 2. Stripe Webhook 重複処理
- Stripeは同一イベントを複数回送信する可能性がある
- 現在は `payment_intent` で重複判定を実施
- データ保存は upsert なので重複でも安全
- 通知送信は重複時にスキップ

### 3. 2つの個別相談テーブル
- `trn_consultation_attendee`: **イベント付随の個別相談** (定例会の一部として申込)
- `trn_consultation_application`: **独立型の個別相談** (別ページから申込)
- Dashboard (`smg-dashboard`) でそれぞれ別のページで表示

### 4. 旧サイトとの互換性
- Webhook で `mode === 'subscription'` の場合は 200 を返してスキップ (旧サイトのサブスクリプション決済)
- MyASP Webhook 経由の自動アカウント作成が並行運用中

### 5. 個別相談のフロー
```
1. EventApplicationForm でチェックボックス選択 (is_urgent, is_first_consultation)
2. Stripe Checkout にリダイレクト
3. 決済完了 → Webhook で trn_consultation_attendee にレコード作成 (フラグ含む)
4. success_url で /off-line-consulations/[id] にリダイレクト
5. ユーザーが日程候補・備考等を入力 → trn_consultation_attendee を UPDATE
```
※ ステップ5で is_urgent/is_first_consultation も再設定されるため、
  仮にステップ3のフラグが正しくなくても、ユーザーが修正可能。

---

## 未対応・将来の改善項目

### 1. 過去データの緊急/初回フラグ修正
- 2026-04-06以前の `trn_consultation_attendee` レコードは `is_urgent = false`, `is_first_consultation = false` のまま
- 修正が必要な場合は、Stripeメタデータまたはユーザー確認を元にDBを直接更新

### 2. TypeScript型チェック
- サンドボックスではメモリ不足でフルビルドが困難
- Vercelのデプロイ時ビルドで型チェックが実行される
- ローカル開発環境での `pnpm build` を推奨

### 3. Biome/Lefthookの警告
- `lefthook` がPATHに見つからない警告が出る場合がある（サンドボックス環境固有）
- 本番デプロイには影響なし

### 4. 通知設定の一括ON化
- 現状: レコードが無い場合はデフォルトONの動作
- 完全な対応: 全ユーザーの全通知タイプに `is_enabled = true` レコードを一括INSERT
- 現在の実装で実質的に解決済みだが、パフォーマンス観点では事前INSERT推奨

---

## トラブルシューティング

### Vercelデプロイが失敗する
1. GitHub Actions のビルドログを確認
2. TypeScript型エラーが多い場合は `pnpm build` をローカルで実行して確認
3. 環境変数が正しく設定されているか Vercel Dashboard で確認

### メール通知が届かない
1. `mst_notification_settings` で該当ユーザーの設定を確認
2. SendGrid のActivity Feedでメール送信状況を確認
3. Vercel Function Logsで `isNotificationEnabledForUser` の出力を確認

### Stripe Webhookが処理されない
1. Stripe Dashboard > Webhooks でイベント配信状況を確認
2. Vercel Function Logsでエラーを確認
3. `STRIPE_WEBHOOK_SECRET` が正しいか確認
4. Webhookが `200` を返しているか確認（サブスクリプションモードのスキップに注意）
