import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import LogsViewer from './pages/LogsViewer';
import Incidents from './pages/Incidents';
import Analytics from './pages/Analytics';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { Log, Incident } from './types';
import { logsApi, incidentsApi } from './services/api';
import websocketService from './services/websocket';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

function AppContent() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logs, setLogs] = useState<Log[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addNotification = (title: string, message: string, type: 'critical' | 'warning' | 'info') => {
    if ((window as any).addNotification) {
      (window as any).addNotification({
        title,
        message,
        type,
        time: t.time.justNow
      });
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      setError(null);

      const [logsResponse, incidentsResponse] = await Promise.all([
        logsApi.getAll({ limit: 100 }),
        incidentsApi.getAll()
      ]);

      const logsData = Array.isArray(logsResponse) 
        ? logsResponse 
        : ((logsResponse as any)?.data || []);
      const incidentsData = Array.isArray(incidentsResponse) 
        ? incidentsResponse 
        : ((incidentsResponse as any)?.data || []);

      setLogs(logsData);
      setIncidents(incidentsData);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.response?.data?.message || 'Failed to load data');
      
      setLogs([]);
      setIncidents([]);
      
      if (err.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  useEffect(() => {
    if (!isAuthenticated) return;

    websocketService.connect();

    const handleNewLog = (newLog: Log) => {
      console.log('New log received:', newLog);
      setLogs(prev => [newLog, ...prev.slice(0, 199)]);
      
      if (newLog.severity === 'critical' || newLog.severity === 'high') {
        addNotification(
          `${newLog.severity === 'critical' ? t.severity.critical : t.severity.high} ${t.notificationTypes.newSecurityEvent}`,
          newLog.message,
          newLog.severity === 'critical' ? 'critical' : 'warning'
        );
      }
    };

    const handleNewIncident = (newIncident: Incident) => {
      console.log('New incident received:', newIncident);
      setIncidents(prev => [newIncident, ...prev]);
      
      addNotification(
        t.notificationTypes.newSecurityIncident,
        newIncident.title,
        newIncident.severity === 'critical' ? 'critical' : 'warning'
      );
    };

    websocketService.onNewLog(handleNewLog);
    websocketService.onNewIncident(handleNewIncident);

    return () => {
      websocketService.offNewLog(handleNewLog);
      websocketService.offNewIncident(handleNewIncident);
      websocketService.disconnect();
    };
  }, [isAuthenticated, t]);

  const handleRefresh = useCallback(() => {
    loadData();
    addNotification(t.notificationTypes.dataRefreshed, t.notificationTypes.dataRefreshedMessage, 'info');
  }, [loadData, t]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    addNotification(t.notificationTypes.welcome, `${t.notificationTypes.welcomeMessage} ${user.name}`, 'info');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('notifications');
    setIsAuthenticated(false);
    setLogs([]);
    setIncidents([]);
  };

  useEffect(() => {
    setSidebarOpen(false);
  }, [activeTab]);

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">{t.common.loading} SIEM Platform...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-all"
            >
              {t.common.refresh}
            </button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard logs={logs} incidents={incidents} />;
      case 'logs':
        return <LogsViewer logs={logs} onRefresh={loadData} />;
      case 'incidents':
        return <Incidents incidents={incidents} onRefresh={loadData} />;
      case 'analytics':
        return <Analytics logs={logs} />;
      case 'alerts':
        return <Alerts />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard logs={logs} incidents={incidents} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          setSidebarOpen={setSidebarOpen}
          onRefresh={handleRefresh}
          onLogout={handleLogout}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 scrollbar-custom">
          <div className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl">
            {renderContent()}
          </div>
        </main>

        <footer className="bg-gray-900/50 backdrop-blur border-t border-cyan-500/20 px-6 py-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div>
              <span>SIEM Light Platform v1.0.0</span>
              <span className="mx-2">•</span>
              <span>{logs.length} {t.logs.title}</span>
              <span className="mx-2">•</span>
              <span>{incidents.length} {t.sidebar.incidents}</span>
            </div>
            <div>
              <span>© 2026 Security Operations Center</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;