# smg_dashboard

SMG 経営塾プラットフォームの管理画面

## 技術スタック

- Node.js (>=22.14.0)
- pnpm
- Next.js 15.2
- React 19.1
- TypeScript
- Biome (Linter & Formatter)

## セットアップ

```bash
# 依存パッケージのインストール
pnpm install

# 開発サーバーの起動
pnpm dev

# Supabase型定義の生成（データベーススキーマ変更時）
pnpm gen:types
```

### Supabase 型定義について

データベーススキーマが変更された場合、以下のコマンドで型定義とヘルパー型を自動生成できます:

```bash
# ローカルSupabaseを起動（未起動の場合）
cd ../smg_backend
supabase start

# 型定義の生成（smg_dashboardディレクトリで実行）
cd ../smg_dashboard
pnpm gen:types
```

**前提条件:**

- `smg_backend`プロジェクトのローカル Supabase が起動していること
- `psql`コマンドがインストールされていること

このコマンドは以下を実行します:

1. `supabase gen types --local` - ローカル Supabase から型定義を生成
2. `better-supabase-types` - 型定義を最適化
3. `scripts/generate-type-helpers.js` - データベースに接続してテーブル/関数一覧を取得し、ヘルパー型を自動生成

生成されるヘルパー型の例:

```typescript
// テーブル型
export type MstUser = Tables<"mst_user">;
export type InsertMstUser = TablesInsert<"mst_user">;
export type UpdateMstUser = TablesUpdate<"mst_user">;

// 関数型
export type ArgsFetchDmPageData =
  Database["public"]["Functions"]["fetch_dm_page_data"]["Args"];
export type ReturnTypeFetchDmPageData =
  Database["public"]["Functions"]["fetch_dm_page_data"]["Returns"];
```

**注意:** ヘルパー型は`src/lib/supabase/types.ts`の末尾に自動追加されます。手動で編集しないでください。

# supabase の型情報の出力

pnpm supabase login # 初回のみ
pnpm gen:supabase # 先に<project_id>を supabase の project_id に書き換える

```

開発サーバーは http://localhost:3000 で起動します。

## スクリプト

- `pnpm dev` - 開発サーバーの起動
- `pnpm build` - プロダクションビルドの作成
- `pnpm lint` - Biomeを使用したコードの静的解析
- `pnpm format` - Biomeを使用したコードフォーマット
- `pnpm gen:supabase` - supabaseの型情報を出力

## ディレクトリ構成

```

src/
├── app/ # Next.js App Router pages
├── components/ # 共通コンポーネント
│ ├── elements/ # 基本的な UI 要素
│ ├── features/ # 特定の機能に関連するコンポーネント
│ └── layouts/ # レイアウトコンポーネント
├── config/ # アプリケーション設定
├── features/ # 機能ごとのコード
│ └── [feature]/
│ ├── api/ # API クライアント
│ ├── components/# 機能固有のコンポーネント
│ ├── hooks/ # カスタムフック
│ ├── types/ # 型定義
│ └── utils/ # ユーティリティ関数
├── hooks/ # 共通のカスタムフック
├── lib/ # サードパーティライブラリの設定
├── styles/ # グローバルスタイル
├── types/ # グローバルな型定義
└── utils/ # ユーティリティ関数

public/ # 静的ファイル

```

参考：[bulletproof-react / nextjs-app](https://github.com/alan2207/bulletproof-react/tree/master/apps/nextjs-app)

## Git Hooks

lefthookを使用して以下のpre-commitフックを実行しています：

- TypeScriptの型チェック
- Biomeによるコードの静的解析とフォーマット
```

this is smg-801 branch test
