import { useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { FoodLog, UserProfile, AI_CHAT_URL, dateKey, formatDate, sumEntries } from "./dashboardTypes";
import { WeekChart } from "./HistoryTab";

interface AnalysisTabProps {
  log: FoodLog;
  profile: UserProfile;
}

export default function AnalysisTab({ log, profile }: AnalysisTabProps) {
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisText, setAnalysisText] = useState("");

  const runAnalysis = useCallback(async () => {
    setAnalysisLoading(true);
    setAnalysisText("");

    const days: { date: string; entries: ReturnType<() => typeof log[string]>; sum: ReturnType<typeof sumEntries> }[] = [];
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

  return (
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
  );
}
