# SMG経営塾 変更履歴 (CHANGELOG)

全コミット履歴と各変更の技術的詳細を記録。
サンドボックスが利用できない場合でも、この文書だけで全変更を理解・再現可能。

---

## [2026-04-06] fix: メール通知デフォルトON化 & 個別相談の緊急/初回チェックボックス追加
**コミット:** `478653b`

### 課題①: メール通知がデフォルトOFF
**報告:** 加藤さんより「イベント予約の投稿時のメール通知がデフォルトでオフになっている」
**根本原因:** UI（通知設定画面）ではトグルがデフォルトONだが、サーバー側の判定関数がデフォルトOFF（false）を返していた。通知設定ページを一度も開いたことがないユーザーは `mst_notification_settings` にレコードが無く、サーバーが `false` を返すためメールが送られなかった。

**修正ファイルと内容:**

#### `src/lib/api/notification-server.ts` (+11, -3)
```diff
// isNotificationEnabledForUser 関数
 if (error.code === 'PGRST116') {
-  return false;
+  return true;  // レコードなし = デフォルトON
 }
 console.error('通知設定の確認に失敗しました:', error);
-return false;
+return true;  // エラー時もデフォルトON（通知が届かないよりは届く方が安全）

-return data?.is_enabled ?? false;
+return data?.is_enabled ?? true;
```

#### `src/lib/api/notification-settings.ts` (+14, -4)
```diff
// getNotificationSettings - generalSettings
-is_enabled: settingsMap.get(type) ?? false,
+is_enabled: settingsMap.get(type) ?? true,

// getNotificationSettings - eventPublishedSettings
-is_enabled: settingsMap.get(type) ?? false,
+is_enabled: settingsMap.get(type) ?? true,

// getNotificationSettings - archivePublishedSettings
-is_enabled: settingsMap.get(category.key) ?? false,
+is_enabled: settingsMap.get(category.key) ?? true,

// isNotificationEnabled 関数 (クライアント用)
 if (error.code === 'PGRST116') {
-  return false;
+  return true;
 }
-return false;
+return true;

-return data?.is_enabled ?? false;
+return data?.is_enabled ?? true;
```

**影響範囲:** 通知設定を明示的にOFFにしたユーザー（DBにレコードが存在する）は引き続きOFFのまま。レコードが無いユーザーのみデフォルトONに変更。

---

### 課題②: 個別相談の「緊急相談」「初回相談」が全員「いいえ」
**報告:** 3/27東京定例会の個別相談で申込者全員が「緊急相談：いいえ」「初回相談：いいえ」で表示される
**根本原因:** `EventApplicationForm.tsx` にチェックボックスが無く、Stripe決済→Webhook→DB保存の全フローで `is_urgent`/`is_first_consultation` が設定されていなかった。テーブルのデフォルト値 `false` がそのまま保存されていた。

**修正ファイルと内容:**

#### `src/components/events/EventApplicationForm.tsx` (+49)
```tsx
// 新しいステート追加
const [isUrgent, setIsUrgent] = useState(false);
const [isFirstConsultation, setIsFirstConsultation] = useState(false);

// Consultation選択時にチェックボックスUI表示 (L824-867)
{selectedTypes.includes("Consultation") && (
  <div className={css({ mb: '4', ml: '4', pl: '4', borderLeft: '2px solid', borderColor: 'gray.200' })}>
    <label>
      <input type="checkbox" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} />
      <span>緊急の相談である（できるだけ早く対応が必要）</span>
    </label>
    <label>
      <input type="checkbox" checked={isFirstConsultation} onChange={(e) => setIsFirstConsultation(e.target.checked)} />
      <span>初めての方</span>
    </label>
  </div>
)}

// API送信時に値を含める (confirmSubmission内)
body: JSON.stringify({
  event_id,
  selectedTypes,
  participationType,
  questionAnswers,
  isUrgent: selectedTypes.includes("Consultation") ? isUrgent : undefined,
  isFirstConsultation: selectedTypes.includes("Consultation") ? isFirstConsultation : undefined,
}),
```

#### `src/app/api/create-checkout-session/route.ts` (+6, -1)
```diff
-const { event_id, selectedTypes, participationType, questionAnswers } = body;
+const { event_id, selectedTypes, participationType, questionAnswers, isUrgent, isFirstConsultation } = body;

 metadata: {
   // ...既存フィールド
+  isUrgent: isUrgent ? 'true' : 'false',
+  isFirstConsultation: isFirstConsultation ? 'true' : 'false',
 },
```

#### `src/app/api/webhook/route.ts` (+4, -1)
```diff
-const { event_id, selectedTypes, userId, participationType, questionAnswers } = session.metadata || {};
+const { event_id, selectedTypes, userId, participationType, questionAnswers, isUrgent, isFirstConsultation } = session.metadata || {};

 // trn_consultation_attendee upsert
 .upsert({
   event_id: event_id,
   user_id: userId,
+  is_urgent: isUrgent === 'true',
+  is_first_consultation: isFirstConsultation === 'true',
   deleted_at: null,
 });
```

