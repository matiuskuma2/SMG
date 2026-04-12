# Bearer認証 QAチェックシート (curl付き)

**対象ブランチ**: `claude/analyze-project-structure-6f8DM`
**前提**: 本番 (`https://www.smgkeieijuku.com`) に適用後に実施。
ステージング環境がある場合はそちらで先に通すこと。

---

## 0. 事前準備

```bash
export BASE_URL="https://www.smgkeieijuku.com"
export SUPABASE_URL="https://zjeyqpwkpbkycyltxirr.supabase.co"
export ANON_KEY="sb_publishable_9cX9rIsWF3l2XoeW0syO2Q_WsTV-azB"

# テストユーザー UserA (一般会員)
export EMAIL_A="matiuskuma2+1@gmail.com"
export PASS_A="Potetoman12"

# UserA の JWT 取得
export JWT_A=$(curl -s -X POST \
  "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL_A}\",\"password\":\"${PASS_A}\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

echo "JWT_A: ${JWT_A:0:20}..."

# (必要に応じて) UserB / Admin の JWT も同様に取得
# export JWT_B=...
# export JWT_ADMIN=...

# 任意のイベントID (UserA が参加しているもの / していないもの)
export EVENT_ID_A_JOINED="f16173ce-65db-4d13-91e1-6b21e5a73e08"
export EVENT_ID_A_NOT_JOINED="00000000-0000-0000-0000-000000000000"  # 要差し替え
```

---

## 1. 🔴最優先: 情報漏洩否定テスト

### 1-A. `/api/seating/assignments/[eventId]` — 非参加ユーザーが他イベントを見られないこと

```bash
# UserA が参加していないイベントの配席を取得
curl -s -w "\nHTTP: %{http_code}\n" \
  "${BASE_URL}/api/seating/assignments/${EVENT_ID_A_NOT_JOINED}?roundNumber=1" \
  -H "Authorization: Bearer ${JWT_A}" \
  -H "Accept: application/json"
# ✅ 期待: HTTP 403 ({"error":"Forbidden"})
# ❌ NG:   200 で username/nickname/icon/has_mobility_issues を含むテーブル一覧

# UserA が参加しているイベントの配席は取得可
curl -s -w "\nHTTP: %{http_code}\n" \
  "${BASE_URL}/api/seating/assignments/${EVENT_ID_A_JOINED}?roundNumber=1" \
  -H "Authorization: Bearer ${JWT_A}" \
  -H "Accept: application/json"
# ✅ 期待: HTTP 200 または 404 (配席未作成時)
```

### 1-B. `/api/user-profile/[userId]` — 他人の個人情報が過剰に返らないこと

```bash
# 他ユーザーID (UserB など) を指定
curl -s -w "\nHTTP: %{http_code}\n" \
  "${BASE_URL}/api/user-profile/<OTHER_USER_ID>" | python3 -m json.tool
# ⚠️  このAPIは現状カテゴリA (変更対象外) で select=* のため、
#      email / phone_number 等が可視性フラグに関わらず返ることがある。
#      本PRの直接対象外だが、別チケットで select カラム絞り込み + 可視性
#      フラグ反映のフィルタリングを推奨。
```

---

## 2. Bearer認証の基本疎通 (全17改修API共通パターン)

以下の3パターンを各APIで確認:
```bash
# パターン1: Bearer 有効 → 200系
curl -s -w "\nHTTP: %{http_code}\n" \
  "${BASE_URL}/api/event-participant-count?event_id=${EVENT_ID_A_JOINED}" \
  -H "Authorization: Bearer ${JWT_A}" \
  -H "Accept: application/json"
# ✅ 200 + {eventCount, offlineEventCount, gatherCount, consultationCount}

# パターン2: Bearer なし → 401
curl -s -w "\nHTTP: %{http_code}\n" \
  "${BASE_URL}/api/event-participant-count?event_id=${EVENT_ID_A_JOINED}" \
  -H "Accept: application/json"
# ✅ 401 + {"error":"認証が必要です"}

# パターン3: Bearer 不正 → 401
curl -s -w "\nHTTP: %{http_code}\n" \
  "${BASE_URL}/api/event-participant-count?event_id=${EVENT_ID_A_JOINED}" \
  -H "Authorization: Bearer invalid_token_12345" \
  -H "Accept: application/json"
# ✅ 401 + {"error":"認証トークンが無効です"}
```

