"""
AI-чат диетолога. Принимает историю сообщений и контекст пользователя,
возвращает ответ от GPT-4o-mini.
"""

import json
import os
import urllib.request
import urllib.error


SYSTEM_PROMPT = """Ты — AI-диетолог и нутрициолог. Ты помогаешь людям с вопросами о питании, калориях, похудении и здоровом образе жизни.

Правила:
- Отвечай дружелюбно и по делу, без лишней воды
- Давай конкретные, практичные советы
- Если у пользователя есть параметры (вес, рост, цель) — учитывай их в ответе
- Не ставь медицинских диагнозов, не заменяй врача
- При сложных вопросах (болезни, лекарства) рекомендуй проконсультироваться с врачом
- Отвечай на русском языке
- Максимальная длина ответа — 200 слов"""


def handler(event: dict, context) -> dict:
    """Обрабатывает запрос к AI-диетологу."""

    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers, "body": ""}

    if event.get("httpMethod") != "POST":
        return {"statusCode": 405, "headers": cors_headers, "body": json.dumps({"error": "Method not allowed"})}

    try:
        body = json.loads(event.get("body") or "{}")
    except (json.JSONDecodeError, TypeError):
        return {"statusCode": 400, "headers": cors_headers, "body": json.dumps({"error": "Invalid JSON"})}

    messages_raw = body.get("messages", [])
    user_context = body.get("userContext", {})

    # Берём последние 10 сообщений
    messages_raw = messages_raw[-10:]

    # Формируем системный промпт с контекстом пользователя
    system_content = SYSTEM_PROMPT
    if user_context:
        parts = []
        if user_context.get("gender"):
            parts.append(f"Пол: {'мужской' if user_context['gender'] == 'male' else 'женский'}")
        if user_context.get("age"):
            parts.append(f"Возраст: {user_context['age']} лет")
        if user_context.get("weight"):
            parts.append(f"Вес: {user_context['weight']} кг")
        if user_context.get("height"):
            parts.append(f"Рост: {user_context['height']} см")
        if user_context.get("goal"):
            goal_labels = {
                "loss": "похудение (дефицит 500 ккал)",
                "softloss": "мягкое похудение (дефицит 250 ккал)",
                "maintain": "поддержание веса",
                "gain": "набор массы (+250 ккал)",
                "fastgain": "быстрый набор (+500 ккал)",
            }
            parts.append(f"Цель: {goal_labels.get(user_context['goal'], user_context['goal'])}")
        if user_context.get("target"):
            parts.append(f"Суточная норма калорий: {user_context['target']} ккал")
        if user_context.get("protein"):
            parts.append(f"Белки: {user_context['protein']}г, Жиры: {user_context.get('fat', '?')}г, Углеводы: {user_context.get('carbs', '?')}г")
        if parts:
            system_content += "\n\nПараметры пользователя:\n" + "\n".join(f"- {p}" for p in parts)

    openai_messages = [{"role": "system", "content": system_content}]

    for m in messages_raw:
        role = m.get("role")
        text = m.get("text", "")
        if role == "user":
            openai_messages.append({"role": "user", "content": text})
        elif role == "ai":
            openai_messages.append({"role": "assistant", "content": text})

    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key:
        return {
            "statusCode": 200,
            "headers": cors_headers,
            "body": json.dumps({"reply": "AI временно недоступен — ключ не настроен. Обратитесь к администратору."}),
        }

    payload = json.dumps({
        "model": "gpt-4o-mini",
        "messages": openai_messages,
        "max_tokens": 400,
        "temperature": 0.7,
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        reply = data["choices"][0]["message"]["content"].strip()
        return {"statusCode": 200, "headers": cors_headers, "body": json.dumps({"reply": reply})}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="ignore")
        status = e.code
        if status == 401:
            reply = "Ошибка авторизации API. Проверь ключ OpenAI."
        elif status == 429:
            reply = "Слишком много запросов. Подожди немного и попробуй снова."
        else:
            reply = "AI временно недоступен. Попробуй позже."
        return {"statusCode": 200, "headers": cors_headers, "body": json.dumps({"reply": reply, "error": err_body[:200]})}
    except Exception as e:
        return {
            "statusCode": 200,
            "headers": cors_headers,
            "body": json.dumps({"reply": "AI временно недоступен. Попробуй позже.", "error": str(e)}),
        }