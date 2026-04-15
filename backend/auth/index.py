"""
Авторизация пользователей: регистрация, вход, выход, проверка сессии.
POST /register — { email, password, name }
POST /login    — { email, password }
POST /logout   — (с сессионным токеном)
GET  /me       — проверка текущей сессии
"""
import json
import os
import hashlib
import secrets
import psycopg2

HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Token",
    "Content-Type": "application/json",
}

def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def get_schema():
    return os.environ.get("MAIN_DB_SCHEMA", "public")

def handler(event: dict, context) -> dict:
    """Авторизация: register/login/logout/me"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": HEADERS, "body": ""}

    schema = get_schema()
    path = event.get("path", "/")
    method = event.get("httpMethod", "GET")
    session_token = event.get("headers", {}).get("X-Session-Token", "")

    # GET /me — проверить сессию
    if method == "GET":
        if not session_token:
            return {"statusCode": 401, "headers": HEADERS, "body": json.dumps({"error": "Не авторизован"})}
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            f"SELECT u.id, u.email, u.name FROM {schema}.sessions s JOIN {schema}.users u ON u.id = s.user_id WHERE s.id = %s AND s.expires_at > NOW()",
            (session_token,)
        )
        row = cur.fetchone()
        conn.close()
        if not row:
            return {"statusCode": 401, "headers": HEADERS, "body": json.dumps({"error": "Сессия истекла"})}
        return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"id": row[0], "email": row[1], "name": row[2]})}

    body = json.loads(event.get("body") or "{}")
    action = body.get("action", "")

    # POST /register
    if action == "register":
        email = (body.get("email") or "").strip().lower()
        password = body.get("password", "")
        name = (body.get("name") or "").strip()
        if not email or not password:
            return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "Email и пароль обязательны"})}
        if len(password) < 6:
            return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "Пароль минимум 6 символов"})}
        conn = get_db()
        cur = conn.cursor()
        cur.execute(f"SELECT id FROM {schema}.users WHERE email = %s", (email,))
        if cur.fetchone():
            conn.close()
            return {"statusCode": 409, "headers": HEADERS, "body": json.dumps({"error": "Email уже зарегистрирован"})}
        pw_hash = hash_password(password)
        cur.execute(f"INSERT INTO {schema}.users (email, password_hash, name) VALUES (%s, %s, %s) RETURNING id", (email, pw_hash, name))
        user_id = cur.fetchone()[0]
        # Создаём пустой профиль
        cur.execute(f"INSERT INTO {schema}.profiles (user_id) VALUES (%s) ON CONFLICT DO NOTHING", (user_id,))
        token = secrets.token_hex(32)
        cur.execute(f"INSERT INTO {schema}.sessions (id, user_id) VALUES (%s, %s)", (token, user_id))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"token": token, "id": user_id, "email": email, "name": name})}

    # POST /login
    if action == "login":
        email = (body.get("email") or "").strip().lower()
        password = body.get("password", "")
        if not email or not password:
            return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "Введите email и пароль"})}
        conn = get_db()
        cur = conn.cursor()
        pw_hash = hash_password(password)
        cur.execute(f"SELECT id, name FROM {schema}.users WHERE email = %s AND password_hash = %s", (email, pw_hash))
        row = cur.fetchone()
        if not row:
            conn.close()
            return {"statusCode": 401, "headers": HEADERS, "body": json.dumps({"error": "Неверный email или пароль"})}
        user_id, name = row
        token = secrets.token_hex(32)
        cur.execute(f"INSERT INTO {schema}.sessions (id, user_id) VALUES (%s, %s)", (token, user_id))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"token": token, "id": user_id, "email": email, "name": name or ""})}

    # POST /logout
    if action == "logout":
        if session_token:
            conn = get_db()
            cur = conn.cursor()
            cur.execute(f"UPDATE {schema}.sessions SET expires_at = NOW() WHERE id = %s", (session_token,))
            conn.commit()
            conn.close()
        return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"ok": True})}

    return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "Неизвестное действие"})}
