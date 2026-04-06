import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface UserProfile {
  name: string;
  dailyCalories: number;
  proteinTarget: number;
  fatTarget: number;
  carbsTarget: number;
}

export interface FoodEntry {
  id: number;
  meal: "breakfast" | "lunch" | "dinner" | "snack";
  name: string;
  weight: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

type FoodLog = Record<string, FoodEntry[]>;

const MEAL_LABELS: Record<string, string> = {
  breakfast: "Завтрак",
  lunch: "Обед",
  dinner: "Ужин",
  snack: "Перекус",
};
const MEAL_ICONS: Record<string, string> = {
  breakfast: "Coffee",
  lunch: "UtensilsCrossed",
  dinner: "Moon",
  snack: "Apple",
};
const MEAL_ORDER = ["breakfast", "lunch", "dinner", "snack"];

const AI_CHAT_URL = "https://functions.poehali.dev/dfa1da49-ab4b-4e4b-b592-8bf7388e022c";

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

function dateKey(d: Date) {
  return d.toISOString().split("T")[0];
}

function formatDate(key: string) {
  const d = new Date(key + "T12:00:00");
  return d.toLocaleDateString("ru", { day: "numeric", month: "long" });
}

function loadProfile(): UserProfile {
  try {
    return JSON.parse(localStorage.getItem("userProfile") || "{}");
  } catch { return {} as UserProfile; }
}
function saveProfile(p: UserProfile) {
  localStorage.setItem("userProfile", JSON.stringify(p));
}
function loadLog(): FoodLog {
  try {
    return JSON.parse(localStorage.getItem("foodLog") || "{}");
  } catch { return {}; }
}
function saveLog(log: FoodLog) {
  localStorage.setItem("foodLog", JSON.stringify(log));
}

function sumEntries(entries: FoodEntry[]) {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      fat: acc.fat + e.fat,
      carbs: acc.carbs + e.carbs,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );
}

