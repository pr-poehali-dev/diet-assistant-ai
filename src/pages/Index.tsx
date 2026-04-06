import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

type CalcInput = { age: string; weight: string; height: string; gender: string; activity: string; goal: string; };
type CalcResult = { bmr: number; tdee: number; target: number; protein: number; fat: number; carbs: number; bmi: number; idealWeight: number; water: number; };

function calcCalories(inp: CalcInput): CalcResult | null {
  const age = parseFloat(inp.age), w = parseFloat(inp.weight), h = parseFloat(inp.height);
  if (!age || !w || !h) return null;
  const bmr = inp.gender === "male"
    ? 10 * w + 6.25 * h - 5 * age + 5
    : 10 * w + 6.25 * h - 5 * age - 161;
  const actMap: Record<string, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, veryactive: 1.9 };
  const tdee = Math.round(bmr * (actMap[inp.activity] ?? 1.375));
  const goalMap: Record<string, number> = { loss: -500, softloss: -250, maintain: 0, gain: 250, fastgain: 500 };
  const target = tdee + (goalMap[inp.goal] ?? 0);
  const protein = Math.round(w * 2.0);
  const fat = Math.round((target * 0.25) / 9);
  const carbs = Math.round((target - protein * 4 - fat * 9) / 4);
  const bmi = Math.round((w / ((h / 100) ** 2)) * 10) / 10;
  const idealWeight = inp.gender === "male" ? Math.round(50 + 0.91 * (h - 152.4)) : Math.round(45.5 + 0.91 * (h - 152.4));
  const water = Math.round(w * 35);
  return { bmr: Math.round(bmr), tdee, target, protein, fat, carbs, bmi, idealWeight, water };
}

const HERO_IMAGE = "https://cdn.poehali.dev/projects/9d3d81c9-90d3-41a8-8ade-c77a796fe46d/files/950827a8-2658-41cc-8978-1de8fa431049.jpg";

const NAV_LINKS = [
  { label: "Главная", href: "#hero" },
  { label: "Преимущества", href: "#advantages" },
  { label: "Калькулятор", href: "#calculator" },
  { label: "Отзывы", href: "#reviews" },
  { label: "Контакты", href: "#contacts" },
];

const ADVANTAGES = [
  { icon: "Zap", title: "Молниеносно", text: "Запускаем проект за 24 часа. Никаких долгих согласований — только результат." },
  { icon: "Shield", title: "Надёжно", text: "Гарантия качества на все работы. Прозрачный договор и чёткие сроки." },
  { icon: "TrendingUp", title: "Эффективно", text: "Каждое решение измеримо. Ваш рост — наша главная метрика." },
  { icon: "Headphones", title: "Поддержка 24/7", text: "Всегда на связи. Решаем вопросы в течение часа в любое время суток." },
  { icon: "Star", title: "Топовое качество", text: "Только лучшие специалисты с опытом 5+ лет работают над вашим проектом." },
  { icon: "Layers", title: "Комплексный подход", text: "Берём на себя всё — от стратегии до реализации и аналитики." },
];

const REVIEWS = [
  { name: "Алексей М.", role: "CEO, TechStart", text: "Результат превзошёл все ожидания. За 2 недели получили полноценный продукт, который раньше делали бы месяц. Команда реально погружается в задачу.", rating: 5 },
  { name: "Мария К.", role: "Маркетолог", text: "Наконец-то нашла подрядчика, который говорит на языке бизнеса, а не технарей. Всё чётко, понятно и в срок. Рекомендую без оговорок!", rating: 5 },
  { name: "Дмитрий С.", role: "Основатель, E-com", text: "Работаем уже третий проект вместе. Каждый раз удивляют скоростью и вниманием к деталям. Это тот редкий случай, когда партнёр думает о твоём бизнесе.", rating: 5 },
];

