import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Shield, Bell, Database, Save, Check } from 'lucide-react';

interface SettingsState {
  notifications: {
    email: boolean;
    slack: boolean;
    push: boolean;
  };
  security: {
    twoFactor: boolean;
    sessionTimeout: number;
  };
  display: {
    refreshInterval: number;
    itemsPerPage: number;
  };
  dataRetention: {
    logRetention: number;
    incidentRetention: number;
  };
}

const Settings: React.FC = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const [settings, setSettings] = useState<SettingsState>({
    notifications: {
      email: true,
      slack: false,
      push: false
    },
    security: {
      twoFactor: false,
      sessionTimeout: 30
    },
    display: {
      refreshInterval: 5,
      itemsPerPage: 20
    },
    dataRetention: {
      logRetention: 90,
      incidentRetention: 365
    }
  });

  const [userProfile, setUserProfile] = useState({
    name: user.name || 'Admin User',
    email: user.email || 'admin@siem.local',
    role: user.role || 'admin',
    department: 'Security Operations'
  });

  const [saved, setSaved] = useState(false);

  // Загрузка настроек из localStorage при монтировании
  useEffect(() => {
    const savedSettings = localStorage.getItem('app_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }

    const savedProfile = localStorage.getItem('user_profile');
    if (savedProfile) {
      try {
        setUserProfile(JSON.parse(savedProfile));
      } catch (e) {
        console.error('Failed to load profile:', e);
      }
    }
  }, []);

  const handleSave = () => {
    // Сохраняем настройки в localStorage
    localStorage.setItem('app_settings', JSON.stringify(settings));
    localStorage.setItem('user_profile', JSON.stringify(userProfile));
    
    // Обновляем данные пользователя в localStorage
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const updatedUser = {
      ...currentUser,
      name: userProfile.name,
      email: userProfile.email
    };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    setSaved(true);
    
    // Показываем уведомление
    if ((window as any).addNotification) {
      (window as any).addNotification({
        title: 'Settings Saved',
        message: 'Your preferences have been updated successfully',
        type: 'info',
        time: 'Just now'
      });
    }
    
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    localStorage.removeItem('app_settings');
    localStorage.removeItem('user_profile');
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Settings</h2>
          <p className="text-gray-400">Configure system preferences and security options</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all"
          >
            Reset to Default
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-cyan-500 text-white hover:bg-cyan-600'
            }`}
          >
            {saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
            <span>{saved ? 'Saved!' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* User Profile */}
      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <User className="w-5 h-5 mr-2 text-cyan-400" />
          User Profile
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Full Name</label>
            <input
              type="text"
              value={userProfile.name}
              onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Email</label>
            <input
              type="email"
              value={userProfile.email}
              onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Role</label>
            <select 
              value={userProfile.role}
              onChange={(e) => setUserProfile({ ...userProfile, role: e.target.value })}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="admin">Administrator</option>
              <option value="analyst">Analyst</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Department</label>
            <input
              type="text"
              value={userProfile.department}
              onChange={(e) => setUserProfile({ ...userProfile, department: e.target.value })}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Bell className="w-5 h-5 mr-2 text-cyan-400" />
          Notifications
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white">Email Notifications</p>
              <p className="text-sm text-gray-400">Receive alerts via email</p>
            </div>
            <button
              onClick={() => setSettings({
                ...settings,
                notifications: { ...settings.notifications, email: !settings.notifications.email }
              })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.notifications.email ? 'bg-cyan-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notifications.email ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white">Slack Notifications</p>
              <p className="text-sm text-gray-400">Post alerts to Slack channel</p>
            </div>
            <button
              onClick={() => setSettings({
                ...settings,
                notifications: { ...settings.notifications, slack: !settings.notifications.slack }
              })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.notifications.slack ? 'bg-cyan-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notifications.slack ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white">Push Notifications</p>
              <p className="text-sm text-gray-400">Browser push notifications</p>
            </div>
            <button
              onClick={() => setSettings({
                ...settings,
                notifications: { ...settings.notifications, push: !settings.notifications.push }
              })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.notifications.push ? 'bg-cyan-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notifications.push ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2 text-cyan-400" />
          Security
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white">Two-Factor Authentication</p>
              <p className="text-sm text-gray-400">Add an extra layer of security</p>
            </div>
            <button
              onClick={() => setSettings({
                ...settings,
                security: { ...settings.security, twoFactor: !settings.security.twoFactor }
              })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.security.twoFactor ? 'bg-cyan-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.security.twoFactor ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-white mb-2">Session Timeout (minutes)</label>
            <input
              type="number"
              value={settings.security.sessionTimeout}
              onChange={(e) => setSettings({
                ...settings,
                security: { ...settings.security, sessionTimeout: parseInt(e.target.value) || 30 }
              })}
              className="w-full md:w-64 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Display Settings */}
      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <SettingsIcon className="w-5 h-5 mr-2 text-cyan-400" />
          Display Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white mb-2">Auto-Refresh Interval (seconds)</label>
            <select
              value={settings.display.refreshInterval}
              onChange={(e) => setSettings({
                ...settings,
                display: { ...settings.display, refreshInterval: parseInt(e.target.value) }
              })}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="5">5 seconds</option>
              <option value="10">10 seconds</option>
              <option value="30">30 seconds</option>
              <option value="60">1 minute</option>
            </select>
          </div>

          <div>
            <label className="block text-white mb-2">Items Per Page</label>
            <select
              value={settings.display.itemsPerPage}
              onChange={(e) => setSettings({
                ...settings,
                display: { ...settings.display, itemsPerPage: parseInt(e.target.value) }
              })}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Retention */}
      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Database className="w-5 h-5 mr-2 text-cyan-400" />
          Data Retention
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white mb-2">Log Retention (days)</label>
            <input
              type="number"
              value={settings.dataRetention.logRetention}
              onChange={(e) => setSettings({
                ...settings,
                dataRetention: { ...settings.dataRetention, logRetention: parseInt(e.target.value) || 90 }
              })}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-white mb-2">Incident Retention (days)</label>
            <input
              type="number"
              value={settings.dataRetention.incidentRetention}
              onChange={(e) => setSettings({
                ...settings,
                dataRetention: { ...settings.dataRetention, incidentRetention: parseInt(e.target.value) || 365 }
              })}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;