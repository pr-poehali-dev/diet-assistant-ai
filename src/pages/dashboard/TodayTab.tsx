import { useState } from "react";
import Icon from "@/components/ui/icon";
import {
  FoodEntry, FoodLog, UserProfile,
  MEAL_LABELS, MEAL_ICONS, MEAL_ORDER,
  AI_CHAT_URL, todayKey, dateKey, formatDate, sumEntries, calcDayCorrection,
} from "./dashboardTypes";
import { MacroRow } from "./DiaryTab";

interface TodayTabProps {
  log: FoodLog;
  profile: UserProfile;
  setLog: React.Dispatch<React.SetStateAction<FoodLog>>;
}

export default function TodayTab({ log, profile, setLog }: TodayTabProps) {
  const [form, setForm] = useState({
    meal: "breakfast" as FoodEntry["meal"],
    name: "",
    weight: "",
    calories: "",
    protein: "",
    fat: "",
    carbs: "",
  });
  const [fetchingNutr, setFetchingNutr] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const today = todayKey();
  const todayEntries = log[today] || [];
  const todaySum = sumEntries(todayEntries);
  const correction = calcDayCorrection(log, profile);

  const effectiveCalories = correction.adjustedCalories || profile.dailyCalories;
  const effectiveProtein = correction.adjustedProtein || profile.proteinTarget;

  const caloriesPct = effectiveCalories > 0
    ? Math.min(Math.round((todaySum.calories / effectiveCalories) * 100), 100)
    : 0;
  const caloriesRemain = effectiveCalories > 0 ? effectiveCalories - todaySum.calories : null;

  const entriesByMeal = MEAL_ORDER.reduce((acc, m) => {
    acc[m] = todayEntries.filter((e) => e.meal === m);
    return acc;
  }, {} as Record<string, FoodEntry[]>);

  function addEntry() {
    if (!form.name.trim() || !form.calories) return;
    const entry: FoodEntry = {
      id: Date.now(),
      meal: form.meal,
      name: form.name.trim(),
      weight: parseFloat(form.weight) || 0,
      calories: parseFloat(form.calories) || 0,
      protein: parseFloat(form.protein) || 0,
      fat: parseFloat(form.fat) || 0,
      carbs: parseFloat(form.carbs) || 0,
    };
    setLog((prev) => ({ ...prev, [today]: [...(prev[today] || []), entry] }));
    setForm({ meal: form.meal, name: "", weight: "", calories: "", protein: "", fat: "", carbs: "" });
    setShowAddForm(false);
  }

  function deleteEntry(id: number) {
    setLog((prev) => ({ ...prev, [today]: (prev[today] || []).filter((e) => e.id !== id) }));
  }

  function repeatYesterday() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = dateKey(yesterday);
    const yEntries = log[yKey] || [];
    if (!yEntries.length) { alert("Вчера записей нет."); return; }
    const newEntries = yEntries.map((e) => ({ ...e, id: Date.now() + Math.random() })) as FoodEntry[];
    setLog((prev) => ({ ...prev, [today]: [...(prev[today] || []), ...newEntries] }));
  }

  async function fetchNutrition() {
    if (!form.name.trim()) return;
    setFetchingNutr(true);
    try {
      const prompt = `Сколько калорий, белков, жиров, углеводов в "${form.name.trim()}" на 100 грамм? Ответь ТОЛЬКО JSON без пояснений: {"calories": number, "protein": number, "fat": number, "carbs": number}`;
      const res = await fetch(AI_CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", text: prompt }], userContext: {} }),
      });
      const data = await res.json();
      const text = data.reply || "";
      const match = text.match(/\{[^}]+\}/);
      if (match) {
        const nutr = JSON.parse(match[0]);
        const w = parseFloat(form.weight) || 100;
        const factor = w / 100;
        setForm((prev) => ({
          ...prev,
          calories: String(Math.round((nutr.calories || 0) * factor)),
          protein: String(Math.round((nutr.protein || 0) * factor * 10) / 10),
          fat: String(Math.round((nutr.fat || 0) * factor * 10) / 10),
          carbs: String(Math.round((nutr.carbs || 0) * factor * 10) / 10),
        }));
      }
    } catch (_e) { console.error(_e); }
    setFetchingNutr(false);
  }

  const hasSetup = profile.dailyCalories > 0;

  return (
    <div className="space-y-4">

      {/* ── Нет профиля ── */}
      {!hasSetup && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-3">
          <Icon name="AlertCircle" size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 mb-1">Рассчитай норму калорий</p>
            <p className="text-xs text-amber-600">Перейди в Калькулятор, чтобы получить персональную норму калорий и БЖУ. После расчёта здесь появится твой план на день.</p>
          </div>
        </div>
      )}

      {/* ── Умная коррекция ── */}
      {correction.message && (
        <div className={`rounded-2xl px-4 py-3 flex gap-2.5 border ${correction.calorieDelta > 0 ? "bg-blue-50 border-blue-200" : correction.calorieDelta < 0 ? "bg-orange-50 border-orange-200" : "bg-emerald-50 border-emerald-200"}`}>
          <Icon name={correction.calorieDelta > 0 ? "TrendingUp" : correction.calorieDelta < 0 ? "TrendingDown" : "CheckCircle"} size={16}
            className={`flex-shrink-0 mt-0.5 ${correction.calorieDelta > 0 ? "text-blue-500" : correction.calorieDelta < 0 ? "text-orange-500" : "text-emerald-500"}`} />
          <div>
            <p className={`text-xs font-semibold mb-0.5 ${correction.calorieDelta > 0 ? "text-blue-700" : correction.calorieDelta < 0 ? "text-orange-700" : "text-emerald-700"}`}>
              Умная коррекция
            </p>
            <p className={`text-xs leading-relaxed ${correction.calorieDelta > 0 ? "text-blue-600" : correction.calorieDelta < 0 ? "text-orange-600" : "text-emerald-600"}`}>
              {correction.message}
            </p>
          </div>
        </div>
      )}

      {/* ── Прогресс калорий ── */}
      {hasSetup && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Сегодня</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-gray-900">{todaySum.calories}</span>
                <span className="text-gray-400 text-sm">/ {effectiveCalories} ккал</span>
              </div>
              {correction.calorieDelta !== 0 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  базовая норма {profile.dailyCalories} ккал
                  <span className={`ml-1 font-semibold ${correction.calorieDelta > 0 ? "text-blue-500" : "text-orange-500"}`}>
                    {correction.calorieDelta > 0 ? `+${correction.calorieDelta}` : correction.calorieDelta}
                  </span>
                </p>
              )}
            </div>
            <div className="text-right">
              {caloriesRemain !== null && (
                <div>
                  <div className={`text-lg font-black ${caloriesRemain < 0 ? "text-red-500" : "text-emerald-500"}`}>
                    {caloriesRemain < 0 ? `+${Math.abs(caloriesRemain)}` : caloriesRemain}
                  </div>
                  <div className="text-xs text-gray-400">{caloriesRemain < 0 ? "превышение" : "осталось"}</div>
                </div>
              )}
            </div>
          </div>

          {/* Прогресс-бар */}
          <div className="h-3 rounded-full bg-gray-100 overflow-hidden mb-4">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${caloriesPct}%`,
                background: caloriesPct >= 100 ? "#ef4444" : caloriesPct >= 80 ? "#f59e0b" : "#10b981",
              }}
            />
          </div>

          {/* БЖУ */}
          <div className="space-y-2.5">
            <MacroRow emoji="🥩" label="Белки" current={todaySum.protein} target={effectiveProtein} color="#10b981" />
            <MacroRow emoji="🧈" label="Жиры" current={todaySum.fat} target={profile.fatTarget} color="#f59e0b" />
            <MacroRow emoji="🍚" label="Углеводы" current={todaySum.carbs} target={profile.carbsTarget} color="#3b82f6" />
          </div>
        </div>
      )}

      {/* ── Список блюд по приёмам пищи ── */}
      {todayEntries.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-sm">Приёмы пищи сегодня</h3>
            <span className="text-xs text-gray-400">{formatDate(today)}</span>
          </div>
          {MEAL_ORDER.map((m) => {
            const items = entriesByMeal[m];
            if (!items.length) return null;
            return (
              <div key={m}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon name={MEAL_ICONS[m] as Parameters<typeof Icon>[0]["name"]} size={13} className="text-gray-400" />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{MEAL_LABELS[m]}</span>
                  <span className="ml-auto text-xs text-gray-400">{sumEntries(items).calories} ккал</span>
                </div>
                <div className="space-y-1">
                  {items.map((e) => (
                    <div key={e.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-700 truncate block">{e.name}</span>
                        <span className="text-xs text-gray-400">
                          {e.weight > 0 ? `${e.weight}г · ` : ""}
                          {e.protein > 0 ? `Б${e.protein} ` : ""}
                          {e.fat > 0 ? `Ж${e.fat} ` : ""}
                          {e.carbs > 0 ? `У${e.carbs}` : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 ml-3">
                        <span className="text-sm font-bold text-gray-700">{e.calories} ккал</span>
                        <button onClick={() => deleteEntry(e.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-500">
                          <Icon name="Trash2" size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Форма добавления ── */}
      {showAddForm ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-sm">Добавить приём пищи</h3>
            <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
              <Icon name="X" size={16} />
            </button>
          </div>

          {/* Meal selector */}
          <div className="grid grid-cols-4 gap-1.5">
            {MEAL_ORDER.map((m) => (
              <button key={m} onClick={() => setForm((p) => ({ ...p, meal: m as FoodEntry["meal"] }))}
                className={`py-2 rounded-xl text-xs font-semibold border transition-all ${form.meal === m ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                {MEAL_LABELS[m]}
              </button>
            ))}
          </div>

          {/* Name + AI */}
          <div className="flex gap-2">
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))
              }
              onKeyDown={(e) => e.key === "Enter" && fetchNutrition()}
              placeholder="Название продукта или блюда"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all text-gray-800 placeholder-gray-300"
            />
            <button onClick={fetchNutrition} disabled={!form.name.trim() || fetchingNutr}
              className="px-3 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-600 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-all whitespace-nowrap">
              {fetchingNutr
                ? <Icon name="Loader2" size={13} className="animate-spin" />
                : <Icon name="Sparkles" size={13} />}
              AI
            </button>
          </div>

          {/* Nutrients */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { key: "weight", label: "Вес", unit: "г" },
              { key: "calories", label: "Ккал", unit: "" },
              { key: "protein", label: "Белки", unit: "г" },
              { key: "fat", label: "Жиры", unit: "г" },
            ].map(({ key, label, unit }) => (
              <div key={key}>
                <p className="text-xs text-gray-400 mb-1">{label}{unit && ` (${unit})`}</p>
                <input
                  type="number"
                  value={form[key as keyof typeof form] as string}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-xl px-2.5 py-2 text-sm outline-none focus:border-emerald-400 text-gray-800 placeholder-gray-300"
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div>
              <p className="text-xs text-gray-400 mb-1">Углеводы (г)</p>
              <input
                type="number"
                value={form.carbs}
                onChange={(e) => setForm((p) => ({ ...p, carbs: e.target.value }))}
                placeholder="0"
                className="w-full border border-gray-200 rounded-xl px-2.5 py-2 text-sm outline-none focus:border-emerald-400 text-gray-800 placeholder-gray-300"
              />
            </div>
          </div>

          <button onClick={addEntry} disabled={!form.name.trim() || !form.calories}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2">
            <Icon name="Plus" size={16} className="text-white" />
            Добавить
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button onClick={() => setShowAddForm(true)}
            className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all flex items-center justify-center gap-2">
            <Icon name="Plus" size={16} className="text-white" />
            Добавить приём пищи
          </button>
          <button onClick={repeatYesterday}
            className="px-4 py-3 rounded-xl border border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-600 text-sm font-semibold transition-all flex items-center gap-1.5">
            <Icon name="RotateCcw" size={14} />
            <span className="hidden sm:inline">Как вчера</span>
          </button>
        </div>
      )}
    </div>
  );
}