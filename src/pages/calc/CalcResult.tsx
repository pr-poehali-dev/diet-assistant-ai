import Icon from "@/components/ui/icon";
import { CalcResult as CalcResultType } from "./calcTypes";

// ─── MacroBar ─────────────────────────────────────────────────────────────────
function MacroBar({ label, value, kcal, color, pct }: {
  label: string; value: number; kcal: number; color: string; pct: number;
}) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-xs font-semibold text-gray-500">{label}</span>
        <span className="text-sm font-bold" style={{ color }}>{value}г <span className="text-xs font-normal text-gray-400">({kcal} ккал)</span></span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
      </div>
      <div className="text-right text-xs text-gray-400 mt-0.5">{pct}%</div>
    </div>
  );
}

// ─── CalcResult ───────────────────────────────────────────────────────────────
interface CalcResultProps {
  result: CalcResultType | null;
  onOpenChat: () => void;
  onGoToDashboard: () => void;
}

export default function CalcResult({ result, onOpenChat, onGoToDashboard }: CalcResultProps) {
  const bmiColor = result
    ? result.bmi < 18.5 ? "#f59e0b"
      : result.bmi < 25 ? "#10b981"
        : result.bmi < 30 ? "#f97316" : "#ef4444"
    : "#10b981";

  return (
    <div className="flex flex-col gap-4">
      {!result ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center text-center h-full min-h-64">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
            <Icon name="BarChart2" size={26} className="text-gray-300" />
          </div>
          <p className="text-gray-400 text-sm">Заполни форму слева и нажми<br /><span className="font-semibold text-gray-500">«Рассчитать»</span></p>
        </div>
      ) : (
        <>
          {/* Calories card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Ваша цель</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-gray-900">{result.target}</span>
                  <span className="text-gray-400 text-sm font-medium">ккал/день</span>
                </div>
              </div>
              <div className="text-right text-xs text-gray-400 space-y-1">
                <div>BMR: <span className="font-semibold text-gray-600">{result.bmr}</span></div>
                <div>TDEE: <span className="font-semibold text-gray-600">{result.tdee}</span></div>
              </div>
            </div>

            {/* BJU bars */}
            <div className="space-y-3">
              <MacroBar label="🥩 Белки" value={result.protein} kcal={result.protein * 4}
                color="#10b981" pct={Math.round(result.protein * 4 / result.target * 100)} />
              <MacroBar label="🧈 Жиры" value={result.fat} kcal={result.fat * 9}
                color="#f59e0b" pct={Math.round(result.fat * 9 / result.target * 100)} />
              <MacroBar label="🍚 Углеводы" value={result.carbs} kcal={result.carbs * 4}
                color="#3b82f6" pct={Math.round(result.carbs * 4 / result.target * 100)} />
            </div>
          </div>

          {/* Extra metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <div className="text-xl font-black" style={{ color: bmiColor }}>{result.bmi}</div>
              <div className="text-xs font-semibold mt-0.5" style={{ color: bmiColor }}>{result.bmiLabel}</div>
              <div className="text-xs text-gray-400 mt-1">ИМТ</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <div className="text-xl font-black text-gray-800">{result.idealWeight}</div>
              <div className="text-xs text-gray-400 mt-0.5">кг</div>
              <div className="text-xs text-gray-400 mt-1">Идеал. вес</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <div className="text-xl font-black text-blue-500">{(result.water / 1000).toFixed(1)}</div>
              <div className="text-xs text-gray-400 mt-0.5">л/день</div>
              <div className="text-xs text-gray-400 mt-1">Вода</div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={onGoToDashboard}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all duration-150 flex items-center justify-center gap-2"
            >
              <Icon name="BookOpen" size={16} className="text-white" />
              Перейти в дневник питания
            </button>
            <button
              onClick={onOpenChat}
              className="w-full py-3 rounded-xl border-2 border-emerald-500 text-emerald-600 font-bold text-sm hover:bg-emerald-50 transition-all duration-150 flex items-center justify-center gap-2"
            >
              <Icon name="Bot" size={16} />
              Спросить AI-диетолога
            </button>
          </div>
        </>
      )}
    </div>
  );
}
