import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import {
  UserProfile, FoodLog, FoodEntry,
  todayKey,
} from "./dashboard/dashboardTypes";
import TodayTab from "./dashboard/TodayTab";
import DiaryTab from "./dashboard/DiaryTab";
import HistoryTab from "./dashboard/HistoryTab";
import AnalysisTab from "./dashboard/AnalysisTab";
import ParamsTab from "./dashboard/ParamsTab";
import { apiGetProfile, apiSaveProfile, apiGetFoodLog, apiSaveFoodLogDay } from "@/lib/api";
import type { AuthUser } from "@/hooks/useAuth";

export type { UserProfile, FoodLog };

interface DashboardProps {
  user: AuthUser;
  onLogout: () => void;
  externalProfile?: Partial<UserProfile>;
}

const Dashboard = ({ user, onLogout, externalProfile }: DashboardProps) => {
  const [tab, setTab] = useState<"today" | "diary" | "history" | "analysis" | "params">("today");
  const [profile, setProfile] = useState<UserProfile>({
    name: user.name || "",
    dailyCalories: 0, proteinTarget: 0, fatTarget: 0, carbsTarget: 0,
  });
  const [log, setLog] = useState<FoodLog>({});
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [histDate, setHistDate] = useState(todayKey);

  useEffect(() => {
    Promise.all([apiGetProfile(), apiGetFoodLog(30)]).then(([prof, foodLog]) => {
      if (prof) setProfile({ ...prof, name: prof.name || user.name || "" });
      if (foodLog) setLog(foodLog);
      setLoadingProfile(false);
    });
  }, []);

  useEffect(() => {
    if (!externalProfile || loadingProfile) return;
    setProfile((prev) => {
      const next = { ...prev, ...externalProfile };
      apiSaveProfile(next);
      return next;
    });
  }, [externalProfile, loadingProfile]);

  function handleSetLog(updater: React.SetStateAction<FoodLog>) {
    setLog((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      const changedDay = Object.keys(next).find((k) => JSON.stringify(next[k]) !== JSON.stringify(prev[k]));
      if (changedDay) apiSaveFoodLogDay(changedDay, next[changedDay] || []);
      return next;
    });
  }

  function handleSetProfile(updater: React.SetStateAction<UserProfile>) {
    setProfile((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      apiSaveProfile(next);
      return next;
    });
  }

  function deleteEntry(date: string, id: number) {
    setLog((prev) => {
      const updated = { ...prev, [date]: (prev[date] || []).filter((e: FoodEntry) => e.id !== id) };
      apiSaveFoodLogDay(date, updated[date]);
      return updated;
    });
  }

  const tabs = [
    { id: "today", label: "Сегодня", icon: "Sun" },
    { id: "diary", label: "Дневник", icon: "BookOpen" },
    { id: "history", label: "История", icon: "CalendarDays" },
    { id: "analysis", label: "AI-анализ", icon: "Sparkles" },
    { id: "params", label: "Параметры", icon: "User" },
  ] as const;

  if (loadingProfile) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Icon name="Loader2" size={28} className="text-emerald-500 animate-spin" />
          <p className="text-gray-400 text-sm">Загружаю твои данные...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Icon name="ChefHat" size={20} className="text-emerald-600" />
          </div>
          <div>
            <div className="font-bold text-gray-800 text-base">
              {profile.name ? `Привет, ${profile.name}!` : `Привет, ${user.email}!`}
            </div>
            <div className="text-xs text-gray-400">
              {profile.dailyCalories > 0
                ? `Норма: ${profile.dailyCalories} ккал/день`
                : "Рассчитай норму в калькуляторе"}
            </div>
          </div>
        </div>
        <button onClick={onLogout}
          className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50">
          <Icon name="LogOut" size={13} />
          Выйти
        </button>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 ${tab === t.id ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <Icon name={t.icon as Parameters<typeof Icon>[0]["name"]} size={14} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {tab === "today" && <TodayTab log={log} profile={profile} setLog={handleSetLog} />}
      {tab === "diary" && <DiaryTab log={log} profile={profile} setLog={handleSetLog} />}
      {tab === "history" && <HistoryTab log={log} profile={profile} histDate={histDate} setHistDate={setHistDate} deleteEntry={deleteEntry} />}
      {tab === "analysis" && <AnalysisTab log={log} profile={profile} />}
      {tab === "params" && <ParamsTab profile={profile} setProfile={handleSetProfile} />}
    </div>
  );
};

export default Dashboard;
