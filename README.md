# SMG経営塾 プラットフォーム

## プロジェクト構成

| プロジェクト | ディレクトリ | 本番URL | Vercelプロジェクト |
|---|---|---|---|
| 会員サイト | `smg-front/` | https://www.smgkeieijuku.com | smg-front (prj_yj2GT45LW4JWwnnT78PancMQMYxS) |
| 管理画面 | `smg-dashboard/` | https://dashboard.smgkeieijuku.com | smg_dashboard (prj_XTTdEmIYUghzemZ6giOGIHlr436S) |

## 技術スタック
- **フレームワーク**: Next.js 14 (App Router)
- **スタイリング**: PandaCSS
- **認証**: Supabase Auth
- **データベース**: Supabase (PostgreSQL 15)
- **決済**: Stripe
- **メール**: SendGrid
- **動画**: Vimeo
- **デプロイ**: Vercel

## Vercel連携
- **チーム**: ebichoco (team_OEO7PqPVqWRc2hGJRALh8tMo)
- **GitHubリポ**: HogWorks/smg_front, HogWorks/smg_dashboard
- **本番ブランチ**: main

## Supabase
- **URL**: https://zjeyqpwkpbkycyltxirr.supabase.co
- **スキーマ**: public (Exposed via Extra search path)
- **テーブル数**: 約60テーブル (mst_* マスタ系 + trn_* トランザクション系)

## 環境変数一覧

### smg-front (会員サイト)
| 変数名 | 用途 |
|---|---|
| NEXT_PUBLIC_SUPABASE_URL | Supabase URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase Anon Key |
| SUPABASE_SERVICE_ROLE_KEY | Supabase Service Role Key |
| STRIPE_SECRET_KEY | Stripe決済キー |
| STRIPE_WEBHOOK_SECRET | Stripe Webhook署名検証 |
| STRIPE_WEBHOOK_SECRET_SUBSCRIPTION | Stripeサブスクリプション用Webhook |
| SENDGRID_API_KEY | SendGridメール送信 |
| SENDGRID_SENDER_EMAIL | SendGrid送信元メール |
| NEXT_PUBLIC_BASE_URL | サイトベースURL |
| NEXT_PUBLIC_DASHBOARD_URL | 管理画面URL |
| NEXT_PUBLIC_DEFAULT_INSTRUCTOR_ID | デフォルト講師ID |
| SMOOTHIN_API_TOKEN | Smoothin API連携 |

### smg_dashboard (管理画面)
| 変数名 | 用途 |
|---|---|
| NEXT_PUBLIC_SUPABASE_URL | Supabase URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase Anon Key |
| SUPABASE_SERVICE_ROLE_KEY | Supabase Service Role Key |
| STRIPE_SECRET_KEY | Stripe決済キー |
| STRIPE_WEBHOOK_SECRET | Stripe Webhook署名検証 |
| SENDGRID_API_KEY | SendGridメール送信 |
| SENDGRID_SENDER_EMAIL | SendGrid送信元メール |
| NEXT_PUBLIC_BASE_URL | 管理画面ベースURL |
| NEXT_PUBLIC_FRONT_URL | 会員サイトURL |
| VIMEO_CLIENT_ID | Vimeo API |
| VIMEO_CLIENT_SECRET | Vimeo API |
| VIMEO_ACCESS_TOKEN | Vimeo API |
| GOOGLE_CLIENT_EMAIL | Google API認証 |
| GOOGLE_PRIVATE_KEY | Google API認証 |
| GOOGLE_FOLDER_ID | Google Drive連携 |

## 主要ページ

### 会員サイト
- `/login` - ログイン
- `/signup` - 新規登録
- `/` - トップページ
- `/events` - イベント一覧
- `/archive` - アーカイブ
- `/radio` - ラジオ
- `/questions` - 質問
- `/consultations` - 個別相談
- `/mypage` - マイページ

### 管理画面
- `/login` - ログイン
- `/` - ダッシュボード
- `/direct-message` - DM管理
- `/broadcast` - 一斉配信
- `/userlist` - ユーザー管理
- `/event` - イベント管理
- `/radio` - ラジオ管理
- `/archive` - アーカイブ管理
- `/notice` - お知らせ管理
- `/faq` - FAQ管理
