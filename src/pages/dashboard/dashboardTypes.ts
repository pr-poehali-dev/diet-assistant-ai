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
