import { useState } from "react";
import Icon from "@/components/ui/icon";

interface AuthPageProps {
  onLogin: (email: string, password: string) => Promise<string | null>;
  onRegister: (email: string, password: string, name: string) => Promise<string | null>;
}

export default function AuthPage({ onLogin, onRegister }: AuthPageProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const err = mode === "login"
      ? await onLogin(email, password)
      : await onRegister(email, password, name);
    if (err) setError(err);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm">
            <Icon name="Flame" size={20} className="text-white" />
          </div>
          <div className="font-bold text-gray-900 text-xl">AI Calorie Assistant</div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1 text-center">
            {mode === "login" ? "Войти в аккаунт" : "Создать аккаунт"}
          </h2>
          <p className="text-sm text-gray-400 text-center mb-6">
            {mode === "login"
              ? "Введи email и пароль для входа"
              : "Заполни данные для регистрации"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Имя</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Как тебя зовут?"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all text-gray-800 placeholder-gray-300"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all text-gray-800 placeholder-gray-300"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "register" ? "Минимум 6 символов" : "Введи пароль"}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all text-gray-800 placeholder-gray-300"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                <Icon name="AlertCircle" size={14} className="text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-600">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              {loading
                ? <><Icon name="Loader2" size={16} className="animate-spin text-white" /> Загрузка...</>
                : mode === "login" ? "Войти" : "Зарегистрироваться"}
            </button>
          </form>

          <div className="mt-5 text-center">
            <span className="text-sm text-gray-400">
              {mode === "login" ? "Нет аккаунта? " : "Уже есть аккаунт? "}
            </span>
            <button
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
              className="text-sm text-emerald-600 font-semibold hover:text-emerald-700 transition-colors"
            >
              {mode === "login" ? "Зарегистрироваться" : "Войти"}
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          Данные хранятся в защищённой базе данных
        </p>
      </div>
    </div>
  );
}
