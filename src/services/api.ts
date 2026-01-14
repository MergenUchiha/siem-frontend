// API Service for MalGuard AI Frontend
// Connects to NestJS Backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
  status: 'SCANNING' | 'COMPLETED' | 'FAILED';
  threat: 'SAFE' | 'SUSPICIOUS' | 'MALICIOUS' | null;
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

// ============================================================================
// API CLASS
// ============================================================================

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // ============================================================================
  // AUTH ENDPOINTS
  // ============================================================================

  login = async (email: string, password: string): Promise<AuthResponse> => {
    console.log('🔐 API: Attempting login for:', email);
    console.log('🌐 API: Calling:', `${this.baseUrl}/auth/login`);
    
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      console.log('📡 API: Response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ API: Login failed:', error);
        throw new Error(error.message || 'Invalid email or password');
      }

      const data = await response.json();
      console.log('✅ API: Login successful:', data.user.name);
      return data;
    } catch (error: any) {
      console.error('❌ API: Login error:', error);
      throw error;
    }
  };

  register = async (email: string, password: string, name: string): Promise<AuthResponse> => {
    console.log('📝 API: Attempting registration for:', email);
    console.log('🌐 API: Calling:', `${this.baseUrl}/auth/register`);
    
    try {
      const response = await fetch(`${this.baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name })
      });

      console.log('📡 API: Response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ API: Registration failed:', error);
        throw new Error(error.message || 'Registration failed');
      }

      const data = await response.json();
      console.log('✅ API: Registration successful:', data.user.name);
      return data;
    } catch (error: any) {
      console.error('❌ API: Registration error:', error);
      throw error;
    }
  };

  getProfile = async (userId: string): Promise<UserProfile> => {
    console.log('👤 API: Fetching profile for:', userId);
    
    const response = await fetch(`${this.baseUrl}/auth/profile/${userId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    return response.json();
  };

  // ============================================================================
  // FILES ENDPOINTS
  // ============================================================================

  uploadFile = async (file: File): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/files/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload file');
    }

    return response.json();
  };

  getFileById = async (id: string): Promise<FileUploadResponse> => {
    const response = await fetch(`${this.baseUrl}/files/${id}`);

    if (!response.ok) {
      throw new Error('Failed to fetch file');
    }

    return response.json();
  };

  getAllFiles = async (): Promise<FileUploadResponse[]> => {
    const response = await fetch(`${this.baseUrl}/files`);

    if (!response.ok) {
      throw new Error('Failed to fetch files');
    }

    return response.json();
  };

  deleteFile = async (id: string): Promise<void> => {
    const response = await fetch(`${this.baseUrl}/files/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete file');
    }
  };

  // ============================================================================
  // ANALYSIS ENDPOINTS
  // ============================================================================

  startAnalysis = async (fileId: string): Promise<AnalysisResponse> => {
    const response = await fetch(`${this.baseUrl}/analysis/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to start analysis');
    }

    return response.json();
  };

  getAnalysisById = async (id: string): Promise<AnalysisResponse> => {
    const response = await fetch(`${this.baseUrl}/analysis/${id}`);

    if (!response.ok) {
      throw new Error('Failed to fetch analysis');
    }

    return response.json();
  };

  getAnalysisByFileId = async (fileId: string): Promise<AnalysisResponse> => {
    const response = await fetch(`${this.baseUrl}/analysis/file/${fileId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch analysis');
    }

    return response.json();
  };

  getAllAnalyses = async (params?: {
    status?: string;
    threat?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: AnalysisResponse[]; total: number; limit: number; offset: number }> => {
    const queryParams = new URLSearchParams();
    
    if (params?.status) queryParams.append('status', params.status);
    if (params?.threat) queryParams.append('threat', params.threat);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${this.baseUrl}/analysis${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch analyses');
    }

    return response.json();
  };

  // ============================================================================
  // STATISTICS ENDPOINTS
  // ============================================================================

  getStatistics = async (): Promise<StatisticsResponse> => {
    const response = await fetch(`${this.baseUrl}/statistics/overview`);

    if (!response.ok) {
      throw new Error('Failed to fetch statistics');
    }

    return response.json();
  };

  getThreatDistribution = async (): Promise<any> => {
    const response = await fetch(`${this.baseUrl}/statistics/threats`);

    if (!response.ok) {
      throw new Error('Failed to fetch threat distribution');
    }

    return response.json();
  };

  getWeeklyStats = async (): Promise<any[]> => {
    const response = await fetch(`${this.baseUrl}/statistics/weekly`);

    if (!response.ok) {
      throw new Error('Failed to fetch weekly stats');
    }

    return response.json();
  };

  // ============================================================================
  // MODEL ENDPOINTS
  // ============================================================================

  getModelInfo = async (): Promise<any> => {
    const response = await fetch(`${this.baseUrl}/model/info`);

    if (!response.ok) {
      throw new Error('Failed to fetch model info');
    }

    return response.json();
  };

  getModelMetrics = async (): Promise<any> => {
    const response = await fetch(`${this.baseUrl}/model/metrics`);

    if (!response.ok) {
      throw new Error('Failed to fetch model metrics');
    }

    return response.json();
  };

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  uploadAndAnalyze = async (file: File): Promise<{
    file: FileUploadResponse;
    analysis: AnalysisResponse;
  }> => {
    const uploadedFile = await this.uploadFile(file);
    const analysis = await this.startAnalysis(uploadedFile.id);

    return {
      file: uploadedFile,
      analysis,
    };
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

          if (analysis.status === 'COMPLETED' || analysis.status === 'FAILED') {
            resolve(analysis);
            return;
          }

          if (attempts >= maxAttempts) {
            reject(new Error('Analysis timeout'));
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
    const response = await fetch(`${this.baseUrl}/analytics/dashboard`);

    if (!response.ok) {
      throw new Error('Failed to fetch dashboard data');
    }

    return response.json();
  };

  getTimeSeries = async (hours: number = 24): Promise<any[]> => {
    const response = await fetch(`${this.baseUrl}/analytics/timeseries?hours=${hours}`);

    if (!response.ok) {
      throw new Error('Failed to fetch time series data');
    }

    return response.json();
  };

  getStatistics = async (): Promise<any> => {
    const response = await fetch(`${this.baseUrl}/analytics/statistics`);

    if (!response.ok) {
      throw new Error('Failed to fetch statistics');
    }

    return response.json();
  };
}

// ============================================================================
// LOGS API
// ============================================================================

class LogsApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  getAll = async (params?: { limit?: number; offset?: number; severity?: string }): Promise<any[]> => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.severity) queryParams.append('severity', params.severity);

    const url = `${this.baseUrl}/logs${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch logs');
    }

    return response.json();
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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData),
    });

    if (!response.ok) {
      throw new Error('Failed to create log');
    }

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
    const response = await fetch(`${this.baseUrl}/incidents`);

    if (!response.ok) {
      throw new Error('Failed to fetch incidents');
    }

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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incidentData),
    });

    if (!response.ok) {
      throw new Error('Failed to create incident');
    }

    return response.json();
  };

  update = async (id: string, updateData: {
    status?: string;
    assignedTo?: string;
    description?: string;
  }): Promise<any> => {
    const response = await fetch(`${this.baseUrl}/incidents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error('Failed to update incident');
    }

    return response.json();
  };

  delete = async (id: string): Promise<void> => {
    const response = await fetch(`${this.baseUrl}/incidents/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete incident');
    }
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

  login = async (email: string, password: string): Promise<{ user: UserProfile; token: string }> => {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Invalid email or password');
    }

    return response.json();
  };

  register = async (email: string, password: string, name: string): Promise<{ user: UserProfile; token: string }> => {
    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

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

// Log for debugging
console.log('🔧 API Service initialized');
console.log('🌐 Base URL:', API_BASE_URL);

// Export class for testing
export default ApiService;