const AI_RESPONSES: Record<string, string> = {
  default: "Привет! Я ИИ-консультант. Спросите меня о наших услугах, ценах или сроках — с удовольствием помогу!",
  цена: "Стоимость зависит от объёма задачи. Базовый пакет — от 15 000 ₽, стандарт — от 45 000 ₽, премиум — от 90 000 ₽. Используйте калькулятор на сайте для точного расчёта.",
  срок: "Стандартные сроки: базовый проект — 3-5 дней, стандарт — 1-2 недели, крупные проекты — 3-4 недели. При необходимости — срочный выпуск за доп. плату.",
  гарантия: "Даём гарантию 12 месяцев на все работы. Если что-то пойдёт не так — бесплатно исправим в рамках ТЗ.",
  контакт: "Свяжитесь с нами: телефон +7 (999) 123-45-67, email hello@example.ru или заполните форму ниже — ответим в течение 15 минут.",
  привет: "Привет! Рад видеть вас. Чем могу помочь? Расскажите о вашей задаче — подберём оптимальное решение.",
  услуг: "Мы предлагаем: разработку сайтов и приложений, настройку рекламы, SEO-продвижение, дизайн и брендинг, автоматизацию бизнес-процессов.",
};

function getAIResponse(message: string): string {
  const lower = message.toLowerCase();
  for (const key of Object.keys(AI_RESPONSES)) {
    if (key !== "default" && lower.includes(key)) return AI_RESPONSES[key];
  }
  return AI_RESPONSES.default;
}

interface ChatMessage {
  role: "user" | "ai";
  text: string;
  time: string;
}

function getTime() {
  return new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
}

