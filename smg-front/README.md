# SMG経営塾 会員サイト (smg-front)

## プロジェクト概要

SMG経営塾プラットフォームの会員向けWebサイト。イベント管理、個別相談、DM、アーカイブ閲覧、通知設定等の機能を提供。

- **本番URL:** https://www.smgkeieijuku.com
- **GitHub:** https://github.com/matiuskuma2/SMG
- **デプロイ:** Vercel (mainブランチ自動デプロイ)

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Next.js 14.2 (App Router) |
| 言語 | TypeScript ^5 |
| UI | React ^18, PandaCSS, Ark UI |
| BaaS | Supabase (PostgreSQL + Auth + RLS) |
| 決済 | Stripe |
| メール | SendGrid |
| Linter | Biome 1.9 |
| パッケージ管理 | pnpm |

## セットアップ

```bash
# 依存パッケージのインストール
pnpm install

# 環境変数の設定 (.env.local)
cp .env.example .env.local  # テンプレートがある場合
# 必要な環境変数は docs/ARCHITECTURE.md を参照

# 開発サーバーの起動
pnpm dev
```

開発サーバーは http://localhost:3000 で起動します。

## スクリプト

| コマンド | 説明 |
|---------|------|
| `pnpm dev` | 開発サーバー起動 |
| `pnpm build` | プロダクションビルド |
| `pnpm lint` | Biome 静的解析 |
| `pnpm format` | Biome フォーマット |

## 主要機能

| 機能 | パス | 説明 |
|------|-----|------|
| イベント一覧 | `/events` | 定例会、セミナー等の一覧・申込 |
| イベント申込 | `/events/[id]` | チェックボックス式申込フォーム (イベント/懇親会/個別相談) |
| 個別相談 | `/consultations` | 独立型の個別相談申込 |
| オフライン個別相談詳細 | `/off-line-consulations/[id]` | 緊急/初回/日程候補入力 |
| DM | `/message` | 講師・塾生間のダイレクトメッセージ |
| 講師に質問 | `/questions` | 質問投稿・回答閲覧 |
| アーカイブ | `/archive` | 過去イベントの動画・資料閲覧 |
| 通知 | `/notification` | 通知一覧 |
| 通知設定 | `/notification/settings` | メール通知のON/OFF設定 |
| マイページ | `/mypage` | プロフィール編集、NFC連携 |
| 領収書 | `/receipts` | Stripe決済の領収書PDF発行 |
| 検索 | `/search` | 横断検索 |
| FAQ | `/faq` | よくある質問 |

## API エンドポイント

主要APIルートの一覧は [docs/API_REFERENCE.md](docs/API_REFERENCE.md) を参照。

## ドキュメント

| ファイル | 内容 |
|---------|------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | システム全体のアーキテクチャ、インフラ構成、テーブル一覧 |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | 全コミット履歴と技術的な変更詳細 |
| [docs/API_REFERENCE.md](docs/API_REFERENCE.md) | 全APIエンドポイントのリファレンス |
| [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) | DBテーブルのカラム定義とリレーション |
| [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md) | 既知の問題、注意点、トラブルシューティング |

## ディレクトリ構成

```
src/
├── app/
│   ├── (member)/       # 会員ページ (認証必須)
│   ├── api/            # APIルート (27エンドポイント)
│   ├── auth/           # 認証ページ
│   └── renewal/        # 更新ページ
├── components/
│   ├── consultations/  # 個別相談コンポーネント
│   ├── events/         # イベントコンポーネント
│   ├── questions/      # 質問コンポーネント
│   └── ui/             # 共通UIコンポーネント
├── lib/
│   ├── api/            # クライアントサイドAPI関数 (15ファイル)
│   ├── supabase.ts     # クライアントSupabase
│   ├── supabase-server.ts  # サーバーSupabase
│   └── supabase-admin.ts   # Admin Supabase (RLSバイパス)
├── features/           # 機能モジュール
├── hooks/              # カスタムフック
├── types/              # 型定義
└── styled-system/      # PandaCSS生成ファイル
docs/                   # プロジェクトドキュメント
public/                 # 静的ファイル
migrations/             # RLSマイグレーションSQL
```

## 最近の主要変更

- **2026-04-06** メール通知デフォルトON化 + 個別相談の緊急/初回チェックボックス追加
- **2026-04-06** 質問ページの講師選択RLS問題修正
- **2026-04-04** イベント申込データ復元ツール追加
- **2026-04-03** DMステータス絞り込み機能
- **2026-03-xx** Webhook RLSバイパス修正、DM機能改善、パスワードリセットOTP化

詳細は [docs/CHANGELOG.md](docs/CHANGELOG.md) を参照。

## Git Hooks

lefthook を使用して以下の pre-commit フックを実行:
- TypeScript の型チェック
- Biome によるコードの静的解析とフォーマット
