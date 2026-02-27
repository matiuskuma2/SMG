# タブ管理機能 実装計画書

## 1. 現状分析

### 1.1 フロント側（smg-front）のナビゲーション構造

**PC ヘッダータブ**: `src/features/top/components/layout/navigation.tsx`
- `useFilteredRoutes()` フックでルート定義をフィルタリング
- `ROUTE_DEFINITION` 配列（`src/features/top/const.ts`）からタブを静的に定義

**SP ハンバーガーメニュー**: `src/features/top/components/parts.tsx` → `Drawer`
- 同じ `useFilteredRoutes()` を使用

**SP フッター**: `src/features/top/components/layout/footer.tsx` → `SPFooter`
- ハードコードされた5つの固定リンク（検索、予約一覧、予約、動画、マイページ）

**現在の静的ルート定義（`const.ts`）**:
```typescript
export const ROUTE_DEFINITION: RouteDefinition[] = [
  { label: 'TOP', href: '/' },
  { label: '講座・イベント予約', href: '/events' },
  { label: 'ご利用ガイド', href: '/beginner' },
  { label: 'お知らせ', href: '/notice' },
  { label: '個別相談予約', href: '/consultations' },
  { label: '動画・写真', href: '/archive' },
  { label: 'SMGラジオ', href: '/radio' },
  { label: '講師に質問', href: '/questions' },
  { label: 'よくある質問', href: '/faq' },
  { label: '簿記3期', href: '/bookkeeping', requiredGroup: '簿記3期' },
  { label: '支部', href: '/shibu', requiredGroup: '支部' },
  { label: 'マスター講座', href: '/master-course', requiredGroup: 'マスター講座' },
];
```

**グループベースの表示制御**: `src/hooks/useFilteredRoutes.ts`
- `requiredGroup` が未指定 → 常に表示
- `requiredGroup` が指定 → そのグループ or 「運営」or「講師」に所属で表示

**ユーザーグループ取得**: `src/hooks/useUserGroups.ts`
- `trn_group_user` テーブルと `mst_group` テーブルを JOIN

### 1.2 管理画面側（smg-dashboard）のサイドバー

**サイドバー**: `src/features/root/components/side-bar/index.tsx`
- 完全にハードコード（静的リンク一覧）
- 現在タブ管理機能は存在しない

### 1.3 既存の「グループ表示制御」パターン（参考）

`trn_event_visible_group` テーブルでイベント×グループのN:N関係を管理するパターンが既に確立されている。タブの表示権限制御もこの同じパターンを踏襲する。

### 1.4 既存テーブル命名規則
- マスタ系: `mst_` prefix（例: `mst_user`, `mst_group`, `mst_event`）
- トランザクション系: `trn_` prefix（例: `trn_group_user`, `trn_event_visible_group`）
- 論理削除: `deleted_at` カラム（NULL = 有効）

---

## 2. データベース設計

### 2.1 新規テーブル: `mst_tab`

| カラム名 | 型 | NOT NULL | デフォルト | 説明 |
|---|---|---|---|---|
| `tab_id` | `uuid` | YES | `gen_random_uuid()` | PK |
| `display_name` | `text` | YES | | 表示名 |
| `link_type` | `text` | YES | | リンク種別: `notice`（お知らせ）, `shibu`（支部）, `event`（イベント予約）, `external`（外部URL）, `internal`（既存内部パス） |
| `link_value` | `text` | YES | | リンク先の値（パスまたはURL） |
| `display_order` | `integer` | YES | `0` | 表示順序（昇順） |
| `status` | `text` | YES | `'draft'` | 公開状態: `public`, `draft` |
| `is_visible_to_all` | `boolean` | YES | `true` | 全グループに表示するか |
| `created_at` | `timestamptz` | YES | `now()` | 作成日時 |
| `updated_at` | `timestamptz` | YES | `now()` | 更新日時 |
| `deleted_at` | `timestamptz` | NO | `NULL` | 論理削除日時 |

### 2.2 新規テーブル: `trn_tab_visible_group`

| カラム名 | 型 | NOT NULL | デフォルト | 説明 |
|---|---|---|---|---|
| `id` | `uuid` | YES | `gen_random_uuid()` | PK |
| `tab_id` | `uuid` | YES | | FK → `mst_tab.tab_id` |
| `group_id` | `uuid` | YES | | FK → `mst_group.group_id` |
| `created_at` | `timestamptz` | YES | `now()` | 作成日時 |
| `deleted_at` | `timestamptz` | NO | `NULL` | 論理削除日時 |

### 2.3 SQL マイグレーション

