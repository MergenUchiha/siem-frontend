import React, { useCallback, useEffect, useState } from "react";
import {
  Bell,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { ToastContainer, useToast } from "../components/ui/Toast";
import {
  ApiError,
  alertsApi,
  type AlertAction,
  type AlertCondition,
  type AlertRule,
} from "../services/api";

/** Renders a stored condition as the expression it stands for. */
function describeCondition(condition: AlertCondition | null): string {
  if (!condition) return "unreadable";
  return condition.operator === "equals"
    ? `${condition.field} == "${condition.value}"`
    : `${condition.field} contains "${condition.value}"`;
}

function describeAction(action: AlertAction | null): string {
  if (!action) return "unreadable";
  switch (action.type) {
    case "create_incident":
      return "Raise an incident";
    case "email":
      return `Email ${action.target}`;
    case "slack":
      return `Slack ${action.target}`;
    case "webhook":
      return `Webhook ${action.target}`;
  }
}

const Alerts: React.FC = () => {
  const { t } = useLanguage();
  const toast = useToast();

  // These were five hardcoded objects in component state. Toggling or deleting
  // one changed nothing on the server and the list reset on every reload,
  // while the backend's alerts API went uncalled.
  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AlertRule | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setAlerts(await alertsApi.getAll());
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load alert rules",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleAlert = async (rule: AlertRule) => {
    setPendingId(rule.id);
    try {
      const updated = await alertsApi.toggle(rule.id);
      setAlerts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to update the rule",
      );
    } finally {
      setPendingId(null);
    }
  };

  const deleteAlert = async () => {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    setDeleteTarget(null);
    setPendingId(id);
    try {
      await alertsApi.delete(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      toast.success("Alert rule deleted");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to delete the rule",
      );
    } finally {
      setPendingId(null);
    }
  };

  const severityColors: Record<string, string> = {
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  const enabledCount = alerts.filter((a) => a.enabled).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toast.toasts} onRemove={toast.remove} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {t.alerts.title}
          </h2>
          <p className="text-gray-400">{t.alerts.manageRules}</p>
        </div>
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

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {!error && alerts.length === 0 && (
        <div className="p-8 bg-gray-800/50 border border-gray-700 rounded-xl text-center text-gray-400">
          {t.alerts.noRules}
        </div>
      )}

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
                      {describeCondition(alert.condition)}
                    </code>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      {t.alerts.action}
                    </p>
                    <p className="text-sm text-gray-300">
                      {describeAction(alert.action)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => void toggleAlert(alert)}
                  disabled={pendingId === alert.id}
                  className={`p-2 rounded-lg transition-all disabled:opacity-50 ${
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
                  onClick={() => setDeleteTarget(alert)}
                  disabled={pendingId === alert.id}
                  className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all disabled:opacity-50"
                  title={t.common.delete}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Which channels a rule can use. The card used to show three addresses
          nobody had configured, each with a green "connected" dot. */}
      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Bell className="w-5 h-5 mr-2 text-cyan-400" />
          {t.alerts.notificationChannels}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["create_incident", "webhook", "slack"] as const).map((channel) => (
            <div
              key={channel}
              className="bg-gray-900/50 border border-gray-700 rounded-lg p-4"
            >
              <h4 className="text-white font-medium mb-2">
                {channel === "create_incident" ? "Incident" : channel}
              </h4>
              <p className="text-sm text-gray-400">
                {alerts.filter((a) => a.action?.type === channel).length}{" "}
                {t.alerts.rulesUsingChannel}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-gray-500">{t.alerts.emailNotDelivered}</p>
      </div>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title={t.common.delete}
        message={`${t.alerts.confirmDelete} "${deleteTarget?.name ?? ""}"?`}
        confirmLabel={t.common.delete}
        cancelLabel={t.common.cancel}
        variant="danger"
        onConfirm={() => void deleteAlert()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default Alerts;
