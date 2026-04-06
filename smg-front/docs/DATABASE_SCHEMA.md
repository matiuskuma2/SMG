# SMG経営塾 データベーススキーマ

最終更新: 2026-04-06
ソース: `src/lib/supabase/types.ts` より抽出

## 主要テーブル詳細

### mst_user (ユーザーマスタ)
| カラム | 型 | 説明 |
|--------|---|------|
| user_id | string (PK) | Supabase Auth UID |
| username | string | ユーザー名 |
| email | string | メールアドレス |
| phone_number | string\|null | 電話番号 |
| company_name | string\|null | 会社名 |
| profile_image_url | string\|null | プロフィール画像URL |
| is_profile_public | boolean | プロフィール公開設定 |
| postal_code | string\|null | 郵便番号 |
| prefecture | string\|null | 都道府県 |
| city_address | string\|null | 市区町村以降 |
| building_name | string\|null | 建物名 |
| created_at | string\|null | 作成日時 |
| updated_at | string\|null | 更新日時 |
| deleted_at | string\|null | 論理削除日時 |

### mst_event (イベントマスタ)
| カラム | 型 | 説明 |
|--------|---|------|
| event_id | string (PK) | イベントID |
| event_name | string | イベント名 |
| event_type | string | イベント種類 (定例会/簿記講座/オンラインセミナー/特別セミナー等) |
| event_location | string\|null | 開催場所 |
| event_city | string\|null | 開催都市 |
| event_capacity | number | イベント定員 |
| gather_capacity | number\|null | 懇親会定員 |
| consultation_capacity | number\|null | 個別相談定員 |
| gather_price | number\|null | 懇親会参加費 (円) |
| gather_registration_end_datetime | string\|null | 懇親会申込締切日時 |
| registration_end_datetime | string\|null | 申込締切日時 |
| has_gather | boolean | 懇親会あり |
| has_consultation | boolean | 個別相談あり |
| notification_sent | boolean | 通知送信済みフラグ |
| created_at / updated_at / deleted_at | string\|null | タイムスタンプ |

### trn_event_attendee (イベント参加者)
| カラム | 型 | 説明 |
|--------|---|------|
| event_id | string (FK→mst_event) | イベントID |
| user_id | string (FK→mst_user) | ユーザーID |
| is_offline | boolean | オフライン参加フラグ |
| created_at / updated_at / deleted_at | string\|null | タイムスタンプ |

### trn_gather_attendee (懇親会参加者)
| カラム | 型 | 説明 |
|--------|---|------|
| event_id | string (FK→mst_event) | イベントID |
| user_id | string (FK→mst_user) | ユーザーID |
| stripe_payment_intent_id | string\|null | Stripe PaymentIntent ID |
| stripe_payment_status | string\|null | 決済ステータス |
| payment_amount | number\|null | 支払い金額 |
| payment_date | string\|null | 支払い日時 |
| created_at / updated_at / deleted_at | string\|null | タイムスタンプ |

### trn_consultation_attendee (個別相談参加者)
| カラム | 型 | 説明 |
|--------|---|------|
| event_id | string (FK→mst_event) | イベントID |
| user_id | string (FK→mst_user) | ユーザーID |
| **is_urgent** | boolean | **緊急相談フラグ** (デフォルト: false) |
| **is_first_consultation** | boolean | **初回相談フラグ** (デフォルト: false) |
| notes | string\|null | 備考 |
| created_at / updated_at / deleted_at | string\|null | タイムスタンプ |

### mst_notification (通知マスタ)
| カラム | 型 | 説明 |
|--------|---|------|
| notification_id | string (PK) | 通知ID |
| notification_type | string | 通知種類 (event/consultation/announcement等) |
| title | string | 通知タイトル |
| content | string | 通知本文 |
| related_url | string\|null | 関連URL |
| created_at / updated_at | string\|null | タイムスタンプ |

### mst_notification_settings (通知設定)
| カラム | 型 | 説明 |
|--------|---|------|
| setting_id | string (PK) | 設定ID |
| user_id | string (FK→mst_user) | ユーザーID |
| notification_type | string | 通知タイプキー |
| **is_enabled** | boolean | **有効/無効** (レコード無し時のデフォルト動作: **ON**) |
| created_at / updated_at / deleted_at | string\|null | タイムスタンプ |

**ユニーク制約:** `(user_id, notification_type)`

### trn_user_notification (ユーザー通知リレーション)
| カラム | 型 | 説明 |
|--------|---|------|
| notification_id | string (FK→mst_notification) | 通知ID |
| user_id | string (FK→mst_user) | ユーザーID |
| is_read | boolean | 既読フラグ |
| created_at / updated_at | string\|null | タイムスタンプ |

### trn_event_question_answer (イベント質問回答)
| カラム | 型 | 説明 |
|--------|---|------|
| question_id | string (FK) | 質問ID |
| user_id | string (FK→mst_user) | ユーザーID |
| answer | any | 回答内容 |
| deleted_at | string\|null | 論理削除 |

---

## テーブル間リレーション

```
mst_user
  ├─→ trn_event_attendee (1:N)
  ├─→ trn_gather_attendee (1:N)
  ├─→ trn_consultation_attendee (1:N)
  ├─→ trn_consultation_application (1:N)
  ├─→ trn_user_notification (1:N)
  ├─→ mst_notification_settings (1:N)
  └─→ trn_event_question_answer (1:N)

mst_event
  ├─→ trn_event_attendee (1:N)
  ├─→ trn_gather_attendee (1:N)
  └─→ trn_consultation_attendee (1:N)

mst_notification
  └─→ trn_user_notification (1:N)
```

## 論理削除パターン

全テーブルで `deleted_at` カラムによる論理削除を採用。
クエリ時は `.is('deleted_at', null)` を付けることで有効レコードのみ取得。
