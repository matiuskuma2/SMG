# SMG経営塾 システムアーキテクチャ

最終更新: 2026-04-06

## 1. システム概要

SMG経営塾プラットフォームは **2つのNext.jsアプリ** で構成される。

| アプリ | リポジトリパス | 用途 | 本番URL |
|--------|---------------|------|---------|
| **smg-front** | `/smg-front` | 会員サイト（塾生・講師向け） | https://www.smgkeieijuku.com |
| **smg-dashboard** | `/smg-dashboard` | 管理画面（運営・講師向け） | (Vercel別プロジェクト) |

## 2. 技術スタック

### 共通
| 技術 | バージョン | 用途 |
|------|-----------|------|
| Next.js | 14.2.35 | フレームワーク (App Router) |
| React | ^18.2.0 | UI |
| TypeScript | ^5 | 型安全性 |
| Supabase | ^2.49.4 | BaaS (PostgreSQL + Auth + RLS) |
| Stripe | ^18.x | 決済 |
| SendGrid | ^8.1.5 | メール送信 |
| Biome | 1.9.4 | Linter & Formatter |

### smg-front 固有
| 技術 | 用途 |
|------|------|
| PandaCSS | CSS-in-JS (styled-system) |
| Ark UI | UIコンポーネント |
| Quill / react-quill-new | リッチテキストエディタ |
| PDFKit | 領収書PDF生成 |
| sharp | 画像圧縮 |
| dayjs | 日時処理 |

### smg-dashboard 固有
| 技術 | 用途 |
|------|------|
| Radix UI | UIコンポーネント |
| Google APIs | スプレッドシート連携 |
| html2canvas + jsPDF | PDF/画像エクスポート |
| Vimeo API | 動画管理 |

## 3. インフラ構成

```
[ユーザー]
    │
    ├─→ Vercel (smg-front)  ─→ Supabase (PostgreSQL + Auth + Storage + RLS)
    │       │
    │       ├─→ Stripe (決済)
    │       ├─→ SendGrid (メール)
    │       └─→ Stripe Webhook (/api/webhook)
    │
    └─→ Vercel (smg-dashboard) ─→ Supabase (同一プロジェクト)
            │
            ├─→ Google Sheets API
            └─→ Vimeo API
```

## 4. データベース (Supabase)

### 主要テーブル

| テーブル名 | 用途 | 主キー |
|-----------|------|--------|
| `mst_user` | ユーザーマスタ | user_id |
| `mst_event` | イベントマスタ | event_id |
| `mst_notification` | 通知マスタ | notification_id |
| `mst_notification_settings` | 通知設定 | setting_id |
| `mst_tab` | ナビゲーションタブ | tab_id |
| `trn_event_attendee` | イベント参加者 | (event_id, user_id) |
| `trn_gather_attendee` | 懇親会参加者 | (event_id, user_id) |
| `trn_consultation_attendee` | 個別相談参加者 | (event_id, user_id) |
| `trn_consultation_application` | 独立型個別相談申込 | - |
| `trn_user_notification` | ユーザー通知リレーション | - |
| `trn_event_question_answer` | イベント質問回答 | - |

### RLS (Row Level Security)
- 全テーブルにRLSポリシーが設定済み
- サーバーサイドでRLSバイパスが必要な場合は `createAdminClient()` (service_role key) を使用
- 該当箇所: Webhook, 通知作成, 質問ページの講師情報取得

## 5. 認証フロー

1. メールアドレス + パスワード認証 (Supabase Auth)
2. OTPリセットフロー (8桁コード、SendGrid経由)
3. ミドルウェアでセッション検証 + グループベースアクセス制御
4. MyASP Webhook経由の自動アカウント作成

## 6. 決済フロー (Stripe)

```
[ユーザー] → EventApplicationForm → /api/create-checkout-session
    │                                        │
    │                                   Stripe Checkout
    │                                        │
    │                               Stripe Webhook
    │                                        │
    │                              /api/webhook/route.ts
    │                                        │
    │            ┌───────────────────────────┼───────────────────────┐
    │            │                           │                       │
    │     trn_event_attendee        trn_gather_attendee     trn_consultation_attendee
    │     (is_offline)              (payment_intent)        (is_urgent, is_first_consultation)
    │
    └──→ /off-line-consulations/[id] (個別相談詳細入力: 日程候補、備考等)
```

### Stripeメタデータ

checkout session と payment_intent の両方に以下を格納:

| Key | 型 | 説明 |
|-----|---|------|
| event_id | string | イベントID |
| selectedTypes | JSON string | 選択された参加タイプ配列 |
| userId | string | SupabaseユーザーID |
| participationType | string\|null | "Offline" \| "Online" \| null |
| questionAnswers | JSON string | 質問回答 |
| isUrgent | "true"\|"false" | 緊急相談フラグ |
| isFirstConsultation | "true"\|"false" | 初回相談フラグ |

## 7. 通知システム

### フロー
1. イベント申込/相談申込時に `mst_notification` にレコード作成
2. `trn_user_notification` でユーザーに紐付け
3. `isNotificationEnabledForUser()` でユーザーの通知設定を確認
4. 有効ならSendGridでメール送信

### デフォルト動作
- 通知設定レコードが **存在しない** 場合 → **デフォルトON** (true)
- ユーザーが明示的にOFFにした場合のみ `is_enabled = false` レコードが作成される
- UI側 (`notification-settings.ts`) とサーバー側 (`notification-server.ts`) で統一

### 通知タイプ一覧

**一般通知:**
- `event_application` - イベント申し込み完了
- `gather_application` - 懇親会申し込み完了
- `consultation_application` - 個別相談申し込み完了
- `question_answered` - 質問への回答
- `question_answer_edited` - 質問への回答の編集

**イベント公開通知 (種類別):**
- `event_published_tereikai` / `_boki` / `_special_seminar` / `_online_seminar` / `_pdca` / `_group_consultation`

**アーカイブ公開通知 (種類別):**
- `archive_published_tereikai` / `_boki` / `_group_consultation` / `_online_seminar` / `_special_seminar` / `_photo` / `_newsletter` / `_sawabe`

## 8. ディレクトリ構造 (smg-front)

```
smg-front/
├── src/
│   ├── app/
│   │   ├── (member)/          # 会員ページ (認証必須)
│   │   │   ├── archive/       # アーカイブ一覧・詳細
│   │   │   ├── consultations/ # 個別相談一覧・詳細
│   │   │   ├── events/        # イベント一覧・詳細
│   │   │   ├── message/       # DM
│   │   │   ├── mypage/        # マイページ・プロフィール
│   │   │   ├── notification/  # 通知一覧・設定
│   │   │   ├── off-line-consulations/ # オフライン個別相談
│   │   │   ├── questions/     # 講師に質問
│   │   │   ├── receipts/      # 領収書
│   │   │   └── ...
│   │   ├── api/               # APIルート
│   │   │   ├── auth/          # 認証コールバック
│   │   │   ├── create-checkout-session/ # Stripe決済セッション作成
│   │   │   ├── webhook/       # Stripe Webhook
│   │   │   ├── notifications/ # 通知作成
│   │   │   ├── question-instructors/ # 講師一覧 (RLSバイパス)
│   │   │   ├── receipts/      # 領収書関連
│   │   │   └── ...
│   │   ├── auth/              # 認証ページ
│   │   └── renewal/           # 更新ページ
│   ├── components/
│   │   ├── consultations/     # 個別相談コンポーネント
│   │   ├── events/            # イベントコンポーネント
│   │   ├── questions/         # 質問コンポーネント
│   │   └── ui/                # 共通UIコンポーネント
│   ├── lib/
│   │   ├── api/               # クライアントサイドAPI関数
│   │   ├── supabase/          # Supabase型定義
│   │   ├── supabase.ts        # クライアントサイドSupabase
│   │   ├── supabase-server.ts # サーバーサイドSupabase
│   │   └── supabase-admin.ts  # Admin Supabase (RLSバイパス)
│   ├── features/              # 機能モジュール
│   ├── hooks/                 # カスタムフック
│   └── types/                 # 型定義
├── public/                    # 静的ファイル
├── migrations/                # RLSマイグレーション
└── docs/                      # ドキュメント
```

## 9. 環境変数 (必要な設定)

### smg-front (Vercel)

| 変数名 | 用途 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名キー |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase サービスロールキー (RLSバイパス) |
| `STRIPE_SECRET_KEY` | Stripe秘密キー |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhookシークレット |
| `NEXT_PUBLIC_BASE_URL` | サイトベースURL |
| `SENDGRID_API_KEY` | SendGrid APIキー |
| `SENDGRID_SENDER_EMAIL` | 送信元メールアドレス |

## 10. デプロイ

### Vercel (自動デプロイ)
- GitHub `main` ブランチへのpushで自動デプロイ
- リポジトリ: `matiuskuma2/SMG`
- smg-front: Root Directory = `smg-front`
- smg-dashboard: Root Directory = `smg-dashboard` (別Vercelプロジェクト)

### デプロイ手順 (手動)
```bash
cd smg-front
pnpm install
pnpm build
# Vercelが自動的にデプロイ
```