```sql
-- タブマスタ
CREATE TABLE IF NOT EXISTS mst_tab (
  tab_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL,
  link_type TEXT NOT NULL CHECK (link_type IN ('notice', 'shibu', 'event', 'external', 'internal')),
  link_value TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('public', 'draft')),
  is_visible_to_all BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX idx_mst_tab_display_order ON mst_tab (display_order) WHERE deleted_at IS NULL;
CREATE INDEX idx_mst_tab_status ON mst_tab (status) WHERE deleted_at IS NULL;

-- タブ表示グループ
CREATE TABLE IF NOT EXISTS trn_tab_visible_group (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tab_id UUID NOT NULL REFERENCES mst_tab(tab_id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES mst_group(group_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  UNIQUE(tab_id, group_id) WHERE (deleted_at IS NULL)
);

CREATE INDEX idx_trn_tab_visible_group_tab ON trn_tab_visible_group (tab_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_trn_tab_visible_group_group ON trn_tab_visible_group (group_id) WHERE deleted_at IS NULL;

-- RLS有効化
ALTER TABLE mst_tab ENABLE ROW LEVEL SECURITY;
ALTER TABLE trn_tab_visible_group ENABLE ROW LEVEL SECURITY;

-- RLSポリシー（service_role は全操作可能、authenticated ユーザーは閲覧のみ）
CREATE POLICY "service_role_all_mst_tab" ON mst_tab FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "authenticated_select_mst_tab" ON mst_tab FOR SELECT
  USING (auth.role() = 'authenticated' AND deleted_at IS NULL);

CREATE POLICY "service_role_all_trn_tab_visible_group" ON trn_tab_visible_group FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "authenticated_select_trn_tab_visible_group" ON trn_tab_visible_group FOR SELECT
  USING (auth.role() = 'authenticated' AND deleted_at IS NULL);
```

### 2.4 初期データ投入（既存のルート定義を移行）

```sql
-- 既存の静的ルート定義をDBに移行
INSERT INTO mst_tab (display_name, link_type, link_value, display_order, status, is_visible_to_all) VALUES
  ('TOP', 'internal', '/', 1, 'public', true),
  ('講座・イベント予約', 'internal', '/events', 2, 'public', true),
  ('ご利用ガイド', 'internal', '/beginner', 3, 'public', true),
  ('お知らせ', 'internal', '/notice', 4, 'public', true),
  ('個別相談予約', 'internal', '/consultations', 5, 'public', true),
  ('動画・写真', 'internal', '/archive', 6, 'public', true),
  ('SMGラジオ', 'internal', '/radio', 7, 'public', true),
  ('講師に質問', 'internal', '/questions', 8, 'public', true),
  ('よくある質問', 'internal', '/faq', 9, 'public', true),
  ('簿記3期', 'internal', '/bookkeeping', 10, 'public', false),
  ('支部', 'internal', '/shibu', 11, 'public', false),
  ('マスター講座', 'internal', '/master-course', 12, 'public', false);

-- グループ制限付きタブの visible_group を設定
-- 簿記3期
INSERT INTO trn_tab_visible_group (tab_id, group_id)
SELECT t.tab_id, g.group_id
FROM mst_tab t, mst_group g
WHERE t.display_name = '簿記3期' AND g.title = '簿記3期' AND t.deleted_at IS NULL AND g.deleted_at IS NULL;

-- 支部
INSERT INTO trn_tab_visible_group (tab_id, group_id)
SELECT t.tab_id, g.group_id
FROM mst_tab t, mst_group g
WHERE t.display_name = '支部' AND g.title = '支部' AND t.deleted_at IS NULL AND g.deleted_at IS NULL;

-- マスター講座
INSERT INTO trn_tab_visible_group (tab_id, group_id)
SELECT t.tab_id, g.group_id
FROM mst_tab t, mst_group g
WHERE t.display_name = 'マスター講座' AND g.title = 'マスター講座' AND t.deleted_at IS NULL AND g.deleted_at IS NULL;
```

---

## 3. 制約とルール

### 3.1 タブ数の上限
- **最大15タブ**（レイアウト崩れ防止。PC横並び + SPドロワーで適正数）
- 作成時にバリデーション

### 3.2 メニュー階層
- **単一階層のみ**（親タブのみ、サブメニューなし）

### 3.3 削除条件
- タブは即時削除可能（タブ自体にはコンテンツが紐付かないため）
- 確認ダイアログを表示

