import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import Icon from "@/components/ui/icon";
import { getPost, BLOG_POSTS, BlogSection } from "@/data/blogPosts";

const CATEGORY_COLORS: Record<string, string> = {
  "Наука о питании": "bg-blue-50 text-blue-700",
  "Диеты и мифы": "bg-orange-50 text-orange-700",
  "Практика": "bg-emerald-50 text-emerald-700",
};

function formatDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("ru", { day: "numeric", month: "long", year: "numeric" });
}

function Section({ s }: { s: BlogSection }) {
  const navigate = useNavigate();
  if (s.type === "h2") return <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">{s.text}</h2>;
  if (s.type === "h3") return <h3 className="text-lg font-bold text-gray-800 mt-6 mb-2">{s.text}</h3>;
  if (s.type === "p") return <p className="text-gray-600 leading-relaxed mb-3">{s.text}</p>;
  if (s.type === "ul") return (
    <ul className="space-y-2 mb-4">
      {s.items?.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-gray-600 text-sm leading-relaxed">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
          {item}
        </li>
      ))}
    </ul>
  );
  if (s.type === "tip") return (
    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 my-4 flex gap-3">
      <Icon name="Lightbulb" size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
      <p className="text-emerald-800 text-sm leading-relaxed">{s.text}</p>
    </div>
  );
  if (s.type === "cta") return (
    <div className="mt-8 p-6 bg-emerald-500 rounded-2xl text-center">
      <p className="text-white font-bold text-lg mb-4">{s.ctaText}</p>
      <button
        onClick={() => navigate(s.ctaHref ?? "/app")}
        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-600 font-bold rounded-xl hover:bg-emerald-50 transition-colors">
        <Icon name="Calculator" size={16} />
        Попробовать бесплатно
      </button>
    </div>
  );
  return null;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const post = getPost(slug ?? "");

  useEffect(() => {
    if (!post) navigate("/blog", { replace: true });
  }, [post, navigate]);

  if (!post) return null;

  const related = BLOG_POSTS.filter(p => p.slug !== post.slug).slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Schema.org Article */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": post.title,
        "description": post.description,
        "datePublished": post.date,
        "author": { "@type": "Organization", "name": "AI Calorie Assistant" },
        "publisher": { "@type": "Organization", "name": "AI Calorie Assistant" },
      })}} />

      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <button onClick={() => navigate("/blog")} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors text-sm">
            <Icon name="ArrowLeft" size={16} />
            Все статьи
          </button>
          <button onClick={() => navigate("/")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
              <Icon name="Flame" size={13} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm hidden sm:inline">AI Calorie Assistant</span>
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <article className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10">
          <div className="flex items-center gap-3 mb-5">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[post.category] ?? "bg-gray-100 text-gray-600"}`}>
              {post.category}
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Icon name="Clock" size={11} />
              {post.readTime} минут чтения
            </span>
            <span className="text-xs text-gray-400">{formatDate(post.date)}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight mb-3">
            {post.title}
          </h1>
          <p className="text-gray-500 text-base leading-relaxed mb-8 border-b border-gray-100 pb-8">
            {post.description}
          </p>

          <div>
            {post.content.map((s, i) => <Section key={i} s={s} />)}
          </div>
        </article>

        {related.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Читайте также</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {related.map(p => (
                <div
                  key={p.slug}
                  onClick={() => navigate(`/blog/${p.slug}`)}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[p.category] ?? "bg-gray-100 text-gray-600"}`}>
                    {p.category}
                  </span>
                  <h3 className="font-bold text-gray-900 text-sm mt-2 leading-snug">{p.title}</h3>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-gray-100 bg-white mt-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between text-xs text-gray-400">
          <span>© 2026 AI Calorie Assistant</span>
          <a href="/privacy" className="hover:text-gray-600 transition-colors">Политика конфиденциальности</a>
        </div>
      </footer>
    </div>
  );
}