---

## 3. カテゴリB (2本)

### 3-A. `/api/event-participant-count`
上記セクション2参照。

### 3-B. `/api/mypage/qr-code`
```bash
curl -s -w "\nHTTP: %{http_code}\n" \
  "${BASE_URL}/api/mypage/qr-code" \
  -H "Authorization: Bearer ${JWT_A}" \
  -H "Accept: application/json"
# ✅ 200 (qrImage/qrToken) または 404 (該当なし)
```

---

## 4. カテゴリC (15本) — user_id 固定化確認

「**bodyやqueryに他人のuserIdを混ぜても、自分のデータしか触れない**」が核心。

### 4-A. `/api/profile/get`
```bash
curl -s "${BASE_URL}/api/profile/get" \
  -H "Authorization: Bearer ${JWT_A}" \
  -H "Accept: application/json" | python3 -m json.tool
# ✅ UserA のプロフィールのみ返る
# ❌ NG: 他人のプロフィールや email/phone が漏れる
```

### 4-B. `/api/profile/update` — 他人IDを送っても自分しか更新されない
```bash
# body.user_id 等を仮に混ぜても無視されるべき
curl -s -X PUT "${BASE_URL}/api/profile/update" \
  -H "Authorization: Bearer ${JWT_A}" \
  -H "Content-Type: application/json" \
  -d '{"name":"UserA更新テスト","nameKana":"ユーザーエーコウシン","companyName":"Co.","companyNameKana":"カ","sns":{},"visibility":{"name":true,"nameKana":true,"nickname":true,"email":false,"phoneNumber":false,"userPosition":true,"birthday":false,"companyName":true,"companyNameKana":true,"companyAddress":true,"industry":true,"introduction":true,"website":true,"sns":true}}'
# ✅ success:true
# 追加検証: DB で UserA のみが更新、UserB の mst_user.updated_at が変わらないこと
```

### 4-C. `/api/receipts/save-history` — body.userId は無視される
```bash
curl -s -X POST "${BASE_URL}/api/receipts/save-history" \
  -H "Authorization: Bearer ${JWT_A}" \
  -H "Content-Type: application/json" \
  -d '{"userId":"<他人のuser_id>","receiptNumber":"TEST-0001","recipientName":"テスト","amount":1000}'
# ✅ success:true
# 追加検証: DB で trn_receipt_history.user_id は UserA (not 他人)
```

### 4-D. その他カテゴリCの主要疎通
```bash
for path in \
  "/api/profile/get" \
  "/api/mypage/applications?page=1&limit=10" \
  "/api/tabs" \
  "/api/receipts/history?stripe_payment_intent_id=pi_test" \
  "/api/seating/my-seat/${EVENT_ID_A_JOINED}" ; do
  echo "=== ${path} ==="
  curl -s -w "HTTP: %{http_code}\n\n" \
    "${BASE_URL}${path}" \
    -H "Authorization: Bearer ${JWT_A}" \
    -H "Accept: application/json" | head -20
done
```

---

## 5. `create-checkout-session` 個別チェック (FlutterFlow起点)

### 5-A. 正常 payload → 200 + url
```bash
curl -s -w "\nHTTP: %{http_code}\n" -X POST \
  "${BASE_URL}/api/create-checkout-session" \
  -H "Authorization: Bearer ${JWT_A}" \
  -H "Content-Type: application/json" \
  -d "{
    \"event_id\":\"${EVENT_ID_A_JOINED}\",
    \"selectedTypes\":[\"Networking\"],
    \"participationType\":\"Event\",
    \"questionAnswers\":{},
    \"isUrgent\":false,
    \"isFirstConsultation\":false
  }"
# ✅ 200 + {"url":"https://checkout.stripe.com/..."}
```

