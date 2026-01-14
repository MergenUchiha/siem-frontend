import React, { useState } from 'react';
import { Search, Filter, Download, Plus, X, Calendar, User, Server, Activity } from 'lucide-react';
import { Log } from '../types';
import { logsApi } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

interface LogsViewerProps {
  logs: Log[];
  onRefresh?: () => void;
}

const LogsViewer: React.FC<LogsViewerProps> = ({ logs, onRefresh }) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const logsPerPage = 20;

  const sources = [...new Set(logs.map(log => log.source))];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.ip.includes(searchTerm) ||
                         (log.user && log.user.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    const matchesSource = sourceFilter === 'all' || log.source === sourceFilter;
    
    return matchesSearch && matchesSeverity && matchesSource;
  });

  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  const severityColors: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    info: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  };

  const handleExport = () => {
    const csv = [
      [t.logs.timestamp, t.logs.severity, t.logs.source, t.logs.message, t.logs.ipAddress, t.logs.user],
      ...filteredLogs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        t.severity[log.severity as keyof typeof t.severity] || log.severity,
        log.source,
        log.message,
        log.ip,
        log.user || ''
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString()}.csv`;
    a.click();
  };

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const logData = {
      source: formData.get('source') as string,
      severity: formData.get('severity') as string,
      message: formData.get('message') as string,
      ip: formData.get('ip') as string,
      action: formData.get('action') as string,
      user: formData.get('user') as string || undefined,
    };

    try {
      await logsApi.create(logData);
      setShowCreateModal(false);
      if (onRefresh) onRefresh();
      
      if ((window as any).addNotification) {
        (window as any).addNotification({
          title: t.notificationTypes.logCreated,
          message: `${t.notificationTypes.logCreatedMessage}: ${t.severity[logData.severity as keyof typeof t.severity]}`,
          type: logData.severity === 'critical' || logData.severity === 'high' ? 'warning' : 'info',
          time: t.time.justNow
        });
      }
    } catch (error) {
      console.error('Failed to create log:', error);
      alert('Failed to create log');
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogClick = (log: Log) => {
    setSelectedLog(log);
    setShowDetailsModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Filter className="w-5 h-5 mr-2 text-cyan-400" />
            {t.logs.filters}
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{t.logs.createLog}</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/30 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>{t.logs.exportCSV}</span>
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t.logs.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
          
          <select
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
          >
            <option value="all">{t.logs.allSeverities}</option>
            <option value="critical">{t.severity.critical}</option>
            <option value="high">{t.severity.high}</option>
            <option value="medium">{t.severity.medium}</option>
            <option value="low">{t.severity.low}</option>
            <option value="info">{t.severity.info}</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
          >
            <option value="all">{t.logs.allSources}</option>
            {sources.map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t.logs.timestamp}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t.logs.severity}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t.logs.source}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t.logs.message}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t.logs.ipAddress}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t.logs.user}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {currentLogs.map(log => (
                <tr 
                  key={log.id} 
                  onClick={() => handleLogClick(log)}
                  className="hover:bg-gray-900/50 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {new Date(log.timestamp).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs border ${severityColors[log.severity]}`}>
                      {t.severity[log.severity as keyof typeof t.severity]?.toUpperCase() || log.severity.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white group-hover:text-cyan-400 transition-colors">
                    {log.source}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300 max-w-md">
                    <div className="truncate" title={log.message}>
                      {log.message}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-400 font-mono">
                    {log.ip}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {log.user || t.logs.noUser}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="bg-gray-900/50 px-6 py-4 border-t border-gray-700 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            {t.logs.showing} {indexOfFirstLog + 1} {t.logs.to} {Math.min(indexOfLastLog, filteredLogs.length)} {t.logs.of} {filteredLogs.length}
          </p>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t.logs.previous}
            </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                if (pageNum > totalPages) return null;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      currentPage === pageNum
                        ? 'bg-cyan-500 text-white'
                        : 'bg-gray-800 border border-gray-700 text-white hover:bg-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t.logs.next}
            </button>
          </div>
        </div>
      </div>

      {showDetailsModal && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">{t.logs.logDetails}</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1.5 rounded-lg text-sm border font-medium ${severityColors[selectedLog.severity]}`}>
                  {t.severity[selectedLog.severity as keyof typeof t.severity]?.toUpperCase()}
                </span>
                <span className="text-sm text-gray-400">
                  ID: {selectedLog.id}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs text-gray-400">{t.logs.timestamp}</span>
                  </div>
                  <p className="text-white font-mono text-sm">
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </p>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Server className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs text-gray-400">{t.logs.source}</span>
                  </div>
                  <p className="text-white text-sm">{selectedLog.source}</p>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs text-gray-400">{t.logs.ipAddress}</span>
                  </div>
                  <p className="text-cyan-400 font-mono text-sm">{selectedLog.ip}</p>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs text-gray-400">{t.logs.user}</span>
                  </div>
                  <p className="text-white text-sm">{selectedLog.user || t.logs.noUser}</p>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <span className="text-xs text-gray-400 block mb-2">{t.logs.action}</span>
                <p className="text-white text-sm">{selectedLog.action}</p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <span className="text-xs text-gray-400 block mb-2">{t.logs.message}</span>
                <p className="text-white text-sm leading-relaxed">{selectedLog.message}</p>
              </div>

              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <span className="text-xs text-gray-400 block mb-2">{t.logs.additionalDetails}</span>
                  <pre className="text-xs text-gray-300 overflow-x-auto p-3 bg-gray-900 rounded">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-6">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all"
              >
                {t.common.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">{t.logs.createNewLog}</h3>
            <form onSubmit={handleCreateLog} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">{t.logs.source}</label>
                <input
                  name="source"
                  type="text"
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  placeholder="Web Server"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">{t.logs.severity}</label>
                <select
                  name="severity"
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="info">{t.severity.info}</option>
                  <option value="low">{t.severity.low}</option>
                  <option value="medium">{t.severity.medium}</option>
                  <option value="high">{t.severity.high}</option>
                  <option value="critical">{t.severity.critical}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">{t.logs.message}</label>
                <textarea
                  name="message"
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  placeholder={t.logs.message}
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">{t.logs.ipAddress}</label>
                <input
                  name="ip"
                  type="text"
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  placeholder="192.168.1.1"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">{t.logs.action}</label>
                <input
                  name="action"
                  type="text"
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  placeholder="Login Attempt"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">{t.logs.user}</label>
                <input
                  name="user"
                  type="text"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  placeholder="username"
                />
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-all disabled:opacity-50"
                >
                  {isCreating ? t.common.loading : t.logs.createLog}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all"
                >
                  {t.common.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogsViewer;