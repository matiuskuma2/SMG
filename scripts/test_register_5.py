#!/usr/bin/env python3
"""
テスト: 最初の5件だけ登録
"""
import csv
import json
import sys
import time
import httpx

CSV_PATH = "/home/user/uploaded_files/完成版既存会員リスト.csv"
DEFAULT_PASSWORD = "smg2026xday"
TEST_LIMIT = 5

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

client = httpx.Client(timeout=30.0)

def find_mst_user_by_email(email):
    r = client.get(
        f"{SUPABASE_URL}/rest/v1/mst_user",
        headers=HEADERS,
        params={"select": "user_id,deleted_at,email", "email": f"eq.{email}", "limit": "1"},
    )
    r.raise_for_status()
    data = r.json()
    return data[0] if data else None

def create_user(email, name, kana, user_type, daihyosha_id=None):
    email = email.lower().strip()
    now = time.strftime("%Y-%m-%dT%H:%M:%S+00:00")
    
    # 既存チェック
    existing = find_mst_user_by_email(email)
    
    if existing:
        update_data = {"updated_at": now}
        if name: 
            update_data["username"] = name
            update_data["company_name"] = name
            update_data["company_name_kana"] = name
        if kana: update_data["user_name_kana"] = kana
        if user_type: update_data["user_type"] = user_type
        if daihyosha_id: update_data["daihyosha_id"] = daihyosha_id
        if existing.get("deleted_at"): update_data["deleted_at"] = None
        
        r = client.patch(
            f"{SUPABASE_URL}/rest/v1/mst_user",
            headers=HEADERS,
            json=update_data,
            params={"user_id": f"eq.{existing['user_id']}"},
        )
        print(f"  UPDATE {email}: status={r.status_code}")
        return existing["user_id"], False
    
    # Auth作成
    r = client.post(
        f"{SUPABASE_URL}/auth/v1/admin/users",
        headers=HEADERS,
        json={"email": email, "password": DEFAULT_PASSWORD, "email_confirm": True},
    )
    
    if r.status_code >= 400:
        err = r.json()
        err_msg = err.get("msg", "") or err.get("message", "")
        if "already been registered" in err_msg:
            print(f"  SKIP (auth exists) {email}: {err_msg}")
            return None, False
        raise Exception(f"Auth error: {r.status_code} {r.text}")
    
    auth_data = r.json()
    user_id = auth_data["id"]
    print(f"  AUTH CREATED {email}: user_id={user_id}")
    
    # mst_user挿入
    insert_data = {
        "user_id": user_id,
        "email": email,
        "username": name or "",
        "company_name": name or "",
        "company_name_kana": name or "",
        "user_name_kana": kana or None,
        "user_type": user_type or "代表者",
        "created_at": now,
        "updated_at": now,
    }
    if daihyosha_id:
        insert_data["daihyosha_id"] = daihyosha_id
    
    r = client.post(
        f"{SUPABASE_URL}/rest/v1/mst_user",
        headers=HEADERS,
        json=[insert_data],
    )
    print(f"  MST_USER INSERT {email}: status={r.status_code}")
    if r.status_code >= 400:
        # ロールバック
        client.delete(f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}", headers=HEADERS)
        raise Exception(f"mst_user error: {r.text}")
    
    return user_id, True


# 最初の5件だけ
with open(CSV_PATH, "r", encoding="utf-8") as f:
    reader = csv.reader(f)
    next(reader)  # skip header
    
    count = 0
    for row in reader:
        if len(row) < 6 or not row[0].strip() or row[5].strip() != "代表者":
            continue
        if count >= TEST_LIMIT:
            break
        
        email = row[0].strip()
        name = row[1].strip()
        kana = row[2].strip()
        
        print(f"\n[{count+1}] {email} - {name}")
        try:
            uid, created = create_user(email, name, kana, "代表者")
            print(f"  -> {'CREATED' if created else 'UPDATED/SKIPPED'}: uid={uid}")
        except Exception as e:
            print(f"  -> ERROR: {e}")
        
        count += 1
        time.sleep(0.1)

print(f"\n=== テスト完了: {count}件処理 ===")
