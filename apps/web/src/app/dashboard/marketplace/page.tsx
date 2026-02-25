"use client";
import { useState, useEffect } from "react";
import { Key, Globe, Puzzle, Plus, Copy, Trash2, Check, X, RefreshCw, ExternalLink } from "lucide-react";
import api from "@/lib/api";

export default function MarketplacePage() {
  const [tab, setTab] = useState<"catalog" | "api-keys" | "webhooks">("catalog");
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
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
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Marketplace & Integrations</h1>
          <p className="text-slate-500 text-sm mt-1">Manage API keys, webhooks, and third-party integrations</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Marketplace & Integrations</h1>
          <p className="text-slate-500 text-sm mt-1">Manage API keys, webhooks, and third-party integrations</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus size={16} /> {tab === "api-keys" ? "New API Key" : tab === "webhooks" ? "New Webhook" : "Browse"}
        </button>
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {(["catalog", "api-keys", "webhooks"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm rounded-md transition-all ${tab === t ? "bg-white text-slate-900 shadow-sm font-medium" : "text-slate-500 hover:text-slate-700"}`}>
            {t === "catalog" ? "Integration Catalog" : t === "api-keys" ? "API Keys" : "Webhooks"}
          </button>
        ))}
      </div>

      {tab === "catalog" && (
        catalog.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Puzzle size={40} className="mx-auto text-slate-300 mb-3" />
            <h3 className="font-semibold text-slate-700 mb-1">No integrations available</h3>
            <p className="text-sm text-slate-500">Third-party integrations will appear here once configured.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {catalog.map((app: any) => (
              <div key={app.id || app.slug} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Puzzle size={24} className="text-slate-400" />
                  </div>
                  {app.installed ? (
                    <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">Installed</span>
                  ) : (
                    <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700">Install</button>
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
              <h3 className="font-semibold text-slate-700 mb-1">No API keys</h3>
              <p className="text-sm text-slate-500">Create an API key to get started with the API.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-slate-500 border-b border-slate-100">
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Key Prefix</th>
                  <th className="p-4 font-medium">Scopes</th>
                  <th className="p-4 font-medium text-center">Status</th>
                  <th className="p-4 font-medium">Last Used</th>
                  <th className="p-4 font-medium text-right">Actions</th>
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
                        {k.isActive !== false ? "Active" : "Revoked"}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-500">{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : "Never"}</td>
                    <td className="p-4 text-right">
                      {k.isActive !== false && <button className="text-red-600 text-sm hover:underline">Revoke</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "webhooks" && (
        <div className="space-y-4">
          {webhooks.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Globe size={40} className="mx-auto text-slate-300 mb-3" />
              <h3 className="font-semibold text-slate-700 mb-1">No webhooks configured</h3>
              <p className="text-sm text-slate-500">Create a webhook to receive real-time event notifications.</p>
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
                        {w.isActive !== false ? "Active" : "Disabled"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-1.5 text-slate-400 hover:text-blue-600"><RefreshCw size={14} /></button>
                    <button className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {(Array.isArray(w.events) ? w.events : []).map((e: string) => <span key={e} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{e}</span>)}
                </div>
                <p className="text-xs text-slate-500">Last delivery: {w.lastDelivery ? new Date(w.lastDelivery).toLocaleString() : "Never"}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