// ─── MacroProgress ────────────────────────────────────────────────────────────
function MacroRow({ emoji, label, current, target, color }: {
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

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────
function WeekChart({ log, target }: { log: FoodLog; target: number }) {
  const days: { key: string; label: string; cal: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    const entries = log[key] || [];
    const cal = sumEntries(entries).calories;
    const label = i === 0 ? "Сег" : d.toLocaleDateString("ru", { weekday: "short" });
    days.push({ key, label, cal });
  }
  const maxVal = Math.max(target * 1.3, ...days.map((d) => d.cal), 1);
  return (
    <div className="flex items-end gap-2 h-32">
      {days.map((d) => {
        const pct = (d.cal / maxVal) * 100;
        const isToday = d.key === todayKey();
        const over = target > 0 && d.cal > target;
        return (
          <div key={d.key} className="flex flex-col items-center flex-1 gap-1">
            <span className="text-xs text-gray-400 font-medium">{d.cal > 0 ? d.cal : ""}</span>
            <div className="w-full rounded-t-lg transition-all duration-500 relative" style={{
              height: `${Math.max(pct, d.cal > 0 ? 6 : 2)}%`,
              background: isToday ? "#10b981" : over ? "#f97316" : "#d1fae5",
              minHeight: d.cal > 0 ? 6 : 2,
            }} />
            {target > 0 && (
              <div className="w-full h-px bg-emerald-200 -mt-1" style={{ opacity: 0.6 }} />
            )}
            <span className={`text-xs ${isToday ? "font-bold text-emerald-600" : "text-gray-400"}`}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
interface DashboardProps {
  externalProfile?: Partial<UserProfile>;
}

const Dashboard = ({ externalProfile }: DashboardProps) => {
  const [tab, setTab] = useState<"diary" | "history" | "analysis">("diary");
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = loadProfile();
    return {
      name: saved.name || "",
      dailyCalories: saved.dailyCalories || 0,
      proteinTarget: saved.proteinTarget || 0,
      fatTarget: saved.fatTarget || 0,
      carbsTarget: saved.carbsTarget || 0,
    };
  });
  const [log, setLog] = useState<FoodLog>(loadLog);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);

  // Merge external profile (from calculator result)
  useEffect(() => {
    if (!externalProfile) return;
    setProfile((prev) => {
      const next = { ...prev, ...externalProfile };
      saveProfile(next);
      return next;
    });
  }, [externalProfile]);

  // Save log whenever it changes
  useEffect(() => { saveLog(log); }, [log]);

  // ── Diary state ──────────────────────────────────────────────────────────────
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

  function saveName() {
    setProfile((prev) => {
      const next = { ...prev, name: nameInput.trim() };
      saveProfile(next);
      return next;
    });
    setEditingName(false);
  }

  // ── History ──────────────────────────────────────────────────────────────────
  const [histDate, setHistDate] = useState(today);
  const histEntries = log[histDate] || [];
  const histSum = sumEntries(histEntries);

  // ── AI Analysis ──────────────────────────────────────────────────────────────
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisText, setAnalysisText] = useState("");

  const runAnalysis = useCallback(async () => {
    setAnalysisLoading(true);
    setAnalysisText("");

    // Собираем последние 5 дней
    const days: { date: string; entries: FoodEntry[]; sum: ReturnType<typeof sumEntries> }[] = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = dateKey(d);
      const entries = log[key] || [];
      if (entries.length > 0) {
        days.push({ date: formatDate(key), entries, sum: sumEntries(entries) });
      }
    }

    const logSummary = days.map((d) =>
      `${d.date}: ${d.sum.calories} ккал, Б:${d.sum.protein}г, Ж:${d.sum.fat}г, У:${d.sum.carbs}г (${d.entries.map((e) => e.name).join(", ")})`
    ).join("\n");

    const prompt = days.length === 0
      ? "У меня пока нет данных о питании в дневнике. Дай 3 универсальных совета по правильному питанию."
      : `Проанализируй моё питание за последние дни:\n${logSummary}\n\nМоя суточная норма: ${profile.dailyCalories || "неизвестно"} ккал. Цели: белок ${profile.proteinTarget || "?"}г, жиры ${profile.fatTarget || "?"}г, углеводы ${profile.carbsTarget || "?"}г.\n\nДай 3-5 конкретных советов: чего не хватает, что улучшить, иду ли я по плану. Будь конкретным и дружелюбным.`;

    try {
      const res = await fetch(AI_CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", text: prompt }], userContext: {} }),
      });
      const data = await res.json();
      setAnalysisText(data.reply || "Не удалось получить анализ.");
    } catch {
      setAnalysisText("AI временно недоступен. Попробуй позже.");
    }
    setAnalysisLoading(false);
  }, [log, profile]);

  // ── Render helpers ───────────────────────────────────────────────────────────
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

  const histByMeal = MEAL_ORDER.reduce((acc, m) => {
    acc[m] = histEntries.filter((e) => e.meal === m);
    return acc;
  }, {} as Record<string, FoodEntry[]>);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Icon name="ChefHat" size={20} className="text-emerald-600" />
          </div>
          <div>
            <div className="font-bold text-gray-800 text-base">
              {profile.name ? `Привет, ${profile.name}!` : "Мой дневник питания"}
            </div>
            <div className="text-xs text-gray-400">
              {profile.dailyCalories > 0
                ? `Норма: ${profile.dailyCalories} ккал/день`
                : "Рассчитай норму в калькуляторе"}
            </div>
          </div>
        </div>

        {/* Name edit */}
        {editingName ? (
          <div className="flex items-center gap-2">
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveName()}
              placeholder="Твоё имя"
              className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              autoFocus
            />
            <button onClick={saveName} className="text-xs px-3 py-1.5 rounded-xl bg-emerald-500 text-white font-semibold">Сохранить</button>
            <button onClick={() => setEditingName(false)} className="text-xs text-gray-400 hover:text-gray-600">Отмена</button>
          </div>
        ) : (
          <button onClick={() => { setNameInput(profile.name); setEditingName(true); }}
            className="text-xs text-gray-400 hover:text-emerald-600 flex items-center gap-1 transition-colors">
            <Icon name="Pencil" size={12} />
            {profile.name ? "Сменить имя" : "Добавить имя"}
          </button>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
        {(["diary", "history", "analysis"] as const).map((t) => {
          const labels = { diary: "Дневник", history: "История", analysis: "AI-анализ" };
          const icons = { diary: "BookOpen", history: "CalendarDays", analysis: "Sparkles" };
          return (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${tab === t ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              <Icon name={icons[t] as Parameters<typeof Icon>[0]["name"]} size={14} />
              {labels[t]}
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════
          TAB 1: DIARY
      ═══════════════════════════════════════════════ */}
      {tab === "diary" && (
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
      )}

      {/* ═══════════════════════════════════════════════
          TAB 2: HISTORY
      ═══════════════════════════════════════════════ */}
      {tab === "history" && (
        <div className="space-y-5">
          {/* Date picker + week chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <Icon name="CalendarDays" size={15} className="text-emerald-500" />
                Выбери дату
              </h3>
              <input type="date" value={histDate}
                max={today}
                onChange={(e) => setHistDate(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 ml-auto" />
            </div>
            <WeekChart log={log} target={profile.dailyCalories} />
            <p className="text-xs text-gray-400 text-center mt-2">Последние 7 дней · зелёный = сегодня · оранжевый = превышение нормы</p>
          </div>

          {/* History entries */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 text-sm">{formatDate(histDate)}</h3>
              {histEntries.length > 0 && (
                <span className="text-xs text-gray-400">{histSum.calories} ккал</span>
              )}
            </div>

            {histEntries.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                <Icon name="CalendarX" size={28} className="mx-auto mb-2 opacity-30" />
                Нет записей за этот день
              </div>
            ) : (
              <div className="space-y-4">
                {MEAL_ORDER.map((m) => {
                  const items = histByMeal[m];
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
                              <button onClick={() => deleteEntry(histDate, e.id)}
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
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <MacroRow emoji="🥩" label="Белки" current={histSum.protein} target={profile.proteinTarget} color="#10b981" />
                  <MacroRow emoji="🧈" label="Жиры" current={histSum.fat} target={profile.fatTarget} color="#f59e0b" />
                  <MacroRow emoji="🍚" label="Углеводы" current={histSum.carbs} target={profile.carbsTarget} color="#3b82f6" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          TAB 3: AI ANALYSIS
      ═══════════════════════════════════════════════ */}
      {tab === "analysis" && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Icon name="Sparkles" size={22} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-base mb-1">AI-анализ рациона</h3>
                <p className="text-sm text-gray-500">
                  AI проанализирует данные за последние 5 дней и подскажет, что улучшить в питании.
                </p>
              </div>
            </div>

            <button onClick={runAnalysis} disabled={analysisLoading}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-all">
              {analysisLoading
                ? <><Icon name="Loader2" size={16} className="animate-spin" /> Анализирую рацион...</>
                : <><Icon name="Sparkles" size={16} /> Получить AI-анализ моего рациона</>}
            </button>
          </div>

          {analysisText && (
            <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Icon name="Bot" size={13} className="text-white" />
                </div>
                <span className="text-sm font-bold text-gray-700">AI-диетолог</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{analysisText}</p>
            </div>
          )}

          {/* Stats overview */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-800 text-sm mb-4">Статистика за 7 дней</h3>
            <WeekChart log={log} target={profile.dailyCalories} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
