import Icon from "@/components/ui/icon";
import {
  FoodEntry, FoodLog, UserProfile,
  MEAL_LABELS, MEAL_ICONS, MEAL_ORDER,
  todayKey, dateKey, formatDate, sumEntries,
} from "./dashboardTypes";
import { MacroRow } from "./DiaryTab";

// ─── WeekChart ────────────────────────────────────────────────────────────────
export function WeekChart({ log, target }: { log: FoodLog; target: number }) {
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

// ─── HistoryTab ───────────────────────────────────────────────────────────────
interface HistoryTabProps {
  log: FoodLog;
  profile: UserProfile;
  histDate: string;
  setHistDate: (date: string) => void;
  deleteEntry: (date: string, id: number) => void;
}

export default function HistoryTab({ log, profile, histDate, setHistDate, deleteEntry }: HistoryTabProps) {
  const today = todayKey();
  const histEntries = log[histDate] || [];
  const histSum = sumEntries(histEntries);

  const histByMeal = MEAL_ORDER.reduce((acc, m) => {
    acc[m] = histEntries.filter((e: FoodEntry) => e.meal === m);
    return acc;
  }, {} as Record<string, FoodEntry[]>);

  return (
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
  );
}
