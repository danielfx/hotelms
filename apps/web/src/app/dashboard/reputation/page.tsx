"use client";
import { useState, useEffect } from "react";
import { Star, MessageSquare, ThumbsUp, ThumbsDown, Send, Eye, Loader2 } from "lucide-react";
import api from "@/lib/api";

const sourceColors: Record<string, string> = {
  BOOKING_COM: "bg-blue-50 text-blue-700",
  GOOGLE: "bg-red-50 text-red-700",
  TRIPADVISOR: "bg-green-50 text-green-700",
  EXPEDIA: "bg-amber-50 text-amber-700",
};

export default function ReputationPage() {
  const [tab, setTab] = useState<"reviews" | "surveys">("reviews");
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    Promise.allSettled([
      api.reputation.listReviews(),
      api.reputation.listSurveys(),
      api.reputation.reviewStats(),
    ]).then(([reviewsRes, surveysRes, statsRes]) => {
      if (reviewsRes.status === "fulfilled") setReviews(Array.isArray(reviewsRes.value) ? reviewsRes.value : []);
      if (surveysRes.status === "fulfilled") setSurveys(Array.isArray(surveysRes.value) ? surveysRes.value : []);
      if (statsRes.status === "fulfilled") setStats(statsRes.value);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const avgRating = stats?.avgRating != null ? Number(stats.avgRating).toFixed(1) : stats?.averageRating != null ? Number(stats.averageRating).toFixed(1) : reviews.length > 0 ? (reviews.reduce((s: number, r: any) => s + Number(r.rating || 0), 0) / reviews.length).toFixed(1) : "—";
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
    date: r.date || r.createdAt?.split("T")[0] || "—",
    responded: r.responded ?? (r.responses && r.responses.length > 0) ?? r.responseStatus === "RESPONDED" ?? false,
  }));

  const mappedSurveys = surveys.map((s: any) => ({
    id: s.id,
    name: s.name || s.title || "Untitled Survey",
    responses: Number(s._count?.responses ?? s.responses ?? s.responseCount ?? 0),
    avgScore: Number(s.avgScore ?? s.averageScore ?? 0).toFixed(1),
    lastResponse: s.lastResponse || s.lastResponseAt?.split("T")[0] || s.updatedAt?.split("T")[0] || "—",
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reputation Management</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor reviews, ratings and guest feedback</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Average Rating", value: avgRating, sub: "across all platforms", icon: Star, color: "bg-amber-50 text-amber-600" },
          { label: "Total Reviews", value: String(totalReviews), sub: "all time", icon: MessageSquare, color: "bg-blue-50 text-blue-600" },
          { label: "Positive", value: reviews.length > 0 ? `${positivePct}%` : "—", sub: "sentiment score", icon: ThumbsUp, color: "bg-green-50 text-green-600" },
          { label: "Response Rate", value: reviews.length > 0 ? `${responseRate}%` : "—", sub: "replied to reviews", icon: Send, color: "bg-purple-50 text-purple-600" },
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
        {(["reviews", "surveys"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm rounded-md transition-all ${tab === t ? "bg-white text-slate-900 shadow-sm font-medium" : "text-slate-500 hover:text-slate-700"}`}>
            {t === "reviews" ? "Guest Reviews" : "Surveys"}
          </button>
        ))}
      </div>

      {tab === "reviews" && (
        <div className="space-y-4">
          {mappedReviews.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <MessageSquare size={40} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-lg font-semibold text-slate-900 mb-1">No Reviews Yet</h3>
              <p className="text-sm text-slate-500">Guest reviews will appear here once they are submitted.</p>
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
                  <p className="text-sm text-slate-500 mt-0.5">by {r.guestName} &middot; {r.date}</p>
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
                  <span className="text-xs text-green-600 font-medium">Responded</span>
                ) : (
                  <button className="text-sm text-blue-600 hover:underline">Reply</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "surveys" && (
        <div className="space-y-4">
          {mappedSurveys.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Eye size={40} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-lg font-semibold text-slate-900 mb-1">No Surveys Yet</h3>
              <p className="text-sm text-slate-500">Create surveys to collect guest feedback.</p>
            </div>
          ) : mappedSurveys.map(s => (
            <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{s.name}</h3>
                  <p className="text-sm text-slate-500">Last response: {s.lastResponse}</p>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="text-lg font-bold text-slate-900">{s.responses}</div>
                    <div className="text-xs text-slate-500">Responses</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <Star size={16} className="text-amber-400 fill-amber-400" />
                      <span className="text-lg font-bold text-slate-900">{s.avgScore}</span>
                    </div>
                    <div className="text-xs text-slate-500">Avg Score</div>
                  </div>
                  <button className="px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50">View Results</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