const Index = () => {
  const [calcInput, setCalcInput] = useState<CalcInput>({ age: "", weight: "", height: "", gender: "female", activity: "moderate", goal: "maintain" });
  const [calcResult, setCalcResult] = useState<CalcResult | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "ai", text: AI_RESPONSES.default, time: getTime() },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [contactForm, setContactForm] = useState({ name: "", phone: "", email: "" });
  const [navOpen, setNavOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isTyping]);

  function handleCalc() {
    setCalcResult(calcCalories(calcInput));
  }

  function sendMessage() {
    const text = chatInput.trim();
    if (!text) return;
    const userMsg: ChatMessage = { role: "user", text, time: getTime() };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setChatMessages((prev) => [...prev, { role: "ai", text: getAIResponse(text), time: getTime() }]);
    }, 1200 + Math.random() * 800);
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--dark-bg)" }}>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <div className="font-display text-xl font-bold gradient-text tracking-wider">ЛОГОТИП</div>
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="text-sm text-white/60 hover:text-white transition-colors duration-200">
                {l.label}
              </a>
            ))}
          </div>
          <a href="#contacts" className="hidden md:block btn-neon px-5 py-2 rounded-full text-sm font-bold">
            Оставить заявку
          </a>
          <button className="md:hidden text-white/70" onClick={() => setNavOpen(!navOpen)}>
            <Icon name={navOpen ? "X" : "Menu"} size={24} />
          </button>
        </div>
        {navOpen && (
          <div className="md:hidden glass border-t border-white/5 px-4 py-4 flex flex-col gap-4">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setNavOpen(false)} className="text-white/70 hover:text-white py-1">
                {l.label}
              </a>
            ))}
            <a href="#contacts" onClick={() => setNavOpen(false)} className="btn-neon text-center py-2 rounded-full text-sm font-bold">
              Оставить заявку
            </a>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section id="hero" className="relative min-h-screen flex items-center overflow-hidden grid-bg">
        <div className="orb" style={{ width: 500, height: 500, background: "rgba(0,229,255,0.12)", top: "10%", left: "-10%" }} />
        <div className="orb" style={{ width: 400, height: 400, background: "rgba(168,85,247,0.12)", bottom: "5%", right: "-5%", animationDelay: "3s" }} />
        <div className="absolute inset-0">
          <img src={HERO_IMAGE} alt="Hero" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, var(--dark-bg) 40%, transparent 80%), linear-gradient(to top, var(--dark-bg) 10%, transparent 50%)" }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pt-24 pb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-xs font-medium mb-6 animate-fade-up" style={{ color: "var(--neon-cyan)" }}>
              <div className="w-2 h-2 rounded-full animate-pulse-glow" style={{ background: "var(--neon-cyan)" }} />
              Новый уровень эффективности
            </div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6 animate-fade-up-delay-1">
              Ваш бизнес<br />
              <span className="gradient-text">на новой высоте</span>
            </h1>
            <p className="text-lg text-white/60 mb-8 leading-relaxed animate-fade-up-delay-2">
              Профессиональные решения для роста вашего дела. Быстро, надёжно, с гарантией результата.
              Уже более 500 клиентов доверились нам.
            </p>
            <div className="flex flex-wrap gap-4 animate-fade-up-delay-3">
              <a href="#contacts" className="btn-neon px-8 py-4 rounded-2xl text-base font-bold flex items-center gap-2">
                Начать сейчас
                <Icon name="ArrowRight" size={18} />
              </a>
              <a href="#calculator" className="btn-outline-neon px-8 py-4 rounded-2xl text-base font-bold flex items-center gap-2">
                <Icon name="Calculator" size={18} />
                Рассчитать цену
              </a>
            </div>

            <div className="flex flex-wrap gap-8 mt-12 animate-fade-up-delay-3">
              {[["500+", "клиентов"], ["98%", "довольны"], ["24ч", "запуск"]].map(([num, label]) => (
                <div key={label} className="text-center">
                  <div className="font-display text-3xl font-bold gradient-text">{num}</div>
                  <div className="text-white/40 text-sm mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30">
          <span className="text-xs tracking-widest uppercase">Скролл</span>
          <Icon name="ChevronDown" size={20} />
        </div>
      </section>

      {/* ADVANTAGES */}
      <section id="advantages" className="py-24 section-glow relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-medium mb-3 uppercase tracking-widest" style={{ color: "var(--neon-cyan)" }}>Почему мы</p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
              Наши <span className="gradient-text">преимущества</span>
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              Мы не просто выполняем задачи — мы строим долгосрочные партнёрства
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ADVANTAGES.map((a, i) => (
              <div key={i} className="glass glass-hover rounded-2xl p-6 flex flex-col gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.2)" }}>
                  <Icon name={a.icon} size={22} style={{ color: "var(--neon-cyan)" }} />
                </div>
                <h3 className="font-display text-xl font-semibold text-white">{a.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{a.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CALCULATOR */}
      <section id="calculator" className="py-24 relative overflow-hidden">
        <div className="orb" style={{ width: 400, height: 400, background: "rgba(168,85,247,0.08)", top: "20%", right: "0" }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-medium mb-3 uppercase tracking-widest" style={{ color: "var(--neon-violet)" }}>Персональный расчёт</p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
              <span className="neon-violet-text">Калькулятор</span> калорий
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">BMR → TDEE → цель → БЖУ → ИМТ и норма воды</p>
          </div>

          <div className="max-w-3xl mx-auto glass rounded-3xl p-8 sm:p-10">
            <div className="space-y-6">

              {/* Пол */}
              <div>
                <p className="text-white/60 text-xs font-medium mb-3 uppercase tracking-wide">Пол</p>
                <div className="grid grid-cols-2 gap-3">
                  {[{ v: "female", label: "Женщина", icon: "♀" }, { v: "male", label: "Мужчина", icon: "♂" }].map((o) => (
                    <button key={o.v} onClick={() => setCalcInput((p) => ({ ...p, gender: o.v }))}
                      className={`rounded-xl py-3 text-sm font-semibold border transition-all duration-200 ${calcInput.gender === o.v ? "border-purple-400 bg-purple-400/10 text-white" : "border-white/10 text-white/50 hover:border-white/25"}`}>
                      {o.icon} {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Возраст / Вес / Рост */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: "age", label: "Возраст", placeholder: "лет", unit: "лет" },
                  { key: "weight", label: "Вес", placeholder: "кг", unit: "кг" },
                  { key: "height", label: "Рост", placeholder: "см", unit: "см" },
                ].map((f) => (
                  <div key={f.key}>
                    <p className="text-white/60 text-xs font-medium mb-2 uppercase tracking-wide">{f.label}</p>
                    <div className="relative">
                      <input
                        type="number"
                        value={calcInput[f.key as keyof CalcInput]}
                        onChange={(e) => setCalcInput((p) => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="w-full rounded-xl px-3 py-3 pr-9 text-sm text-white placeholder-white/25 outline-none transition-all text-center"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                        onFocus={(e) => (e.target.style.borderColor = "rgba(168,85,247,0.5)")}
                        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/25 text-xs">{f.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Активность */}
              <div>
                <p className="text-white/60 text-xs font-medium mb-3 uppercase tracking-wide">Уровень активности</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { v: "sedentary", label: "Сидячий образ жизни", sub: "×1.2" },
                    { v: "light", label: "Лёгкая активность", sub: "×1.375" },
                    { v: "moderate", label: "Умеренная активность", sub: "×1.55" },
                    { v: "active", label: "Высокая активность", sub: "×1.725" },
                    { v: "veryactive", label: "Очень высокая", sub: "×1.9" },
                  ].map((o) => (
                    <button key={o.v} onClick={() => setCalcInput((p) => ({ ...p, activity: o.v }))}
                      className={`rounded-xl px-4 py-2.5 text-left text-sm border transition-all duration-200 flex justify-between items-center ${calcInput.activity === o.v ? "border-cyan-400 bg-cyan-400/10 text-white" : "border-white/10 text-white/50 hover:border-white/25"}`}>
                      <span>{o.label}</span>
                      <span className="text-xs opacity-60 ml-2">{o.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Цель */}
              <div>
                <p className="text-white/60 text-xs font-medium mb-3 uppercase tracking-wide">Цель</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { v: "loss", label: "Похудение", sub: "−500 ккал" },
                    { v: "softloss", label: "Мягкое похудение", sub: "−250 ккал" },
                    { v: "maintain", label: "Поддержание", sub: "±0 ккал" },
                    { v: "gain", label: "Набор массы", sub: "+250 ккал" },
                    { v: "fastgain", label: "Быстрый набор", sub: "+500 ккал" },
                  ].map((o) => (
                    <button key={o.v} onClick={() => setCalcInput((p) => ({ ...p, goal: o.v }))}
                      className={`rounded-xl px-3 py-2.5 text-center text-sm border transition-all duration-200 ${calcInput.goal === o.v ? "border-cyan-400 bg-cyan-400/10 text-white" : "border-white/10 text-white/50 hover:border-white/25"}`}>
                      <div className="font-semibold">{o.label}</div>
                      <div className="text-xs opacity-60">{o.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleCalc} className="btn-neon w-full py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2">
                <Icon name="Calculator" size={20} />
                Рассчитать
              </button>

              {calcResult && (
                <div className="animate-fade-up space-y-4">
                  {/* Главные метрики */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Базовый обмен (BMR)", value: calcResult.bmr, unit: "ккал" },
                      { label: "Суточный расход (TDEE)", value: calcResult.tdee, unit: "ккал" },
                      { label: "Ваша цель", value: calcResult.target, unit: "ккал" },
                    ].map((m) => (
                      <div key={m.label} className="rounded-2xl p-4 text-center" style={{ background: "linear-gradient(135deg, rgba(0,229,255,0.08), rgba(168,85,247,0.08))", border: "1px solid rgba(0,229,255,0.2)" }}>
                        <div className="font-display text-2xl font-bold gradient-text">{m.value}</div>
                        <div className="text-white/40 text-xs mt-1">{m.unit}</div>
                        <div className="text-white/30 text-xs mt-0.5 leading-tight">{m.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* БЖУ */}
                  <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <p className="text-white/50 text-xs uppercase tracking-wide mb-3">Рекомендации по БЖУ</p>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: "Белки", value: calcResult.protein, color: "#00e5ff", pct: Math.round(calcResult.protein * 4 / calcResult.target * 100) },
                        { label: "Жиры", value: calcResult.fat, color: "#a855f7", pct: Math.round(calcResult.fat * 9 / calcResult.target * 100) },
                        { label: "Углеводы", value: calcResult.carbs, color: "#f0abfc", pct: Math.round(calcResult.carbs * 4 / calcResult.target * 100) },
                      ].map((b) => (
                        <div key={b.label} className="text-center">
                          <div className="font-display text-xl font-bold" style={{ color: b.color }}>{b.value}г</div>
                          <div className="text-white/40 text-xs">{b.label}</div>
                          <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${b.pct}%`, background: b.color }} />
                          </div>
                          <div className="text-white/25 text-xs mt-1">{b.pct}%</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Доп. метрики */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { icon: "Scale", label: "ИМТ", value: String(calcResult.bmi), unit: calcResult.bmi < 18.5 ? "дефицит" : calcResult.bmi < 25 ? "норма" : calcResult.bmi < 30 ? "избыток" : "ожирение" },
                      { icon: "Target", label: "Идеальный вес", value: String(calcResult.idealWeight), unit: "кг" },
                      { icon: "Droplets", label: "Норма воды", value: String(calcResult.water), unit: "мл/день" },
                    ].map((m) => (
                      <div key={m.label} className="rounded-2xl p-4 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <Icon name={m.icon} size={18} className="mx-auto mb-2" style={{ color: "var(--neon-cyan)" }} />
                        <div className="font-display text-xl font-bold text-white">{m.value}</div>
                        <div className="text-white/35 text-xs mt-0.5">{m.unit}</div>
                        <div className="text-white/25 text-xs">{m.label}</div>
                      </div>
                    ))}
                  </div>

                  <a href="#chat" className="flex items-center justify-center gap-2 btn-outline-neon w-full py-3 rounded-2xl text-sm font-bold">
                    <Icon name="Bot" size={16} />
                    Получить персональный план от ИИ
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* AI CHAT */}
      <section id="chat" className="py-24 section-glow relative">
        <div className="orb" style={{ width: 350, height: 350, background: "rgba(0,229,255,0.07)", bottom: "0", left: "5%" }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-medium mb-3 uppercase tracking-widest" style={{ color: "var(--neon-cyan)" }}>ИИ-консультант</p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
              Чат с <span className="gradient-text">ИИ агентом</span>
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              Задайте любой вопрос — ИИ ответит мгновенно
            </p>
          </div>

          <div className="max-w-2xl mx-auto glass rounded-3xl overflow-hidden" style={{ border: "1px solid rgba(0,229,255,0.15)" }}>
            <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center animate-pulse-glow" style={{ background: "linear-gradient(135deg, var(--neon-cyan), var(--neon-violet))" }}>
                <Icon name="Bot" size={18} className="text-gray-900" />
              </div>
              <div>
                <div className="text-white font-semibold text-sm">ИИ Ассистент</div>
                <div className="text-xs flex items-center gap-1" style={{ color: "var(--neon-cyan)" }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  Онлайн
                </div>
              </div>
              <div className="ml-auto text-white/30 text-xs hidden sm:block">Спросите о ценах или сроках</div>
            </div>

            <div className="h-80 overflow-y-auto p-5 space-y-4 scrollbar-thin">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`chat-bubble-in flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  {msg.role === "ai" && (
                    <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--neon-cyan), var(--neon-violet))" }}>
                      <Icon name="Bot" size={14} className="text-gray-900" />
                    </div>
                  )}
                  <div
                    className={`max-w-xs rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "ai" ? "rounded-tl-sm text-white/90" : "rounded-tr-sm font-medium text-gray-900"}`}
                    style={msg.role === "ai"
                      ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }
                      : { background: "linear-gradient(135deg, var(--neon-cyan), var(--neon-violet))" }
                    }
                  >
                    {msg.text}
                    <div className={`text-xs mt-1 ${msg.role === "ai" ? "text-white/25" : "text-black/30"}`}>{msg.time}</div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="chat-bubble-in flex gap-3">
                  <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--neon-cyan), var(--neon-violet))" }}>
                    <Icon name="Bot" size={14} className="text-gray-900" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-2 h-2 rounded-full" style={{ background: "var(--neon-cyan)", animation: `blink 1s ease-in-out ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t border-white/5">
              <div className="flex gap-3">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Напишите вопрос..."
                  className="flex-1 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(0,229,255,0.4)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
                <button
                  onClick={sendMessage}
                  disabled={!chatInput.trim() || isTyping}
                  className="w-11 h-11 rounded-xl flex items-center justify-center btn-neon disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <Icon name="Send" size={16} className="text-gray-900" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {["Какая цена?", "Сроки?", "Гарантии?", "Контакты"].map((hint) => (
                  <button
                    key={hint}
                    onClick={() => setChatInput(hint)}
                    className="text-xs px-3 py-1.5 rounded-full transition-all hover:text-white"
                    style={{ background: "rgba(0,229,255,0.06)", border: "1px solid rgba(0,229,255,0.15)", color: "rgba(0,229,255,0.7)" }}
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-medium mb-3 uppercase tracking-widest" style={{ color: "var(--neon-violet)" }}>Отзывы</p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
              Что говорят <span className="neon-violet-text">клиенты</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {REVIEWS.map((r, i) => (
              <div key={i} className="glass glass-hover rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex gap-1">
                  {Array.from({ length: r.rating }).map((_, j) => (
                    <Icon key={j} name="Star" size={16} style={{ color: "var(--neon-cyan)", fill: "var(--neon-cyan)" }} />
                  ))}
                </div>
                <p className="text-white/70 text-sm leading-relaxed flex-1">"{r.text}"</p>
                <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm font-display" style={{ background: "linear-gradient(135deg, var(--neon-cyan), var(--neon-violet))", color: "#080c14" }}>
                    {r.name[0]}
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">{r.name}</div>
                    <div className="text-white/40 text-xs">{r.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACTS */}
      <section id="contacts" className="py-24 relative overflow-hidden">
        <div className="orb" style={{ width: 500, height: 500, background: "rgba(0,229,255,0.07)", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-sm font-medium mb-3 uppercase tracking-widest" style={{ color: "var(--neon-cyan)" }}>Связаться</p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
              Начнём <span className="gradient-text">работу</span>?
            </h2>
            <p className="text-white/50 text-lg mb-10">
              Оставьте заявку — свяжемся в течение 15 минут и обсудим ваш проект
            </p>

            <div className="glass rounded-3xl p-8 sm:p-10 text-left">
              {submitted ? (
                <div className="text-center py-8 animate-fade-up">
                  <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, var(--neon-cyan), var(--neon-violet))" }}>
                    <Icon name="Check" size={32} className="text-gray-900" />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-white mb-2">Заявка отправлена!</h3>
                  <p className="text-white/50">Свяжемся с вами в течение 15 минут</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wide mb-2 block">Ваше имя</label>
                    <input
                      value={contactForm.name}
                      onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Как вас зовут?"
                      className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-all"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                      onFocus={(e) => (e.target.style.borderColor = "rgba(0,229,255,0.4)")}
                      onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wide mb-2 block">Телефон</label>
                    <input
                      value={contactForm.phone}
                      onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="+7 (999) 000-00-00"
                      className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-all"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                      onFocus={(e) => (e.target.style.borderColor = "rgba(0,229,255,0.4)")}
                      onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wide mb-2 block">Email</label>
                    <input
                      value={contactForm.email}
                      onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="your@email.ru"
                      className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-all"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                      onFocus={(e) => (e.target.style.borderColor = "rgba(0,229,255,0.4)")}
                      onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (contactForm.name || contactForm.phone || contactForm.email) setSubmitted(true);
                    }}
                    className="btn-neon w-full py-4 rounded-2xl text-base font-bold mt-2 flex items-center justify-center gap-2"
                  >
                    <Icon name="Send" size={18} />
                    Отправить заявку
                  </button>
                </div>
              )}

              <div className="flex flex-wrap gap-6 justify-center mt-8 pt-6 border-t border-white/5">
                {[
                  { icon: "Phone", text: "+7 (999) 123-45-67" },
                  { icon: "Mail", text: "hello@example.ru" },
                  { icon: "MessageCircle", text: "Telegram" },
                ].map((c) => (
                  <div key={c.text} className="flex items-center gap-2 text-sm text-white/50">
                    <Icon name={c.icon} size={16} style={{ color: "var(--neon-cyan)" }} />
                    {c.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-display text-lg font-bold gradient-text">ЛОГОТИП</div>
          <p className="text-white/30 text-sm">© 2026 Все права защищены</p>
          <div className="flex gap-6">
            {NAV_LINKS.slice(0, 4).map((l) => (
              <a key={l.href} href={l.href} className="text-white/30 text-xs hover:text-white/60 transition-colors">{l.label}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;