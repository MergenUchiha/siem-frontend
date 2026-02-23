// API Service for SIEM Frontend
// Connects to NestJS Backend

const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// ============================================================================
// TYPES
// ============================================================================

export interface FileUploadResponse {
    id: string;
    fileName: string;
    fileSize: number;
    filePath: string;
    mimeType: string;
    fileHash: string | null;
    uploadDate: string;
    updatedAt: string;
}

export interface AnalysisResponse {
    id: string;
    fileId: string;
    status: "SCANNING" | "COMPLETED" | "FAILED";
    threat: "SAFE" | "SUSPICIOUS" | "MALICIOUS" | null;
    confidence: number | null;
    features: any;
    mlMetrics: any;
    createdAt: string;
    updatedAt: string;
    file?: FileUploadResponse;
}

export interface StatisticsResponse {
    totalScans: number;
    completed: number;
    scanning: number;
    failed: number;
    threatsDetected: number;
    safeFiles: number;
    suspiciousFiles: number;
    averageConfidence: number;
}

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: string;
}

export interface AuthResponse {
    user: UserProfile;
    message: string;
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
    logs: any[];
}

// ============================================================================
// FIX: helper — attach JWT token to every authenticated request
// ============================================================================

const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("token");
    return token
        ? {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
          }
        : { "Content-Type": "application/json" };
};

// ============================================================================
// MAIN API CLASS  (files / analysis / statistics / model)
// ============================================================================

class ApiService {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    // --------------------------------------------------------------------------
    // AUTH ENDPOINTS
    // --------------------------------------------------------------------------

