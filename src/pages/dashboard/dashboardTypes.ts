export interface UserProfile {
  name: string;
  dailyCalories: number;
  proteinTarget: number;
  fatTarget: number;
  carbsTarget: number;
  // Параметры из калькулятора
  gender?: string;
  age?: string;
  weight?: string;
  height?: string;
  activity?: string;
  goal?: string;
  bodyFat?: string;
  conditions?: string[];
  medications?: string[];
  bmr?: number;
  tdee?: number;
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

export type FoodLog = Record<string, FoodEntry[]>;

export const MEAL_LABELS: Record<string, string> = {
  breakfast: "Завтрак",
  lunch: "Обед",
  dinner: "Ужин",
  snack: "Перекус",
};

export const MEAL_ICONS: Record<string, string> = {
  breakfast: "Coffee",
  lunch: "UtensilsCrossed",
  dinner: "Moon",
  snack: "Apple",
};

export const MEAL_ORDER = ["breakfast", "lunch", "dinner", "snack"];

export const AI_CHAT_URL = "https://functions.poehali.dev/dfa1da49-ab4b-4e4b-b592-8bf7388e022c";

export function todayKey() {
  return new Date().toISOString().split("T")[0];
}

export function dateKey(d: Date) {
  return d.toISOString().split("T")[0];
}

export function formatDate(key: string) {
  const d = new Date(key + "T12:00:00");
  return d.toLocaleDateString("ru", { day: "numeric", month: "long" });
}

export function loadProfile(): UserProfile {
  try {
    return JSON.parse(localStorage.getItem("userProfile") || "{}");
  } catch { return {} as UserProfile; }
}

export function saveProfile(p: UserProfile) {
  localStorage.setItem("userProfile", JSON.stringify(p));
}

export function loadLog(): FoodLog {
  try {
    return JSON.parse(localStorage.getItem("foodLog") || "{}");
  } catch { return {}; }
}

export function saveLog(log: FoodLog) {
  localStorage.setItem("foodLog", JSON.stringify(log));
}

export function sumEntries(entries: FoodEntry[]) {
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

// ─── Умная коррекция нормы ────────────────────────────────────────────────────
export interface DayCorrection {
  adjustedCalories: number;
  adjustedProtein: number;
  calorieDelta: number;
  proteinBoost: boolean;
  message: string;
}

export function calcDayCorrection(log: FoodLog, profile: UserProfile): DayCorrection {
  const base = profile.dailyCalories || 0;
  const baseProtein = profile.proteinTarget || 0;

  if (base === 0) {
    return { adjustedCalories: 0, adjustedProtein: 0, calorieDelta: 0, proteinBoost: false, message: "" };
  }

  // Собираем данные за последние 3 дня (не включая сегодня)
  const prevDays: { calories: number; protein: number }[] = [];
  for (let i = 1; i <= 3; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const entries = log[dateKey(d)] || [];
    if (entries.length > 0) {
      const s = sumEntries(entries);
      prevDays.push({ calories: s.calories, protein: s.protein });
    }
  }

  if (prevDays.length === 0) {
    return { adjustedCalories: base, adjustedProtein: baseProtein, calorieDelta: 0, proteinBoost: false, message: "" };
  }

  const avgCalories = prevDays.reduce((s, d) => s + d.calories, 0) / prevDays.length;
  const avgDeficit = base - avgCalories; // положительный = недобор, отрицательный = перебор

  let calorieDelta = 0;
  let message = "";

  if (avgDeficit > 300) {
    // Систематический недобор
    calorieDelta = +150;
    const kcalShort = Math.round(avgDeficit);
    message = `За последние ${prevDays.length} дн. вы недоедаете ~${kcalShort} ккал. Сегодня можно добавить +150 ккал без вреда для цели.`;
  } else if (avgDeficit < -400) {
    // Систематический перебор
    calorieDelta = -200;
    const kcalOver = Math.round(-avgDeficit);
    message = `За последние ${prevDays.length} дн. вы перебирали ~${kcalOver} ккал. Рекомендуем лёгкий день: −200 ккал для компенсации.`;
  } else if (Math.abs(avgDeficit) <= 200) {
    message = "Всё идёт по плану! Продолжай в том же духе.";
  }

  // Коррекция белка: если 2+ дня подряд недобор белка > 20%
  let proteinBoost = false;
  const daysLowProtein = prevDays.filter(d => baseProtein > 0 && d.protein < baseProtein * 0.8).length;
  if (daysLowProtein >= 2) {
    proteinBoost = true;
    if (message) message += " Также: вы систематически недобираете белок — сегодня цель по белку увеличена на 15%.";
    else message = "Вы систематически недобираете белок. Сегодня цель по белку увеличена на 15%.";
  }

  return {
    adjustedCalories: Math.max(1200, base + calorieDelta),
    adjustedProtein: proteinBoost ? Math.round(baseProtein * 1.15) : baseProtein,
    calorieDelta,
    proteinBoost,
    message,
  };
}
