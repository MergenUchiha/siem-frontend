// Log Types
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type LogSource = 'Web Server' | 'Database' | 'Firewall' | 'VPN Gateway' | 'Email Server' | 'API Gateway' | 'Load Balancer' | 'Auth Service';
export type LogAction = 'Login Attempt' | 'File Access' | 'Network Connection' | 'Authentication' | 'Data Transfer' | 'Configuration Change' | 'API Request' | 'Database Query';

export interface Log {
  id: string;
  timestamp: string;
  source: LogSource | string;
  severity: SeverityLevel;
  message: string;
  ip: string;
  user?: string;
  action: LogAction | string;
  details?: Record<string, unknown>;
}

// Incident Types
export type IncidentStatus = 'open' | 'investigating' | 'resolved' | 'closed';

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
  priority?: 'urgent' | 'high' | 'normal' | 'low';
}

// Dashboard Metrics
export interface DashboardMetrics {
  totalEvents: number;
  criticalAlerts: number;
  activeIncidents: number;
  securityScore: number;
  threatsBlocked: number;
  lastUpdate: string;
}

// Alert Types
export interface Alert {
  id: string;
  name: string;
  description: string;
  severity: SeverityLevel;
  enabled: boolean;
  conditions: AlertCondition[];
  actions: AlertAction[];
  createdAt: string;
  lastTriggered?: string;
}

export interface AlertCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'regex';
  value: string | number;
}

export interface AlertAction {
  type: 'email' | 'webhook' | 'slack' | 'sms';
  target: string;
  enabled: boolean;
}

// Analytics
export interface TimeSeriesData {
  timestamp: string;
  value: number;
  category?: string;
}

export interface SourceDistribution {
  source: string;
  count: number;
  percentage: number;
}

export interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

// Settings
export interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    slack: boolean;
    sms: boolean;
  };
  display: {
    theme: 'dark' | 'light';
    refreshInterval: number;
    itemsPerPage: number;
    dateFormat: string;
  };
  security: {
    twoFactor: boolean;
    sessionTimeout: number;
    ipWhitelist: string[];
  };
  dataRetention: {
    logs: number;
    incidents: number;
  };
}

// User Profile
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'analyst' | 'viewer';
  department: string;
  avatar?: string;
  lastLogin: string;
}