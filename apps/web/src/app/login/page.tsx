"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import api from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations("login");
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const demoUsers = [
    { label: "General Manager", email: "manager@grandplaza.com", password: "Manager123!" },
    { label: "Front Desk", email: "frontdesk@grandplaza.com", password: "Frontdesk123!" },
    { label: "Revenue Manager", email: "revenue@grandplaza.com", password: "Revenue123!" },
    { label: "Housekeeping", email: "housekeeping@grandplaza.com", password: "Housekeeping123!" },
  ];

  const doLogin = async (email: string, password: string) => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message?.message || data.message || "Invalid credentials");
      }

      // Store token and user
      localStorage.setItem("accessToken", data.data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.data.user));

      // Set cookie so middleware can check auth
      document.cookie = `accessToken=${data.data.accessToken}; path=/; max-age=${15 * 60}; SameSite=Lax`;

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    doLogin(form.email, form.password);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-violet-600/10" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />

        {/* Logo */}
        <div className="relative">
          <div className="text-2xl font-extrabold text-white tracking-tight">
            <span className="text-blue-400">Hotel</span>MS
          </div>
          <div className="text-sm text-slate-500 mt-1">Property Management System</div>
        </div>

        {/* Main copy */}
        <div className="relative space-y-6">
          <h1 className="text-5xl font-extrabold text-white leading-tight tracking-tight">
            {t("manageEntireHotel")}
          </h1>
          <p className="text-slate-400 text-lg max-w-sm leading-relaxed">
            {t("pmsDescription")}
          </p>
        </div>

        {/* Stats */}
        <div className="relative grid grid-cols-3 gap-6">
          {[
            { value: "20+", label: "Modules" },
            { value: "500+", label: "Features" },
            { value: "99.9%", label: "Uptime SLA" },
          ].map(({ value, label }) => (
            <div key={label} className="border border-white/10 rounded-2xl p-4 bg-white/5 backdrop-blur-sm">
              <div className="text-2xl font-extrabold text-white">{value}</div>
              <div className="text-xs text-slate-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="text-2xl font-extrabold text-slate-900">
              <span className="text-blue-500">Hotel</span>MS
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-slate-900">{t("welcomeBack")}</h2>
            <p className="text-slate-500 mt-1.5 text-sm">{t("signInSubtitle")}</p>
          </div>

          {/* Demo users */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t("quickDemoLogin")}</p>
            <div className="grid grid-cols-2 gap-2">
              {demoUsers.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => { setForm({ email: u.email, password: u.password }); doLogin(u.email, u.password); }}
                  className="text-left px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
                >
                  <div className="text-xs font-semibold text-slate-700 group-hover:text-blue-600">{u.label}</div>
                  <div className="text-[10px] text-slate-400 truncate">{u.email}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">{t("orSignInManually")}</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2.5">
                <span className="text-red-500 text-sm">⚠</span>
                <span className="text-red-600 text-sm">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t("email")}</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="you@hotel.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-600">{t("password")}</label>
                <button type="button" onClick={() => setShowForgot(true)} className="text-xs text-blue-500 hover:text-blue-600 font-medium">{t("forgotPassword")}</button>
              </div>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-medium"
                >
                  {showPass ? t("hide") : t("show")}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-500/25 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t("signingIn")}
                </span>
              ) : (
                t("signIn")
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6">
            {t("termsIntro")}{" "}
            <button type="button" onClick={() => alert("Terms of Service: Standard hotel management SaaS terms apply. Usage is subject to our service agreement.")} className="text-blue-500 hover:underline">{t("termsOfService")}</button>{" "}
            {t("and")}{" "}
            <button type="button" onClick={() => alert("Privacy Policy: Your data is encrypted and stored securely. We comply with GDPR and industry standards.")} className="text-blue-500 hover:underline">{t("privacyPolicy")}</button>.
          </p>

          {/* Forgot password modal */}
          {showForgot && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
                <h3 className="font-bold text-slate-900">{t("resetPassword")}</h3>
                {forgotSent ? (
                  <div className="text-sm text-emerald-600 bg-emerald-50 rounded-xl p-4">
                    Reset link sent to <strong>{forgotEmail}</strong>. Check your inbox.
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-slate-500">Enter your email and we&apos;ll send you a reset link.</p>
                    <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
                    <button type="button" onClick={async () => {
                      if (!forgotEmail) return;
                      setForgotLoading(true);
                      try {
                        await api.auth.forgotPassword(forgotEmail);
                        setForgotSent(true);
                      } catch (e: any) { alert(e.message || "Failed to send reset link"); }
                      setForgotLoading(false);
                    }} disabled={forgotLoading || !forgotEmail}
                      className="w-full py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">
                      {forgotLoading ? t("sending") : t("sendResetLink")}
                    </button>
                  </>
                )}
                <button type="button" onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail(""); }}
                  className="w-full py-2 text-sm text-slate-500 hover:text-slate-700">{t("backToLogin")}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
