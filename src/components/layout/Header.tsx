import React, { useState, useEffect } from 'react';
import { Menu, Bell, Search, RefreshCw, Wifi, X, LogOut, User } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
  onRefresh?: () => void;
  onLogout?: () => void;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'critical' | 'warning' | 'info';
  time: string;
  read: boolean;
}

const Header: React.FC<HeaderProps> = ({ setSidebarOpen, onRefresh, onLogout }) => {
  const { t } = useLanguage();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : { name: 'User', email: 'user@siem.local', role: 'analyst' };

  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch (e) {
        console.error('Failed to parse notifications:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setShowNotifications(false);
        setShowUserMenu(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addNotification = (notification: Omit<Notification, 'id' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev.slice(0, 19)]);
  };

  React.useEffect(() => {
    (window as any).addNotification = addNotification;
    return () => {
      delete (window as any).addNotification;
    };
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    if (onRefresh) onRefresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleLogout = () => {
    localStorage.removeItem('notifications');
    setNotifications([]);
    if (onLogout) onLogout();
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    localStorage.removeItem('notifications');
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'critical': return 'border-l-4 border-red-500 bg-red-500/10';
      case 'warning': return 'border-l-4 border-yellow-500 bg-yellow-500/10';
      case 'info': return 'border-l-4 border-blue-500 bg-blue-500/10';
      default: return 'border-l-4 border-gray-500 bg-gray-500/10';
    }
  };

  return (
    <>
      <header className="bg-gray-900/50 backdrop-blur-xl border-b border-cyan-500/20 sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 lg:px-6 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
              aria-label="Open sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="relative hidden md:block">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${searchFocused ? 'text-cyan-400' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder={t.header.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="w-64 lg:w-96 pl-10 pr-20 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-400 bg-gray-700 border border-gray-600 rounded">
                  Ctrl+K
                </kbd>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              title={t.common.refresh}
              aria-label={t.common.refresh}
            >
              <RefreshCw className={`w-5 h-5 transition-transform ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'} duration-300`} />
            </button>

            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all group"
                aria-label={t.header.notifications}
              >
                <Bell className="w-5 h-5 group-hover:animate-pulse" />
                {unreadCount > 0 && (
                  <>
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse">
                      <span className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
                    </span>
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full min-w-[20px] text-center">
                      {unreadCount}
                    </span>
                  </>
                )}
              </button>

              {showNotifications && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowNotifications(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                      <h3 className="text-white font-semibold">{t.header.notifications}</h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-400">{unreadCount} {t.header.unread}</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-cyan-400 hover:text-cyan-300"
                          >
                            {t.header.markAllRead}
                          </button>
                        )}
                      </div>
                    </div>
                    {notifications.length > 0 ? (
                      <>
                        <div className="divide-y divide-gray-700">
                          {notifications.map(notification => (
                            <div
                              key={notification.id}
                              onClick={() => markAsRead(notification.id)}
                              className={`p-4 hover:bg-gray-800 cursor-pointer transition-colors ${getNotificationColor(notification.type)} ${notification.read ? 'opacity-60' : ''}`}
                            >
                              <div className="flex items-start justify-between mb-1">
                                <h4 className="text-white font-medium text-sm">{notification.title}</h4>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                                )}
                              </div>
                              <p className="text-gray-400 text-xs mb-2">{notification.message}</p>
                              <span className="text-gray-500 text-xs">{notification.time}</span>
                            </div>
                          ))}
                        </div>
                        <div className="p-3 border-t border-gray-700 text-center">
                          <button
                            onClick={clearAll}
                            className="text-red-400 text-sm hover:text-red-300 transition-colors"
                          >
                            {t.header.clearAll}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="p-8 text-center">
                        <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400 text-sm">{t.header.noNotifications}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg group hover:bg-green-500/20 transition-all cursor-pointer">
              <Wifi className="w-4 h-4 text-green-400 group-hover:animate-pulse" />
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-green-400 font-medium">{t.header.online}</span>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-cyan-500/50 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-white hidden lg:block">{user.name}</span>
              </button>

              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50">
                    <div className="p-4 border-b border-gray-700">
                      <p className="text-white font-medium">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                      <p className="text-xs text-cyan-400 mt-1 capitalize">{user.role}</p>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t.common.logout}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="hidden lg:flex items-center px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg">
              <span className="text-sm text-gray-400">
                {currentTime.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false 
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t.common.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-all"
            />
          </div>
        </div>
      </header>

      {showSearch && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-lg shadow-2xl">
            <div className="p-4 border-b border-gray-700 flex items-center">
              <Search className="w-5 h-5 text-gray-400 mr-3" />
              <input
                type="text"
                placeholder={t.header.searchPlaceholder}
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none"
              />
              <button
                onClick={() => setShowSearch(false)}
                className="ml-3 p-1 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-gray-400 text-sm text-center">
                {searchQuery ? `${t.common.search} "${searchQuery}"...` : `${t.common.search}...`}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;