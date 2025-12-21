import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import LogsViewer from './pages/LogsViewer';
import Incidents from './pages/Incidents';
import Analytics from './pages/Analytics';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import { generateMockLogs, generateMockIncidents } from './utils/mockData';
import { Log, Incident } from './types';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logs, setLogs] = useState<Log[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize data
  useEffect(() => {
    const initializeData = () => {
      try {
        setLogs(generateMockLogs(100));
        setIncidents(generateMockIncidents());
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing data:', error);
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  // Simulate real-time log updates
  useEffect(() => {
    if (isLoading) return;

    const interval = setInterval(() => {
      try {
        const newLog = generateMockLogs(1)[0];
        setLogs(prev => [newLog, ...prev.slice(0, 199)]); // Keep max 200 logs
      } catch (error) {
        console.error('Error generating new log:', error);
      }
    }, 10000); // Add new log every 10 seconds

    return () => clearInterval(interval);
  }, [isLoading]);

  // Handle data refresh
  const handleRefresh = useCallback(() => {
    try {
      setLogs(generateMockLogs(100));
      setIncidents(generateMockIncidents());
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [activeTab]);

  // Render page content based on active tab
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

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard logs={logs} incidents={incidents} />;
      case 'logs':
        return <LogsViewer logs={logs} />;
      case 'incidents':
        return <Incidents incidents={incidents} />;
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