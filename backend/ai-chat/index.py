"""
AI-чат диетолога. Принимает историю сообщений и контекст пользователя,
возвращает ответ от GPT-4o-mini через AITunnel.
"""

import json
import os
import urllib.request
import urllib.error


SYSTEM_PROMPT = """Ты AI-диетолог. Отвечай кратко — 2–4 предложения. Не используй списки, маркеры и эмодзи.

Правила:
Не рекомендуй калорийность ниже 1200 ккал (женщины) и 1500 ккал (мужчины).
При гипотиреозе, СПКЯ, диабете дефицит калорий не более 12%.
Не советуй экстремальные диеты без консультации врача.

Формат ответа: одна фраза — понимание проблемы, потом конкретный совет с цифрой или продуктом, потом короткое действие на сегодня. Например: «Понимаю, вы переели. Завтра вернитесь к норме 2200 ккал и добавьте 30 минут ходьбы. Прямо сейчас выпейте воду.»"""


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

        # Данные дневника питания
        diary_parts = []
        if user_context.get("todayCalories") is not None:
            remaining = user_context.get("caloriesRemaining", 0)
            sign = "осталось" if remaining >= 0 else "перебор"
            diary_parts.append(f"Сегодня съедено: {user_context['todayCalories']} ккал ({abs(remaining)} ккал {sign})")
        if user_context.get("todayProtein"):
            diary_parts.append(f"Сегодня БЖУ: Б={user_context['todayProtein']}г, Ж={user_context.get('todayFat',0)}г, У={user_context.get('todayCarbs',0)}г")
        if user_context.get("lastFoods"):
            diary_parts.append(f"Последние продукты сегодня: {', '.join(user_context['lastFoods'])}")
        recent = user_context.get("recentDays", [])
        if recent:
            for day in recent[:3]:
                diary_parts.append(f"{day['date']}: {day['calories']} ккал, Б={day['protein']}г")
        if diary_parts:
            system_content += "\n\nДневник питания:\n" + "\n".join(f"- {p}" for p in diary_parts)

    openai_messages = [{"role": "system", "content": system_content}]

    for m in messages_raw:
        role = m.get("role")
        text = m.get("text", "")
        if role == "user":
            openai_messages.append({"role": "user", "content": text})
        elif role == "ai":
            openai_messages.append({"role": "assistant", "content": text})

    aitunnel_key = os.environ.get("AITUNNEL_API_KEY", "").strip()

    if not aitunnel_key:
        return {
            "statusCode": 200,
            "headers": cors_headers,
            "body": json.dumps({"reply": "⚠️ Ключ AITUNNEL_API_KEY не заполнен. Перейди в раздел «Ядро → Секреты» и добавь ключ от aitunnel.ru"}),
        }

    payload = json.dumps({
        "model": "gpt-4o-mini",
        "messages": openai_messages,
        "max_tokens": 1500,
        "temperature": 0.7,
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://api.aitunnel.ru/v1/chat/completions",
        data=payload,
        headers={"Authorization": f"Bearer {aitunnel_key}", "Content-Type": "application/json", "User-Agent": "Mozilla/5.0 (compatible; diet-assistant/1.0)"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        reply = data["choices"][0]["message"]["content"].strip()
        return {"statusCode": 200, "headers": cors_headers, "body": json.dumps({"reply": reply})}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="ignore")
        if e.code == 429:
            return {"statusCode": 200, "headers": cors_headers, "body": json.dumps({"reply": "Слишком много запросов к AI. Подожди 10–20 секунд и попробуй снова."})}
        else:
            return {"statusCode": 200, "headers": cors_headers, "body": json.dumps({"reply": f"Ошибка AI ({e.code}): {err_body[:500]}"})}
    except Exception as e:
        return {"statusCode": 200, "headers": cors_headers, "body": json.dumps({"reply": f"Ошибка соединения: {str(e)}"})}


    # ── Fallback: встроенные советы без внешнего API ──────────────────────────
    last_user_msg = ""
    for m in reversed(messages_raw):
        if m.get("role") == "user":
            last_user_msg = m.get("text", "").lower()
            break

    ctx_parts = []
    if user_context.get("weight"):
        ctx_parts.append(f"вес {user_context['weight']} кг")
    if user_context.get("target"):
        ctx_parts.append(f"норма {user_context['target']} ккал/день")
    ctx_str = ", ".join(ctx_parts)

    tips = []

    # Белок
    if any(w in last_user_msg for w in ["белок", "протеин", "мышц", "protein"]):
        tips = [
            "Хорошие источники белка: куриная грудка (~31г/100г), творог (~18г/100г), яйца (~13г/100г), рыба (~20-25г/100г), бобовые (~8-9г/100г).",
            "Рекомендуемая норма белка — 1.6–2.2 г на кг веса тела в день.",
            "Для набора мышечной массы старайся получать белок равномерно в течение дня, а не за один приём.",
        ]
    # Похудение
    elif any(w in last_user_msg for w in ["похуде", "сброс", "дефицит", "жир", "вес"]):
        tips = [
            "Дефицит 300–500 ккал в день — оптимальный темп похудения (0.3–0.5 кг в неделю) без потери мышц.",
            "Белок помогает сохранить мышцы при похудении и увеличивает насыщение. Норма: 1.8–2.2 г/кг веса.",
            "Клетчатка (овощи, цельнозерновые) замедляет переваривание и продлевает сытость — это ключ к контролю аппетита.",
        ]
    # Углеводы
    elif any(w in last_user_msg for w in ["углевод", "сахар", "хлеб", "крупа", "рис"]):
        tips = [
            "Предпочитай сложные углеводы: гречка, овсянка, бурый рис, цельнозерновой хлеб — они дают долгую энергию без резкого скачка сахара.",
            "Простые углеводы (сладкое, белый хлеб) лучше есть в первой половине дня — тогда они успеют «сгореть».",
            "При диабете или СПКЯ важно контролировать гликемический индекс продуктов — отдавай предпочтение ГИ < 55.",
        ]
    # Завтрак
    elif any(w in last_user_msg for w in ["завтрак", "утро", "breakfast"]):
        tips = [
            "Идеальный завтрак сочетает белок + сложные углеводы: яйца с гречкой, творог с овсянкой, омлет с овощами.",
            "Пропуск завтрака повышает риск переедания вечером — организм «добирает» калории позже.",
            "Старайся поесть в течение 1–2 часов после пробуждения для стабильного уровня сахара.",
        ]
    # Анализ рациона (история)
    elif any(w in last_user_msg for w in ["анализ", "рацион", "питание", "дневник", "ел", "съел"]):
        if ctx_str:
            tips = [
                f"Исходя из твоих данных ({ctx_str}): следи за тем, чтобы каждый приём пищи содержал белок — это ключ к насыщению.",
                "Обрати внимание на водный баланс: 30–35 мл воды на кг веса в день помогает обмену веществ.",
                "Регулярность питания (3–5 приёмов в день) важнее подсчёта каждой калории на начальном этапе.",
            ]
        else:
            tips = [
                "Сбалансированный рацион: 25–30% белок, 25–30% жиры, 40–50% углеводы от общей калорийности.",
                "Овощи и зелень — основа питания: они дают клетчатку, витамины и почти не добавляют калорий.",
                "Старайся минимизировать ультрапереработанные продукты (колбаса, чипсы, фастфуд) — они калорийны и плохо насыщают.",
            ]
    # Вода
    elif any(w in last_user_msg for w in ["вод", "пить", "жажд"]):
        tips = [
            "Норма воды: 30–35 мл на кг веса. При весе 70 кг — около 2–2.5 литра в день.",
            "Иногда чувство голода — это жажда. Попробуй выпить стакан воды и подождать 10 минут.",
            "Кофе и чай без сахара засчитываются в водный баланс, но не более 2–3 чашек в день.",
        ]
    # Общие советы / по умолчанию
    else:
        weight = user_context.get("weight", "")
        goal = user_context.get("goal", "")
        goal_tip = ""
        if goal == "loss" or goal == "softloss":
            goal_tip = "При похудении главное — стабильный небольшой дефицит калорий и достаточно белка."
        elif goal == "gain" or goal == "fastgain":
            goal_tip = "При наборе массы ключ — профицит 200–500 ккал и тренировки с прогрессивной нагрузкой."
        else:
            goal_tip = "Для поддержания веса важно отслеживать калории хотя бы первые несколько недель."

        tips = [
            goal_tip if goal_tip else "Основа здорового питания: достаточно белка, овощи в каждый приём, минимум сахара и ультрапереработанного.",
            "Записывай еду в дневник — исследования показывают, что это само по себе помогает есть на 15–20% меньше.",
            "Не пропускай приёмы пищи: голод приводит к перееданию. Лучше 4–5 небольших порций, чем 1–2 больших.",
        ]

    reply = "\n\n".join(f"• {t}" for t in tips)
    if ctx_str:
        reply = f"Советы с учётом твоих данных ({ctx_str}):\n\n" + reply
    reply += "\n\n_Это базовые рекомендации. Для персонального анализа подключите AI-модель._"

    return {"statusCode": 200, "headers": cors_headers, "body": json.dumps({"reply": reply})}