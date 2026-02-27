"use client";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Star, MessageSquare, ThumbsUp, ThumbsDown, Send, Eye, Loader2 } from "lucide-react";
import api from "@/lib/api";

const sourceColors: Record<string, string> = {
  BOOKING_COM: "bg-blue-50 text-blue-700",
  GOOGLE: "bg-red-50 text-red-700",
  TRIPADVISOR: "bg-green-50 text-green-700",
  EXPEDIA: "bg-amber-50 text-amber-700",
};

export default function ReputationPage() {
  const t = useTranslations("reputation");
  const tc = useTranslations("common");
  const [tab, setTab] = useState<"reviews" | "surveys">("reviews");
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [surveyResults, setSurveyResults] = useState<any>(null);

  const loadData = () => {
    return Promise.allSettled([
      api.reputation.listReviews(),
      api.reputation.listSurveys(),
      api.reputation.reviewStats(),
    ]).then(([reviewsRes, surveysRes, statsRes]) => {
      if (reviewsRes.status === "fulfilled") setReviews(Array.isArray(reviewsRes.value) ? reviewsRes.value : []);
      if (surveysRes.status === "fulfilled") setSurveys(Array.isArray(surveysRes.value) ? surveysRes.value : []);
      if (statsRes.status === "fulfilled") setStats(statsRes.value);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const avgRating = stats?.avgRating != null ? Number(stats.avgRating).toFixed(1) : stats?.averageRating != null ? Number(stats.averageRating).toFixed(1) : reviews.length > 0 ? (reviews.reduce((s: number, r: any) => s + Number(r.rating || 0), 0) / reviews.length).toFixed(1) : "\u2014";
  const totalReviews = stats?.total ?? stats?.totalReviews ?? reviews.length;
  const positiveCount = reviews.filter((r: any) => (r.sentiment || "").toUpperCase() === "POSITIVE").length;
  const positivePct = reviews.length > 0 ? Math.round((positiveCount / reviews.length) * 100) : 0;
  const respondedCount = reviews.filter((r: any) => r.responded || r.responseStatus === "RESPONDED" || (r.responses && r.responses.length > 0)).length;
  const responseRate = reviews.length > 0 ? Math.round((respondedCount / reviews.length) * 100) : 0;

  const mappedReviews = reviews.map((r: any) => ({
    id: r.id,
    guestName: r.guestName || r.guest?.name || "Anonymous",
    source: r.source || "UNKNOWN",
    rating: Number(r.rating || 0),
    title: r.title || r.subject || "Review",
    comment: r.comment || r.text || r.body || "",
    sentiment: (r.sentiment || "NEUTRAL").toUpperCase(),
    date: r.date || r.createdAt?.split("T")[0] || "\u2014",
    responded: r.responded ?? (r.responses && r.responses.length > 0) ?? r.responseStatus === "RESPONDED" ?? false,
  }));

  const mappedSurveys = surveys.map((s: any) => ({
    id: s.id,
    name: s.name || s.title || "Untitled Survey",
    responses: Number(s._count?.responses ?? s.responses ?? s.responseCount ?? 0),
    avgScore: Number(s.avgScore ?? s.averageScore ?? 0).toFixed(1),
    lastResponse: s.lastResponse || s.lastResponseAt?.split("T")[0] || s.updatedAt?.split("T")[0] || "\u2014",
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
          <p className="text-slate-500 text-sm mt-1">{t("subtitle")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t("avgRating"), value: avgRating, sub: t("acrossAllPlatforms"), icon: Star, color: "bg-amber-50 text-amber-600" },
          { label: t("totalReviews"), value: String(totalReviews), sub: t("allTime"), icon: MessageSquare, color: "bg-blue-50 text-blue-600" },
          { label: t("positive"), value: reviews.length > 0 ? `${positivePct}%` : "\u2014", sub: t("sentimentScore"), icon: ThumbsUp, color: "bg-green-50 text-green-600" },
          { label: t("responseRate"), value: reviews.length > 0 ? `${responseRate}%` : "\u2014", sub: t("repliedToReviews"), icon: Send, color: "bg-purple-50 text-purple-600" },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${kpi.color}`}><kpi.icon size={22} /></div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{kpi.value}</div>
              <div className="text-xs text-slate-500">{kpi.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {(["reviews", "surveys"] as const).map(tb => (
          <button key={tb} onClick={() => setTab(tb)} className={`px-4 py-2 text-sm rounded-md transition-all ${tab === tb ? "bg-white text-slate-900 shadow-sm font-medium" : "text-slate-500 hover:text-slate-700"}`}>
            {tb === "reviews" ? t("guestReviews") : t("surveys")}
          </button>
        ))}
      </div>

      {tab === "reviews" && (
        <div className="space-y-4">
          {mappedReviews.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <MessageSquare size={40} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-lg font-semibold text-slate-900 mb-1">{t("noReviews")}</h3>
              <p className="text-sm text-slate-500">{t("noReviewsDesc")}</p>
            </div>
          ) : mappedReviews.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-slate-900">{r.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${sourceColors[r.source] || "bg-slate-100 text-slate-600"}`}>
                      {r.source.replace("_", ".")}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{t("by")} {r.guestName} &middot; {r.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} className={i < Math.floor(r.rating) ? "text-amber-400 fill-amber-400" : "text-slate-200"} />
                    ))}
                  </div>
                  <span className="font-bold text-slate-900">{r.rating}</span>
                </div>
              </div>
              <p className="text-sm text-slate-700 mb-3">{r.comment}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.sentiment === "POSITIVE" ? "bg-green-50 text-green-700" : r.sentiment === "NEGATIVE" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"}`}>
                    {r.sentiment === "POSITIVE" ? <ThumbsUp size={10} className="inline mr-1" /> : r.sentiment === "NEGATIVE" ? <ThumbsDown size={10} className="inline mr-1" /> : null}
                    {r.sentiment}
                  </span>
                </div>
                {r.responded ? (
                  <span className="text-xs text-green-600 font-medium">{t("responded")}</span>
                ) : (
                  <button className="text-sm text-blue-600 hover:underline" onClick={() => { setReplyingTo(r); setReplyText(""); }}>{t("reply")}</button>
                )}
              </div>
              {replyingTo?.id === r.id && (
                <div className="mt-4 border-t border-slate-100 pt-4 space-y-3">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder={t("writeReply")}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="px-3 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                    >
                      {tc("cancel")}
                    </button>
                    <button
                      disabled={!replyText.trim() || replyLoading}
                      onClick={async () => {
                        setReplyLoading(true);
                        try {
                          await api.reputation.respondToReview(r.id, { body: replyText });
                          setReplyingTo(null);
                          setReplyText("");
                          await loadData();
                        } catch (e: any) {
                          alert(e.message || "Failed to send reply");
                        } finally {
                          setReplyLoading(false);
                        }
                      }}
                      className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                    >
                      {replyLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} {t("sendReply")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "surveys" && (
        <div className="space-y-4">
          {mappedSurveys.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Eye size={40} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-lg font-semibold text-slate-900 mb-1">{t("noSurveys")}</h3>
              <p className="text-sm text-slate-500">{t("noSurveysDesc")}</p>
            </div>
          ) : mappedSurveys.map(s => (
            <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-slate-900">{s.name}</h3>
                  <p className="text-sm text-slate-500">{t("lastResponse")}: {s.lastResponse}</p>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="text-lg font-bold text-slate-900">{s.responses}</div>
                    <div className="text-xs text-slate-500">{t("responses")}</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <Star size={16} className="text-amber-400 fill-amber-400" />
                      <span className="text-lg font-bold text-slate-900">{s.avgScore}</span>
                    </div>
                    <div className="text-xs text-slate-500">{t("avgScore")}</div>
                  </div>
                  <button
                    className="px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                    onClick={async () => {
                      try {
                        const data = await api.reputation.surveyAnalytics(s.id);
                        setSurveyResults(data);
                      } catch (e: any) {
                        alert(e.message || "Failed to load results");
                      }
                    }}
                  >{t("viewResults")}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Survey Results Modal */}
      {surveyResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{t("surveyResults")}</h2>
              <button onClick={() => setSurveyResults(null)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-slate-900">{surveyResults.totalResponses ?? surveyResults.responses ?? surveyResults._count?.responses ?? "\u2014"}</div>
                <div className="text-xs text-slate-500">{t("totalResponses")}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Star size={18} className="text-amber-400 fill-amber-400" />
                  <span className="text-2xl font-bold text-slate-900">{Number(surveyResults.averageScore ?? surveyResults.avgScore ?? 0).toFixed(1)}</span>
                </div>
                <div className="text-xs text-slate-500">{t("averageScore")}</div>
              </div>
              {surveyResults.completionRate != null && (
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-slate-900">{surveyResults.completionRate}%</div>
                  <div className="text-xs text-slate-500">{t("completionRate")}</div>
                </div>
              )}
              {surveyResults.npsScore != null && (
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-slate-900">{surveyResults.npsScore}</div>
                  <div className="text-xs text-slate-500">{t("npsScore")}</div>
                </div>
              )}
            </div>
            {surveyResults.questions && Array.isArray(surveyResults.questions) && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-slate-700">{t("questionBreakdown")}</h3>
                {surveyResults.questions.map((q: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <span className="text-sm text-slate-700 truncate mr-4">{q.question || q.label || `Q${i + 1}`}</span>
                    <span className="text-sm font-medium text-slate-900 whitespace-nowrap">{Number(q.avgScore ?? q.average ?? 0).toFixed(1)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end">
              <button onClick={() => setSurveyResults(null)} className="px-4 py-2 text-sm text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50">
                {tc("close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
