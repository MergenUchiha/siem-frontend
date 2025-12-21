import { Log, Incident, DashboardMetrics, SeverityLevel, LogSource, LogAction } from '../types';

// Enhanced Log Generator with more realistic data
export const generateMockLogs = (count: number = 50): Log[] => {
  const sources: LogSource[] = [
    'Web Server', 'Database', 'Firewall', 'VPN Gateway', 
    'Email Server', 'API Gateway', 'Load Balancer', 'Auth Service'
  ];
  
  const actions: LogAction[] = [
    'Login Attempt', 'File Access', 'Network Connection', 
    'Authentication', 'Data Transfer', 'Configuration Change',
    'API Request', 'Database Query'
  ];
  
  const severities: SeverityLevel[] = ['critical', 'high', 'medium', 'low', 'info'];
  
  const messages = [
    'Multiple failed login attempts detected',
    'Suspicious file download activity',
    'Unauthorized access attempt blocked',
    'Port scan detected from external IP',
    'Database query execution time exceeded threshold',
    'SSL certificate validation failed',
    'Brute force attack detected',
    'Anomalous data transfer volume',
    'Privilege escalation attempt',
    'Configuration change without approval',
    'SQL injection attempt blocked',
    'Cross-site scripting detected',
    'DDoS attack mitigated',
    'Malware signature detected',
    'Unusual API usage pattern',
    'Rate limit exceeded',
    'Invalid authentication token',
    'Session hijacking attempt',
    'Data exfiltration detected',
    'Phishing attempt blocked'
  ];

  const usernames = ['admin', 'user123', 'john.doe', 'jane.smith', 'system', 'root', 'operator', 'analyst'];

  return Array.from({ length: count }, (_, i) => {
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const source = sources[Math.floor(Math.random() * sources.length)];
    
    return {
      id: `log-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      source,
      severity,
      message: messages[Math.floor(Math.random() * messages.length)],
      ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      user: Math.random() > 0.3 ? usernames[Math.floor(Math.random() * usernames.length)] : undefined,
      action: actions[Math.floor(Math.random() * actions.length)],
      details: {
        responseTime: Math.floor(Math.random() * 1000),
        bytes: Math.floor(Math.random() * 10000),
        statusCode: [200, 201, 400, 401, 403, 404, 500][Math.floor(Math.random() * 7)]
      }
    };
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// Enhanced Incidents Generator
export const generateMockIncidents = (): Incident[] => {
  return [
    {
      id: 'inc-001',
      title: 'Brute Force Attack on Admin Panel',
      severity: 'critical',
      status: 'investigating',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      affectedSystems: ['Web Server', 'Authentication Service'],
      description: 'Multiple failed login attempts from various IPs targeting admin accounts. Over 500 attempts detected in the last 30 minutes from 15 different IP addresses.',
      assignedTo: 'security-team@company.com',
      tags: ['authentication', 'brute-force', 'web', 'high-priority'],
      priority: 'urgent'
    },
    {
      id: 'inc-002',
      title: 'Suspicious Data Exfiltration',
      severity: 'high',
      status: 'open',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      affectedSystems: ['Database', 'API Gateway'],
      description: 'Unusual volume of data transfers detected to external IP addresses. Approximately 2.5GB transferred in 10 minutes to unknown destination.',
      tags: ['data-leak', 'database', 'network'],
      priority: 'urgent'
    },
    {
      id: 'inc-003',
      title: 'SQL Injection Attempt Detected',
      severity: 'high',
      status: 'investigating',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      affectedSystems: ['Database', 'Web Server'],
      description: 'Malicious SQL queries detected in API requests. Attack signatures match known SQLi patterns from OWASP database.',
      assignedTo: 'dev-security@company.com',
      tags: ['sql-injection', 'web', 'database', 'owasp'],
      priority: 'high'
    },
    {
      id: 'inc-004',
      title: 'Unauthorized Configuration Change',
      severity: 'medium',
      status: 'resolved',
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      affectedSystems: ['Firewall'],
      description: 'Firewall rules modified without proper authorization. Changes have been reverted and access logs reviewed.',
      tags: ['configuration', 'firewall', 'unauthorized'],
      resolvedAt: new Date(Date.now() - 3600000).toISOString(),
      priority: 'normal'
    },
    {
      id: 'inc-005',
      title: 'DDoS Attack Detected',
      severity: 'critical',
      status: 'investigating',
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      affectedSystems: ['Load Balancer', 'Web Server', 'API Gateway'],
      description: 'Distributed denial of service attack targeting multiple endpoints. Traffic spike of 10000% detected from botnet.',
      assignedTo: 'network-ops@company.com',
      tags: ['ddos', 'network', 'availability', 'botnet'],
      priority: 'urgent'
    },
    {
      id: 'inc-006',
      title: 'Malware Detection in Email Attachment',
      severity: 'high',
      status: 'open',
      timestamp: new Date(Date.now() - 18000000).toISOString(),
      affectedSystems: ['Email Server', 'Endpoint'],
      description: 'Malicious attachment detected in email. File quarantined and sender blocked. Trojan.Generic signature identified.',
      tags: ['malware', 'email', 'endpoint', 'trojan'],
      priority: 'high'
    },
    {
      id: 'inc-007',
      title: 'Privilege Escalation Attempt',
      severity: 'high',
      status: 'investigating',
      timestamp: new Date(Date.now() - 21600000).toISOString(),
      affectedSystems: ['Auth Service', 'Database'],
      description: 'User account attempted to escalate privileges without authorization. Access denied and activity logged.',
      assignedTo: 'security-team@company.com',
      tags: ['privilege-escalation', 'authentication', 'authorization'],
      priority: 'high'
    },
    {
      id: 'inc-008',
      title: 'Suspicious API Rate Limit Violations',
      severity: 'medium',
      status: 'resolved',
      timestamp: new Date(Date.now() - 25200000).toISOString(),
      affectedSystems: ['API Gateway'],
      description: 'Multiple API endpoints exceeded rate limits. IP has been temporarily blocked for 24 hours.',
      tags: ['api', 'rate-limit', 'abuse'],
      resolvedAt: new Date(Date.now() - 7200000).toISOString(),
      priority: 'normal'
    }
  ];
};

// Real-time Metrics Generator with more variation
export const generateRealtimeMetrics = (): DashboardMetrics => {
  const baseMetrics = {
    totalEvents: 15847,
    criticalAlerts: 23,
    activeIncidents: 8,
    securityScore: 87,
    threatsBlocked: 1249
  };

  return {
    totalEvents: baseMetrics.totalEvents + Math.floor(Math.random() * 200),
    criticalAlerts: baseMetrics.criticalAlerts + Math.floor(Math.random() * 5) - 2,
    activeIncidents: baseMetrics.activeIncidents + Math.floor(Math.random() * 3) - 1,
    securityScore: Math.max(75, Math.min(95, baseMetrics.securityScore + Math.floor(Math.random() * 6) - 3)),
    threatsBlocked: baseMetrics.threatsBlocked + Math.floor(Math.random() * 50),
    lastUpdate: new Date().toISOString()
  };
};

// Enhanced Time Series Data for Charts
export const generateTimeSeriesData = (hours: number = 24) => {
  const data = [];
  const now = Date.now();
  
  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now - i * 3600000);
    const hour = timestamp.getHours();
    
    // Simulate realistic traffic patterns (higher during business hours)
    const baseTraffic = (hour >= 8 && hour <= 18) ? 400 : 200;
    const variance = Math.random() * 150;
    
    data.push({
      time: timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      timestamp: timestamp.toISOString(),
      events: Math.floor(baseTraffic + variance),
      threats: Math.floor(Math.random() * 50) + 10,
      alerts: Math.floor(Math.random() * 20) + 5,
      blocked: Math.floor(Math.random() * 30) + 15
    });
  }
  
  return data;
};

// Top IPs Generator
export const generateTopIPs = (count: number = 10) => {
  return Array.from({ length: count }, (_, i) => ({
    ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    requests: Math.floor(Math.random() * 1000) + 100,
    threats: Math.floor(Math.random() * 50),
    country: ['US', 'CN', 'RU', 'BR', 'IN', 'DE', 'UK', 'FR'][Math.floor(Math.random() * 8)]
  })).sort((a, b) => b.requests - a.requests);
};