import React, { useState } from "react";
import {
  Bell,
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

interface AlertRule {
  id: string;
  name: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  enabled: boolean;
  condition: string;
  action: string;
}

const Alerts: React.FC = () => {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState<AlertRule[]>([
    {
      id: "1",
      name: "Multiple Failed Login Attempts",
      description:
        "Trigger when more than 5 failed login attempts within 10 minutes",
      severity: "high",
      enabled: true,
      condition: "failed_login_count > 5 in 10min",
      action: "Email + Slack notification",
    },
    {
      id: "2",
      name: "Unusual Data Transfer Volume",
      description: "Alert on data transfers exceeding 1GB in 5 minutes",
      severity: "critical",
      enabled: true,
      condition: "data_transfer > 1GB in 5min",
      action: "Email + SMS",
    },
    {
      id: "3",
      name: "SQL Injection Attempt",
      description: "Detect SQL injection patterns in requests",
      severity: "critical",
      enabled: true,
      condition: "contains(sql_injection_pattern)",
      action: "Block IP + Email",
    },
    {
      id: "4",
      name: "Privilege Escalation",
      description: "Alert on unauthorized privilege changes",
      severity: "high",
      enabled: false,
      condition: "privilege_change && !authorized",
      action: "Email notification",
    },
    {
      id: "5",
      name: "Port Scan Detection",
      description: "Detect port scanning activity",
      severity: "medium",
      enabled: true,
      condition: "port_scan_detected",
      action: "Log + Email",
    },
  ]);

  const toggleAlert = (id: string) => {
    setAlerts(
      alerts.map((alert) =>
        alert.id === id ? { ...alert, enabled: !alert.enabled } : alert,
      ),
    );
  };

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter((alert) => alert.id !== id));
  };

  const severityColors: Record<string, string> = {
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  const enabledCount = alerts.filter((a) => a.enabled).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {t.alerts.title}
          </h2>
          <p className="text-gray-400">{t.alerts.manageRules}</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-all">
          <Plus className="w-5 h-5" />
          <span>{t.alerts.newAlertRule}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
          <p className="text-gray-400 text-sm mb-2">{t.alerts.totalRules}</p>
          <p className="text-3xl font-bold text-white">{alerts.length}</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
          <p className="text-green-400 text-sm mb-2">{t.alerts.activeRules}</p>
          <p className="text-3xl font-bold text-white">{enabledCount}</p>
        </div>
        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
          <p className="text-gray-400 text-sm mb-2">{t.alerts.inactiveRules}</p>
          <p className="text-3xl font-bold text-white">
            {alerts.length - enabledCount}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`bg-gray-800/50 backdrop-blur border rounded-xl p-6 transition-all ${
              alert.enabled
                ? "border-gray-700 hover:border-cyan-500/50"
                : "border-gray-700 opacity-60"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-white">
                    {alert.name}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded text-xs border ${severityColors[alert.severity]}`}
                  >
                    {t.severity[
                      alert.severity as keyof typeof t.severity
                    ]?.toUpperCase() || alert.severity.toUpperCase()}
                  </span>
                  {alert.enabled && (
                    <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                      {t.alerts.active}
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  {alert.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      {t.alerts.condition}
                    </p>
                    <code className="text-xs text-cyan-400 bg-gray-900 px-2 py-1 rounded">
                      {alert.condition}
                    </code>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      {t.alerts.action}
                    </p>
                    <p className="text-sm text-gray-300">{alert.action}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => toggleAlert(alert.id)}
                  className={`p-2 rounded-lg transition-all ${
                    alert.enabled
                      ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                      : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                  }`}
                  title={alert.enabled ? t.alerts.disable : t.alerts.enable}
                >
                  {alert.enabled ? (
                    <ToggleRight className="w-5 h-5" />
                  ) : (
                    <ToggleLeft className="w-5 h-5" />
                  )}
                </button>

                <button
                  className="p-2 bg-gray-700 text-gray-400 rounded-lg hover:bg-gray-600 hover:text-white transition-all"
                  title={t.common.edit}
                >
                  <Edit className="w-5 h-5" />
                </button>

                <button
                  onClick={() => deleteAlert(alert.id)}
                  className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                  title={t.common.delete}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Bell className="w-5 h-5 mr-2 text-cyan-400" />
          {t.alerts.notificationChannels}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white font-medium">Email</h4>
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            </div>
            <p className="text-sm text-gray-400">security-team@company.com</p>
          </div>

          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white font-medium">Slack</h4>
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            </div>
            <p className="text-sm text-gray-400">#security-alerts</p>
          </div>

          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white font-medium">Webhook</h4>
              <span className="w-3 h-3 bg-gray-500 rounded-full"></span>
            </div>
            <p className="text-sm text-gray-400">{t.alerts.notConfigured}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alerts;
