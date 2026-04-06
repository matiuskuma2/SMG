# SMG経営塾 API リファレンス

最終更新: 2026-04-06

## サーバーサイド API ルート (`/api/*`)

### 認証系

| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| `/api/auth/callback` | GET | Supabase Auth コールバック |
| `/api/auth/login-success` | POST | ログイン成功後処理 |
| `/api/signup` | POST | 新規会員登録 |
| `/api/x7k9m2p/change-password` | POST | パスワード変更 (管理用URL) |

### 決済系

| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| `/api/create-checkout-session` | POST | Stripe Checkoutセッション作成 |
| `/api/webhook` | POST | Stripe Webhook受信 |
| `/api/webhook/subscription-failed` | POST | サブスクリプション失敗Webhook |

### 通知系

| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| `/api/notifications/create` | POST | 通知作成 + メール送信 |

### プロフィール系

| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| `/api/profile/get` | GET | プロフィール取得 |
| `/api/profile/update` | POST | プロフィール更新 |
| `/api/profile/upload-icon` | POST | アイコン画像アップロード |
| `/api/user-profile/[userId]` | GET | 公開プロフィール取得 (NFC用) |

### その他

| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| `/api/banners` | GET | バナー一覧取得 |
| `/api/compress-image` | POST | 画像圧縮 |
| `/api/industries` | GET | 業種一覧取得 |
| `/api/inquiry` | POST | お問い合わせ送信 |
| `/api/mypage/applications` | GET | マイページ申込一覧 |
| `/api/mypage/qr-code` | GET | QRコード生成 |
| `/api/question-instructors` | GET | 講師一覧取得 (RLSバイパス) |
| `/api/tabs` | GET | ナビゲーションタブ取得 |
| `/api/receipts/*` | Various | 領収書関連 |

---

## 主要API詳細

### POST `/api/create-checkout-session`

Stripe Checkoutセッションを作成。懇親会/個別相談選択時に使用。

**リクエストボディ:**
```json
{
  "event_id": "string",
  "selectedTypes": ["Event", "Networking", "Consultation"],
  "participationType": "Offline" | "Online" | null,
  "questionAnswers": { "questionId": "answer" },
  "isUrgent": true | false | undefined,
  "isFirstConsultation": true | false | undefined
}
```

**処理内容:**
1. イベント情報取得 (料金、定員)
2. 定員チェック (Event, Networking, Consultation)
3. 請求項目作成 (懇親会のみ有料、個別相談は無料)
4. Stripe Checkoutセッション作成
5. メタデータに全情報を格納

**レスポンス:**
```json
{ "url": "https://checkout.stripe.com/..." }
```

### POST `/api/webhook`

Stripe Webhookイベント処理。

**処理フロー:**
1. Stripe署名検証
2. `checkout.session.completed` イベント処理
3. サブスクリプション決済はスキップ (旧サイト互換)
4. 重複Webhook判定 (payment_intent照合)
5. DB保存 (upsert):
   - `trn_event_attendee` (イベント参加)
   - `trn_gather_attendee` (懇親会参加 + 決済情報)
   - `trn_consultation_attendee` (個別相談 + 緊急/初回フラグ)
6. 質問回答保存 (`trn_event_question_answer`)
7. 通知作成 (重複でない場合のみ)

### GET `/api/question-instructors`

講師一覧を取得。RLSバイパスで `is_profile_public = false` の講師も含む。

**レスポンス:**
```json
[
  {
    "user_id": "string",
    "username": "string",
    "profile_image_url": "string"
  }
]
```

---

## クライアントサイド API 関数 (`src/lib/api/`)

| ファイル | 主要関数 | 説明 |
|---------|---------|------|
| `event.ts` | `getEvents`, `getEvent`, `getEventQuestions`, `saveEventQuestionAnswers` | イベント操作 |
| `consultation.ts` | `getConsultations`, `submitConsultationApplication`, `cancelConsultationApplication` | 個別相談操作 |
| `notification.ts` | `getNotifications`, `markAllNotificationsAsRead` | 通知取得・既読 |
| `notification-settings.ts` | `getNotificationSettings`, `updateNotificationSetting`, `isNotificationEnabled` | 通知設定管理 |
| `notification-server.ts` | `isNotificationEnabledForUser`, `createEventApplicationNotification`, `createGatherApplicationNotification`, `createConsultationApplicationNotification` | サーバーサイド通知 |
| `messages.ts` | DM関連関数 | ダイレクトメッセージ |
| `archive.ts` | `getArchives`, `getArchive` | アーカイブ操作 |
| `search.ts` | `searchAll` | 横断検索 |
| `notice.ts` | `getNotices`, `getNotice` | お知らせ操作 |
| `faq.ts` | `getFAQs` | FAQ操作 |
| `radio.ts` | `getRadios`, `getRadio` | ラジオ操作 |
| `userProfile.ts` | `getUserProfile` | ユーザープロフィール |

---

## Supabase クライアント種別

| クライアント | ファイル | RLS | 用途 |
|------------|---------|-----|------|
| `createClient()` | `supabase.ts` | **有効** | クライアントサイド、通常のサーバーサイド |
| `createClient()` | `supabase-server.ts` | **有効** | サーバーサイド (Cookie付き) |
| `createAdminClient()` | `supabase-admin.ts` | **バイパス** | Webhook、通知作成、講師情報取得 |
