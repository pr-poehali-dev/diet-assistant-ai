import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors text-sm"
          >
            <Icon name="ArrowLeft" size={16} />
            Назад
          </button>
          <span className="text-gray-300">|</span>
          <span className="font-semibold text-gray-800 text-sm">Политика конфиденциальности</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Политика конфиденциальности</h1>
          <p className="text-sm text-gray-400 mb-8">Последнее обновление: июнь 2026</p>

          <div className="prose prose-sm max-w-none text-gray-600 space-y-6">
            <p className="text-gray-500 italic">
              Здесь будет размещена политика конфиденциальности.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-100 bg-white mt-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 text-center text-xs text-gray-400">
          © 2026 AI Calorie Assistant
        </div>
      </footer>
    </div>
  );
};

export default Privacy;
