"""
Дневник питания: получение и сохранение записей по дням.
GET  /?date=YYYY-MM-DD — получить записи за день
POST /                  — { date, entries } сохранить записи за день
GET  /?range=7          — получить записи за последние N дней
"""
import json
import os
import psycopg2

HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Token",
    "Content-Type": "application/json",
}

def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_schema():
    return os.environ.get("MAIN_DB_SCHEMA", "public")

def get_user_id(cur, schema, token):
    cur.execute(
        f"SELECT user_id FROM {schema}.sessions WHERE id = %s AND expires_at > NOW()",
        (token,)
    )
    row = cur.fetchone()
    return row[0] if row else None

def handler(event: dict, context) -> dict:
    """Дневник питания: get/save по дням"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": HEADERS, "body": ""}

    schema = get_schema()
    token = event.get("headers", {}).get("X-Session-Token", "")
    if not token:
        return {"statusCode": 401, "headers": HEADERS, "body": json.dumps({"error": "Не авторизован"})}

    conn = get_db()
    cur = conn.cursor()
    user_id = get_user_id(cur, schema, token)
    if not user_id:
        conn.close()
        return {"statusCode": 401, "headers": HEADERS, "body": json.dumps({"error": "Сессия истекла"})}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}

    if method == "GET":
        date_param = params.get("date", "")
        range_param = params.get("range", "")

        if range_param:
            # Вернуть за последние N дней
            days = min(int(range_param), 90)
            cur.execute(
                f"SELECT log_date::text, entries FROM {schema}.food_logs WHERE user_id = %s AND log_date >= CURRENT_DATE - INTERVAL '{days} days' ORDER BY log_date",
                (user_id,)
            )
            rows = cur.fetchall()
            conn.close()
            result = {row[0]: row[1] for row in rows}
            return {"statusCode": 200, "headers": HEADERS, "body": json.dumps(result)}

        if date_param:
            cur.execute(
                f"SELECT entries FROM {schema}.food_logs WHERE user_id = %s AND log_date = %s",
                (user_id, date_param)
            )
            row = cur.fetchone()
            conn.close()
            return {"statusCode": 200, "headers": HEADERS, "body": json.dumps(row[0] if row else [])}

        # Всё за последние 30 дней
        cur.execute(
            f"SELECT log_date::text, entries FROM {schema}.food_logs WHERE user_id = %s AND log_date >= CURRENT_DATE - INTERVAL '30 days' ORDER BY log_date",
            (user_id,)
        )
        rows = cur.fetchall()
        conn.close()
        result = {row[0]: row[1] for row in rows}
        return {"statusCode": 200, "headers": HEADERS, "body": json.dumps(result)}

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        date = body.get("date", "")
        entries = body.get("entries", [])
        if not date:
            conn.close()
            return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "Дата обязательна"})}
        cur.execute(f"""
            INSERT INTO {schema}.food_logs (user_id, log_date, entries, updated_at)
            VALUES (%s, %s, %s, NOW())
            ON CONFLICT (user_id, log_date) DO UPDATE SET entries = EXCLUDED.entries, updated_at = NOW()
        """, (user_id, date, json.dumps(entries)))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"ok": True})}

    conn.close()
    return {"statusCode": 405, "headers": HEADERS, "body": json.dumps({"error": "Method not allowed"})}
