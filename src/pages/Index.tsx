import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

// ─── Types ────────────────────────────────────────────────────────────────────
type CalcInput = {
  age: string; weight: string; height: string;
  gender: string; activity: string; goal: string;
};
type CalcResult = {
  bmr: number; tdee: number; target: number;
  protein: number; fat: number; carbs: number;
  bmi: number; bmiLabel: string; idealWeight: number; water: number;
};
interface ChatMessage { role: "user" | "ai"; text: string; time: string; }

// ─── Calc logic ───────────────────────────────────────────────────────────────
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
function calcCalories(inp: CalcInput): CalcResult | null {
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

// ─── AI chat ─────────────────────────────────────────────────────────────────
const AI_KB: [string[], string][] = [
  [["привет", "hello", "добрый"], "Привет! Я AI-диетолог. Введи свои параметры в калькулятор, затем задай любой вопрос о питании 🥦"],
  [["белк", "протеин"], "Белок — строительный материал мышц. Норма: 1.6–2.2 г на кг веса. При похудении держи ближе к верхней границе — это сохраняет мышцы."],
  [["жир"], "Жиры необходимы для гормонов и усвоения витаминов. Оптимально: 25–35% от калорий. Приоритет — ненасыщенные (оливковое масло, орехи, авокадо)."],
  [["углевод", "карб"], "Углеводы — основной источник энергии. Предпочитай сложные: гречка, овсянка, бурый рис, овощи. Они медленнее усваиваются и дольше держат сытость."],
  [["вод", "пить"], "Норма воды — 30–35 мл на кг веса в день. При тренировках и жаре добавляй ещё 300–500 мл. Пей равномерно в течение дня."],
  [["имт", "вес", "индекс"], "ИМТ — это индекс массы тела (вес ÷ рост²). Норма: 18.5–24.9. Но он не учитывает состав тела — спортсмен с мышцами может иметь «лишний» ИМТ."],
  [["похуде", "дефицит", "сжечь"], "Для похудения создай дефицит 300–500 ккал от TDEE. Резкое ограничение (более 1000 ккал) тормозит метаболизм. Темп: 0.5–1 кг в неделю — оптимально."],
  [["набра", "масса", "профицит"], "Для набора массы добавь 200–300 ккал к TDEE. Приоритет — белок и тренировки. Медленный набор (0.5 кг/мес) — меньше жира."],
  [["завтрак", "утр"], "Завтрак важен для запуска метаболизма. Оптимально: белок + сложные углеводы. Например, яйца + овсянка или творог + цельнозерновой хлеб."],
  [["калор", "tdee", "bmr"], "BMR — это сколько калорий тратит твой организм в покое. TDEE = BMR × коэффициент активности. Это твоя реальная суточная потребность."],
  [["препарат", "таблетк", "лекарств"], "При приёме медикаментов некоторые продукты могут влиять на усвоение. Это важный вопрос — обязательно обсуди с лечащим врачом или фармацевтом."],
  [["диабет", "сахар"], "При диабете критически важен гликемический индекс продуктов. Избегай быстрых углеводов, ешь часто и небольшими порциями. Обязательно работай с врачом."],
  [["спорт", "трениров", "фитнес"], "При регулярных тренировках увеличь белок до 2–2.2 г/кг. Углеводы лучше есть до и после тренировки. Не забывай про восстановление — сон не менее 7–8 часов."],
];

function getAIResponse(msg: string, result: CalcResult | null): string {
  const lower = msg.toLowerCase();
  for (const [keys, resp] of AI_KB) {
    if (keys.some((k) => lower.includes(k))) return resp;
  }
  if (result) {
    return `На основе твоих данных: цель — ${result.target} ккал/день, белок — ${result.protein}г, жиры — ${result.fat}г, углеводы — ${result.carbs}г. Уточни свой вопрос — я помогу разобраться детальнее!`;
  }
  return "Сначала введи свои параметры в калькулятор — тогда смогу дать персональные рекомендации. Или задай общий вопрос о питании!";
}

function getTime() {
  return new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function RadioGroup({ label, options, value, onChange }: {
  label: string;
  options: { v: string; label: string; sub?: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <div className="flex flex-col gap-1.5">
        {options.map((o) => (
          <label key={o.v} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer border transition-all duration-150 ${value === o.v ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-gray-300 bg-white"}`}>
            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${value === o.v ? "border-emerald-500" : "border-gray-300"}`}>
              {value === o.v && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
            </div>
            <input type="radio" className="hidden" value={o.v} checked={value === o.v} onChange={() => onChange(o.v)} />
            <span className="text-sm font-medium text-gray-700">{o.label}</span>
            {o.sub && <span className="text-xs text-gray-400 ml-auto">{o.sub}</span>}
          </label>
        ))}
      </div>
    </div>
  );
}

function NumInput({ label, value, onChange, placeholder, unit }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; unit: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-9 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{unit}</span>
      </div>
    </div>
  );
}

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

// ─── Main ─────────────────────────────────────────────────────────────────────
const Index = () => {
  const [inp, setInp] = useState<CalcInput>({
    age: "", weight: "", height: "", gender: "female", activity: "moderate", goal: "maintain",
  });
  const [result, setResult] = useState<CalcResult | null>(null);
  const [calcError, setCalcError] = useState("");

  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "ai", text: "Привет! Я AI-диетолог. Введи свои параметры в калькулятор, затем задай любой вопрос о питании 🥦", time: getTime() },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (chatOpen) setTimeout(() => chatInputRef.current?.focus(), 100);
  }, [chatOpen]);

  function handleCalc() {
    const r = calcCalories(inp);
    if (!r) { setCalcError("Заполни возраст, вес и рост"); return; }
    setCalcError("");
    setResult(r);
  }

  function sendMsg() {
    const text = chatInput.trim();
    if (!text || isTyping) return;
    setMessages((prev) => [...prev, { role: "user", text, time: getTime() }]);
    setChatInput("");
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [...prev, { role: "ai", text: getAIResponse(text, result), time: getTime() }]);
    }, 900 + Math.random() * 600);
  }

  const bmiColor = result
    ? result.bmi < 18.5 ? "#f59e0b"
      : result.bmi < 25 ? "#10b981"
        : result.bmi < 30 ? "#f97316" : "#ef4444"
    : "#10b981";

  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* ── HEADER ── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
              <Icon name="Flame" size={15} className="text-white" />
            </div>
            <span className="font-bold text-gray-800 text-sm tracking-tight">AI Calorie Assistant</span>
          </div>
          <span className="text-xs text-gray-400 hidden sm:block">Бесплатный калькулятор калорий с AI</span>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Title */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Рассчитай свою норму калорий</h1>
          <p className="text-gray-500 text-sm">Персональный расчёт BMR, TDEE и БЖУ по формуле Миффлина-Сан Жеора</p>
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT — Calculator */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
              <Icon name="Calculator" size={16} className="text-emerald-500" />
              Калькулятор
            </h2>

            {/* Gender */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Пол</p>
              <div className="grid grid-cols-2 gap-2">
                {[{ v: "female", label: "Женщина" }, { v: "male", label: "Мужчина" }].map((o) => (
                  <button key={o.v} onClick={() => setInp((p) => ({ ...p, gender: o.v }))}
                    className={`py-2.5 rounded-xl text-sm font-semibold border transition-all duration-150 ${inp.gender === o.v ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Age / Weight / Height */}
            <div className="grid grid-cols-3 gap-3">
              <NumInput label="Возраст" value={inp.age} onChange={(v) => setInp((p) => ({ ...p, age: v }))} placeholder="30" unit="лет" />
              <NumInput label="Вес" value={inp.weight} onChange={(v) => setInp((p) => ({ ...p, weight: v }))} placeholder="70" unit="кг" />
              <NumInput label="Рост" value={inp.height} onChange={(v) => setInp((p) => ({ ...p, height: v }))} placeholder="170" unit="см" />
            </div>

            {/* Activity */}
            <RadioGroup
              label="Активность"
              value={inp.activity}
              onChange={(v) => setInp((p) => ({ ...p, activity: v }))}
              options={[
                { v: "sedentary", label: "Сидячий образ жизни", sub: "×1.2" },
                { v: "light", label: "1–3 тренировки в неделю", sub: "×1.375" },
                { v: "moderate", label: "3–5 тренировок в неделю", sub: "×1.55" },
                { v: "active", label: "Ежедневные тренировки", sub: "×1.725" },
                { v: "veryactive", label: "Интенсивный спорт/работа", sub: "×1.9" },
              ]}
            />

            {/* Goal */}
            <RadioGroup
              label="Цель"
              value={inp.goal}
              onChange={(v) => setInp((p) => ({ ...p, goal: v }))}
              options={[
                { v: "loss", label: "Похудение", sub: "−500 ккал" },
                { v: "softloss", label: "Мягкое похудение", sub: "−250 ккал" },
                { v: "maintain", label: "Поддержание веса", sub: "±0 ккал" },
                { v: "gain", label: "Набор мышечной массы", sub: "+250 ккал" },
                { v: "fastgain", label: "Быстрый набор", sub: "+500 ккал" },
              ]}
            />

            {calcError && (
              <p className="text-red-500 text-xs flex items-center gap-1">
                <Icon name="AlertCircle" size={13} /> {calcError}
              </p>
            )}

            <button
              onClick={handleCalc}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-bold text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-sm"
            >
              <Icon name="Zap" size={16} className="text-white" />
              Рассчитать
            </button>
          </div>

          {/* RIGHT — Result */}
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

                {/* Ask AI button */}
                <button
                  onClick={() => setChatOpen(true)}
                  className="w-full py-3 rounded-xl border-2 border-emerald-500 text-emerald-600 font-bold text-sm hover:bg-emerald-50 transition-all duration-150 flex items-center justify-center gap-2"
                >
                  <Icon name="Bot" size={16} />
                  Спросить AI-диетолога
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── How it works ── */}
        <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-700 text-sm mb-4 flex items-center gap-2">
            <Icon name="Info" size={15} className="text-blue-400" />
            Как это работает?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-gray-500">
            <div className="flex flex-col gap-1">
              <span className="font-bold text-gray-700 text-sm">① BMR</span>
              <p>Базовый обмен — калории, которые организм тратит в полном покое. Считается по формуле Миффлина-Сан Жеора с учётом пола, возраста, веса и роста.</p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-bold text-gray-700 text-sm">② TDEE</span>
              <p>Суточный расход с учётом активности. BMR умножается на коэффициент от 1.2 (сидячий) до 1.9 (очень активный). Это реальная потребность в калориях.</p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-bold text-gray-700 text-sm">③ Цель + БЖУ</span>
              <p>К TDEE прибавляется или вычитается коррекция на цель. Белок — 2 г/кг веса, жиры — 25% калорий, остаток — углеводы.</p>
            </div>
          </div>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-100 bg-white mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
          <span>© 2026 AI Calorie Assistant</span>
          <a href="#" className="hover:text-gray-600 transition-colors">Политика конфиденциальности</a>
        </div>
      </footer>

      {/* ── AI CHAT WIDGET ── */}
      {/* Toggle button */}
      <button
        onClick={() => setChatOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 w-13 h-13 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
        style={{ width: 52, height: 52 }}
        aria-label="Открыть AI-чат"
      >
        {chatOpen
          ? <Icon name="X" size={20} className="text-white" />
          : <Icon name="Bot" size={22} className="text-white" />
        }
        {!chatOpen && (
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400 border-2 border-white" />
        )}
      </button>

      {/* Chat panel */}
      {chatOpen && (
        <div
          className="fixed bottom-20 right-5 z-50 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          style={{ maxHeight: "70vh", animation: "chatSlideUp 0.2s ease" }}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-emerald-500 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Icon name="Bot" size={17} className="text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">AI-диетолог</div>
              <div className="text-emerald-100 text-xs flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-300" />
                Онлайн
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} className="ml-auto text-white/70 hover:text-white transition-colors">
              <Icon name="Minimize2" size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50" style={{ minHeight: 220, maxHeight: 340 }}>
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                {m.role === "ai" && (
                  <div className="w-7 h-7 rounded-full bg-emerald-500 flex-shrink-0 flex items-center justify-center">
                    <Icon name="Bot" size={13} className="text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${m.role === "ai"
                    ? "bg-white text-gray-700 rounded-tl-sm shadow-sm border border-gray-100"
                    : "bg-emerald-500 text-white rounded-tr-sm"}`}
                >
                  {m.text}
                  <div className={`text-xs mt-1 ${m.role === "ai" ? "text-gray-300" : "text-white/60"}`}>{m.time}</div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-500 flex-shrink-0 flex items-center justify-center">
                  <Icon name="Bot" size={13} className="text-white" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2.5 shadow-sm border border-gray-100 flex items-center gap-1">
                  {[0, 1, 2].map((j) => (
                    <div key={j} className="w-1.5 h-1.5 rounded-full bg-gray-400"
                      style={{ animation: `chatDot 1.2s ease-in-out ${j * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick hints */}
          <div className="px-3 pt-2 pb-1 bg-gray-50 flex flex-wrap gap-1.5 border-t border-gray-100">
            {["Норма белка?", "Как худеть?", "Сколько воды?", "Что есть утром?"].map((h) => (
              <button key={h} onClick={() => setChatInput(h)}
                className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 hover:border-emerald-400 hover:text-emerald-600 transition-all bg-white">
                {h}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input
              ref={chatInputRef}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMsg()}
              placeholder="Задай вопрос о питании..."
              className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all text-gray-800 placeholder-gray-300"
            />
            <button
              onClick={sendMsg}
              disabled={!chatInput.trim() || isTyping}
              className="w-9 h-9 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 flex items-center justify-center transition-all flex-shrink-0"
            >
              <Icon name="Send" size={14} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
