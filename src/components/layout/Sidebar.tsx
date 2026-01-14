import React from 'react';
import { Shield, BarChart3, Database, AlertTriangle, TrendingUp, Bell, Settings, Users, X, Activity } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface MenuItem {
  id: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen }) => {
  const { t } = useLanguage();
  
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : { name: 'User', email: 'user@siem.local', role: 'analyst' };

  const menuItems: MenuItem[] = [
    { id: 'dashboard', icon: BarChart3, label: t.sidebar.dashboard },
    { id: 'logs', icon: Database, label: t.sidebar.logViewer },
    { id: 'incidents', icon: AlertTriangle, label: t.sidebar.incidents, badge: 8 },
    { id: 'analytics', icon: TrendingUp, label: t.sidebar.analytics },
    { id: 'alerts', icon: Bell, label: t.sidebar.alerts, badge: 5 },
    { id: 'settings', icon: Settings, label: t.sidebar.settings }
  ];

  const handleMenuClick = (tabId: string) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  return (
    <>
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 
          bg-gray-900 border-r border-cyan-500/20 
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        <div className="flex items-center justify-between p-6 border-b border-cyan-500/20">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Shield className="w-8 h-8 text-cyan-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse">
                <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">SIEM Light</h1>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Activity className="w-3 h-3" />
                Security Platform
              </p>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="lg:hidden text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-800 rounded"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-custom">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={`
                  w-full flex items-center justify-between px-4 py-3 rounded-lg 
                  transition-all duration-200 group
                  ${isActive 
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/10' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white hover:border hover:border-gray-700'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-cyan-400' : ''}`} />
                  <span className="font-medium">{item.label}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {item.badge !== undefined && (
                    <span className={`
                      px-2 py-0.5 text-xs font-bold rounded-full
                      ${isActive 
                        ? 'bg-cyan-400 text-gray-900' 
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }
                    `}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-cyan-500/20">
          <div className="bg-gray-800/50 backdrop-blur rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">{t.sidebar.systemStatus}</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-green-400 font-medium">{t.header.online}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">{t.sidebar.cpuUsage}</span>
                <span className="text-gray-300">45%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1">
                <div className="bg-green-500 h-1 rounded-full" style={{ width: '45%' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-cyan-500/20">
          <div className="flex items-center space-x-3 px-4 py-3 bg-gray-800/50 backdrop-blur rounded-lg hover:bg-gray-700/50 transition-all cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center ring-2 ring-cyan-500/30 group-hover:ring-cyan-500/50 transition-all">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;