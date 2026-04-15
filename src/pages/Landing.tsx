import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const WHY_CARDS = [
  {
    icon: "Target",
    color: "bg-emerald-100 text-emerald-600",
    title: "Точный расчёт",
    text: "Формула Миффлина-Сан Жеора с учётом пола, возраста, активности и твоей цели. Никаких приблизительных данных.",
  },
  {
    icon: "Bot",
    color: "bg-blue-100 text-blue-600",
    title: "AI-помощник 24/7",
    text: "Отвечает на вопросы о питании, помогает заменить продукты, корректирует план — без стресса и запретов.",
  },
  {
    icon: "LayoutDashboard",
    color: "bg-violet-100 text-violet-600",
    title: "Всё в одном месте",
    text: "Калькулятор + дневник питания + аналитика. Работает без регистрации, данные хранятся у тебя в браузере.",
  },
];

const STEPS = [
  {
    num: "01",
    icon: "ClipboardList",
    title: "Введи параметры",
    text: "Рост, вес, возраст, пол, уровень активности и твою цель — похудение, набор или поддержание.",
  },
  {
    num: "02",
    icon: "BarChart3",
    title: "Получи расчёт",
    text: "Мгновенно узнаёшь свою норму калорий, БЖУ, индекс массы тела и идеальный вес.",
  },
  {
    num: "03",
    icon: "MessageCircle",
    title: "Общайся с AI",
    text: "Задавай любые вопросы, получай советы по рациону, записывай приёмы пищи в дневник.",
  },
];

// ── Hero illustration (inline SVG) ─────────────────────────────────────────
function HeroIllustration() {
  return (
    <svg viewBox="0 0 420 340" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-md mx-auto">
      {/* Background circle */}
      <circle cx="210" cy="170" r="150" fill="#f0fdf4" />
      <circle cx="210" cy="170" r="120" fill="#dcfce7" opacity="0.6" />

      {/* Phone */}
      <rect x="160" y="80" width="100" height="170" rx="16" fill="white" stroke="#e5e7eb" strokeWidth="2" />
      <rect x="168" y="95" width="84" height="110" rx="8" fill="#f9fafb" />
      {/* Screen content */}
      <rect x="176" y="103" width="68" height="8" rx="4" fill="#d1fae5" />
      <rect x="176" y="118" width="50" height="6" rx="3" fill="#e5e7eb" />
      <rect x="176" y="130" width="60" height="6" rx="3" fill="#e5e7eb" />
      <rect x="176" y="142" width="45" height="6" rx="3" fill="#e5e7eb" />
      {/* Progress bar */}
      <rect x="176" y="158" width="68" height="8" rx="4" fill="#f3f4f6" />
      <rect x="176" y="158" width="44" height="8" rx="4" fill="#10b981" />
      {/* Calories number */}
      <text x="200" y="186" fontSize="12" fontWeight="700" fill="#111827" textAnchor="middle">1850 ккал</text>

      {/* Home indicator */}
      <rect x="198" y="236" width="24" height="3" rx="2" fill="#d1d5db" />

      {/* Floating food items */}
      {/* Avocado */}
      <ellipse cx="120" cy="130" rx="22" ry="28" fill="#86efac" />
      <ellipse cx="120" cy="132" rx="13" ry="18" fill="#4ade80" />
      <ellipse cx="120" cy="136" rx="7" ry="10" fill="#92400e" />

      {/* Apple */}
      <ellipse cx="310" cy="120" rx="20" ry="22" fill="#f87171" />
      <rect x="308" y="96" width="4" height="8" rx="2" fill="#78716c" />
      <path d="M312 100 Q320 95 318 103" stroke="#4ade80" strokeWidth="2" fill="none" />

      {/* Salad bowl */}
      <ellipse cx="310" cy="230" rx="30" ry="12" fill="#bbf7d0" />
      <ellipse cx="310" cy="224" rx="28" ry="10" fill="#86efac" />
      <circle cx="302" cy="220" r="5" fill="#fde68a" />
      <circle cx="316" cy="218" r="4" fill="#fca5a5" />
      <circle cx="308" cy="215" r="3" fill="#a3e635" />

      {/* Blueberries */}
      <circle cx="110" cy="230" r="8" fill="#818cf8" />
      <circle cx="126" cy="225" r="6" fill="#818cf8" />
      <circle cx="118" cy="218" r="7" fill="#6366f1" />

      {/* AI sparkles */}
      <g opacity="0.8">
        <path d="M350 80 L353 88 L361 91 L353 94 L350 102 L347 94 L339 91 L347 88 Z" fill="#10b981" />
        <path d="M75 180 L77 185 L82 187 L77 189 L75 194 L73 189 L68 187 L73 185 Z" fill="#3b82f6" />
        <path d="M355 180 L356.5 184 L360.5 185.5 L356.5 187 L355 191 L353.5 187 L349.5 185.5 L353.5 184 Z" fill="#f59e0b" />
      </g>

      {/* Chat bubble */}
      <rect x="60" y="85" width="85" height="36" rx="12" fill="white" stroke="#e5e7eb" strokeWidth="1.5" />
      <path d="M95 121 L90 130 L100 121" fill="white" stroke="#e5e7eb" strokeWidth="1.5" />
      <text x="102" y="99" fontSize="8" fill="#10b981" fontWeight="700" textAnchor="middle">AI-диетолог</text>
      <text x="102" y="112" fontSize="7" fill="#6b7280" textAnchor="middle">Чем помочь? 👋</text>
    </svg>
  );
}