    login = async (email: string, password: string): Promise<AuthResponse> => {
        console.log("🔐 API: Attempting login for:", email);
        console.log("🌐 API: Calling:", `${this.baseUrl}/auth/login`);

        try {
            const response = await fetch(`${this.baseUrl}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            console.log("📡 API: Response status:", response.status);

            if (!response.ok) {
                const error = await response.json();
                console.error("❌ API: Login failed:", error);
                throw new Error(error.message || "Invalid email or password");
            }

            const data = await response.json();
            console.log("✅ API: Login successful:", data.user.name);
            return data;
        } catch (error: any) {
            console.error("❌ API: Login error:", error);
            throw error;
        }
    };

    register = async (
        email: string,
        password: string,
        name: string,
    ): Promise<AuthResponse> => {
        console.log("📝 API: Attempting registration for:", email);
        console.log("🌐 API: Calling:", `${this.baseUrl}/auth/register`);

        try {
            const response = await fetch(`${this.baseUrl}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, name }),
            });

            console.log("📡 API: Response status:", response.status);

            if (!response.ok) {
                const error = await response.json();
                console.error("❌ API: Registration failed:", error);
                throw new Error(error.message || "Registration failed");
            }

            const data = await response.json();
            console.log("✅ API: Registration successful:", data.user.name);
            return data;
        } catch (error: any) {
            console.error("❌ API: Registration error:", error);
            throw error;
        }
    };

    getProfile = async (userId: string): Promise<UserProfile> => {
        console.log("👤 API: Fetching profile for:", userId);

        const response = await fetch(`${this.baseUrl}/auth/profile/${userId}`, {
            headers: getAuthHeaders(),
        });

        if (!response.ok) throw new Error("Failed to fetch profile");
        return response.json();
    };

    // --------------------------------------------------------------------------
    // FILES ENDPOINTS
    // --------------------------------------------------------------------------

    uploadFile = async (file: File): Promise<FileUploadResponse> => {
        const formData = new FormData();
        formData.append("file", file);

        const token = localStorage.getItem("token");
        const response = await fetch(`${this.baseUrl}/files/upload`, {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to upload file");
        }

        return response.json();
    };

    getFileById = async (id: string): Promise<FileUploadResponse> => {
        const response = await fetch(`${this.baseUrl}/files/${id}`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error("Failed to fetch file");
        return response.json();
    };

    getAllFiles = async (): Promise<FileUploadResponse[]> => {
        const response = await fetch(`${this.baseUrl}/files`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error("Failed to fetch files");
        return response.json();
    };

    deleteFile = async (id: string): Promise<void> => {
        const response = await fetch(`${this.baseUrl}/files/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error("Failed to delete file");
    };

    // --------------------------------------------------------------------------
    // ANALYSIS ENDPOINTS
    // --------------------------------------------------------------------------

    startAnalysis = async (fileId: string): Promise<AnalysisResponse> => {
        const response = await fetch(`${this.baseUrl}/analysis/scan`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ fileId }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to start analysis");
        }

        return response.json();
    };

    getAnalysisById = async (id: string): Promise<AnalysisResponse> => {
        const response = await fetch(`${this.baseUrl}/analysis/${id}`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error("Failed to fetch analysis");
        return response.json();
    };

    getAnalysisByFileId = async (fileId: string): Promise<AnalysisResponse> => {
        const response = await fetch(
            `${this.baseUrl}/analysis/file/${fileId}`,
            { headers: getAuthHeaders() },
        );
        if (!response.ok) throw new Error("Failed to fetch analysis");
        return response.json();
    };

    getAllAnalyses = async (params?: {
        status?: string;
        threat?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        data: AnalysisResponse[];
        total: number;
        limit: number;
        offset: number;
    }> => {
        const queryParams = new URLSearchParams();
        if (params?.status) queryParams.append("status", params.status);
        if (params?.threat) queryParams.append("threat", params.threat);
        if (params?.limit) queryParams.append("limit", params.limit.toString());
        if (params?.offset)
            queryParams.append("offset", params.offset.toString());

        const url = `${this.baseUrl}/analysis${queryParams.toString() ? "?" + queryParams.toString() : ""}`;
        const response = await fetch(url, { headers: getAuthHeaders() });

        if (!response.ok) throw new Error("Failed to fetch analyses");
        return response.json();
    };

    // --------------------------------------------------------------------------
    // STATISTICS ENDPOINTS
    // --------------------------------------------------------------------------

    getStatistics = async (): Promise<StatisticsResponse> => {
        const response = await fetch(`${this.baseUrl}/statistics/overview`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error("Failed to fetch statistics");
        return response.json();
    };

    getThreatDistribution = async (): Promise<any> => {
        const response = await fetch(`${this.baseUrl}/statistics/threats`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok)
            throw new Error("Failed to fetch threat distribution");
        return response.json();
    };

    getWeeklyStats = async (): Promise<any[]> => {
        const response = await fetch(`${this.baseUrl}/statistics/weekly`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error("Failed to fetch weekly stats");
        return response.json();
    };

    // --------------------------------------------------------------------------
    // MODEL ENDPOINTS
    // --------------------------------------------------------------------------

    getModelInfo = async (): Promise<any> => {
        const response = await fetch(`${this.baseUrl}/model/info`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error("Failed to fetch model info");
        return response.json();
    };

    getModelMetrics = async (): Promise<any> => {
        const response = await fetch(`${this.baseUrl}/model/metrics`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error("Failed to fetch model metrics");
        return response.json();
    };

    // --------------------------------------------------------------------------
    // HELPER METHODS
    // --------------------------------------------------------------------------

    uploadAndAnalyze = async (
        file: File,
    ): Promise<{ file: FileUploadResponse; analysis: AnalysisResponse }> => {
        const uploadedFile = await this.uploadFile(file);
        const analysis = await this.startAnalysis(uploadedFile.id);
        return { file: uploadedFile, analysis };
    };

    pollAnalysisStatus = async (
        analysisId: string,
        onUpdate: (analysis: AnalysisResponse) => void,
        maxAttempts: number = 60,
        intervalMs: number = 2000,
    ): Promise<AnalysisResponse> => {
        return new Promise((resolve, reject) => {
            let attempts = 0;

            const poll = async () => {
                try {
                    attempts++;
                    const analysis = await this.getAnalysisById(analysisId);
                    onUpdate(analysis);

                    if (
                        analysis.status === "COMPLETED" ||
                        analysis.status === "FAILED"
                    ) {
                        resolve(analysis);
                        return;
                    }

                    if (attempts >= maxAttempts) {
                        reject(new Error("Analysis timeout"));
                        return;
                    }

                    setTimeout(poll, intervalMs);
                } catch (error) {
                    reject(error);
                }
            };

            poll();
        });
    };
}

// ============================================================================
// ANALYTICS API
// ============================================================================

class AnalyticsApiService {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    getDashboard = async (): Promise<any> => {
        const response = await fetch(`${this.baseUrl}/analytics/dashboard`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error("Failed to fetch dashboard data");
        return response.json();
    };

    getTimeSeries = async (hours: number = 24): Promise<any[]> => {
        const response = await fetch(
            `${this.baseUrl}/analytics/time-series?hours=${hours}`,
            { headers: getAuthHeaders() },
        );
        if (!response.ok) throw new Error("Failed to fetch time series data");
        return response.json();
    };

    getStatistics = async (): Promise<any> => {
        const response = await fetch(`${this.baseUrl}/analytics/statistics`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error("Failed to fetch statistics");
        return response.json();
    };
}

// ============================================================================
// LOGS API
// ============================================================================

export interface PaginatedLogs {
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

class LogsApiService {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    getAll = async (params?: {
        limit?: number;
        offset?: number;
        severity?: string;
        page?: number;
    }): Promise<PaginatedLogs> => {
        const queryParams = new URLSearchParams();
        if (params?.limit) queryParams.append("limit", params.limit.toString());
        if (params?.offset)
            queryParams.append("offset", params.offset.toString());
        if (params?.page) queryParams.append("page", params.page.toString());
        if (params?.severity) queryParams.append("severity", params.severity);

        const url = `${this.baseUrl}/logs${queryParams.toString() ? "?" + queryParams.toString() : ""}`;
        const response = await fetch(url, { headers: getAuthHeaders() });

        if (!response.ok) throw new Error("Failed to fetch logs");

        const result = await response.json();

        if (Array.isArray(result)) {
            return {
                data: result,
                total: result.length,
                page: 1,
                limit: result.length,
                totalPages: 1,
            };
        }
        return result as PaginatedLogs;
    };

    create = async (logData: {
        source: string;
        severity: string;
        message: string;
        ip: string;
        action: string;
        user?: string;
    }): Promise<any> => {
        const response = await fetch(`${this.baseUrl}/logs`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(logData),
        });
        if (!response.ok) throw new Error("Failed to create log");
        return response.json();
    };
}

// ============================================================================
// INCIDENTS API
// ============================================================================

class IncidentsApiService {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    getAll = async (): Promise<any[]> => {
        const response = await fetch(`${this.baseUrl}/incidents`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error("Failed to fetch incidents");
        return response.json();
    };

    create = async (incidentData: {
        title: string;
        severity: string;
        affectedSystems: string[];
        description: string;
        assignedTo?: string;
        tags?: string[];
    }): Promise<any> => {
        const response = await fetch(`${this.baseUrl}/incidents`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(incidentData),
        });
        if (!response.ok) throw new Error("Failed to create incident");
        return response.json();
    };

    update = async (
        id: string,
        updateData: {
            status?: string;
            assignedTo?: string;
            description?: string;
        },
    ): Promise<any> => {
        const response = await fetch(`${this.baseUrl}/incidents/${id}`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify(updateData),
        });
        if (!response.ok) throw new Error("Failed to update incident");
        return response.json();
    };

    delete = async (id: string): Promise<void> => {
        const response = await fetch(`${this.baseUrl}/incidents/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error("Failed to delete incident");
    };
}

// ============================================================================
// AUTH API
// ============================================================================

class AuthApiService {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    login = async (
        email: string,
        password: string,
    ): Promise<{ user: UserProfile; token: string }> => {
        const response = await fetch(`${this.baseUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Invalid email or password");
        }
        return response.json();
    };

    register = async (
        email: string,
        password: string,
        name: string,
    ): Promise<{ user: UserProfile; token: string }> => {
        const response = await fetch(`${this.baseUrl}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, name }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Registration failed");
        }
        return response.json();
    };
}

// ============================================================================
// SETTINGS API  ← NEW
// ============================================================================

class SettingsApiService {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    /** Load webhook/integration config from backend */
    getWebhookConfig = async (): Promise<WebhookConfig> => {
        const response = await fetch(`${this.baseUrl}/settings/webhook`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error("Failed to load webhook config");
        return response.json();
    };

    /** Persist webhook/integration config to backend */
    saveWebhookConfig = async (
        config: WebhookConfig,
    ): Promise<WebhookConfig> => {
        const response = await fetch(`${this.baseUrl}/settings/webhook`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(config),
        });
        if (!response.ok) throw new Error("Failed to save webhook config");
        return response.json();
    };

    /**
     * Tell the backend to pull logs from the configured remote server.
     * Backend fetches `GET <remoteUrl>`, normalises the payload and
     * saves each entry via LogsService.
     */
    pullLogs = async (params?: {
        limit?: number;
        since?: string; // ISO timestamp — only fetch logs newer than this
    }): Promise<PullResult> => {
        const response = await fetch(`${this.baseUrl}/settings/webhook/pull`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(params ?? {}),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error((err as any).message || "Failed to pull logs");
        }
        return response.json();
    };

    /** General app settings (retention days, notification flags, …) */
    getAll = async (): Promise<any> => {
        const response = await fetch(`${this.baseUrl}/settings`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error("Failed to load settings");
        return response.json();
    };

    saveAll = async (data: Record<string, any>): Promise<any> => {
        const response = await fetch(`${this.baseUrl}/settings`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error("Failed to save settings");
        return response.json();
    };
}

// ============================================================================
// EXPORT SINGLETON INSTANCES
// ============================================================================

export const api = new ApiService(API_BASE_URL);
export const analyticsApi = new AnalyticsApiService(API_BASE_URL);
export const logsApi = new LogsApiService(API_BASE_URL);
export const incidentsApi = new IncidentsApiService(API_BASE_URL);
export const authApi = new AuthApiService(API_BASE_URL);
export const settingsApi = new SettingsApiService(API_BASE_URL); // ← NEW

// Log for debugging
console.log("🔧 API Service initialized");
console.log("🌐 Base URL:", API_BASE_URL);

export default ApiService;