### 3.4 link_type の挙動
| link_type | link_value の値 | フロント側の遷移先 |
|---|---|---|
| `notice` | 自動（`/notice` 固定） | お知らせページ |
| `shibu` | 自動（`/shibu` 固定） | 支部ページ |
| `event` | 自動（`/events` 固定） | イベント予約ページ |
| `external` | 完全なURL | 新しいタブで外部リンクを開く |
| `internal` | パス（例: `/archive`） | 内部遷移 |

---

## 4. 実装ステップ

### Phase 1: DB + API（バックエンド）
1. Supabase SQL Editor でテーブル作成 + 初期データ投入
2. `smg-dashboard` に API ルート追加:
   - `GET /api/tabs` – タブ一覧取得
   - `POST /api/tabs` – タブ作成
   - `PUT /api/tabs/[id]` – タブ更新
   - `DELETE /api/tabs/[id]` – タブ削除（論理削除）
   - `PUT /api/tabs/reorder` – 並び順変更
3. `smg-front` に API ルート追加:
   - `GET /api/tabs` – ユーザー向けタブ一覧取得（公開 + 権限フィルタ済み）

### Phase 2: 管理画面 UI（smg-dashboard）
1. サイドバーに「タブ管理」メニュー追加
2. タブ一覧ページ（`/tablist`）
   - テーブル表示: 表示名、リンク種別、表示順、公開/下書き、権限
   - ドラッグ&ドロップ or 数値入力で並び替え
   - 作成・編集・削除ボタン
3. タブ作成/編集ページ（`/tab/new`, `/tab/[id]`）
   - フォーム: 表示名、リンク種別（セレクト）、リンク先、表示順、公開状態、権限設定
   - 権限: 「全員に表示」チェックボックス + グループ選択（複数選択可）
4. 削除確認ダイアログ

### Phase 3: フロント側の動的タブ化（smg-front）
1. `useFilteredRoutes` フックを改修 → Supabase からタブデータを取得
2. `ROUTE_DEFINITION` を DB データに置換（フォールバックとして静的定義を維持）
3. `Navigation`、`Drawer`、フッター（PC）の表示をDB駆動に変更
4. `external` タイプの場合、`target="_blank"` で新タブ開放

### Phase 4: テストとデプロイ
1. 既存のルート定義がすべてDB移行後も正しく動作するか確認
2. グループ制限付きタブの権限チェックテスト
3. タブの追加/編集/削除/並び替えの管理画面テスト
4. 本番デプロイ

---

## 5. 影響範囲

### 変更されるファイル（smg-front）
| ファイル | 変更内容 |
|---|---|
| `src/features/top/const.ts` | フォールバック用に維持、DBからの取得を優先 |
| `src/hooks/useFilteredRoutes.ts` | DB取得ロジックに改修 |
| `src/features/top/components/layout/navigation.tsx` | 外部リンク対応追加 |
| `src/features/top/components/parts.tsx` (Drawer) | 外部リンク対応追加 |
| `src/features/top/components/layout/footer.tsx` | PC Footer のリンクをDB駆動に（オプション） |

### 新規ファイル（smg-dashboard）
| ファイル | 内容 |
|---|---|
| `src/app/api/tabs/route.ts` | タブ CRUD API |
| `src/app/api/tabs/[id]/route.ts` | 個別タブ API |
| `src/app/api/tabs/reorder/route.ts` | 並び替え API |
| `src/app/tablist/page.tsx` | タブ一覧ページ |
| `src/app/tab/new/page.tsx` | タブ新規作成ページ |
| `src/app/tab/[id]/page.tsx` | タブ編集ページ |

### 新規ファイル（smg-front）
| ファイル | 内容 |
|---|---|
| `src/app/api/tabs/route.ts` | ユーザー向けタブ取得 API |

---

## 6. 技術的な注意点

1. **キャッシュ戦略**: タブデータは頻繁に変更されないため、ISR (Incremental Static Regeneration) またはクライアントサイドキャッシュ（SWR/React Query）で最適化
2. **フォールバック**: DBからの取得失敗時は `ROUTE_DEFINITION` の静的定義にフォールバック
3. **RLS**: `service_role` で管理画面から CRUD、`authenticated` ユーザーは SELECT のみ
4. **運営/講師の特別扱い**: 現行ロジックと同様、「運営」「講師」グループは全タブを閲覧可能

---

## 7. タイムライン見積もり

| フェーズ | 作業内容 | 見積もり |
|---|---|---|
| Phase 1 | DB作成 + API実装 | 2-3時間 |
| Phase 2 | 管理画面UI | 4-5時間 |
| Phase 3 | フロント動的化 | 2-3時間 |
| Phase 4 | テスト + デプロイ | 1-2時間 |
| **合計** | | **9-13時間** |
