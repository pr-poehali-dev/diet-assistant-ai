import { useState } from "react";
import Icon from "@/components/ui/icon";
import { UserProfile, saveProfile } from "./dashboardTypes";
import { calcCalories } from "../calc/calcTypes";

interface ParamsTabProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
}

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "Сидячий образ жизни",
  light: "1–3 тренировки в неделю",
  moderate: "3–5 тренировок в неделю",
  active: "Ежедневные тренировки",
  veryactive: "Интенсивный спорт/работа",
};

const GOAL_LABELS: Record<string, string> = {
  loss: "Похудение",
  softloss: "Мягкое похудение",
  maintain: "Поддержание веса",
  gain: "Набор мышечной массы",
  fastgain: "Быстрый набор",
};

const CONDITION_LABELS: Record<string, string> = {
  diabetes: "Сахарный диабет",
  hypothyroidism: "Гипотиреоз",
  pcos: "СПКЯ",
};

const MED_LABELS: Record<string, string> = {
  metformin: "Метформин",
  corticosteroids: "Кортикостероиды",
  antidepressants: "Антидепрессанты",
};

export default function ParamsTab({ profile, setProfile }: ParamsTabProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    weight: profile.weight || "",
    activity: profile.activity || "moderate",
    goal: profile.goal || "maintain",
  });
  const [recalcResult, setRecalcResult] = useState<{ calories: number; protein: number; fat: number; carbs: number } | null>(null);

  function handleRecalc() {
    if (!profile.age || !form.weight || !profile.height) return;
    const result = calcCalories({
      age: profile.age || "",
      weight: form.weight,
      height: profile.height || "",
      gender: profile.gender || "female",
      activity: form.activity,
      goal: form.goal,
      bodyFat: profile.bodyFat || "",
      conditions: profile.conditions || [],
      medications: profile.medications || [],
    });
    if (result) {
      setRecalcResult({ calories: result.target, protein: result.protein, fat: result.fat, carbs: result.carbs });
    }
  }

  function applyRecalc() {
    if (!recalcResult) return;
    const next: UserProfile = {
      ...profile,
      weight: form.weight,
      activity: form.activity,
      goal: form.goal,
      dailyCalories: recalcResult.calories,
      proteinTarget: recalcResult.protein,
      fatTarget: recalcResult.fat,
      carbsTarget: recalcResult.carbs,
    };
    saveProfile(next);
    setProfile(next);
    setRecalcResult(null);
    setEditing(false);
  }

  const hasCalcData = !!(profile.age && profile.height && profile.weight);

  return (
    <div className="space-y-4">

      {/* ── Текущие параметры ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <Icon name="User" size={15} className="text-emerald-500" />
            Мои параметры
          </h3>
          {hasCalcData && !editing && (
            <button onClick={() => setEditing(true)}
              className="text-xs text-gray-400 hover:text-emerald-600 flex items-center gap-1 transition-colors">
              <Icon name="Pencil" size={12} />
              Изменить
            </button>
          )}
        </div>

        {!hasCalcData ? (
          <div className="text-center py-6 text-gray-400 text-sm">
            <Icon name="Calculator" size={28} className="mx-auto mb-2 opacity-30" />
            <p>Параметры появятся после расчёта в калькуляторе</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Физ. данные */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Пол", value: profile.gender === "male" ? "Мужчина" : "Женщина" },
                { label: "Возраст", value: profile.age ? `${profile.age} лет` : "—" },
                { label: "Рост", value: profile.height ? `${profile.height} см` : "—" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-base font-black text-gray-800">{value}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {/* Вес */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-base font-black text-gray-800">{profile.weight ? `${profile.weight} кг` : "—"}</div>
                <div className="text-xs text-gray-400 mt-0.5">Вес</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-base font-black text-emerald-600">{profile.dailyCalories || "—"}</div>
                <div className="text-xs text-gray-400 mt-0.5">Норма ккал</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-base font-black text-blue-600">{profile.tdee || "—"}</div>
                <div className="text-xs text-gray-400 mt-0.5">TDEE</div>
              </div>
            </div>

            {/* Цель и активность */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs text-gray-400 mb-0.5">Цель</div>
                <div className="text-sm font-semibold text-gray-700">{GOAL_LABELS[profile.goal || ""] || "—"}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs text-gray-400 mb-0.5">Активность</div>
                <div className="text-sm font-semibold text-gray-700">{ACTIVITY_LABELS[profile.activity || ""] || "—"}</div>
              </div>
            </div>

            {/* Норма БЖУ */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Белки", value: profile.proteinTarget, color: "text-emerald-600", unit: "г" },
                { label: "Жиры", value: profile.fatTarget, color: "text-amber-500", unit: "г" },
                { label: "Углеводы", value: profile.carbsTarget, color: "text-blue-500", unit: "г" },
              ].map(({ label, value, color, unit }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className={`text-base font-black ${color}`}>{value ? `${value}${unit}` : "—"}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {/* Заболевания / препараты */}
            {((profile.conditions?.length ?? 0) > 0 || (profile.medications?.length ?? 0) > 0) && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-xs font-semibold text-amber-700 mb-1.5">Учтено в расчёте</p>
                <div className="flex flex-wrap gap-1.5">
                  {(profile.conditions || []).map((c) => (
                    <span key={c} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{CONDITION_LABELS[c] || c}</span>
                  ))}
                  {(profile.medications || []).map((m) => (
                    <span key={m} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{MED_LABELS[m] || m}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Форма редактирования ── */}
      {editing && hasCalcData && (
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <Icon name="RefreshCw" size={14} className="text-emerald-500" />
            Обновить параметры
          </h3>

          {/* Вес */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Текущий вес</p>
            <div className="relative max-w-32">
              <input
                type="number"
                value={form.weight}
                onChange={(e) => setForm((p) => ({ ...p, weight: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-9 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">кг</span>
            </div>
          </div>

          {/* Активность */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Активность</p>
            <div className="space-y-1.5">
              {Object.entries(ACTIVITY_LABELS).map(([v, label]) => (
                <label key={v} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer border transition-all ${form.activity === v ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${form.activity === v ? "border-emerald-500" : "border-gray-300"}`}>
                    {form.activity === v && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                  </div>
                  <input type="radio" className="hidden" checked={form.activity === v} onChange={() => setForm((p) => ({ ...p, activity: v }))} />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Цель */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Цель</p>
            <div className="space-y-1.5">
              {Object.entries(GOAL_LABELS).map(([v, label]) => (
                <label key={v} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer border transition-all ${form.goal === v ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${form.goal === v ? "border-emerald-500" : "border-gray-300"}`}>
                    {form.goal === v && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                  </div>
                  <input type="radio" className="hidden" checked={form.goal === v} onChange={() => setForm((p) => ({ ...p, goal: v }))} />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Пересчёт */}
          <button onClick={handleRecalc} disabled={!form.weight}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
            <Icon name="RefreshCw" size={15} className="text-white" />
            Пересчитать норму
          </button>

          {recalcResult && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-emerald-800">Новая норма:</p>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <div className="text-lg font-black text-emerald-600">{recalcResult.calories}</div>
                  <div className="text-xs text-gray-400">ккал</div>
                </div>
                <div>
                  <div className="text-lg font-black text-emerald-600">{recalcResult.protein}г</div>
                  <div className="text-xs text-gray-400">белки</div>
                </div>
                <div>
                  <div className="text-lg font-black text-amber-500">{recalcResult.fat}г</div>
                  <div className="text-xs text-gray-400">жиры</div>
                </div>
                <div>
                  <div className="text-lg font-black text-blue-500">{recalcResult.carbs}г</div>
                  <div className="text-xs text-gray-400">углеводы</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={applyRecalc}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all">
                  Применить
                </button>
                <button onClick={() => setRecalcResult(null)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold hover:border-gray-300 transition-all">
                  Отмена
                </button>
              </div>
            </div>
          )}

          {!recalcResult && (
            <button onClick={() => setEditing(false)}
              className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold hover:border-gray-300 transition-all">
              Отмена
            </button>
          )}
        </div>
      )}
    </div>
  );
}
