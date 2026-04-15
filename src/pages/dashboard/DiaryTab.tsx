import { useState } from "react";
import Icon from "@/components/ui/icon";
import {
  FoodEntry, FoodLog, UserProfile,
  MEAL_LABELS, MEAL_ICONS, MEAL_ORDER,
  AI_CHAT_URL, todayKey, dateKey, formatDate, sumEntries,
} from "./dashboardTypes";

// ─── MacroRow ─────────────────────────────────────────────────────────────────
export function MacroRow({ emoji, label, current, target, color }: {
  emoji: string; label: string; current: number; target: number; color: string;
}) {
  const pct = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1 text-sm">
        <span className="text-gray-600 font-medium">{emoji} {label}</span>
        <span className="text-gray-800 font-bold">{current} <span className="text-gray-400 font-normal">/ {target}г</span></span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="text-right text-xs text-gray-400 mt-0.5">{pct}%</div>
    </div>
  );
}

// ─── DiaryTab ─────────────────────────────────────────────────────────────────
interface DiaryTabProps {
  log: FoodLog;
  profile: UserProfile;
  setLog: React.Dispatch<React.SetStateAction<FoodLog>>;
}

export default function DiaryTab({ log, profile, setLog }: DiaryTabProps) {
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

  const today = todayKey();
  const todayEntries = log[today] || [];
  const todaySum = sumEntries(todayEntries);

  const caloriesPct = profile.dailyCalories > 0
    ? Math.min(Math.round((todaySum.calories / profile.dailyCalories) * 100), 100)
    : 0;
  const caloriesRemain = profile.dailyCalories > 0
    ? profile.dailyCalories - todaySum.calories
    : null;

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
  }

  function deleteEntry(date: string, id: number) {
    setLog((prev) => ({ ...prev, [date]: (prev[date] || []).filter((e) => e.id !== id) }));
  }

  function clearToday() {
    if (!window.confirm("Очистить все записи за сегодня?")) return;
    setLog((prev) => ({ ...prev, [today]: [] }));
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
      const match = data.reply?.match(/\{[^}]+\}/);
      if (match) {
        const nutr = JSON.parse(match[0]);
        const w = parseFloat(form.weight) || 100;
        const factor = w / 100;
        setForm((f) => ({
          ...f,
          calories: String(Math.round((nutr.calories || 0) * factor)),
          protein: String(Math.round((nutr.protein || 0) * factor)),
          fat: String(Math.round((nutr.fat || 0) * factor)),
          carbs: String(Math.round((nutr.carbs || 0) * factor)),
        }));
      }
    } catch { /* silent */ }
    setFetchingNutr(false);
  }

  return (
    <div className="space-y-5">

      {/* Add food form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2">
          <Icon name="Plus" size={15} className="text-emerald-500" />
          Добавить приём пищи
        </h3>

        {/* Meal selector */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {MEAL_ORDER.map((m) => (
            <button key={m} onClick={() => setForm((f) => ({ ...f, meal: m as FoodEntry["meal"] }))}
              className={`py-2 rounded-xl text-xs font-semibold border transition-all ${form.meal === m ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
              {MEAL_LABELS[m]}
            </button>
          ))}
        </div>

        {/* Inputs row 1 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <div className="sm:col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Продукт</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Овсянка, куриная грудка..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Вес (г)</label>
            <input type="number" value={form.weight} onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
              placeholder="200"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Калории</label>
            <input type="number" value={form.calories} onChange={(e) => setForm((f) => ({ ...f, calories: e.target.value }))}
              placeholder="350"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
          </div>
        </div>

        {/* Inputs row 2: BJU */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {(["protein", "fat", "carbs"] as const).map((k) => {
            const labels = { protein: "Белки (г)", fat: "Жиры (г)", carbs: "Углеводы (г)" };
            return (
              <div key={k}>
                <label className="text-xs text-gray-500 mb-1 block">{labels[k]}</label>
                <input type="number" value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 flex-wrap">
          <button onClick={fetchNutrition} disabled={fetchingNutr || !form.name.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-emerald-400 text-emerald-600 text-sm font-semibold hover:bg-emerald-50 disabled:opacity-40 transition-all">
            {fetchingNutr
              ? <><Icon name="Loader2" size={14} className="animate-spin" /> Ищу КБЖУ...</>
              : <><Icon name="Sparkles" size={14} /> Узнать КБЖУ через AI</>}
          </button>
          <button onClick={addEntry} disabled={!form.name.trim() || !form.calories}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold disabled:opacity-40 transition-all ml-auto">
            <Icon name="Plus" size={14} />
            Добавить
          </button>
        </div>
      </div>

      {/* Calorie summary */}
      {profile.dailyCalories > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-3xl font-black text-gray-900">{todaySum.calories}</span>
              <span className="text-gray-400 text-sm ml-1">/ {profile.dailyCalories} ккал</span>
            </div>
            <div className="text-right">
              {caloriesRemain !== null && (
                <div className={`text-sm font-bold ${caloriesRemain < 0 ? "text-orange-500" : "text-emerald-600"}`}>
                  {caloriesRemain < 0 ? `+${Math.abs(caloriesRemain)} превышение` : `${caloriesRemain} осталось`}
                </div>
              )}
              <div className="text-xs text-gray-400">{caloriesPct}% от нормы</div>
            </div>
          </div>
          <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${caloriesPct}%`, background: caloriesPct > 100 ? "#f97316" : "#10b981" }} />
          </div>
        </div>
      )}

      {/* Today's meals */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <Icon name="CalendarCheck" size={15} className="text-emerald-500" />
            Сегодня — {formatDate(today)}
          </h3>
          <div className="flex gap-2">
            <button onClick={repeatYesterday}
              className="text-xs flex items-center gap-1 text-gray-400 hover:text-blue-500 transition-colors">
              <Icon name="RotateCcw" size={12} /> Вчерашний день
            </button>
            <button onClick={clearToday}
              className="text-xs flex items-center gap-1 text-gray-400 hover:text-red-500 transition-colors">
              <Icon name="Trash2" size={12} /> Очистить
            </button>
          </div>
        </div>

        {todayEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            <Icon name="UtensilsCrossed" size={28} className="mx-auto mb-2 opacity-30" />
            Пока ничего не добавлено.<br />Введи первый приём пищи выше!
          </div>
        ) : (
          <div className="space-y-4">
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
                          <span className="text-xs text-gray-400">{e.weight > 0 ? `${e.weight}г · ` : ""}{e.protein > 0 ? `Б${e.protein} ` : ""}{e.fat > 0 ? `Ж${e.fat} ` : ""}{e.carbs > 0 ? `У${e.carbs}` : ""}</span>
                        </div>
                        <div className="flex items-center gap-3 ml-3">
                          <span className="text-sm font-bold text-gray-700">{e.calories} ккал</span>
                          <button onClick={() => deleteEntry(today, e.id)}
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
      </div>

      {/* BJU summary */}
      {todayEntries.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h3 className="font-bold text-gray-800 text-sm mb-2">Итого за день</h3>
          <MacroRow emoji="🥩" label="Белки" current={todaySum.protein} target={profile.proteinTarget} color="#10b981" />
          <MacroRow emoji="🧈" label="Жиры" current={todaySum.fat} target={profile.fatTarget} color="#f59e0b" />
          <MacroRow emoji="🍚" label="Углеводы" current={todaySum.carbs} target={profile.carbsTarget} color="#3b82f6" />
        </div>
      )}
    </div>
  );
}
