#!/usr/bin/env python3
"""
SMG 既存会員一括登録スクリプト
- CSVから代表者・パートナーを読み込み
- Supabase Auth にユーザー作成（既存なら上書き、パスワードは変更しない）
- mst_user にレコード作成/更新
- パートナーは daihyosha_id で代表者と紐付け
"""

import csv
import json
import sys
import time
import httpx
import os

# === 設定 ===
CSV_PATH = "/home/user/uploaded_files/完成版既存会員リスト.csv"
DEFAULT_PASSWORD = "smg2026xday"

# .env.localから読み取り
def get_env():
    env = {}
    with open("/home/user/webapp/smg-dashboard/.env.local") as f:
        for line in f:
            line = line.strip()
            if line and "=" in line and not line.startswith("#"):
                key, val = line.split("=", 1)
                env[key] = val.strip('"').strip("'")
    return env

env = get_env()
SUPABASE_URL = env["NEXT_PUBLIC_SUPABASE_URL"]
SERVICE_KEY = env["SUPABASE_SERVICE_ROLE_KEY"]

HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

# レート制限対策
REQUEST_DELAY = 0.05  # 50ms between requests

client = httpx.Client(timeout=30.0)


def supabase_get(path, params=None):
    """Supabase REST GET"""
    r = client.get(f"{SUPABASE_URL}/rest/v1/{path}", headers=HEADERS, params=params or {})
    r.raise_for_status()
    return r.json()


def supabase_post(path, data):
    """Supabase REST POST"""
    r = client.post(f"{SUPABASE_URL}/rest/v1/{path}", headers=HEADERS, json=data)
    if r.status_code >= 400:
        raise Exception(f"POST {path} failed: {r.status_code} {r.text}")
    return r.json() if r.text else None


def supabase_patch(path, data, params):
    """Supabase REST PATCH"""
    r = client.patch(f"{SUPABASE_URL}/rest/v1/{path}", headers=HEADERS, json=data, params=params)
    if r.status_code >= 400:
        raise Exception(f"PATCH {path} failed: {r.status_code} {r.text}")
    return r.json() if r.text else None


def auth_create_user(email, password):
    """Supabase Auth: ユーザー作成"""
    r = client.post(
        f"{SUPABASE_URL}/auth/v1/admin/users",
        headers=HEADERS,
        json={
            "email": email,
            "password": password,
            "email_confirm": True,
        },
    )
    if r.status_code >= 400:
        return None, r.json()
    return r.json(), None


def auth_get_user_by_email(email):
    """Supabase Auth: メールでユーザー検索"""
    # listUsersでフィルタ（Supabase GoTrue API）
    r = client.get(
        f"{SUPABASE_URL}/auth/v1/admin/users",
        headers=HEADERS,
        params={"page": 1, "per_page": 1},
    )
    # GoTrue doesn't support email filter in list, use different approach
    return None


def find_mst_user_by_email(email):
    """mst_userからメールで検索"""
    data = supabase_get("mst_user", {"select": "user_id,deleted_at,email", "email": f"eq.{email}", "limit": "1"})
    return data[0] if data else None


def create_or_update_user(email, username, kana, user_type, daihyosha_id=None):
    """
    ユーザーを作成または更新
    - 既存ならプロフィール更新（パスワードは変更しない）
    - 新規ならAuth作成 + mst_user作成
    """
    email = email.lower().strip()
    
    # mst_userで既存チェック
    existing = find_mst_user_by_email(email)
    
    now = time.strftime("%Y-%m-%dT%H:%M:%S+00:00")
    
    if existing:
        # 既存ユーザー → プロフィール更新のみ（パスワードは変更しない）
        update_data = {
            "updated_at": now,
        }
        # usernameが入っている場合のみ更新
        if username:
            update_data["username"] = username
            update_data["company_name"] = username
            update_data["company_name_kana"] = username
        if kana:
            update_data["user_name_kana"] = kana
        if user_type:
            update_data["user_type"] = user_type
        if daihyosha_id:
            update_data["daihyosha_id"] = daihyosha_id
        
        # deleted_atがある場合は復活
        if existing.get("deleted_at"):
            update_data["deleted_at"] = None
        
        supabase_patch("mst_user", update_data, {"user_id": f"eq.{existing['user_id']}"})
        return existing["user_id"], False  # updated
    
    # 新規ユーザー → Auth作成
    auth_data, auth_error = auth_create_user(email, DEFAULT_PASSWORD)
    
    if auth_error:
        error_msg = auth_error.get("msg", "") or auth_error.get("message", "") or str(auth_error)
        # 既にAuthに存在する場合
        if "already been registered" in error_msg or "already exists" in error_msg:
            # Auth側にはあるがmst_userにない場合 → AuthのIDを取得してmst_userに作成
            # GoTrue APIで直接検索はできないので、mst_userを再確認
            # この場合、Auth IDが分からないのでスキップするかエラーにする
            print(f"  WARNING: Auth exists but mst_user not found: {email} - {error_msg}")
            return None, False
        raise Exception(f"Auth create error for {email}: {error_msg}")
    
    user_id = auth_data["id"]
    
    # mst_user にレコード挿入
    insert_data = {
        "user_id": user_id,
        "email": email,
        "username": username or "",
        "company_name": username or "",
        "company_name_kana": username or "",
        "user_name_kana": kana or None,
        "user_type": user_type or "代表者",
        "created_at": now,
        "updated_at": now,
    }
    if daihyosha_id:
        insert_data["daihyosha_id"] = daihyosha_id
    
    try:
        supabase_post("mst_user", [insert_data])
    except Exception as e:
        # ロールバック
        client.delete(
            f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}",
            headers=HEADERS,
        )
        raise Exception(f"mst_user insert error for {email}: {e}")
    
    return user_id, True  # created


