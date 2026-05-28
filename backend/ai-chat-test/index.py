"""Диагностика v2: проверяет GROQ_API_KEY и делает тестовый запрос."""

import json
import os
import urllib.request
import urllib.error


def handler(event: dict, context) -> dict:
    """Тестирует подключение к Groq API."""

    headers = {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}

    groq_key = os.environ.get("GROQ_API_KEY", "").strip()

    if not groq_key:
        return {"statusCode": 200, "headers": headers, "body": json.dumps({
            "status": "error",
            "message": "GROQ_API_KEY не найден в переменных окружения",
            "key_present": False,
        })}

    # Показываем первые/последние символы для проверки
    key_preview = groq_key[:8] + "..." + groq_key[-4:]

    payload = json.dumps({
        "model": "llama3-70b-8192",
        "messages": [{"role": "user", "content": "Скажи только: работает"}],
        "max_tokens": 10,
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=payload,
        headers={"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        reply = data["choices"][0]["message"]["content"].strip()
        return {"statusCode": 200, "headers": headers, "body": json.dumps({
            "status": "ok",
            "message": "Groq работает!",
            "key_preview": key_preview,
            "reply": reply,
        })}
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8", errors="ignore")
        return {"statusCode": 200, "headers": headers, "body": json.dumps({
            "status": "error",
            "http_code": e.code,
            "key_preview": key_preview,
            "error": err[:500],
        })}
    except Exception as e:
        return {"statusCode": 200, "headers": headers, "body": json.dumps({
            "status": "error",
            "key_preview": key_preview,
            "error": str(e),
        })}