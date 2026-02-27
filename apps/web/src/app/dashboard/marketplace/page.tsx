"use client";
import { useState, useEffect, useCallback } from "react";
import { Key, Globe, Puzzle, Plus, Copy, Trash2, Check, X, RefreshCw, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import api from "@/lib/api";

const AVAILABLE_SCOPES = ["READ", "WRITE", "ADMIN", "BILLING", "REPORTS"];
const AVAILABLE_EVENTS = [
  "reservation.created",
  "reservation.updated",
  "reservation.cancelled",
  "guest.created",
  "guest.updated",
  "payment.received",
  "room.status_changed",
];

function NewApiKeyModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const t = useTranslations("marketplace");
  const tc = useTranslations("common");
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleScope = (scope: string) => {
    setScopes(prev => prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const result = await api.marketplace.createApiKey({ name: name.trim(), scopes });
      const generatedKey = result?.key || result?.apiKey || result?.token || "";
      if (generatedKey) {
        alert(`API Key created successfully!\n\nKey: ${generatedKey}\n\nCopy this key now -- you won't be able to see it again.`);
      } else {
        alert("API Key created successfully!");
      }
      onCreated();
      onClose();
    } catch (e: any) {
      alert(e.message || "Failed to create API key");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">{t("newApiKey")}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t("apiKeyName")}</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Production Key"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t("scopes")}</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_SCOPES.map(scope => (
                <button
                  key={scope}
                  type="button"
                  onClick={() => toggleScope(scope)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    scopes.includes(scope)
                      ? "bg-blue-50 border-blue-300 text-blue-700"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {scopes.includes(scope) && <Check size={12} className="inline mr-1" />}
                  {scope}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">{tc("cancel")}</button>
          <button
            onClick={handleSubmit}
            disabled={saving || !name.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? tc("creating") : t("createKey")}
          </button>
        </div>
      </div>
    </div>
  );
}

function NewWebhookModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const t = useTranslations("marketplace");
  const tc = useTranslations("common");
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>([]);
  const [secret, setSecret] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleEvent = (event: string) => {
    setEvents(prev => prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]);
  };

  const handleSubmit = async () => {
    if (!url.trim()) return;
    setSaving(true);
    try {
      await api.marketplace.createWebhook({ url: url.trim(), events, secret: secret.trim() || undefined });
      alert("Webhook created successfully!");
      onCreated();
      onClose();
    } catch (e: any) {
      alert(e.message || "Failed to create webhook");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">{t("newWebhook")}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t("url")}</label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com/webhook"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t("secret")}</label>
            <input
              type="text"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              placeholder="Signing secret"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t("events")}</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_EVENTS.map(event => (
                <button
                  key={event}
                  type="button"
                  onClick={() => toggleEvent(event)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    events.includes(event)
                      ? "bg-blue-50 border-blue-300 text-blue-700"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {events.includes(event) && <Check size={12} className="inline mr-1" />}
                  {event}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">{tc("cancel")}</button>
          <button
            onClick={handleSubmit}
            disabled={saving || !url.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? tc("creating") : t("createWebhook")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const t = useTranslations("marketplace");
  const tc = useTranslations("common");
  const [tab, setTab] = useState<"catalog" | "api-keys" | "webhooks">("catalog");
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [showNewApiKey, setShowNewApiKey] = useState(false);
  const [showNewWebhook, setShowNewWebhook] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [keys, hooks, integrations] = await Promise.all([
        api.marketplace.listApiKeys().catch(() => []),
        api.marketplace.listWebhooks().catch(() => []),
        api.marketplace.listIntegrations().catch(() => []),
      ]);
      setApiKeys(Array.isArray(keys) ? keys : []);
      setWebhooks(Array.isArray(hooks) ? hooks : []);
      setCatalog(Array.isArray(integrations) ? integrations : []);
    } catch {
      // fallback to empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      {showNewApiKey && <NewApiKeyModal onClose={() => setShowNewApiKey(false)} onCreated={loadData} />}
      {showNewWebhook && <NewWebhookModal onClose={() => setShowNewWebhook(false)} onCreated={loadData} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
          <p className="text-slate-500 text-sm mt-1">{t("subtitle")}</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          onClick={() => {
            if (tab === "api-keys") setShowNewApiKey(true);
            else if (tab === "webhooks") setShowNewWebhook(true);
          }}
        >
          <Plus size={16} /> {tab === "api-keys" ? t("newApiKey") : tab === "webhooks" ? t("newWebhook") : t("browse")}
        </button>
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {(["catalog", "api-keys", "webhooks"] as const).map(tb => (
          <button key={tb} onClick={() => setTab(tb)} className={`px-4 py-2 text-sm rounded-md transition-all ${tab === tb ? "bg-white text-slate-900 shadow-sm font-medium" : "text-slate-500 hover:text-slate-700"}`}>
            {tb === "catalog" ? t("catalog") : tb === "api-keys" ? t("apiKeys") : t("webhooks")}
          </button>
        ))}
      </div>

      {tab === "catalog" && (
        catalog.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Puzzle size={40} className="mx-auto text-slate-300 mb-3" />
            <h3 className="font-semibold text-slate-700 mb-1">{t("noIntegrations")}</h3>
            <p className="text-sm text-slate-500">{t("noIntegrationsDesc")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {catalog.map((app: any) => (
              <div key={app.id || app.slug} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Puzzle size={24} className="text-slate-400" />
                  </div>
                  {app.installed ? (
                    <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">{t("installed")}</span>
                  ) : (
                    <button
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700"
                      onClick={async () => {
                        if (!confirm(`Install ${app.name}?`)) return;
                        try {
                          await api.marketplace.installIntegration(app.slug || app.id);
                          loadData();
                        } catch (e: any) {
                          alert(e.message || "Failed to install");
                        }
                      }}
                    >{t("install")}</button>
                  )}
                </div>
                <h3 className="font-semibold text-slate-900">{app.name}</h3>
                <p className="text-xs text-slate-500 mb-2">{app.category}</p>
                <p className="text-sm text-slate-600">{app.description}</p>
              </div>
            ))}
          </div>
        )
      )}

      {tab === "api-keys" && (
        <div className="bg-white rounded-xl border border-slate-200">
          {apiKeys.length === 0 ? (
            <div className="p-12 text-center">
              <Key size={40} className="mx-auto text-slate-300 mb-3" />
              <h3 className="font-semibold text-slate-700 mb-1">{t("noApiKeys")}</h3>
              <p className="text-sm text-slate-500">{t("noApiKeysDesc")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-slate-500 border-b border-slate-100">
                    <th className="p-4 font-medium">{tc("name")}</th>
                    <th className="p-4 font-medium">{t("keyPrefix")}</th>
                    <th className="p-4 font-medium">{t("scopes")}</th>
                    <th className="p-4 font-medium text-center">{tc("status")}</th>
                    <th className="p-4 font-medium">{t("lastUsed")}</th>
                    <th className="p-4 font-medium text-right">{tc("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.map((k: any) => (
                    <tr key={k.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="p-4 font-medium text-slate-900">{k.name}</td>
                      <td className="p-4 font-mono text-sm text-slate-600">{k.keyPrefix || k.prefix || "***"}...</td>
                      <td className="p-4">
                        <div className="flex gap-1 flex-wrap">
                          {(Array.isArray(k.scopes) ? k.scopes : []).map((s: string) => <span key={s} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">{s}</span>)}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${k.isActive !== false ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                          {k.isActive !== false ? tc("active") : t("revoke")}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-500">{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : t("never")}</td>
                      <td className="p-4 text-right">
                        {k.isActive !== false && (
                          <button
                            className="text-red-600 text-sm hover:underline"
                            onClick={async () => {
                              if (!confirm("Revoke this API key?")) return;
                              try {
                                await api.marketplace.revokeApiKey(k.id);
                                loadData();
                              } catch (e: any) {
                                alert(e.message || "Failed to revoke key");
                              }
                            }}
                          >{t("revoke")}</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "webhooks" && (
        <div className="space-y-4">
          {webhooks.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Globe size={40} className="mx-auto text-slate-300 mb-3" />
              <h3 className="font-semibold text-slate-700 mb-1">{t("noWebhooks")}</h3>
              <p className="text-sm text-slate-500">{t("noWebhooksDesc")}</p>
            </div>
          ) : (
            webhooks.map((w: any) => (
              <div key={w.id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Globe size={16} className="text-slate-400" />
                      <span className="font-mono text-sm text-slate-700">{w.url}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${w.isActive !== false ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                        {w.isActive !== false ? tc("active") : tc("inactive")}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="p-1.5 text-slate-400 hover:text-blue-600"
                      onClick={async () => {
                        try {
                          await api.marketplace.testWebhook(w.id);
                          alert("Test webhook sent");
                        } catch (e: any) {
                          alert(e.message || "Failed to test webhook");
                        }
                      }}
                    ><RefreshCw size={14} /></button>
                    <button
                      className="p-1.5 text-slate-400 hover:text-red-600"
                      onClick={async () => {
                        if (!confirm("Delete this webhook?")) return;
                        try {
                          await api.marketplace.deleteWebhook(w.id);
                          loadData();
                        } catch (e: any) {
                          alert(e.message || "Failed to delete webhook");
                        }
                      }}
                    ><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {(Array.isArray(w.events) ? w.events : []).map((e: string) => <span key={e} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{e}</span>)}
                </div>
                <p className="text-xs text-slate-500">{t("lastDelivery")}: {w.lastDelivery ? new Date(w.lastDelivery).toLocaleString() : t("never")}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
