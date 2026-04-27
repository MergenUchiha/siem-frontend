/**
 * api.ts — centralized API layer
 *
 * Improvements over the original:
 *  - Single `apiFetch` helper handles auth headers, JSON parsing and unified error format
 *  - All services use the helper — no copy-pasted getAuthHeaders() across classes
 *  - Proper TypeScript generics on every method
 *  - No mixed `fetch` + `axios` — pure fetch everywhere
 *  - `ApiError` class lets callers do `err instanceof ApiError` and read `.status`
 */

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE_URL =
    (import.meta.env.VITE_API_URL as string) || "http://localhost:3001/api";

// ─── Error type ───────────────────────────────────────────────────────────────

export class ApiError extends Error {
    constructor(
        public readonly status: number,
        message: string,
        public readonly data?: unknown,
    ) {
        super(message);
        this.name = "ApiError";
    }
}

// ─── Domain types ─────────────────────────────────────────────────────────────

export type SeverityLevel = "critical" | "high" | "medium" | "low" | "info";
export type IncidentStatus = "open" | "investigating" | "resolved" | "closed";

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt?: string;
}

export interface AuthResponse {
    user: UserProfile;
    token: string;
}

export interface Log {
    id: string;
    timestamp: string;
    source: string;
    severity: SeverityLevel;
    message: string;
    ip: string;
    user?: string;
    action: string;
    details?: Record<string, unknown>;
}

export interface Incident {
    id: string;
    title: string;
    severity: SeverityLevel;
    status: IncidentStatus;
    timestamp: string;
    affectedSystems: string[];
    description: string;
    assignedTo?: string;
    tags?: string[];
    resolvedAt?: string;
}

export interface DashboardMetrics {
    totalEvents: number;
    criticalAlerts: number;
    activeIncidents: number;
    securityScore: number;
    threatsBlocked: number;
    lastUpdate: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface WebhookConfig {
    enabled: boolean;
    host: string;
    port: string;
    path: string;
    apiKey: string;
}

export interface PullResult {
    fetched: number;
    saved: number;
    errors: number;
    logs: Log[];
}

export interface AutoPullStatus {
    running: boolean;
    intervalSeconds: number;
    lastPullAt: string | null;
    lastPullResult: PullResult | null;
}

// ─── Core fetch helper ────────────────────────────────────────────────────────

async function apiFetch<T>(
    path: string,
    options: RequestInit & {
        params?: Record<string, string | number | undefined>;
    } = {},
): Promise<T> {
    const { params, ...init } = options;

    // Build URL with optional query params
    let url = `${BASE_URL}${path}`;
    if (params) {
        const qs = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null) qs.set(k, String(v));
        });
        const str = qs.toString();
        if (str) url += `?${str}`;
    }

    // Attach auth header if token exists
    const token = localStorage.getItem("token");
    const headers = new Headers(init.headers);
    if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(url, { ...init, headers });

    if (!res.ok) {
        let errData: unknown;
        try {
            errData = await res.json();
        } catch {
            errData = null;
        }
        const message =
            (errData as any)?.message ??
            `HTTP ${res.status}: ${res.statusText}`;
        throw new ApiError(res.status, message, errData);
    }

    // 204 No Content → return empty
    if (res.status === 204) return undefined as unknown as T;

    return res.json() as Promise<T>;
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const authApi = {
    login: (email: string, password: string) =>
        apiFetch<AuthResponse>("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        }),

    register: (email: string, password: string, name: string) =>
        apiFetch<AuthResponse>("/auth/register", {
            method: "POST",
            body: JSON.stringify({ email, password, name }),
        }),
};

// ─── Logs API ─────────────────────────────────────────────────────────────────

export interface LogFilters {
    page?: number;
    limit?: number;
    severity?: SeverityLevel;
    source?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
}

export const logsApi = {
    getAll: (filters: LogFilters = {}) =>
        apiFetch<PaginatedResponse<Log>>("/logs", { params: filters as any }),

    getOne: (id: string) => apiFetch<Log>(`/logs/${id}`),

    create: (data: Omit<Log, "id" | "timestamp">) =>
        apiFetch<Log>("/logs", { method: "POST", body: JSON.stringify(data) }),

    getSources: () => apiFetch<string[]>("/logs/sources"),
};

// ─── Incidents API ────────────────────────────────────────────────────────────

export interface CreateIncidentPayload {
    title: string;
    severity: SeverityLevel;
    affectedSystems: string[];
    description: string;
    assignedTo?: string;
    tags?: string[];
}

export interface UpdateIncidentPayload {
    status?: IncidentStatus;
    assignedTo?: string;
    description?: string;
    tags?: string[];
}

export const incidentsApi = {
    getAll: (filters?: { status?: IncidentStatus; severity?: SeverityLevel }) =>
        apiFetch<Incident[]>("/incidents", { params: filters as any }),

    getOne: (id: string) => apiFetch<Incident>(`/incidents/${id}`),

    create: (data: CreateIncidentPayload) =>
        apiFetch<Incident>("/incidents", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    update: (id: string, data: UpdateIncidentPayload) =>
        apiFetch<Incident>(`/incidents/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),

    delete: (id: string) =>
        apiFetch<void>(`/incidents/${id}`, { method: "DELETE" }),
};

// ─── Analytics API ────────────────────────────────────────────────────────────

export const analyticsApi = {
    getDashboard: () => apiFetch<DashboardMetrics>("/analytics/dashboard"),

    getTimeSeries: (hours = 24) =>
        apiFetch<Array<Record<string, unknown>>>("/analytics/time-series", {
            params: { hours },
        }),

    getSourceDistribution: () =>
        apiFetch<Array<{ source: string; count: number; percentage: string }>>(
            "/analytics/sources",
        ),

    getSeverityDistribution: () =>
        apiFetch<Array<{ name: string; value: number }>>("/analytics/severity"),
};

// ─── Settings / Integrations API ──────────────────────────────────────────────

export const settingsApi = {
    getWebhookConfig: () => apiFetch<WebhookConfig>("/settings/webhook"),

    saveWebhookConfig: (config: WebhookConfig) =>
        apiFetch<WebhookConfig>("/settings/webhook", {
            method: "POST",
            body: JSON.stringify(config),
        }),

    pullLogs: (params: { limit?: number; since?: string } = {}) =>
        apiFetch<PullResult>("/settings/webhook/pull", {
            method: "POST",
            body: JSON.stringify(params),
        }),

    getAutoPullStatus: () =>
        apiFetch<AutoPullStatus>("/settings/auto-pull"),

    startAutoPull: (intervalSeconds?: number) =>
        apiFetch<AutoPullStatus>("/settings/auto-pull", {
            method: "POST",
            body: JSON.stringify({ intervalSeconds }),
        }),

    stopAutoPull: () =>
        apiFetch<AutoPullStatus>("/settings/auto-pull", {
            method: "DELETE",
        }),

    getAll: () => apiFetch<Record<string, unknown>>("/settings"),

    saveAll: (data: Record<string, unknown>) =>
        apiFetch<Record<string, unknown>>("/settings", {
            method: "POST",
            body: JSON.stringify(data),
        }),
};
