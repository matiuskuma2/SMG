# SMG Front

SMG 経営塾プラットフォームの会員サイト

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
```

開発サーバーは http://localhost:3000 で起動します。

## スクリプト

- `pnpm dev` - 開発サーバーの起動
- `pnpm build` - プロダクションビルドの作成
- `pnpm lint` - Biome を使用したコードの静的解析
- `pnpm format` - Biome を使用したコードフォーマット

## ディレクトリ構成

```
src/
├── app/                # Next.js App Router pages
├── components/         # 共通コンポーネント
│   ├── elements/      # 基本的なUI要素
│   ├── features/      # 特定の機能に関連するコンポーネント
│   └── layouts/       # レイアウトコンポーネント
├── config/            # アプリケーション設定
├── features/          # 機能ごとのコード
│   └── [feature]/
│       ├── api/       # APIクライアント
│       ├── components/# 機能固有のコンポーネント
│       ├── hooks/     # カスタムフック
│       ├── types/     # 型定義
│       └── utils/     # ユーティリティ関数
├── hooks/             # 共通のカスタムフック
├── lib/              # サードパーティライブラリの設定
├── styles/           # グローバルスタイル
├── types/            # グローバルな型定義
└── utils/            # ユーティリティ関数

public/              # 静的ファイル
```

参考：[bulletproof-react / nextjs-app](https://github.com/alan2207/bulletproof-react/tree/master/apps/nextjs-app)

## Git Hooks

lefthook を使用して以下の pre-commit フックを実行しています：

- TypeScript の型チェック
- Biome によるコードの静的解析とフォーマット

this is smg-801 branch test
