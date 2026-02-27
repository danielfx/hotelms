// Typed API client for HotelMS frontend
// Use relative URL so requests go through Next.js rewrites (avoids CORS)
const API_URL = "";

class ApiClient {
  private baseUrl: string;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = `${baseUrl}/api/v1`;
  }

  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  }

  private async tryRefresh(): Promise<boolean> {
    // Deduplicate concurrent refresh attempts — only one runs at a time
    if (this.refreshPromise) return this.refreshPromise;
    this.refreshPromise = (async () => {
      try {
        const refreshRes = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (refreshRes.ok) {
          const text = await refreshRes.text();
          try {
            const data = text ? JSON.parse(text) : {};
            if (data.data?.accessToken) {
              localStorage.setItem("accessToken", data.data.accessToken);
            }
          } catch {}
          return true;
        }
      } catch {}
      return false;
    })();
    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
    });

    if (res.status === 401) {
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        return this.request<T>(endpoint, options);
      }
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    const text = await res.text();
    let data: any;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(`Server returned non-JSON response (${res.status})`);
    }
    if (!res.ok) throw new Error(data.message?.message || data.message || "Request failed");
    return data.data ?? data;
  }

  get<T>(endpoint: string) { return this.request<T>(endpoint); }
  post<T>(endpoint: string, body?: unknown) { return this.request<T>(endpoint, { method: "POST", body: JSON.stringify(body) }); }
  put<T>(endpoint: string, body?: unknown) { return this.request<T>(endpoint, { method: "PUT", body: JSON.stringify(body) }); }
  patch<T>(endpoint: string, body?: unknown) { return this.request<T>(endpoint, { method: "PATCH", body: JSON.stringify(body) }); }
  delete<T>(endpoint: string) { return this.request<T>(endpoint, { method: "DELETE" }); }

  // ─── AUTH ──────────────────────────────────────────────────────────────────
  auth = {
    login: (email: string, password: string) => this.post<{ accessToken: string; user: any }>("/auth/login", { email, password }),
    logout: () => this.post("/auth/logout"),
    me: () => this.get<any>("/auth/me"),
    refresh: () => this.post<{ accessToken: string }>("/auth/refresh"),
    forgotPassword: (email: string) => this.post("/auth/forgot-password", { email }),
    resetPassword: (token: string, newPassword: string) => this.post("/auth/reset-password", { token, newPassword }),
    changePassword: (currentPassword: string, newPassword: string) => this.patch("/auth/change-password", { currentPassword, newPassword }),
    switchProperty: (propertyId: string) => this.post<{ accessToken: string; property: any }>("/auth/switch-property", { propertyId }),
  };

  // ─── ROOMS ─────────────────────────────────────────────────────────────────
  rooms = {
    list: (params?: Record<string, string>) => {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      return this.get<any[]>(`/rooms${q}`);
    },
    get: (id: string) => this.get<any>(`/rooms/${id}`),
    create: (data: any) => this.post<any>("/rooms", data),
    update: (id: string, data: any) => this.patch<any>(`/rooms/${id}`, data),
    updateStatus: (id: string, status: string, notes?: string) => this.patch<any>(`/rooms/${id}/status`, { status, notes }),
    delete: (id: string) => this.delete(`/rooms/${id}`),
    availability: (checkIn: string, checkOut: string) => this.get<any[]>(`/rooms/availability?checkIn=${checkIn}&checkOut=${checkOut}`),
  };

  // ─── RESERVATIONS ──────────────────────────────────────────────────────────
  reservations = {
    list: (params?: Record<string, string>) => {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      return this.get<any>(`/reservations${q}`);
    },
    get: (id: string) => this.get<any>(`/reservations/${id}`),
    create: (data: any) => this.post<any>("/reservations", data),
    update: (id: string, data: any) => this.patch<any>(`/reservations/${id}`, data),
    checkIn: (id: string, data?: any) => this.post<any>(`/reservations/${id}/checkin`, data),
    checkOut: (id: string, data?: any) => this.post<any>(`/reservations/${id}/checkout`, data),
    cancel: (id: string, reason?: string) => this.post<any>(`/reservations/${id}/cancel`, { reason }),
    noShow: (id: string) => this.post<any>(`/reservations/${id}/no-show`),
  };

  // ─── GUESTS ────────────────────────────────────────────────────────────────
  guests = {
    list: (params?: Record<string, string>) => {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      return this.get<any>(`/guests${q}`);
    },
    get: (id: string) => this.get<any>(`/guests/${id}`),
    create: (data: any) => this.post<any>("/guests", data),
    update: (id: string, data: any) => this.patch<any>(`/guests/${id}`, data),
    toggleVip: (id: string) => this.patch<any>(`/guests/${id}/vip`),
    search: (q: string) => this.get<any[]>(`/guests/search?q=${encodeURIComponent(q)}`),
  };

  // ─── FOLIO ─────────────────────────────────────────────────────────────────
  folio = {
    get: (reservationId: string) => this.get<any>(`/folio/reservation/${reservationId}`),
    getById: (folioId: string) => this.get<any>(`/folio/${folioId}`),
    addCharge: (folioId: string, data: any) => this.post<any>(`/folio/${folioId}/charges`, data),
    voidCharge: (chargeId: string) => this.patch<any>(`/folio/charges/${chargeId}/void`),
    close: (folioId: string) => this.post<any>(`/folio/${folioId}/close`),
    invoice: (folioId: string) => this.post<any>(`/folio/${folioId}/invoice`),
    addPayment: (reservationId: string, data: any) => this.post<any>(`/folio/reservation/${reservationId}/payments`, data),
  };

  // ─── RATES ─────────────────────────────────────────────────────────────────
  rates = {
    list: () => this.get<any[]>("/rates/plans"),
    get: (id: string) => this.get<any>(`/rates/plans/${id}`),
    create: (data: any) => this.post<any>("/rates/plans", data),
    update: (id: string, data: any) => this.patch<any>(`/rates/plans/${id}`, data),
    bulkUpdate: (data: any) => this.post<any>("/rates/bulk-update", data),
    duplicate: (id: string, data: { code: string; name: string }) => this.post<any>(`/rates/plans/${id}/duplicate`, data),
    dailyRates: (planId: string, params?: Record<string, string>) => {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      return this.get<any>(`/rates/plans/${planId}/daily${q}`);
    },
    setDailyRate: (planId: string, data: any) => this.post<any>(`/rates/plans/${planId}/daily`, data),
  };

  // ─── HOUSEKEEPING ──────────────────────────────────────────────────────────
  housekeeping = {
    list: (params?: Record<string, string>) => {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      return this.get<any>(`/housekeeping/tasks${q}`);
    },
    createTask: (data: any) => this.post<any>("/housekeeping/tasks", data),
    update: (id: string, data: any) => this.patch<any>(`/housekeeping/tasks/${id}`, data),
    assign: (id: string, attendantId: string) => this.post<any>(`/housekeeping/tasks/${id}/assign`, { attendantId }),
    start: (id: string) => this.post<any>(`/housekeeping/tasks/${id}/start`),
    complete: (id: string, data?: any) => this.post<any>(`/housekeeping/tasks/${id}/complete`, data),
    inspect: (id: string, data?: any) => this.post<any>(`/housekeeping/tasks/${id}/inspect`, data),
    generate: (date?: string) => this.post<any>("/housekeeping/schedule/generate", { date }),
    attendants: () => this.get<any[]>("/housekeeping/attendants"),
    stats: () => this.get<any>("/housekeeping/stats"),
    maintenance: (params?: Record<string, string>) => {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      return this.get<any>(`/housekeeping/maintenance${q}`);
    },
    createMaintenance: (data: any) => this.post<any>("/housekeeping/maintenance", data),
    resolveMaintenance: (id: string, data: any) => this.post<any>(`/housekeeping/maintenance/${id}/resolve`, data),
  };

  // ─── REPORTS ───────────────────────────────────────────────────────────────
  reports = {
    occupancy: (params: { from: string; to: string }) => this.get<any>(`/reports/occupancy?from=${params.from}&to=${params.to}`),
    revenue: (params: { from: string; to: string }) => this.get<any>(`/reports/revenue?from=${params.from}&to=${params.to}`),
    arrivals: (date: string) => this.get<any>(`/reports/arrivals?date=${date}`),
    departures: (date: string) => this.get<any>(`/reports/departures?date=${date}`),
    nightAudit: (date: string) => this.post<any>("/reports/night-audit", { date }),
    dashboard: () => this.get<any>("/reports/dashboard"),
    usali: (from: string, to: string) => this.get<any>(`/reports/usali?from=${from}&to=${to}`),
    usaliExpenses: (params?: Record<string, string>) => {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      return this.get<any[]>(`/reports/usali/expenses${q}`);
    },
    addExpense: (data: any) => this.post<any>("/reports/usali/expenses", data),
    deleteExpense: (id: string) => this.delete(`/reports/usali/expenses/${id}`),
  };

  // ─── CHANNELS ──────────────────────────────────────────────────────────────
  channels = {
    list: () => this.get<any[]>("/channels"),
    get: (id: string) => this.get<any>(`/channels/${id}`),
    connect: (channel: string, credentials: any) => this.post<any>("/channels/connect", { channel, ...credentials }),
    sync: (id: string, type?: string, dateRange?: { dateFrom: string; dateTo: string }) => {
      const body = dateRange ?? {};
      if (type === "rates") return this.post<any>(`/channels/${id}/sync/rates`, body);
      if (type === "inventory") return this.post<any>(`/channels/${id}/sync/inventory`, body);
      return this.post<any>(`/channels/${id}/sync/rates`, body);
    },
    syncAll: () => this.post<any>("/channels/sync-all"),
    pullReservations: (id: string) => this.post<any>(`/channels/${id}/pull/reservations`),
    disconnect: (id: string) => this.delete(`/channels/${id}`),
    logs: (id: string) => this.get<any[]>(`/channels/${id}/logs`),
  };

  // ─── PROPERTIES ───────────────────────────────────────────────────────────
  properties = {
    list: () => this.get<any[]>("/properties"),
    getCurrent: () => this.get<any>("/properties/current"),
    update: (data: any) => this.patch<any>("/properties/current", data),
    updateSettings: (data: any) => this.patch<any>("/properties/current/settings", data),
    getStats: () => this.get<any>("/properties/current/stats"),
  };

  // ─── COMMUNICATIONS ───────────────────────────────────────────────────────
  communications = {
    inbox: () => this.get<any>("/communications/inbox"),
    stats: () => this.get<any>("/communications/stats"),
    templates: () => this.get<any[]>("/communications/templates"),
    createTemplate: (data: any) => this.post<any>("/communications/templates", data),
    send: (data: any) => this.post<any>("/communications/send", data),
    bulk: (data: any) => this.post<any>("/communications/bulk", data),
    reply: (reservationId: string, data: any) => this.post<any>(`/communications/reservations/${reservationId}/reply`, data),
    sendConfirmation: (reservationId: string) => this.post<any>(`/communications/reservations/${reservationId}/booking-confirmation`),
    sendPreArrival: (reservationId: string) => this.post<any>(`/communications/reservations/${reservationId}/pre-arrival`),
    sendWelcome: (reservationId: string) => this.post<any>(`/communications/reservations/${reservationId}/welcome`),
    sendReceipt: (reservationId: string) => this.post<any>(`/communications/reservations/${reservationId}/checkout-receipt`),
    sendReviewRequest: (reservationId: string) => this.post<any>(`/communications/reservations/${reservationId}/review-request`),
  };

  // ─── CRM ──────────────────────────────────────────────────────────────────
  crm = {
    listSegments: () => this.get<any[]>("/crm/segments"),
    createSegment: (data: any) => this.post<any>("/crm/segments", data),
    updateSegment: (id: string, data: any) => this.patch<any>(`/crm/segments/${id}`, data),
    deleteSegment: (id: string) => this.delete(`/crm/segments/${id}`),
    listCampaigns: () => this.get<any[]>("/crm/campaigns"),
    getCampaign: (id: string) => this.get<any>(`/crm/campaigns/${id}`),
    createCampaign: (data: any) => this.post<any>("/crm/campaigns", data),
    updateCampaign: (id: string, data: any) => this.patch<any>(`/crm/campaigns/${id}`, data),
    sendCampaign: (id: string) => this.post<any>(`/crm/campaigns/${id}/send`),
    campaignAnalytics: (id: string) => this.get<any>(`/crm/campaigns/${id}/analytics`),
  };

  // ─── REVENUE INTELLIGENCE ─────────────────────────────────────────────────
  revenue = {
    listRules: () => this.get<any[]>("/revenue/rules"),
    createRule: (data: any) => this.post<any>("/revenue/rules", data),
    updateRule: (id: string, data: any) => this.patch<any>(`/revenue/rules/${id}`, data),
    deleteRule: (id: string) => this.delete(`/revenue/rules/${id}`),
    forecast: (from: string, to: string) => this.get<any[]>(`/revenue/forecast?from=${from}&to=${to}`),
    recommendations: (from: string, to: string) => this.get<any[]>(`/revenue/recommendations?from=${from}&to=${to}`),
    applyRecommendation: (id: string) => this.post<any>(`/revenue/recommendations/${id}/apply`),
    competitors: () => this.get<any>("/revenue/competitors"),
  };

  // ─── REPUTATION ───────────────────────────────────────────────────────────
  reputation = {
    listReviews: (source?: string) => this.get<any[]>(`/reputation/reviews${source ? `?source=${source}` : ''}`),
    reviewStats: () => this.get<any>("/reputation/reviews/stats"),
    createReview: (data: any) => this.post<any>("/reputation/reviews", data),
    respondToReview: (id: string, data: any) => this.post<any>(`/reputation/reviews/${id}/respond`, data),
    listSurveys: () => this.get<any[]>("/reputation/surveys"),
    createSurvey: (data: any) => this.post<any>("/reputation/surveys", data),
    getSurvey: (id: string) => this.get<any>(`/reputation/surveys/${id}`),
    surveyAnalytics: (id: string) => this.get<any>(`/reputation/surveys/${id}/analytics`),
  };

  // ─── PORTFOLIO ────────────────────────────────────────────────────────────
  portfolio = {
    dashboard: () => this.get<any>("/portfolio/dashboard"),
    kpis: (from: string, to: string) => this.get<any>(`/portfolio/kpis?from=${from}&to=${to}`),
    report: (from: string, to: string) => this.get<any>(`/portfolio/report?from=${from}&to=${to}`),
  };

  // ─── GROUPS & EVENTS ──────────────────────────────────────────────────────
  groups = {
    list: (status?: string) => this.get<any[]>(`/groups${status ? `?status=${status}` : ''}`),
    get: (id: string) => this.get<any>(`/groups/${id}`),
    create: (data: any) => this.post<any>("/groups", data),
    update: (id: string, data: any) => this.patch<any>(`/groups/${id}`, data),
    delete: (id: string) => this.delete(`/groups/${id}`),
    addBlock: (groupId: string, data: any) => this.post<any>(`/groups/${groupId}/blocks`, data),
    addRooming: (groupId: string, data: any) => this.post<any>(`/groups/${groupId}/rooming`, data),
    listEventSpaces: () => this.get<any[]>("/groups/events/spaces"),
    createEventSpace: (data: any) => this.post<any>("/groups/events/spaces", data),
    listEventBookings: (from?: string, to?: string) => this.get<any[]>(`/groups/events/bookings${from ? `?from=${from}&to=${to}` : ''}`),
    createEventBooking: (data: any) => this.post<any>("/groups/events/bookings", data),
  };

  // ─── MARKETPLACE ──────────────────────────────────────────────────────────
  marketplace = {
    listApiKeys: () => this.get<any[]>("/marketplace/api-keys"),
    createApiKey: (data: any) => this.post<any>("/marketplace/api-keys", data),
    revokeApiKey: (id: string) => this.post<any>(`/marketplace/api-keys/${id}/revoke`),
    deleteApiKey: (id: string) => this.delete(`/marketplace/api-keys/${id}`),
    listWebhooks: () => this.get<any[]>("/marketplace/webhooks"),
    createWebhook: (data: any) => this.post<any>("/marketplace/webhooks", data),
    updateWebhook: (id: string, data: any) => this.patch<any>(`/marketplace/webhooks/${id}`, data),
    deleteWebhook: (id: string) => this.delete(`/marketplace/webhooks/${id}`),
    webhookDeliveries: (id: string) => this.get<any[]>(`/marketplace/webhooks/${id}/deliveries`),
    testWebhook: (id: string) => this.post<any>(`/marketplace/webhooks/${id}/test`),
    listIntegrations: () => this.get<any[]>("/marketplace/integrations"),
    catalog: () => this.get<any[]>("/marketplace/catalog"),
    installIntegration: (slug: string, config?: any) => this.post<any>(`/marketplace/integrations/${slug}/install`, { config }),
    uninstallIntegration: (slug: string) => this.post<any>(`/marketplace/integrations/${slug}/uninstall`),
    toggleIntegration: (id: string, enabled: boolean) => this.patch<any>(`/marketplace/integrations/${id}/toggle`, { enabled }),
  };

  // ─── AUDIT ────────────────────────────────────────────────────────────────
  audit = {
    searchLogs: (params?: Record<string, string>) => {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      return this.get<any>(`/audit/logs${q}`);
    },
    logStats: () => this.get<any>("/audit/logs/stats"),
    exportGuestData: (guestId: string) => this.get<any>(`/audit/gdpr/export/${guestId}`),
    deleteGuestData: (guestId: string) => this.post<any>(`/audit/gdpr/delete/${guestId}`),
    permissions: () => this.get<any>("/audit/permissions"),
  };

  // ─── ONBOARDING & HELP ────────────────────────────────────────────────────
  onboarding = {
    getProgress: () => this.get<any>("/onboarding/progress"),
    completeStep: (step: string, data?: any) => this.post<any>(`/onboarding/progress/${step}`, { data }),
    resetProgress: () => this.post<any>("/onboarding/progress/reset"),
    helpCategories: () => this.get<any[]>("/onboarding/help/categories"),
    helpArticles: (category?: string) => this.get<any[]>(`/onboarding/help/articles${category ? `?category=${category}` : ''}`),
    helpArticle: (slug: string) => this.get<any>(`/onboarding/help/articles/${slug}`),
  };

  // ─── ROOM SERVICE ───────────────────────────────────────────────────────
  roomService = {
    listMenu: (params?: Record<string, string>) => {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      return this.get<any[]>(`/room-service/menu${q}`);
    },
    createMenuItem: (data: any) => this.post<any>("/room-service/menu", data),
    updateMenuItem: (id: string, data: any) => this.patch<any>(`/room-service/menu/${id}`, data),
    toggleAvailability: (id: string) => this.patch<any>(`/room-service/menu/${id}/availability`),
    deleteMenuItem: (id: string) => this.delete(`/room-service/menu/${id}`),
    listOrders: (params?: Record<string, string>) => {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      return this.get<any[]>(`/room-service/orders${q}`);
    },
    getOrder: (id: string) => this.get<any>(`/room-service/orders/${id}`),
    createOrder: (data: any) => this.post<any>("/room-service/orders", data),
    updateOrderStatus: (id: string, status: string) => this.patch<any>(`/room-service/orders/${id}/status`, { status }),
    stats: () => this.get<any>("/room-service/stats"),
  };

  // ─── BILLING ──────────────────────────────────────────────────────────────
  billing = {
    plans: () => this.get<any[]>("/billing/plans"),
    getSubscription: () => this.get<any>("/billing/subscription"),
    createSubscription: (data: any) => this.post<any>("/billing/subscription", data),
    updateSubscription: (data: any) => this.patch<any>("/billing/subscription", data),
    cancelSubscription: () => this.post<any>("/billing/subscription/cancel"),
    invoices: () => this.get<any[]>("/billing/invoices"),
    invoice: (id: string) => this.get<any>(`/billing/invoices/${id}`),
    usage: () => this.get<any>("/billing/usage"),
  };
}

export const api = new ApiClient(API_URL);
export default api;
