"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HelpCircle, Search, Book, Video, MessageCircle, ChevronRight, CheckCircle2, Circle, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import api from "@/lib/api";

export default function HelpPage() {
  const t = useTranslations("help");
  const tc = useTranslations("common");
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState<"setup" | "help" | "support">("setup");
  const [loading, setLoading] = useState(true);
  const [setupSteps, setSetupSteps] = useState<any[]>([]);
  const [helpCategories, setHelpCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [articles, setArticles] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [progressRes, categoriesRes] = await Promise.all([
          api.onboarding.getProgress().catch(() => null),
          api.onboarding.helpCategories().catch(() => []),
        ]);

        // Progress may have a steps array or be structured differently
        if (progressRes) {
          if (Array.isArray(progressRes.steps)) {
            setSetupSteps(progressRes.steps);
          } else if (Array.isArray(progressRes)) {
            setSetupSteps(progressRes);
          } else {
            setSetupSteps([]);
          }
        }

        setHelpCategories(Array.isArray(categoriesRes) ? categoriesRes : []);
      } catch {
        // fallback to empty
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const completedCount = setupSteps.filter(s => s.completed).length;
  const totalSteps = setupSteps.length;
  const percentComplete = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
          <p className="text-slate-500 text-sm mt-1">{t("subtitle")}</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
        <p className="text-slate-500 text-sm mt-1">{t("subtitle")}</p>
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {(["setup", "help", "support"] as const).map(tb => (
          <button key={tb} onClick={() => setTab(tb)} className={`px-4 py-2 text-sm rounded-md transition-all ${tab === tb ? "bg-white text-slate-900 shadow-sm font-medium" : "text-slate-500 hover:text-slate-700"}`}>
            {tb === "setup" ? t("setupWizard") : tb === "help" ? t("helpCenter") : t("support")}
          </button>
        ))}
      </div>

      {tab === "setup" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-900">{t("setupProgress")}</h3>
                <p className="text-sm text-slate-500">{t("stepsCompleted", { completed: completedCount, total: totalSteps })}</p>
              </div>
              <div className="text-2xl font-bold text-blue-600">{percentComplete}%</div>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-6">
              <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${percentComplete}%` }} />
            </div>
            {setupSteps.length === 0 ? (
              <div className="text-center py-6">
                <HelpCircle size={36} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">{t("noSteps")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {setupSteps.map((step: any, i: number) => (
                  <div key={step.id || i} onClick={() => {
                    if (step.completed) return;
                    const routes: Record<string, string> = {
                      "property": "/dashboard/settings",
                      "rooms": "/dashboard/rooms",
                      "rates": "/dashboard/rates",
                      "channels": "/dashboard/channels",
                      "team": "/dashboard/settings",
                    };
                    const route = Object.entries(routes).find(([key]) => step.title?.toLowerCase().includes(key) || step.name?.toLowerCase().includes(key));
                    router.push(route?.[1] || "/dashboard/settings");
                  }} className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${step.completed ? "border-green-100 bg-green-50/50" : "border-slate-100 hover:bg-slate-50 cursor-pointer"}`}>
                    {step.completed ? (
                      <CheckCircle2 size={22} className="text-green-500" />
                    ) : (
                      <div className="w-[22px] h-[22px] rounded-full border-2 border-slate-300 flex items-center justify-center text-xs text-slate-400">{i + 1}</div>
                    )}
                    <div className="flex-1">
                      <div className={`font-medium ${step.completed ? "text-green-800" : "text-slate-900"}`}>{step.title || step.name}</div>
                      <div className={`text-sm ${step.completed ? "text-green-600" : "text-slate-500"}`}>{step.description || ""}</div>
                    </div>
                    {!step.completed && <ChevronRight size={16} className="text-slate-400" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "help" && (
        <div className="space-y-6">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t("searchArticles")}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {helpCategories.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Book size={40} className="mx-auto text-slate-300 mb-3" />
              <h3 className="font-semibold text-slate-700 mb-1">{t("noArticles")}</h3>
              <p className="text-sm text-slate-500">{t("noArticlesDesc")}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {helpCategories.map((cat: any) => (
                  <div key={cat.id || cat.slug} onClick={async () => {
                    try {
                      setSelectedCategory(cat.name || cat.id);
                      const data = await api.onboarding.helpArticles(cat.id || cat.slug || cat.name);
                      setArticles(Array.isArray(data) ? data : []);
                    } catch { setArticles([]); }
                  }} className={`bg-white rounded-xl border p-5 hover:shadow-md transition-shadow cursor-pointer flex items-center gap-4 ${selectedCategory === (cat.name || cat.id) ? "border-blue-400 ring-2 ring-blue-100" : "border-slate-200"}`}>
                    <div className="text-3xl">{cat.icon || "\uD83D\uDCC4"}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{cat.name}</h3>
                      <p className="text-sm text-slate-500">{cat.articles ?? cat.articleCount ?? 0} {t("articles")}</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-400" />
                  </div>
                ))}
              </div>
              {selectedCategory && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">{selectedCategory}</h3>
                    <button onClick={() => setSelectedCategory(null)} className="text-xs text-slate-400 hover:text-slate-600">{t("clear")}</button>
                  </div>
                  {articles.length === 0 ? (
                    <p className="text-sm text-slate-400">{t("noArticlesInCategory")}</p>
                  ) : (
                    articles.map((a: any, i: number) => (
                      <div key={i} className="p-3 bg-white rounded-xl border border-slate-100 hover:border-slate-200 cursor-pointer">
                        <div className="font-semibold text-sm text-slate-800">{a.title || a.name}</div>
                        {a.summary && <p className="text-xs text-slate-400 mt-1">{a.summary}</p>}
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tab === "support" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Book, title: t("documentation"), desc: t("documentationDesc"), action: t("viewDocs"), actionKey: "viewDocs", color: "bg-blue-50 text-blue-600" },
            { icon: Video, title: t("videoTutorials"), desc: t("videoTutorialsDesc"), action: t("watchNow"), actionKey: "watchNow", color: "bg-purple-50 text-purple-600" },
            { icon: MessageCircle, title: t("contactSupport"), desc: t("contactSupportDesc"), action: t("startChat"), actionKey: "startChat", color: "bg-green-50 text-green-600" },
          ].map(card => (
            <div key={card.actionKey} className="bg-white rounded-xl border border-slate-200 p-6 text-center">
              <div className={`w-14 h-14 rounded-xl ${card.color} flex items-center justify-center mx-auto mb-4`}>
                <card.icon size={28} />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{card.title}</h3>
              <p className="text-sm text-slate-500 mb-4">{card.desc}</p>
              <button
                onClick={() => {
                  if (card.actionKey === "viewDocs") window.open("https://docs.hotelms.com", "_blank");
                  else if (card.actionKey === "watchNow") alert("Video tutorials coming soon");
                  else if (card.actionKey === "startChat") window.open("mailto:support@hotelms.com");
                  else alert("Coming soon");
                }}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 transition-colors">{card.action}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
