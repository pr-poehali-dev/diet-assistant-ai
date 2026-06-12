import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const FEATURES = [
  {
    icon: "Target",
    color: "bg-emerald-100 text-emerald-600",
    title: "Точная наука",
    text: "В основе — формула Миффлина-Сан Жеора 1990 года. Её используют диетологи по всему миру: погрешность не превышает 10% у 82% людей.",
  },
  {
    icon: "Bot",
    color: "bg-blue-100 text-blue-600",
    title: "Искусственный интеллект",
    text: "AI-помощник отвечает на вопросы о питании, анализирует дневник и даёт персональные советы — как личный диетолог, только доступный 24/7.",
  },
  {
    icon: "ShieldCheck",
    color: "bg-violet-100 text-violet-600",
    title: "Приватность",
    text: "Данные хранятся только у вас в браузере. Мы не собираем и не передаём личную информацию третьим лицам.",
  },
  {
    icon: "Zap",
    color: "bg-orange-100 text-orange-600",
    title: "Без барьеров",
    text: "Бесплатно, без регистрации, без рекламы. Мы верим, что инструменты для здоровья должны быть доступны каждому.",
  },
];

const STATS = [
  { num: "5+", label: "лет исследований в основе формул" },
  { num: "3", label: "ключевых показателя: BMR, TDEE, БЖУ" },
  { num: "0₽", label: "стоимость — полностью бесплатно" },
];

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm">
              <Icon name="Flame" size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">AI Calorie Assistant</span>
          </button>
          <button
            onClick={() => navigate("/app")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold shadow-sm transition-all">
            <Icon name="Calculator" size={14} className="text-white" />
            Калькулятор
          </button>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="bg-white border-b border-gray-100">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200">
              <Icon name="Flame" size={28} className="text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">О проекте</h1>
            <p className="text-gray-500 text-lg leading-relaxed max-w-2xl mx-auto">
              AI Calorie Assistant — бесплатный онлайн-сервис для расчёта нормы калорий, отслеживания питания и получения персональных советов от искусственного интеллекта.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="py-14">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 sm:p-10">
              <h2 className="text-2xl font-black text-gray-900 mb-4">Наша миссия</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Мы создали этот сервис, потому что устали видеть, как люди либо мучают себя жёсткими диетами, либо действуют наугад — без понимания, сколько энергии реально нужно их телу.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                Правильное питание — это не запреты и не подсчёт каждой крошки до изнеможения. Это осознанность: знать свою норму калорий, понимать баланс белков, жиров и углеводов, замечать паттерны в своём рационе.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Наш инструмент даёт эти знания быстро, точно и бесплатно — чтобы каждый мог сделать первый шаг к осознанному питанию без регистрации, оплаты и лишних сложностей.
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-6">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="bg-emerald-500 rounded-2xl p-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-white">
                {STATS.map(s => (
                  <div key={s.label}>
                    <div className="text-4xl font-black mb-1">{s.num}</div>
                    <div className="text-emerald-100 text-sm">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-14">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-black text-gray-900 mb-6">Что делает нас другими</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {FEATURES.map(f => (
                <div key={f.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                    <Icon name={f.icon as Parameters<typeof Icon>[0]["name"]} size={20} />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-6 pb-14">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 sm:p-10">
              <h2 className="text-2xl font-black text-gray-900 mb-4">Как это работает</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Сервис рассчитывает ваш <strong className="text-gray-800">BMR</strong> (базовый обмен веществ) по формуле Миффлина-Сан Жеора — с учётом пола, возраста, веса и роста. Затем умножает его на коэффициент активности и получает <strong className="text-gray-800">TDEE</strong> — реальную суточную потребность в калориях.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                На основе вашей цели (похудение, поддержание или набор массы) сервис формирует целевой калораж и разбивает его на <strong className="text-gray-800">БЖУ</strong>: белки, жиры и углеводы.
              </p>
              <p className="text-gray-600 leading-relaxed">
                AI-помощник анализирует ваш дневник питания, отвечает на вопросы о продуктах, помогает заменить одни блюда другими и даёт советы по корректировке рациона — в режиме диалога, без шаблонных ответов.
              </p>
              <div className="mt-6 pt-6 border-t border-gray-100">
                <button
                  onClick={() => navigate("/app")}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors">
                  <Icon name="Calculator" size={16} className="text-white" />
                  Попробовать бесплатно
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
          <span>© 2026 AI Calorie Assistant</span>
          <div className="flex items-center gap-4">
            <a href="/blog" className="hover:text-gray-600 transition-colors">Блог</a>
            <a href="/privacy" className="hover:text-gray-600 transition-colors">Политика конфиденциальности</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
