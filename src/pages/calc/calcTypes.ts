export type CalcInput = {
  age: string; weight: string; height: string;
  gender: string; activity: string; goal: string;
  bodyFat: string;
  conditions: string[];
  medications: string[];
};

export type CalcResult = {
  bmr: number; tdee: number; target: number;
  protein: number; fat: number; carbs: number;
  bmi: number; bmiLabel: string; idealWeight: number; water: number;
  adjustmentNote: string;
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

  const bodyFatPct = parseFloat(inp.bodyFat);
  const hasBodyFat = !isNaN(bodyFatPct) && bodyFatPct > 0 && bodyFatPct < 70;

  let bmr: number;
  if (hasBodyFat) {
    const leanMass = w * (1 - bodyFatPct / 100);
    bmr = 370 + 21.6 * leanMass;
  } else {
    bmr = inp.gender === "male"
      ? 10 * w + 6.25 * h - 5 * age + 5
      : 10 * w + 6.25 * h - 5 * age - 161;
  }

  const conditions = inp.conditions ?? [];
  const medications = inp.medications ?? [];
  const notes: string[] = [];

  // Condition adjustments to TDEE multiplier
  let conditionMultiplier = 1.0;
  if (conditions.includes("hypothyroidism")) {
    conditionMultiplier *= 0.9;
    notes.push("Гипотиреоз снижает расход энергии (~−10%)");
  }
  if (conditions.includes("pcos")) {
    conditionMultiplier *= 0.95;
    notes.push("СПКЯ снижает чувствительность к инсулину (~−5%)");
  }
  if (conditions.includes("diabetes")) {
    notes.push("Диабет: снижено потребление быстрых углеводов");
  }

  const tdee = Math.round(bmr * (ACT_MAP[inp.activity] ?? 1.375) * conditionMultiplier);

  // Medication adjustments to target calories
  let medicationDelta = 0;
  if (medications.includes("corticosteroids")) {
    medicationDelta -= 150;
    notes.push("Кортикостероиды: повышают аппетит и задержку воды (−150 ккал)");
  }
  if (medications.includes("antidepressants")) {
    medicationDelta -= 100;
    notes.push("Антидепрессанты могут замедлять метаболизм (−100 ккал)");
  }
  if (medications.includes("metformin")) {
    notes.push("Метформин: улучшает чувствительность к инсулину, белок важен");
  }

  const target = Math.max(1200, tdee + (GOAL_MAP[inp.goal] ?? 0) + medicationDelta);

  // Protein — increased for PCOS, metformin, diabetes
  const proteinMultiplier =
    conditions.includes("pcos") || conditions.includes("diabetes") || medications.includes("metformin")
      ? 2.2
      : 2.0;
  const protein = Math.round(w * proteinMultiplier);

  // Carbs — reduced for diabetes / PCOS / metformin
  const lowCarbMode = conditions.includes("diabetes") || conditions.includes("pcos") || medications.includes("metformin");
  const fatPct = lowCarbMode ? 0.3 : 0.25;
  const fat = Math.round((target * fatPct) / 9);
  const carbs = Math.max(0, Math.round((target - protein * 4 - fat * 9) / 4));

  const bmi = Math.round((w / ((h / 100) ** 2)) * 10) / 10;
  const idealWeight = inp.gender === "male"
    ? Math.round(50 + 0.91 * (h - 152.4))
    : Math.round(45.5 + 0.91 * (h - 152.4));
  const water = Math.round(w * 35);

  const adjustmentNote = notes.join(" • ");

  return { bmr: Math.round(bmr), tdee, target, protein, fat, carbs, bmi, bmiLabel: bmiLabel(bmi), idealWeight, water, adjustmentNote };
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