// ── Landing ─────────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate();

  function goToCalc() {
    navigate("/app");
  }

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm">
              <Icon name="Flame" size={16} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm leading-none">AI Calorie Assistant</div>
              <div className="text-xs text-emerald-500 font-medium">Еда с умом</div>
            </div>
          </div>
          <button
            onClick={goToCalc}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold shadow-sm transition-all hover:shadow-md active:scale-95">
            <Icon name="Calculator" size={15} className="text-white" />
            Калькулятор
          </button>
        </div>
      </header>

      {/* ══ HERO ════════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 pt-16 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold mb-6">
            <Icon name="Sparkles" size={12} />
            Бесплатно · Без регистрации
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 leading-tight mb-5">
            Еда — это не враг.<br />
            <span className="text-emerald-500">Поможем подружиться.</span>
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed mb-8 max-w-xl">
            Мы создали AI-диетолога, который считает калории, анализирует рацион и даёт советы — без стресса и жёстких запретов.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <button
              onClick={goToCalc}
              className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-base shadow-lg shadow-emerald-200 transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0">
              <Icon name="Calculator" size={18} className="text-white" />
              Рассчитать норму калорий
            </button>
            <button
              onClick={() => navigate("/app?tab=dashboard")}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold text-base hover:border-emerald-300 hover:text-emerald-600 transition-all">
              <Icon name="BookOpen" size={17} />
              Вести дневник
            </button>
          </div>
          <p className="mt-4 text-xs text-gray-400 flex items-center gap-1.5 justify-center lg:justify-start">
            <Icon name="ShieldCheck" size={12} className="text-emerald-400" />
            Данные хранятся только у вас в браузере
          </p>
        </div>

        <div className="flex items-center justify-center">
          <HeroIllustration />
        </div>
      </section>

      {/* ══ WHY US ══════════════════════════════════════════════════════════ */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">Почему мы?</h2>
            <p className="text-gray-500 text-base max-w-lg mx-auto">Всё, что нужно для осознанного питания — в одном месте</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {WHY_CARDS.map((c) => (
              <div key={c.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-200">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${c.color}`}>
                  <Icon name={c.icon as Parameters<typeof Icon>[0]["name"]} size={22} />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{c.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ════════════════════════════════════════════════════ */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">Как это работает</h2>
            <p className="text-gray-500 text-base max-w-lg mx-auto">Три шага до персонального плана питания</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden sm:block absolute top-8 left-[calc(16.7%+20px)] right-[calc(16.7%+20px)] h-px bg-emerald-100 z-0" />

            {STEPS.map((s, i) => (
              <div key={s.num} className="relative flex flex-col items-center text-center z-10">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center mb-4 shadow-lg shadow-emerald-200">
                  <Icon name={s.icon as Parameters<typeof Icon>[0]["name"]} size={26} className="text-white" />
                </div>
                <div className="absolute -top-2 -right-2 sm:static sm:hidden w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-black flex items-center justify-center">
                  {i + 1}
                </div>
                <div className="font-black text-5xl text-gray-100 absolute top-0 left-1/2 -translate-x-1/2 -z-10 leading-none select-none hidden sm:block">
                  {s.num}
                </div>
                <h3 className="font-bold text-gray-900 text-xl mb-2 mt-1">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ STATS STRIP ══════════════════════════════════════════════════════ */}
      <section className="bg-emerald-500 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-white">
            {[
              { num: "100%", label: "Бесплатно" },
              { num: "AI", label: "Диетолог 24/7" },
              { num: "0", label: "Регистраций" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-4xl font-black mb-1">{s.num}</div>
                <div className="text-emerald-100 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ══════════════════════════════════════════════════════════════ */}
      <section className="py-24 text-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <Icon name="Zap" size={28} className="text-emerald-500" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
            Начни прямо сейчас
          </h2>
          <p className="text-gray-500 text-lg mb-8">
            Узнай свою норму калорий за 30 секунд и получи персональный план от AI-диетолога.
          </p>
          <button
            onClick={goToCalc}
            className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg shadow-xl shadow-emerald-200 transition-all hover:shadow-2xl hover:-translate-y-1 active:translate-y-0">
            <Icon name="Calculator" size={22} className="text-white" />
            Перейти к калькулятору
          </button>
          <p className="mt-4 text-sm text-gray-400">Это бесплатно и не требует регистрации</p>
        </div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════════════════════ */}
      <footer className="border-t border-gray-100 py-8 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center">
              <Icon name="Flame" size={11} className="text-white" />
            </div>
            <span>© 2025 AI Calorie Assistant</span>
          </div>
          <div className="flex items-center gap-5">
            <button onClick={goToCalc} className="hover:text-gray-600 transition-colors">Калькулятор</button>
            <button onClick={goToCalc} className="hover:text-gray-600 transition-colors">Дневник питания</button>
            <a href="#" className="hover:text-gray-600 transition-colors">Политика конфиденциальности</a>
          </div>
        </div>
      </footer>
    </div>
  );
}