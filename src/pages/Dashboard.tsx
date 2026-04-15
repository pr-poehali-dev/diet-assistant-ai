import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import {
  UserProfile, FoodLog,
  loadProfile, saveProfile, loadLog, saveLog,
  todayKey,
} from "./dashboard/dashboardTypes";
import TodayTab from "./dashboard/TodayTab";
import DiaryTab from "./dashboard/DiaryTab";
import HistoryTab from "./dashboard/HistoryTab";
import AnalysisTab from "./dashboard/AnalysisTab";
import ParamsTab from "./dashboard/ParamsTab";

export type { UserProfile, FoodLog };

interface DashboardProps {
  externalProfile?: Partial<UserProfile>;
}

const Dashboard = ({ externalProfile }: DashboardProps) => {
  const [tab, setTab] = useState<"today" | "diary" | "history" | "analysis" | "params">("today");
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = loadProfile();
    return {
      name: saved.name || "",
      dailyCalories: saved.dailyCalories || 0,
      proteinTarget: saved.proteinTarget || 0,
      fatTarget: saved.fatTarget || 0,
      carbsTarget: saved.carbsTarget || 0,
      gender: saved.gender,
      age: saved.age,
      weight: saved.weight,
      height: saved.height,
      activity: saved.activity,
      goal: saved.goal,
      bodyFat: saved.bodyFat,
      conditions: saved.conditions,
      medications: saved.medications,
      bmr: saved.bmr,
      tdee: saved.tdee,
    };
  });
  const [log, setLog] = useState<FoodLog>(loadLog);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);
  const [histDate, setHistDate] = useState(todayKey);

  useEffect(() => {
    if (!externalProfile) return;
    setProfile((prev) => {
      const next = { ...prev, ...externalProfile };
      saveProfile(next);
      return next;
    });
  }, [externalProfile]);

  useEffect(() => { saveLog(log); }, [log]);

  function saveName() {
    setProfile((prev) => {
      const next = { ...prev, name: nameInput.trim() };
      saveProfile(next);
      return next;
    });
    setEditingName(false);
  }

  function deleteEntry(date: string, id: number) {
    setLog((prev) => ({ ...prev, [date]: (prev[date] || []).filter((e) => e.id !== id) }));
  }

  const tabs = [
    { id: "today", label: "Сегодня", icon: "Sun" },
    { id: "diary", label: "Дневник", icon: "BookOpen" },
    { id: "history", label: "История", icon: "CalendarDays" },
    { id: "analysis", label: "AI-анализ", icon: "Sparkles" },
    { id: "params", label: "Параметры", icon: "User" },
  ] as const;

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
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 ${tab === t.id ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <Icon name={t.icon as Parameters<typeof Icon>[0]["name"]} size={14} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      {tab === "today" && (
        <TodayTab log={log} profile={profile} setLog={setLog} />
      )}

      {tab === "diary" && (
        <DiaryTab log={log} profile={profile} setLog={setLog} />
      )}

      {tab === "history" && (
        <HistoryTab
          log={log}
          profile={profile}
          histDate={histDate}
          setHistDate={setHistDate}
          deleteEntry={deleteEntry}
        />
      )}

      {tab === "analysis" && (
        <AnalysisTab log={log} profile={profile} />
      )}

      {tab === "params" && (
        <ParamsTab profile={profile} setProfile={setProfile} />
      )}
    </div>
  );
};

export default Dashboard;
