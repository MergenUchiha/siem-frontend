import React, { useState, useEffect, useCallback } from 'react';
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

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logs, setLogs] = useState<Log[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Функция для добавления уведомления
  const addNotification = (title: string, message: string, type: 'critical' | 'warning' | 'info') => {
    if ((window as any).addNotification) {
      (window as any).addNotification({
        title,
        message,
        type,
        time: 'Just now'
      });
    }
  };

  // Проверка авторизации
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  // Загрузка данных с API
  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      setError(null);

      const [logsResponse, incidentsResponse] = await Promise.all([
        logsApi.getAll({ limit: 100 }),
        incidentsApi.getAll()
      ]);

      setLogs(logsResponse);
      setIncidents(incidentsResponse);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.response?.data?.message || 'Failed to load data');
      
      // Если 401, разлогиниваем
      if (err.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Инициализация данных
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  // WebSocket подключение
  useEffect(() => {
    if (!isAuthenticated) return;

    // Подключаемся к WebSocket
    const socket = websocketService.connect();

    // Подписываемся на новые логи
    const handleNewLog = (newLog: Log) => {
      console.log('New log received:', newLog);
      setLogs(prev => [newLog, ...prev.slice(0, 199)]);
      
      // Добавляем уведомление для критичных логов
      if (newLog.severity === 'critical' || newLog.severity === 'high') {
        addNotification(
          `${newLog.severity === 'critical' ? 'Critical' : 'High'} Security Event`,
          newLog.message,
          newLog.severity === 'critical' ? 'critical' : 'warning'
        );
      }
    };

    // Подписываемся на новые инциденты
    const handleNewIncident = (newIncident: Incident) => {
      console.log('New incident received:', newIncident);
      setIncidents(prev => [newIncident, ...prev]);
      
      // Добавляем уведомление
      addNotification(
        'New Security Incident',
        newIncident.title,
        newIncident.severity === 'critical' ? 'critical' : 'warning'
      );
    };

    websocketService.onNewLog(handleNewLog);
    websocketService.onNewIncident(handleNewIncident);

    // Очистка при размонтировании
    return () => {
      websocketService.offNewLog(handleNewLog);
      websocketService.offNewIncident(handleNewIncident);
      websocketService.disconnect();
    };
  }, [isAuthenticated]);

  // Обработка рефреша
  const handleRefresh = useCallback(() => {
    loadData();
    addNotification('Data Refreshed', 'All data has been updated', 'info');
  }, [loadData]);

  // Обработка логина
  const handleLogin = () => {
    setIsAuthenticated(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    addNotification('Welcome!', `Logged in as ${user.name}`, 'info');
  };

  // Обработка логаута
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('notifications');
    setIsAuthenticated(false);
    setLogs([]);
    setIncidents([]);
  };

  // Закрытие сайдбара при смене вкладки
  useEffect(() => {
    setSidebarOpen(false);
  }, [activeTab]);

  // Если не авторизован - показываем логин
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // Рендер контента
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading SIEM Platform...</p>
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
              Retry
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
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header 
          setSidebarOpen={setSidebarOpen}
          onRefresh={handleRefresh}
          onLogout={handleLogout}
        />
        
        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 scrollbar-custom">
          <div className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl">
            {renderContent()}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-900/50 backdrop-blur border-t border-cyan-500/20 px-6 py-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div>
              <span>SIEM Light Platform v1.0.0</span>
              <span className="mx-2">•</span>
              <span>{logs.length} logs indexed</span>
              <span className="mx-2">•</span>
              <span>{incidents.length} incidents tracked</span>
            </div>
            <div>
              <span>© 2024 Security Operations Center</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;