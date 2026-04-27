import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Shield, Bell, Database, Save, Check, Globe, Sun, Moon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Language } from '../i18n/i18n';

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
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
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
    localStorage.setItem('app_settings', JSON.stringify(settings));
    localStorage.setItem('user_profile', JSON.stringify(userProfile));
    
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const updatedUser = {
      ...currentUser,
      name: userProfile.name,
      email: userProfile.email
    };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    setSaved(true);
    
    if ((window as any).addNotification) {
      (window as any).addNotification({
        title: t.notificationTypes.settingsSaved,
        message: t.notificationTypes.settingsSavedMessage,
        type: 'info',
        time: t.time.justNow
      });
    }
    
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    localStorage.removeItem('app_settings');
    localStorage.removeItem('user_profile');
    window.location.reload();
  };

  const languageNames: Record<Language, string> = {
    en: 'English',
    ru: 'Русский',
    tk: 'Türkmençe'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">{t.settings.title}</h2>
          <p className="text-gray-400">{t.settings.subtitle}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all"
          >
            {t.settings.resetToDefault}
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
            <span>{saved ? t.settings.saved : t.settings.saveChanges}</span>
          </button>
        </div>
      </div>

      {/* Language Selection */}
      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Globe className="w-5 h-5 mr-2 text-cyan-400" />
          {t.settings.language}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['en', 'ru', 'tk'] as Language[]).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-4 py-3 rounded-lg border-2 transition-all ${
                language === lang
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                  : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">
                  {lang === 'en' ? '🇬🇧' : lang === 'ru' ? '🇷🇺' : '🇹🇲'}
                </div>
                <div className="font-medium">{languageNames[lang]}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Theme Selection */}
      <div className="bg-gray-800/50 dark:bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          {theme === 'dark' ? <Moon className="w-5 h-5 mr-2 text-cyan-400" /> : <Sun className="w-5 h-5 mr-2 text-yellow-400" />}
          {t.settings.theme}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setTheme('dark')}
            className={`px-4 py-3 rounded-lg border-2 transition-all ${
              theme === 'dark'
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Moon className="w-5 h-5" />
              <span className="font-medium">{t.settings.darkTheme}</span>
            </div>
          </button>
          <button
            onClick={() => setTheme('light')}
            className={`px-4 py-3 rounded-lg border-2 transition-all ${
              theme === 'light'
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Sun className="w-5 h-5" />
              <span className="font-medium">{t.settings.lightTheme}</span>
            </div>
          </button>
        </div>
      </div>

      {/* User Profile */}
      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <User className="w-5 h-5 mr-2 text-cyan-400" />
          {t.settings.userProfile}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">{t.settings.fullName}</label>
            <input
              type="text"
              value={userProfile.name}
              onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">{t.common.email}</label>
            <input
              type="email"
              value={userProfile.email}
              onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">{t.settings.role}</label>
            <select 
              value={userProfile.role}
              onChange={(e) => setUserProfile({ ...userProfile, role: e.target.value })}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="admin">{t.roles.admin}</option>
              <option value="analyst">{t.roles.analyst}</option>
              <option value="viewer">{t.roles.viewer}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">{t.settings.department}</label>
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
          {t.settings.notifications}
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white">{t.settings.emailNotifications}</p>
              <p className="text-sm text-gray-400">{t.settings.emailNotificationsDesc}</p>
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
              <p className="text-white">{t.settings.slackNotifications}</p>
              <p className="text-sm text-gray-400">{t.settings.slackNotificationsDesc}</p>
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
              <p className="text-white">{t.settings.pushNotifications}</p>
              <p className="text-sm text-gray-400">{t.settings.pushNotificationsDesc}</p>
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
          {t.settings.security}
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white">{t.settings.twoFactor}</p>
              <p className="text-sm text-gray-400">{t.settings.twoFactorDesc}</p>
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
            <label className="block text-white mb-2">{t.settings.sessionTimeout}</label>
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
          {t.settings.displaySettings}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white mb-2">{t.settings.refreshInterval}</label>
            <select
              value={settings.display.refreshInterval}
              onChange={(e) => setSettings({
                ...settings,
                display: { ...settings.display, refreshInterval: parseInt(e.target.value) }
              })}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="5">5 {t.time.seconds}</option>
              <option value="10">10 {t.time.seconds}</option>
              <option value="30">30 {t.time.seconds}</option>
              <option value="60">1 {t.time.minutes}</option>
            </select>
          </div>

          <div>
            <label className="block text-white mb-2">{t.settings.itemsPerPage}</label>
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
          {t.settings.dataRetention}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white mb-2">{t.settings.logRetention}</label>
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
            <label className="block text-white mb-2">{t.settings.incidentRetention}</label>
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