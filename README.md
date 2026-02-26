# SMG経営塾 - 会員サイト & 管理画面

## プロジェクト概要

**SMG経営塾**の会員向けWebサービス。会員サイト（フロント）と管理画面（ダッシュボード）の2つのNext.jsアプリケーションで構成。

| 項目 | 会員サイト | 管理画面 |
|------|-----------|---------|
| **リポジトリ** | `smg-front/` | `smg-dashboard/` |
| **本番URL** | https://www.smgkeieijuku.com | https://dashboard.smgkeieijuku.com |
| **GitHubオリジン** | HogWorks/smg_front | HogWorks/smg_dashboard |
| **デプロイ** | Vercel | Vercel |

---

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│  会員サイト (smg-front)    │    管理画面 (smg-dashboard)      │
│  Next.js 14 App Router     │    Next.js 14 App Router        │
│  Vercel Production         │    Vercel Production            │
└──────────┬─────────────────┴──────────┬─────────────────────┘
           │                            │
           ▼                            ▼
┌────────────────────────────────────────────────────────────┐
│                   Supabase (BaaS)                          │
│  ├── Auth       : メール/パスワード認証                      │
│  ├── Postgres 15: 60テーブル（mst_* / trn_*）              │
│  ├── Storage    : 画像・ファイル保管                         │
│  └── RPC        : カスタムSQL関数                           │
└────────────────────────────────────────────────────────────┘
           │              │              │
   ┌───────┘      ┌───────┘      ┌───────┘
   ▼              ▼              ▼
┌────────┐  ┌──────────┐  ┌──────────┐
│ Stripe │  │  Vimeo   │  │ SendGrid │
│ 決済    │  │ 動画配信  │  │  メール   │
└────────┘  └──────────┘  └──────────┘
```

---

## 技術スタック

| 領域 | 技術 |
|------|------|
| フレームワーク | Next.js 14 (App Router) |
| CSS | PandaCSS (styled-system) |
| 認証 | Supabase Auth |
| DB | Supabase Postgres 15 (ap-northeast-1 Tokyo) |
| ストレージ | Supabase Storage + Vimeo（動画） |
| 決済 | Stripe (Checkout + Webhook) |
| メール | SendGrid |
| デプロイ | Vercel (Production / Preview) |
| リッチテキスト | Quill エディタ |
| 状態管理 | TanStack React Query |
| PDF生成 | PDFKit（領収書） |
| リンター | Biome |
| Git hooks | Lefthook |

---

## 会員サイト画面一覧 (smg-front)

### 認証系
| パス | 機能 |
|------|------|
| `/login` | ログイン |
| `/signup` | 新規会員登録 |
| `/forgotPassword` | パスワードリセット申請 |
| `/reset-password` | パスワード再設定 |

### メイン機能
| パス | 機能 |
|------|------|
| `/` | トップページ（ナビカード6種 + 各セクション） |
| `/events` | 講座・イベント一覧 |
| `/events/[id]` | イベント詳細 + Stripe決済 |
| `/events/schedule` | イベントスケジュール |
| `/archive` | 動画・写真アーカイブ |
| `/archive/tabs/[tabId]` | アーカイブタブ別表示 |
| `/radio` | SMGラジオ一覧 |
| `/radio/[radioId]` | ラジオ詳細再生 |
| `/questions` | 講師への質問一覧 |
| `/questions/post` | 質問投稿 |
| `/consultations` | 個別相談一覧 |
| `/bookkeeping` | 経理・記帳 |
| `/beginner` | 初めての方向けガイド |
| `/notice` | お知らせ一覧 |
| `/notification` | 通知一覧 |
| `/notification/settings` | 通知設定 |
| `/mypage` | マイページ |
| `/mypage/profile/edit` | プロフィール編集 |
| `/mypage/profile/[userId]/public-profile` | 公開プロフィール |
| `/nfc-profile/[id]` | NFC名刺プロフィール |
| `/faq` | よくある質問 |
| `/inquiry` | お問い合わせ |
| `/receipts/[eventId]` | 領収書発行（PDF生成） |
| `/message` | メッセージ |
| `/search` | 会員検索 |
| `/enquete/[id]` | アンケート回答 |

### API Routes
| パス | 機能 |
|------|------|
| `/api/auth/callback` | Supabase Auth コールバック |
| `/api/auth/login-success` | ログイン成功後処理 |
| `/api/create-checkout-session` | Stripe決済セッション作成 |
| `/api/webhook` | Stripe Webhook受信 |
| `/api/signup` | 会員登録処理 |
| `/api/profile/*` | プロフィール取得/更新/アイコン |
| `/api/receipts/*` | 領収書PDF生成/メール送信/履歴 |
| `/api/notifications/create` | 通知作成 |
| `/api/inquiry` | お問い合わせ送信 |
| `/api/compress-image` | 画像圧縮 |

---

## 管理画面 画面一覧 (smg-dashboard)

### メッセージ
| パス | 機能 |
|------|------|
| `/direct-message` | 1:1チャット |
| `/broadcast` | 一斉配信作成 |
| `/broadcast-history` | 配信履歴 |

### ユーザー・グループ管理
| パス | 機能 |
|------|------|
| `/userlist` | ユーザー一覧 |
| `/user/create` | ユーザー作成 |
| `/user/bulk-create` | 一括ユーザー作成 |
| `/user/edit/[userId]` | ユーザー編集 |
| `/grouplist` | グループ一覧 |
| `/group/create` / `/group/edit/[groupId]` | グループ作成/編集 |

### コンテンツ管理
| パス | 機能 |
|------|------|
| `/eventlist` | イベント一覧 |
| `/event/create` / `/event/edit/[eventid]` | イベント作成/編集 |
| `/event/participants/[eventid]` | 参加者管理 |
| `/event/archive/[eventid]` | イベントアーカイブ |
| `/radiolist` → `/radio/create/edit` | ラジオ管理 |
| `/archive` → `/archive/create/edit` | アーカイブ管理 |
| `/theme` → `/theme/create/edit` | テーマ管理 |
| `/noticelist` → `/notice/create/edit` | お知らせ管理 |
| `/faqlist` → `/faq/new/[faqid]` | FAQ管理 |
| `/forBeginnerslist` | 初心者ガイド管理 |

### その他
| パス | 機能 |
|------|------|
| `/individualConsultationlist` | 個別相談管理 |
| `/questionlist` | 質問管理 |
| `/question-howto` | 質問使い方 |
| `/enquetelist` → `/enquete/create/edit` | アンケート管理 |
| `/receipt-issue` | 領収書発行管理 |
| `/zoom-setting` | Zoomリンク管理 |

---

## データベース構造

### マスタテーブル (mst_*)
| テーブル | 用途 |
|---------|------|
| `mst_user` | 会員情報 |
| `mst_event` / `mst_event_type` | イベント |
| `mst_group` | グループ（ステータス管理含む） |
| `mst_archive_type` | アーカイブ種別 |
| `mst_radio` | ラジオ |
| `mst_consultation` / `mst_consultation_schedule` | 個別相談 |
| `mst_faq` | FAQ |
| `mst_notice` / `mst_notice_category` | お知らせ |
| `mst_survey` / `mst_survey_detail` | アンケート |
| `mst_theme` | アーカイブテーマ |
| `mst_beginner_guide_*` | 初心者ガイド |
| `mst_dm_*` | DM (thread/label/tag) |
| `mst_notification` / `mst_notification_settings` | 通知 |
| `mst_industry` | 業種 |
| `mst_inquiry` | お問い合わせ |
| `mst_meeting_link` | Zoomリンク |
| `mst_question_manual` | 質問マニュアル |
| `mst_event_file` / `mst_event_archive` | イベントファイル |

### トランザクションテーブル (trn_*)
| テーブル | 用途 |
|---------|------|
| `trn_event_attendee` | イベント参加 |
| `trn_gather_attendee` | 懇親会参加（Stripe連携） |
| `trn_consultation_attendee` | 個別相談参加 |
| `trn_group_user` | グループ所属 |
| `trn_question` / `trn_answer` | 質問・回答 |
| `trn_event_question` / `trn_event_question_answer` | イベント質問 |
| `trn_consultation_question` / `trn_consultation_question_answer` | 相談質問 |
| `trn_survey_answer` | アンケート回答 |
| `trn_dm_message` / `trn_dm_message_image` / `trn_dm_memo` | DM |
| `trn_broadcast_history` / `trn_broadcast_target_user` | 一斉配信 |
| `trn_receipt_history` | 領収書履歴 |
| `trn_nfc_exchange` | NFC名刺交換 |
| `trn_invite` | 招待 |
| `trn_user_notification` | ユーザー通知 |
| `trn_user_guide_progress` | ガイド進捗 |
| `trn_notice_file` / `trn_notice_visible_group` | お知らせ |
| `trn_event_archive_*` / `trn_event_visible_group` | イベントアーカイブ |
| `trn_radio_visible_group` | ラジオ表示グループ |
| `trn_inquiry_answer` | お問い合わせ回答 |
| `trn_dm_thread_label` / `trn_dm_thread_tag` | DMラベル/タグ |

---

## 認証フロー

```
ログイン → Supabase Auth (メール/パスワード)
  → middleware.ts で認証チェック
  ├── 未ログイン → /login リダイレクト
  ├── グループ「未決済」or「退会」→ 強制ログアウト
  └── 認証済み → 各ページへ
```

## 決済フロー (Stripe)

```
イベント予約画面
  → 参加タイプ選択（イベント / 懇親会 / 個別相談）
  → /api/create-checkout-session → Stripe Checkout
  → 決済成功 → Stripe Webhook (/api/webhook)
  → DB更新 (trn_event_attendee / trn_gather_attendee / trn_consultation_attendee)
  → 通知作成
```

---

## 環境変数

### 会員サイト (smg-front)
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
SENDGRID_API_KEY=
NEXT_PUBLIC_BASE_URL=
```

### 管理画面 (smg-dashboard)
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
VIMEO_ACCESS_TOKEN=
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=
SENDGRID_API_KEY=
```

---

## ローカル開発

### 会員サイト
```bash
cd smg-front
pnpm install
pnpm run build
pnpm run dev
```

### 管理画面
```bash
cd smg-dashboard
pnpm install --ignore-scripts
pnpm panda codegen
pnpm run build
pnpm run dev
```

---

## Supabase設定メモ

- **プロジェクト名**: SMGプラットフォーム
- **URL**: https://zjeyqpwkpbkycyltxirr.supabase.co
- **リージョン**: Northeast Asia (Tokyo) - ap-northeast-1
- **インスタンス**: t4g.micro
- **Data API Exposed schemas**: `api`, `graphql_public`（publicは非公開）
- **Extra search path**: `extensions`
- **Max rows**: 5000

---

## 分析日: 2026-02-26
