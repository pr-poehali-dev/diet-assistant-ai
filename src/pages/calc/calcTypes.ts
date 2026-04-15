export type CalcInput = {
  age: string; weight: string; height: string;
  gender: string; activity: string; goal: string;
};

export type CalcResult = {
  bmr: number; tdee: number; target: number;
  protein: number; fat: number; carbs: number;
  bmi: number; bmiLabel: string; idealWeight: number; water: number;
};

export interface ChatMessage { role: "user" | "ai"; text: string; time: string; }

const ACT_MAP: Record<string, number> = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, veryactive: 1.9,
};
const GOAL_MAP: Record<string, number> = {
  loss: -500, softloss: -250, maintain: 0, gain: 250, fastgain: 500,
};

function bmiLabel(bmi: number) {
  if (bmi < 18.5) return "Дефицит";
  if (bmi < 25) return "Норма";
  if (bmi < 30) return "Избыток";
  return "Ожирение";
}

export function calcCalories(inp: CalcInput): CalcResult | null {
  const age = parseFloat(inp.age), w = parseFloat(inp.weight), h = parseFloat(inp.height);
  if (!age || !w || !h || age <= 0 || w <= 0 || h <= 0) return null;
  const bmr = inp.gender === "male"
    ? 10 * w + 6.25 * h - 5 * age + 5
    : 10 * w + 6.25 * h - 5 * age - 161;
  const tdee = Math.round(bmr * (ACT_MAP[inp.activity] ?? 1.375));
  const target = Math.max(1200, tdee + (GOAL_MAP[inp.goal] ?? 0));
  const protein = Math.round(w * 2.0);
  const fat = Math.round((target * 0.25) / 9);
  const carbs = Math.max(0, Math.round((target - protein * 4 - fat * 9) / 4));
  const bmi = Math.round((w / ((h / 100) ** 2)) * 10) / 10;
  const idealWeight = inp.gender === "male"
    ? Math.round(50 + 0.91 * (h - 152.4))
    : Math.round(45.5 + 0.91 * (h - 152.4));
  const water = Math.round(w * 35);
  return { bmr: Math.round(bmr), tdee, target, protein, fat, carbs, bmi, bmiLabel: bmiLabel(bmi), idealWeight, water };
}

export function getTime() {
  return new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
}

export const AI_CHAT_URL = "https://functions.poehali.dev/dfa1da49-ab4b-4e4b-b592-8bf7388e022c";

export const QUICK_QUESTIONS = [
  "Что мне съесть на ужин?",
  "Сколько пить воды?",
  "Как ускорить похудение?",
];
