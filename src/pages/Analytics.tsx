import React from 'react';
import { TrendingUp, PieChart, BarChart as BarChartIcon, Globe } from 'lucide-react';
import { Log } from '../types';
import { BarChart, Bar, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsProps {
  logs: Log[];
}

const Analytics: React.FC<AnalyticsProps> = ({ logs }) => {
  // Last 24 hours logs
  const last24Hours = logs.filter(log => 
    new Date(log.timestamp).getTime() > Date.now() - 24 * 3600000
  );

  // Source distribution
  const sourceDistribution = logs.reduce((acc, log) => {
    acc[log.source] = (acc[log.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topSources = Object.entries(sourceDistribution)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 6)
    .map(([source, count]) => ({
      name: source,
      value: count,
      percentage: ((count / logs.length) * 100).toFixed(1)
    }));

  // Severity distribution
  const severityData = logs.reduce((acc, log) => {
    acc[log.severity] = (acc[log.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const severityChartData = Object.entries(severityData).map(([severity, count]) => ({
    name: severity.charAt(0).toUpperCase() + severity.slice(1),
    value: count
  }));

  // Hourly distribution for last 24 hours
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const hour = new Date();
    hour.setHours(hour.getHours() - (23 - i));
    hour.setMinutes(0, 0, 0);
    
    const hourLogs = last24Hours.filter(log => {
      const logHour = new Date(log.timestamp);
      return logHour.getHours() === hour.getHours();
    });
    
    return {
      hour: hour.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      events: hourLogs.length,
      critical: hourLogs.filter(l => l.severity === 'critical').length,
      high: hourLogs.filter(l => l.severity === 'high').length
    };
  });

  // Action distribution
  const actionData = logs.reduce((acc, log) => {
    acc[log.action] = (acc[log.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topActions = Object.entries(actionData)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([action, count]) => ({
      name: action,
      count
    }));

  const COLORS = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#3b82f6',
    info: '#6b7280'
  };

  const PIE_COLORS = ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
          <p className="text-gray-400 text-sm mb-2">Total Events (24h)</p>
          <p className="text-3xl font-bold text-white">{last24Hours.length}</p>
        </div>
        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
          <p className="text-gray-400 text-sm mb-2">Unique Sources</p>
          <p className="text-3xl font-bold text-white">{Object.keys(sourceDistribution).length}</p>
        </div>
        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
          <p className="text-gray-400 text-sm mb-2">Critical Events</p>
          <p className="text-3xl font-bold text-red-400">
            {logs.filter(l => l.severity === 'critical').length}
          </p>
        </div>
        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
          <p className="text-gray-400 text-sm mb-2">Avg Events/Hour</p>
          <p className="text-3xl font-bold text-white">
            {Math.round(last24Hours.length / 24)}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 24-Hour Activity */}
        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-cyan-400" />
            24-Hour Activity Overview
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="hour" 
                stroke="#9ca3af" 
                style={{ fontSize: '11px' }}
                interval={3}
              />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="events" 
                stroke="#06b6d4" 
                strokeWidth={2}
                name="Total Events"
              />
              <Line 
                type="monotone" 
                dataKey="critical" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Critical"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Source Distribution */}
        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Globe className="w-5 h-5 mr-2 text-cyan-400" />
            Top Event Sources
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={topSources}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} (${percentage}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {topSources.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>

        {/* Severity Distribution */}
        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <PieChart className="w-5 h-5 mr-2 text-cyan-400" />
            Severity Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={severityChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="value" fill="#06b6d4" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Actions */}
        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <BarChartIcon className="w-5 h-5 mr-2 text-cyan-400" />
            Most Common Actions
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topActions} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <YAxis 
                dataKey="name" 
                type="category" 
                stroke="#9ca3af" 
                style={{ fontSize: '11px' }}
                width={120}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="count" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Stats Table */}
      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Source Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Events
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Percentage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {topSources.map((source, index) => (
                <tr key={source.name} className="hover:bg-gray-900/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {source.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-400">
                    {source.value.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {source.percentage}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-24 bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-cyan-500 h-2 rounded-full"
                        style={{ width: `${source.percentage}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;