**後方互換性:** Stripeメタデータに `isUrgent`/`isFirstConsultation` が無い既存決済は `undefined === 'true'` → `false` となり、既存レコードと同一動作。

---

## [2026-04-06] fix: 質問ページの講師選択がRLSにより塾生に表示されないバグを修正
**コミット:** `c21a473`

**問題:** `mst_user` テーブルのRLSポリシーが `is_profile_public = false` の講師情報へのアクセスをブロック
**修正:**
- 新規API `src/app/api/question-instructors/route.ts` 追加（`createAdminClient` でRLSバイパス）
- `QuestionsPage.tsx`, `questions/post/page.tsx`, `questions/edit/[id]/page.tsx` をAPI経由に変更

**変更規模:** +92, -118行

---

## [2026-04-05] fix: mst_user カラム名を user_name → username に修正
**コミット:** `5dbb169`

---

## [2026-04-04] feat: イベント申込データ復元ツール追加
**コミット:** `bb1e327`

Stripe決済データからDBレコードを復旧するドライラン/実行モード付きツール。

---

## [2026-04-03] feat: DMメッセージ一覧にステータス絞り込み機能を追加
**コミット:** `d475d80`

---

## [2026-04-02] feat: ご利用ガイド一覧に「詳細ページリンク取得」ボタンを追加
**コミット:** `11bcbf2`

---

## [2026-04-01] feat: 複数機能追加・修正
**コミット:** `d71fa3a`

---

## [2026-03-xx] cleanup/fix: Webhook関連
- `8d13f3c` cleanup: 一時的なデータ修復エンドポイント削除
- `c893642` feat: 一時的なデータ修復エンドポイント追加 (Stripe決済→DB復旧)
- `413121b` fix: WebhookでcreateAdminClient使用に変更 (RLSバイパス)
- `4474904` fix: Webhook懇親会・個別相談データ保存バグ修正

---

## [2026-03-xx] feat: DM機能改善
- `065e9be` / `c46f0cd` / `d68255a` fix: TypeScript型修正
- `b2edf52` feat: DM機能改善 - 全必須要件対応

---

## [2026-03-xx] fix: NFC・個別相談 RLS関連
- `7945855` fix: NFC交換履歴 RLSフォールバック
- `937f052` fix: 個別相談ページ RLS講師情報フォールバック

---

## [2026-03-xx] feat: パスワードリセットOTP化
- `525afe4` fix: OTP入力を6桁→8桁に変更
- `1e8b576` feat: OTPコード入力式に変更 (SendGridプリフェッチ問題対策)
- `614e175` fix: otp_expiredエラー処理と再送信フォーム
- `b86483b` fix: middleware PKCE処理改善
- `aa695c2` fix: PKCEフロー対応で「無効なリンク」問題を修正

---

## [2026-03-xx] fix: NFCプロフィール
- `acdadf8` fix: user-profile APIをREST API fetchに変更
- `5f92178` debug: デバッグ情報追加
- `647bc9c` fix: Cache-Controlヘッダー追加
- `30dd6bf` fix: select(*) と force-dynamic追加
- `0e2b9fa` fix: RLSバイパスのためサーバーサイドAPI経由に変更

---

## [2026-02-xx] feat: CSVエクスポート・プロフィール住所
- `ad82399` feat: CSVエクスポートに「ログイン状況」「最終ログイン日時」列を追加
- `7203043` fix: mst_user型にpostal_code/prefecture/city_address/building_name追加
- `b823f29` feat: プロフィール編集に住所フィールド追加（郵便番号自動補完対応）

---

## [2026-02-xx] 初期〜基盤構築
- `0ff2ccd` feat: 既存会員一括登録スクリプト追加
- `3610593`〜`cc13a1b` fix: gather_registration_end_datetime 追加
- `383256a` fix: RLSバイパスでログイン・ミドルウェア修正
- `7772034` feat: バナーDB管理化 + 懇親会締切日分離
- `5e039a7` fix: middleware cookie修正
- `56b4d09` feat: ナビゲーションを動的タブ化
- `39a4483` / `ffe661d` fix: ログインフロー RLS修正
- `aa815e4` feat: 講師に質問ページに質問フォーム埋め込み
- `d3d3699` feat: タブ管理機能の実装
- `7628f2d` / `973b485` fix: myasp-webhook修正
- `55b14f3` RLSマイグレーションスクリプト追加
- `945fb78` CSVダウンロード機能追加
- `40e0470` ユーザー検索に電話番号追加
- `831e33a` 支部・マスター講座タブ追加
- `712e4a2` お知らせ単体表示ページ追加
- `e89fe60` / `298ba72` 簿記講座タブ関連
- `d0375ff` gitignore/README更新
- `0e4cf39` **初回コミット**
