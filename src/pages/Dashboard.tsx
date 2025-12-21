import React, { useState, useEffect, useMemo } from 'react';
import { Activity, AlertTriangle, Shield, CheckCircle, BarChart3, Zap, TrendingUp, Clock } from 'lucide-react';
import { Log, Incident, DashboardMetrics } from '../types';
import MetricCard from '../components/dashboard/MetricCard';
import { analyticsApi } from '../services/api';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';

interface DashboardProps {
  logs: Log[];
  incidents: Incident[];
}

const Dashboard: React.FC<DashboardProps> = ({ logs, incidents }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalEvents: 0,
    criticalAlerts: 0,
    activeIncidents: 0,
    securityScore: 0,
    threatsBlocked: 0,
    lastUpdate: new Date().toISOString()
  });
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load metrics from API
  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const [dashboardData, timeSeriesResponse] = await Promise.all([
          analyticsApi.getDashboard(),
          analyticsApi.getTimeSeries(24)
        ]);

        setMetrics(dashboardData);
        setTimeSeriesData(timeSeriesResponse);
      } catch (error) {
        console.error('Failed to load dashboard metrics:', error);
        // Fallback to calculated metrics
        setMetrics({
          totalEvents: logs.length,
          criticalAlerts: logs.filter(l => l.severity === 'critical').length,
          activeIncidents: incidents.filter(i => i.status === 'open' || i.status === 'investigating').length,
          securityScore: 87,
          threatsBlocked: logs.filter(l => l.severity === 'critical' || l.severity === 'high').length,
          lastUpdate: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
    // Update metrics every 30 seconds
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, [logs, incidents]);

  // Memoized calculations for better performance
  const severityCounts = useMemo(() => {
    return logs.reduce((acc, log) => {
      acc[log.severity] = (acc[log.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [logs]);

  const severityData = useMemo(() => {
    return Object.entries(severityCounts).map(([severity, count]) => ({
      name: severity.charAt(0).toUpperCase() + severity.slice(1),
      value: count,
      percentage: ((count / logs.length) * 100).toFixed(1)
    }));
  }, [severityCounts, logs.length]);

  const SEVERITY_COLORS: Record<string, string> = {
    Critical: '#ef4444',
    High: '#f97316',
    Medium: '#eab308',
    Low: '#3b82f6',
    Info: '#6b7280'
  };

  const recentLogs = useMemo(() => logs.slice(0, 8), [logs]);
  const criticalIncidents = useMemo(() => 
    incidents.filter(i => i.severity === 'critical' || i.severity === 'high'),
    [incidents]
  );

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-500/20 text-red-400 border-red-500/30',
      high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      info: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return colors[severity] || colors.info;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-red-500/20 text-red-400 border-red-500/30',
      investigating: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      resolved: 'bg-green-500/20 text-green-400 border-green-500/30',
      closed: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return colors[status] || colors.open;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slideIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Security Dashboard</h1>
          <p className="text-gray-400 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Last updated: {new Date(metrics.lastUpdate).toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <MetricCard 
          icon={Activity} 
          title="Total Events" 
          value={metrics.totalEvents} 
          change={5.2}
          color="from-cyan-500 to-blue-600"
        />
        <MetricCard 
          icon={AlertTriangle} 
          title="Critical Alerts" 
          value={metrics.criticalAlerts} 
          change={-12.5}
          color="from-red-500 to-pink-600"
        />
        <MetricCard 
          icon={Shield} 
          title="Threats Blocked" 
          value={metrics.threatsBlocked} 
          change={8.3}
          color="from-green-500 to-emerald-600"
        />
        <MetricCard 
          icon={CheckCircle} 
          title="Security Score" 
          value={metrics.securityScore} 
          change={2.1}
          color="from-purple-500 to-indigo-600"
          subtitle="Excellent"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Events Timeline */}
        <div className="glass rounded-xl p-6 hover:border-cyan-500/50 transition-smooth">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-cyan-400" />
            Events Timeline (Last 24 Hours)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                stroke="#9ca3af" 
                style={{ fontSize: '11px' }}
                interval={2}
              />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="events" 
                stroke="#06b6d4" 
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                name="Total Events"
              />
              <Line 
                type="monotone" 
                dataKey="threats" 
                stroke="#ef4444" 
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                name="Threats"
              />
              <Line 
                type="monotone" 
                dataKey="critical" 
                stroke="#f97316" 
                strokeWidth={2}
                dot={{ r: 2 }}
                name="Critical"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Severity Distribution */}
        <div className="glass rounded-xl p-6 hover:border-cyan-500/50 transition-smooth">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-cyan-400" />
            Threat Distribution by Severity
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={severityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity and Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Activity Feed */}
        <div className="glass rounded-xl p-6 hover:border-cyan-500/50 transition-smooth">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-cyan-400 animate-pulse" />
            Live Activity Feed
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-custom">
            {recentLogs.map((log, index) => (
              <div 
                key={log.id} 
                className="flex items-start space-x-3 p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900 transition-all cursor-pointer group border border-transparent hover:border-gray-700"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={`px-2 py-1 rounded text-xs border flex-shrink-0 ${getSeverityColor(log.severity)}`}>
                  {log.severity.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate group-hover:text-cyan-400 transition-colors">
                    {log.message}
                  </p>
                  <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                    <span>{log.source}</span>
                    <span>•</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    {log.user && (
                      <>
                        <span>•</span>
                        <span className="text-cyan-400">{log.user}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Critical Incidents */}
        <div className="glass rounded-xl p-6 hover:border-cyan-500/50 transition-smooth">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-400" />
            Critical & High Severity Incidents
            <span className="ml-auto px-2 py-1 text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded-full">
              {criticalIncidents.length}
            </span>
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-custom">
            {criticalIncidents.map((incident, index) => (
              <div 
                key={incident.id} 
                className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:border-cyan-500/50 transition-all cursor-pointer group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-white font-medium text-sm group-hover:text-cyan-400 transition-colors">
                    {incident.title}
                  </h4>
                  <span className={`px-2 py-1 rounded text-xs border flex-shrink-0 ml-2 ${getStatusColor(incident.status)}`}>
                    {incident.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                  {incident.description}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    {new Date(incident.timestamp).toLocaleString()}
                  </span>
                  <span className="text-cyan-400 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    {incident.affectedSystems.length} systems
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;