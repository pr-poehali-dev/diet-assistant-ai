import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { CalcResult as CalcResultType, CalcInput, ChatMessage, AI_CHAT_URL, QUICK_QUESTIONS, getTime } from "./calcTypes";

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

// ─── InlineChat ───────────────────────────────────────────────────────────────
function InlineChat({ inp, result, autoAnalyze, onAutoAnalyzeDone }: {
  inp: CalcInput;
  result: CalcResultType;
  autoAnalyze?: boolean;
  onAutoAnalyzeDone?: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autoTriggeredRef = useRef(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (autoAnalyze && !autoTriggeredRef.current) {
      autoTriggeredRef.current = true;
      onAutoAnalyzeDone?.();
      sendMsg("Расчёт готов. Дай конкретные рекомендации по питанию, продуктам и режиму дня для достижения моей цели.", true);
    }
  }, [autoAnalyze]);

  async function sendMsg(text: string, auto?: boolean) {
    if (!text.trim() || isTyping) return;
    const userMsg: ChatMessage = { role: "user", text: text.trim(), time: getTime() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    if (!auto) setChatInput("");
    setIsTyping(true);

    const userContext = {
      gender: inp.gender, age: inp.age, weight: inp.weight, height: inp.height,
      goal: inp.goal, target: result.target, protein: result.protein,
      fat: result.fat, carbs: result.carbs, bmr: result.bmr, tdee: result.tdee,
      conditions: inp.conditions, medications: inp.medications,
      bodyFat: inp.bodyFat, adjustmentNote: result.adjustmentNote,
    };

    try {
      const res = await fetch(AI_CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated.slice(-10), userContext }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "ai", text: data.reply ?? "Нет ответа.", time: getTime() }]);
    } catch {
      setMessages((prev) => [...prev, { role: "ai", text: "AI временно недоступен. Попробуй позже.", time: getTime() }]);
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-emerald-500 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
          <Icon name="Bot" size={17} className="text-white" />
        </div>
        <div>
          <div className="text-white font-bold text-sm">AI-диетолог</div>
          <div className="text-emerald-100 text-xs flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-300" />
            {isTyping ? "Печатает..." : "Онлайн"}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="p-4 space-y-3 bg-gray-50 max-h-72 overflow-y-auto">
        {messages.length === 0 && !isTyping && (
          <p className="text-xs text-gray-400 text-center py-2">Анализирую ваши данные...</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            {m.role === "ai" && (
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex-shrink-0 flex items-center justify-center mt-0.5">
                <Icon name="Bot" size={11} className="text-white" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${m.role === "ai"
              ? "bg-white text-gray-700 rounded-tl-sm shadow-sm border border-gray-100"
              : "bg-emerald-500 text-white rounded-tr-sm"}`}
            >
              <p className="whitespace-pre-wrap text-xs">{m.text}</p>
              <div className={`text-xs mt-1 ${m.role === "ai" ? "text-gray-300" : "text-white/60"}`}>{m.time}</div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-500 flex-shrink-0 flex items-center justify-center">
              <Icon name="Bot" size={11} className="text-white" />
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

      {/* Quick questions */}
      <div className="px-3 pt-2 pb-1.5 bg-white flex flex-wrap gap-1.5 border-t border-gray-100">
        {QUICK_QUESTIONS.map((q) => (
          <button key={q}
            onClick={() => sendMsg(q)}
            disabled={isTyping}
            className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-40 transition-all bg-white">
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
        <input
          ref={inputRef}
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMsg(chatInput)}
          placeholder="Задай вопрос о питании..."
          className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all text-gray-800 placeholder-gray-300"
        />
        <button
          onClick={() => sendMsg(chatInput)}
          disabled={!chatInput.trim() || isTyping}
          className="w-9 h-9 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 flex items-center justify-center transition-all flex-shrink-0"
        >
          <Icon name="Send" size={14} className="text-white" />
        </button>
      </div>
    </div>
  );
}

// ─── CalcResult ───────────────────────────────────────────────────────────────
interface CalcResultProps {
  result: CalcResultType | null;
  inp: CalcInput;
  onGoToDashboard: () => void;
  autoAnalyze?: boolean;
  onAutoAnalyzeDone?: () => void;
}

export default function CalcResult({ result, inp, onGoToDashboard, autoAnalyze, onAutoAnalyzeDone }: CalcResultProps) {
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

          {/* Adjustment notes */}
          {result.adjustmentNote && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex gap-2.5">
              <Icon name="Info" size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-700 mb-1">Персональные корректировки</p>
                <p className="text-xs text-amber-600 leading-relaxed">{result.adjustmentNote}</p>
              </div>
            </div>
          )}

          {/* Inline AI chat */}
          <InlineChat
            inp={inp}
            result={result}
            autoAnalyze={autoAnalyze}
            onAutoAnalyzeDone={onAutoAnalyzeDone}
          />

          {/* Dashboard button */}
          <button
            onClick={onGoToDashboard}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all duration-150 flex items-center justify-center gap-2"
          >
            <Icon name="BookOpen" size={16} className="text-white" />
            Перейти в дневник питания
          </button>
        </>
      )}
    </div>
  );
}