def main():
    print("=" * 60)
    print("SMG 既存会員一括登録スクリプト")
    print("=" * 60)
    
    # CSVを読み込み
    representatives = []  # 代表者
    partners = []  # パートナー
    
    with open(CSV_PATH, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        headers = next(reader)
        
        for row in reader:
            if len(row) < 6:
                continue
            
            email = row[0].strip()
            name = row[1].strip()
            kana = row[2].strip()
            role = row[5].strip()
            rep_email = row[6].strip() if len(row) > 6 else ""
            
            if not email:
                continue  # メールアドレス空はスキップ
            
            if role == "代表者":
                representatives.append({
                    "email": email,
                    "name": name,
                    "kana": kana,
                })
            elif role == "パートナー":
                partners.append({
                    "email": email,
                    "name": name,
                    "kana": kana,
                    "rep_email": rep_email,
                })
    
    print(f"代表者: {len(representatives)}名")
    print(f"パートナー: {len(partners)}名")
    print(f"合計: {len(representatives) + len(partners)}名")
    print()
    
    # DRY RUN check
    dry_run = "--dry-run" in sys.argv
    if dry_run:
        print(">>> DRY RUN モード（実際の登録は行いません）<<<")
        print()
    
    # Phase 1: 代表者を登録
    print("-" * 60)
    print("Phase 1: 代表者を登録")
    print("-" * 60)
    
    rep_email_to_userid = {}  # email -> user_id マッピング（パートナー紐付け用）
    created_count = 0
    updated_count = 0
    error_count = 0
    skip_count = 0
    
    for i, rep in enumerate(representatives):
        try:
            if dry_run:
                print(f"  [{i+1}/{len(representatives)}] DRY: {rep['email']} - {rep['name']}")
                rep_email_to_userid[rep["email"].lower().strip()] = "dry-run-id"
                continue
            
            user_id, created = create_or_update_user(
                email=rep["email"],
                username=rep["name"],
                kana=rep["kana"],
                user_type="代表者",
            )
            
            if user_id:
                rep_email_to_userid[rep["email"].lower().strip()] = user_id
                if created:
                    created_count += 1
                else:
                    updated_count += 1
            else:
                skip_count += 1
            
            if (i + 1) % 100 == 0:
                print(f"  [{i+1}/{len(representatives)}] 作成={created_count} 更新={updated_count} スキップ={skip_count} エラー={error_count}")
            
            time.sleep(REQUEST_DELAY)
            
        except Exception as e:
            error_count += 1
            print(f"  ERROR [{i+1}] {rep['email']}: {e}")
            if error_count > 50:
                print("エラーが50件を超えたため中断します")
                break
    
    print(f"\n代表者完了: 作成={created_count} 更新={updated_count} スキップ={skip_count} エラー={error_count}")
    print()
    
    # Phase 2: パートナーを登録
    print("-" * 60)
    print("Phase 2: パートナーを登録")
    print("-" * 60)
    
    p_created = 0
    p_updated = 0
    p_error = 0
    p_skip = 0
    
    for i, partner in enumerate(partners):
        try:
            rep_email_key = partner["rep_email"].lower().strip()
            daihyosha_id = rep_email_to_userid.get(rep_email_key)
            
            if not daihyosha_id and not dry_run:
                # 代表者がまだ登録されていない場合、mst_userから検索
                existing_rep = find_mst_user_by_email(rep_email_key)
                if existing_rep:
                    daihyosha_id = existing_rep["user_id"]
                    rep_email_to_userid[rep_email_key] = daihyosha_id
            
            if dry_run:
                print(f"  [{i+1}/{len(partners)}] DRY: {partner['email']} -> 代表者: {partner['rep_email']}")
                continue
            
            user_id, created = create_or_update_user(
                email=partner["email"],
                username=partner["name"],
                kana=partner["kana"],
                user_type="パートナー",
                daihyosha_id=daihyosha_id,
            )
            
            if user_id:
                if created:
                    p_created += 1
                else:
                    p_updated += 1
            else:
                p_skip += 1
            
            if (i + 1) % 100 == 0:
                print(f"  [{i+1}/{len(partners)}] 作成={p_created} 更新={p_updated} スキップ={p_skip} エラー={p_error}")
            
            time.sleep(REQUEST_DELAY)
            
        except Exception as e:
            p_error += 1
            print(f"  ERROR [{i+1}] {partner['email']}: {e}")
            if p_error > 50:
                print("エラーが50件を超えたため中断します")
                break
    
    print(f"\nパートナー完了: 作成={p_created} 更新={p_updated} スキップ={p_skip} エラー={p_error}")
    
    # 最終サマリー
    print()
    print("=" * 60)
    print("最終サマリー")
    print("=" * 60)
    print(f"代表者:   作成={created_count} 更新={updated_count} スキップ={skip_count} エラー={error_count}")
    print(f"パートナー: 作成={p_created} 更新={p_updated} スキップ={p_skip} エラー={p_error}")
    print(f"合計作成: {created_count + p_created}")
    print(f"合計更新: {updated_count + p_updated}")
    print(f"合計エラー: {error_count + p_error}")


if __name__ == "__main__":
    main()
