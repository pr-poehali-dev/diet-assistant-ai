"""
Профиль пользователя: получение и сохранение параметров.
GET  / — получить профиль (X-Session-Token обязателен)
POST / — сохранить профиль
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
    """Профиль пользователя: get/save"""
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

    if method == "GET":
        cur.execute(f"SELECT u.name, p.* FROM {schema}.users u LEFT JOIN {schema}.profiles p ON p.user_id = u.id WHERE u.id = %s", (user_id,))
        row = cur.fetchone()
        conn.close()
        if not row:
            return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({})}
        cols = [d[0] for d in cur.description]
        data = dict(zip(cols, row))
        return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({
            "name": data.get("name", ""),
            "dailyCalories": data.get("daily_calories", 0),
            "proteinTarget": data.get("protein_target", 0),
            "fatTarget": data.get("fat_target", 0),
            "carbsTarget": data.get("carbs_target", 0),
            "gender": data.get("gender", ""),
            "age": data.get("age", ""),
            "weight": data.get("weight", ""),
            "height": data.get("height", ""),
            "activity": data.get("activity", "moderate"),
            "goal": data.get("goal", "maintain"),
            "bodyFat": data.get("body_fat", ""),
            "conditions": data.get("conditions") or [],
            "medications": data.get("medications") or [],
            "bmr": data.get("bmr", 0),
            "tdee": data.get("tdee", 0),
        })}

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        # Обновляем имя в users
        name = body.get("name", "")
        if name is not None:
            cur.execute(f"UPDATE {schema}.users SET name = %s WHERE id = %s", (name, user_id))
        # Upsert профиля
        cur.execute(f"""
            INSERT INTO {schema}.profiles
              (user_id, daily_calories, protein_target, fat_target, carbs_target,
               gender, age, weight, height, activity, goal, body_fat,
               conditions, medications, bmr, tdee, updated_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW())
            ON CONFLICT (user_id) DO UPDATE SET
              daily_calories = EXCLUDED.daily_calories,
              protein_target = EXCLUDED.protein_target,
              fat_target = EXCLUDED.fat_target,
              carbs_target = EXCLUDED.carbs_target,
              gender = EXCLUDED.gender,
              age = EXCLUDED.age,
              weight = EXCLUDED.weight,
              height = EXCLUDED.height,
              activity = EXCLUDED.activity,
              goal = EXCLUDED.goal,
              body_fat = EXCLUDED.body_fat,
              conditions = EXCLUDED.conditions,
              medications = EXCLUDED.medications,
              bmr = EXCLUDED.bmr,
              tdee = EXCLUDED.tdee,
              updated_at = NOW()
        """, (
            user_id,
            body.get("dailyCalories", 0),
            body.get("proteinTarget", 0),
            body.get("fatTarget", 0),
            body.get("carbsTarget", 0),
            body.get("gender", ""),
            str(body.get("age", "")),
            str(body.get("weight", "")),
            str(body.get("height", "")),
            body.get("activity", "moderate"),
            body.get("goal", "maintain"),
            str(body.get("bodyFat", "")),
            json.dumps(body.get("conditions") or []),
            json.dumps(body.get("medications") or []),
            int(body.get("bmr") or 0),
            int(body.get("tdee") or 0),
        ))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"ok": True})}

    conn.close()
    return {"statusCode": 405, "headers": HEADERS, "body": json.dumps({"error": "Method not allowed"})}
