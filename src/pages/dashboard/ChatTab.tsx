import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { UserProfile, AI_CHAT_URL } from "./dashboardTypes";

interface Message {
  role: "user" | "ai";
  text: string;
  time: string;
}

interface ChatTabProps {
  profile: UserProfile;
}

function getTime() {
  return new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
}

const QUICK = [
  "Что поесть на завтрак?",
  "Как добрать белок?",
  "Что есть при похудении?",
  "Сколько пить воды?",
  "Полезный перекус?",
  "Как ускорить метаболизм?",
];

export default function ChatTab({ profile }: ChatTabProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: profile.name
        ? `Привет, ${profile.name}! Я твой AI-диетолог на базе Llama 3.3. Задай любой вопрос о питании, калориях или здоровом образе жизни — отвечу быстро и по делу.`
        : "Привет! Я твой AI-диетолог на базе Llama 3.3. Задай любой вопрос о питании, калориях или здоровом образе жизни.",
      time: getTime(),
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  async function send(override?: string) {
    const text = (override ?? input).trim();
    if (!text || typing) return;

    const userMsg: Message = { role: "user", text, time: getTime() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setTyping(true);

    const userContext: Record<string, unknown> = {};
    if (profile.dailyCalories) userContext.target = profile.dailyCalories;
    if (profile.proteinTarget) userContext.protein = profile.proteinTarget;
    if (profile.fatTarget) userContext.fat = profile.fatTarget;
    if (profile.carbsTarget) userContext.carbs = profile.carbsTarget;
    if (profile.gender) userContext.gender = profile.gender;
    if (profile.age) userContext.age = profile.age;
    if (profile.weight) userContext.weight = profile.weight;
    if (profile.height) userContext.height = profile.height;
    if (profile.goal) userContext.goal = profile.goal;
    if (profile.conditions?.length) userContext.conditions = profile.conditions;
    if (profile.medications?.length) userContext.medications = profile.medications;

    try {
      const res = await fetch(AI_CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated.slice(-12),
          userContext,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "ai", text: data.reply ?? "Нет ответа.", time: getTime() }]);
    } catch {
      setMessages((prev) => [...prev, { role: "ai", text: "Не удалось получить ответ. Проверь соединение.", time: getTime() }]);
    }
    setTyping(false);
  }

  function clearChat() {
    setMessages([{
      role: "ai",
      text: "Чат очищен. Задай новый вопрос!",
      time: getTime(),
    }]);
  }

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ height: "calc(100vh - 220px)", minHeight: 480 }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
          <Icon name="Bot" size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <div className="text-white font-bold text-sm">AI-диетолог</div>
          <div className="text-emerald-100 text-xs flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-300" />
            {typing ? "Печатает..." : "Llama 3.3 · Онлайн"}
          </div>
        </div>
        <button onClick={clearChat} className="text-white/60 hover:text-white transition-colors p-1" title="Очистить чат">
          <Icon name="Trash2" size={15} />
        </button>
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
            <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
              m.role === "ai"
                ? "bg-white text-gray-700 rounded-tl-sm shadow-sm border border-gray-100"
                : "bg-emerald-500 text-white rounded-tr-sm"
            }`}>
              <p className="whitespace-pre-wrap">{m.text}</p>
              <div className={`text-xs mt-1 ${m.role === "ai" ? "text-gray-300" : "text-emerald-100"}`}>{m.time}</div>
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-500 flex-shrink-0 flex items-center justify-center">
              <Icon name="Bot" size={13} className="text-white" />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100 flex items-center gap-1">
              {[0, 1, 2].map((j) => (
                <div key={j} className="w-2 h-2 rounded-full bg-emerald-300"
                  style={{ animation: `bounce 1.2s ease-in-out ${j * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick questions */}
      <div className="px-3 pt-2.5 pb-2 bg-white border-t border-gray-100 flex-shrink-0">
        <div className="flex flex-wrap gap-1.5">
          {QUICK.map((q) => (
            <button key={q} onClick={() => send(q)} disabled={typing}
              className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-40 transition-all bg-white whitespace-nowrap">
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-gray-100 flex gap-2 flex-shrink-0">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Задай вопрос о питании..."
          disabled={typing}
          className="flex-1 rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all text-gray-800 placeholder-gray-300 disabled:opacity-60"
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || typing}
          className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 flex items-center justify-center transition-all flex-shrink-0 shadow-sm"
        >
          <Icon name="Send" size={15} className="text-white" />
        </button>
      </div>
    </div>
  );
}
