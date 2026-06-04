import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { BLOG_POSTS } from "@/data/blogPosts";

const CATEGORY_COLORS: Record<string, string> = {
  "Наука о питании": "bg-blue-50 text-blue-700",
  "Диеты и мифы": "bg-orange-50 text-orange-700",
  "Практика": "bg-emerald-50 text-emerald-700",
};

function formatDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("ru", { day: "numeric", month: "long", year: "numeric" });
}

export default function Blog() {
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-gray-900 mb-2">Блог о питании и калориях</h1>
          <p className="text-gray-500">Полезные статьи о подсчёте калорий, БЖУ, дневнике питания и похудении без стресса</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BLOG_POSTS.map(post => (
            <article
              key={post.slug}
              onClick={() => navigate(`/blog/${post.slug}`)}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[post.category] ?? "bg-gray-100 text-gray-600"}`}>
                    {post.category}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Icon name="Clock" size={11} />
                    {post.readTime} мин
                  </span>
                </div>
                <h2 className="font-bold text-gray-900 text-base leading-snug mb-2 line-clamp-3">
                  {post.title}
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">
                  {post.description}
                </p>
              </div>
              <div className="px-6 pb-5 flex items-center justify-between">
                <span className="text-xs text-gray-400">{formatDate(post.date)}</span>
                <span className="text-emerald-600 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                  Читать <Icon name="ArrowRight" size={14} />
                </span>
              </div>
            </article>
          ))}
        </div>
      </main>

      <footer className="border-t border-gray-100 bg-white mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
          <span>© 2026 AI Calorie Assistant</span>
          <div className="flex items-center gap-4">
            <a href="/privacy" className="hover:text-gray-600 transition-colors">Политика конфиденциальности</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