### 5-B. selectedTypes 欠落/不正 → 500 ではなく 400
```bash
# 欠落
curl -s -w "\nHTTP: %{http_code}\n" -X POST \
  "${BASE_URL}/api/create-checkout-session" \
  -H "Authorization: Bearer ${JWT_A}" \
  -H "Content-Type: application/json" \
  -d "{\"event_id\":\"${EVENT_ID_A_JOINED}\"}"
# ✅ 400 (selectedTypes は1件以上の配列が必要です)

# 空配列
curl -s -w "\nHTTP: %{http_code}\n" -X POST \
  "${BASE_URL}/api/create-checkout-session" \
  -H "Authorization: Bearer ${JWT_A}" \
  -H "Content-Type: application/json" \
  -d "{\"event_id\":\"${EVENT_ID_A_JOINED}\",\"selectedTypes\":[]}"
# ✅ 400

# 不正な値
curl -s -w "\nHTTP: %{http_code}\n" -X POST \
  "${BASE_URL}/api/create-checkout-session" \
  -H "Authorization: Bearer ${JWT_A}" \
  -H "Content-Type: application/json" \
  -d "{\"event_id\":\"${EVENT_ID_A_JOINED}\",\"selectedTypes\":[\"Hack\"]}"
# ✅ 400 (selectedTypes に不正な値が含まれています)

# event_id 不正
curl -s -w "\nHTTP: %{http_code}\n" -X POST \
  "${BASE_URL}/api/create-checkout-session" \
  -H "Authorization: Bearer ${JWT_A}" \
  -H "Content-Type: application/json" \
  -d "{\"event_id\":\"00000000-0000-0000-0000-000000000000\",\"selectedTypes\":[\"Event\"]}"
# ✅ 404 (指定されたイベントが見つかりません)
```

### 5-C. metadata.userId が認証ユーザーIDになっていること
Stripe Dashboard (Checkout Sessions) で当該セッションの metadata を開き、
`userId = UserA の user_id` であることを確認。

---

## 6. `seating/generate` 権限チェック

```bash
# 一般ユーザー (UserA) → 403
curl -s -w "\nHTTP: %{http_code}\n" -X POST \
  "${BASE_URL}/api/seating/generate" \
  -H "Authorization: Bearer ${JWT_A}" \
  -H "Content-Type: application/json" \
  -d "{\"eventId\":\"${EVENT_ID_A_JOINED}\",\"totalTables\":5,\"seatsPerTable\":4,\"roundNumber\":1}"
# ✅ 403 Forbidden

# 運営/講師 (JWT_ADMIN) → 200 (または参加者なしで 404)
curl -s -w "\nHTTP: %{http_code}\n" -X POST \
  "${BASE_URL}/api/seating/generate" \
  -H "Authorization: Bearer ${JWT_ADMIN}" \
  -H "Content-Type: application/json" \
  -d "{\"eventId\":\"${EVENT_ID_A_JOINED}\",\"totalTables\":5,\"seatsPerTable\":4,\"roundNumber\":1}"
# ✅ 200 success or 404 No paid participants
```

---

## 7. 回帰テスト (既存Web / Cookie経路)

Bearerに変更していない/したに関わらず、Cookieログイン状態のブラウザで以下を目視確認。

| ページ | 確認項目 |
|---|---|
| `/events` | 参加人数が表示される |
| `/events/[id]` | 詳細の参加人数・一覧と整合 |
| `/mypage` | 申込一覧が表示される |
| `/mypage/profile` | 自分の情報が取得・保存できる |
| イベント申込 → 決済 | Stripe Checkout へ遷移・決済成功後の戻り先が正しい |
| `/mypage/receipts` | 領収書履歴・PDF/メール送信 |

---

## 8. 合否基準

- すべての ✅ 期待値が満たされる。
- 特に **1-A (seating/assignments 403)** と **5-B (checkout 400 化)** は必達。
- 回帰で1つでも既存機能が壊れていたら、該当コミットを revert してから再テスト。
