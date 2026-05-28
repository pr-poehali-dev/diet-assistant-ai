import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { ChatMessage, CalcInput, CalcResult, AI_CHAT_URL, QUICK_QUESTIONS, getTime } from "./calcTypes";

interface AiChatProps {
  inp: CalcInput;
  result: CalcResult | null;
  autoAnalyze?: boolean;
  onAutoAnalyzeDone?: () => void;
}

export default function AiChat({ inp, result, autoAnalyze, onAutoAnalyzeDone }: AiChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "ai", text: "Привет! Я AI-диетолог. Задай любой вопрос о питании, калориях или тренировках.", time: getTime() },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const autoAnalyzedRef = useRef(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (autoAnalyze && result && !autoAnalyzedRef.current) {
      autoAnalyzedRef.current = true;
      sendMsg("Расчёт готов. Проанализируй мои параметры и дай конкретные рекомендации по питанию, режиму дня и продуктам, которые помогут достичь моей цели.", true);
      onAutoAnalyzeDone?.();
    }
  }, [autoAnalyze, result]);

  async function sendMsg(overrideText?: string, silent?: boolean) {
    const text = (overrideText ?? chatInput).trim();
    if (!text || isTyping) return;
    const newMsg: ChatMessage = { role: "user", text, time: getTime() };
    const updatedMessages = [...messages, newMsg];
    if (!silent) setMessages(updatedMessages);
    else setMessages(updatedMessages);
    setChatInput("");
    setIsTyping(true);

    const userContext = result ? {
      gender: inp.gender, age: inp.age, weight: inp.weight, height: inp.height,
      goal: inp.goal, target: result.target, protein: result.protein,
      fat: result.fat, carbs: result.carbs, bmr: result.bmr, tdee: result.tdee,
      conditions: inp.conditions, medications: inp.medications,
      bodyFat: inp.bodyFat, adjustmentNote: result.adjustmentNote,
    } : {};

    try {
      const res = await fetch(AI_CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages.slice(-10), userContext }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "ai", text: data.reply ?? "Нет ответа от AI.", time: getTime() }]);
    } catch {
      setMessages((prev) => [...prev, { role: "ai", text: "AI временно недоступен. Попробуй позже.", time: getTime() }]);
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden" style={{ height: 520 }}>
      {/* Header */}
      <div className="px-4 py-3 bg-emerald-500 flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
          <Icon name="Bot" size={19} className="text-white" />
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
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            {m.role === "ai" && (
              <div className="w-7 h-7 rounded-full bg-emerald-500 flex-shrink-0 flex items-center justify-center mt-0.5">
                <Icon name="Bot" size={13} className="text-white" />
              </div>
            )}
            <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${m.role === "ai"
              ? "bg-white text-gray-700 rounded-tl-sm shadow-sm border border-gray-100"
              : "bg-emerald-500 text-white rounded-tr-sm"}`}
            >
              <p className="whitespace-pre-wrap">{m.text}</p>
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

      {/* Quick questions */}
      <div className="px-3 pt-2 pb-1.5 bg-white flex flex-wrap gap-1.5 border-t border-gray-100 flex-shrink-0">
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
      <div className="p-3 bg-white border-t border-gray-100 flex gap-2 flex-shrink-0">
        <input
          ref={chatInputRef}
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMsg()}
          placeholder="Задай вопрос о питании..."
          className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all text-gray-800 placeholder-gray-300"
        />
        <button
          onClick={() => sendMsg()}
          disabled={!chatInput.trim() || isTyping}
          className="w-9 h-9 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 flex items-center justify-center transition-all flex-shrink-0"
        >
          <Icon name="Send" size={14} className="text-white" />
        </button>
      </div>
    </div>
  );
}
