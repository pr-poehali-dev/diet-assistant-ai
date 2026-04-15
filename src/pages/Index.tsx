import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Icon from "@/components/ui/icon";
import Dashboard, { UserProfile } from "./Dashboard";
import { CalcInput, CalcResult, calcCalories } from "./calc/calcTypes";
import CalcForm from "./calc/CalcForm";
import CalcResultPanel from "./calc/CalcResult";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState<"calc" | "dashboard">(
    searchParams.get("tab") === "dashboard" ? "dashboard" : "calc"
  );

  useEffect(() => {
    if (searchParams.get("tab") === "dashboard") setPage("dashboard");
  }, [searchParams]);
  const [inp, setInp] = useState<CalcInput>({
    age: "", weight: "", height: "", gender: "female", activity: "moderate", goal: "maintain",
    bodyFat: "", conditions: [], medications: [],
  });
  const [result, setResult] = useState<CalcResult | null>(null);
  const [calcError, setCalcError] = useState("");
  const [dashboardProfile, setDashboardProfile] = useState<Partial<UserProfile> | undefined>(undefined);
  const [autoAnalyze, setAutoAnalyze] = useState(false);

  function handleCalc() {
    const r = calcCalories(inp);
    if (!r) { setCalcError("Заполни возраст, вес и рост"); return; }
    setCalcError("");
    setResult(r);
    setDashboardProfile({
      dailyCalories: r.target,
      proteinTarget: r.protein,
      fatTarget: r.fat,
      carbsTarget: r.carbs,
    });
    setAutoAnalyze(true);
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* ── HEADER ── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5 flex-shrink-0 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm">
              <Icon name="Flame" size={16} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm leading-none whitespace-nowrap">AI Calorie Assistant</div>
            </div>
          </button>

          {/* Nav tabs */}
          <nav className="flex items-center gap-1">
            <button
              onClick={() => setPage("calc")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${page === "calc" ? "bg-emerald-50 text-emerald-600" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
              <Icon name="Calculator" size={14} />
              <span className="hidden sm:inline">Калькулятор</span>
            </button>
            <button
              onClick={() => setPage("dashboard")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${page === "dashboard" ? "bg-emerald-50 text-emerald-600" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
              <Icon name="BookOpen" size={14} />
              <span className="hidden sm:inline">Дневник</span>
            </button>
          </nav>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main>

        {/* Dashboard page */}
        {page === "dashboard" && <Dashboard externalProfile={dashboardProfile} />}

        {/* Calculator page */}
        {page === "calc" && <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

          {/* Title */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Рассчитай свою норму калорий</h1>
            <p className="text-gray-500 text-sm">Персональный расчёт BMR, TDEE и БЖУ по формуле Миффлина-Сан Жеора</p>
          </div>

          {/* ── Two-column layout ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* LEFT — Calculator form */}
            <CalcForm
              inp={inp}
              setInp={setInp}
              calcError={calcError}
              onCalc={handleCalc}
            />

            {/* RIGHT — Result */}
            <CalcResultPanel
              result={result}
              inp={inp}
              onGoToDashboard={() => setPage("dashboard")}
              autoAnalyze={autoAnalyze}
              onAutoAnalyzeDone={() => setAutoAnalyze(false)}
            />
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
        </div>}
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-100 bg-white mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
          <span>© 2026 AI Calorie Assistant</span>
          <a href="#" className="hover:text-gray-600 transition-colors">Политика конфиденциальности</a>
        </div>
      </footer>


    </div>
  );
};

export default Index;