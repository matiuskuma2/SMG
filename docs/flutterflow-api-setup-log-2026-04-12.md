# FlutterFlow API設定ログ（SMG）

更新日: 2026-04-12
対象: `smgfrontapi`（Base URL: `https://www.smgkeieijuku.com`）

## この作業の目的
FlutterFlow から SMG 会員サイト API を安定して呼び出せるようにし、
「どの画面のどこに何を入れるか」を実運用レベルで確定する。

---

## 重要な前提（結論）
1. `event_id` は **UUID形式の実イベントID文字列** を入れる。  
   - 例: `f16173ce-65db-4d13-91e1-6b21e5a73e08`
   - `UUID` という文字をそのまま入力するのではない。
2. `create-checkout-session` は FlutterFlow 設定を正しくしても `500` が再現するケースがあり、サーバー側条件/実装要因の切り分けが必要。
3. FlutterFlow のこの UI では JSON 型変数（`selectedTypes`, `questionAnswers`）に対して、Response & Test 画面で直接値入力欄が出ない場合がある。

---

## 実施した設定（確定版）

### API Group
- Group Name: `smgfrontapi`
- Base URL: `https://www.smgkeieijuku.com`
- Group Header:
  - `Accept: application/json`

### 成功確認できた GET API
- `getBanners` → `GET /api/banners`（200, JSON応答）
- `getIndustries` → `GET /api/industries`（200, `[]` は正常）
- `getQuestionInstructors` → `GET /api/question-instructors`（疎通確認OK）

### `getUserProfile` 404対応
- `GET /api/user-profile/[userId]` は `mst_user` テーブル参照。
- Authユーザー作成直後は `mst_user` 未作成で 404 になるため、テストユーザーを `mst_user` に投入して解消。

---

## createCheckoutSession（本件の要点）

### 対象API
- `POST /api/create-checkout-session`

### FlutterFlow側の設定（実施済み）
- Method: `POST`
- Headers:
  - `Authorization: Bearer [access_token]`
  - `apikey: sb_publishable_...`
  - `Content-Type: application/json`
- Variables:
  - `event_id` (String)
  - `selectedTypes` (JSON)
  - `participationType` (String)
  - `questionAnswers` (JSON)
  - `isUrgent` (Boolean)
  - `isFirstConsultation` (Boolean)
  - `access_token` (String)
- Body(JSON):
```json
{
  "event_id": "f16173ce-65db-4d13-91e1-6b21e5a73e08",
  "selectedTypes": ["Networking"],
  "participationType": "Event",
  "questionAnswers": {},
  "isUrgent": false,
  "isFirstConsultation": false
}
```

### 検証結果
- FlutterFlow からは `500`（`決済セッションの作成に失敗しました`）
- 同条件で cURL でも `500` を再現
- よって、FlutterFlow の入力ミスではなく、サーバー側要因の可能性が高い

---

## サーバー側で次にやるべきこと（開発タスク）
1. `/api/create-checkout-session` の catch でエラー詳細（原因分類）を返す一時デバッグを入れる。
2. 失敗理由を判定可能にする（例）:
   - 対象イベントなし
   - 締切超過
   - 定員超過
   - 懇親会料金未設定
   - 認証コンテキスト不整合
3. FlutterFlow からの Bearer 認証時の user 解決方式を明確化（Cookie依存排除の検討）。

---

## 運用メモ
- トークン/パスワード等の機密情報はドキュメントに平文で残さない。
- テスト時に使った access token は短命（約1時間）なので、実運用はログインフローから都度取得する。
- API Group と API Call の同名ヘッダー重複はエラー原因になるため、共通ヘッダーと個別ヘッダーを分離管理する。
