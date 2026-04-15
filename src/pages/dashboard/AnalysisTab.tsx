import { useState, useCallback, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { FoodLog, UserProfile, AI_CHAT_URL, dateKey, formatDate, sumEntries, calcDayCorrection } from "./dashboardTypes";
import { WeekChart } from "./HistoryTab";

interface AnalysisTabProps {
  log: FoodLog;
  profile: UserProfile;
}

export default function AnalysisTab({ log, profile }: AnalysisTabProps) {
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisText, setAnalysisText] = useState("");
  const [autoLoaded, setAutoLoaded] = useState(false);

  const correction = calcDayCorrection(log, profile);

  const runAnalysis = useCallback(async () => {
    setAnalysisLoading(true);
    setAnalysisText("");

    const days: { date: string; sum: ReturnType<typeof sumEntries>; names: string[] }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = dateKey(d);
      const entries = log[key] || [];
      if (entries.length > 0) {
        days.push({ date: formatDate(key), sum: sumEntries(entries), names: entries.map((e) => e.name) });
      }
    }

    const logSummary = days.map((d) =>
      `${d.date}: ${d.sum.calories} ккал, Б:${d.sum.protein}г, Ж:${d.sum.fat}г, У:${d.sum.carbs}г (${d.names.join(", ")})`
    ).join("\n");

    const correctionNote = correction.message
      ? `\n\nТекущая автокоррекция нормы: ${correction.message}`
      : "";

    const prompt = days.length === 0
      ? "У меня пока нет данных о питании. Дай 3 конкретных совета как правильно начать вести дневник питания."
      : `Проанализируй моё питание за последние дни:\n${logSummary}\n\nМоя суточная норма: ${profile.dailyCalories || "неизвестно"} ккал. Цели: белок ${profile.proteinTarget || "?"}г, жиры ${profile.fatTarget || "?"}г, углеводы ${profile.carbsTarget || "?"}г.${correctionNote}\n\nДай 3-5 конкретных советов с учётом паттернов: чего систематически не хватает, что улучшить, рекомендуй конкретные продукты. Будь конкретным и дружелюбным.`;

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
  }, [log, profile, correction.message]);

  // Авто-загрузка при открытии вкладки если есть данные
  useEffect(() => {
    if (!autoLoaded && Object.keys(log).length > 0) {
      setAutoLoaded(true);
      runAnalysis();
    }
  }, []);

  return (
    <div className="space-y-5">

      {/* ── Умная коррекция нормы ── */}
      {correction.message && (
        <div className={`rounded-2xl px-4 py-4 border ${correction.calorieDelta > 0 ? "bg-blue-50 border-blue-200" : correction.calorieDelta < 0 ? "bg-orange-50 border-orange-200" : "bg-emerald-50 border-emerald-200"}`}>
          <div className="flex items-center gap-2 mb-2">
            <Icon name="Brain" size={16} className={correction.calorieDelta > 0 ? "text-blue-500" : correction.calorieDelta < 0 ? "text-orange-500" : "text-emerald-500"} />
            <span className={`text-sm font-bold ${correction.calorieDelta > 0 ? "text-blue-700" : correction.calorieDelta < 0 ? "text-orange-700" : "text-emerald-700"}`}>
              Умная коррекция на сегодня
            </span>
          </div>
          <p className={`text-sm leading-relaxed ${correction.calorieDelta > 0 ? "text-blue-600" : correction.calorieDelta < 0 ? "text-orange-600" : "text-emerald-600"}`}>
            {correction.message}
          </p>
          {correction.calorieDelta !== 0 && (
            <div className="mt-3 flex gap-3 text-sm">
              <span className="text-gray-500">Базовая норма: <b>{profile.dailyCalories} ккал</b></span>
              <span className={`font-bold ${correction.calorieDelta > 0 ? "text-blue-600" : "text-orange-600"}`}>
                → Скорректировано: {correction.adjustedCalories} ккал
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── AI анализ рациона ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <Icon name="Sparkles" size={22} className="text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-base mb-1">AI-анализ рациона</h3>
            <p className="text-sm text-gray-500">
              AI анализирует данные за последние 7 дней и даёт персональные советы.
            </p>
          </div>
        </div>

        <button onClick={runAnalysis} disabled={analysisLoading}
          className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-all">
          {analysisLoading
            ? <><Icon name="Loader2" size={16} className="animate-spin" /> Анализирую рацион...</>
            : <><Icon name="RefreshCw" size={16} /> Обновить совет</>}
        </button>
      </div>

      {analysisText && (
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
              <Icon name="Bot" size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold text-gray-700">AI-диетолог</span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{analysisText}</p>
        </div>
      )}

      {/* ── График ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2">
          <Icon name="BarChart2" size={15} className="text-emerald-500" />
          Статистика за 7 дней
        </h3>
        <WeekChart log={log} target={correction.adjustedCalories || profile.dailyCalories} />
        <p className="text-xs text-gray-400 text-center mt-2">
          Зелёный = сегодня · Оранжевый = превышение нормы
          {correction.calorieDelta !== 0 && (
            <span className="ml-1">· Норма скорректирована до {correction.adjustedCalories} ккал</span>
          )}
        </p>
      </div>
    </div>
  );
}
