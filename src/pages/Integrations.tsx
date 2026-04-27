import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Webhook,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Download,
  Info,
  Play,
  Square,
  Timer,
  Filter,
  X,
  Plus,
  Shield,
  ShieldOff,
  Trash2,
  Search,
  Calendar,
} from "lucide-react";
import { ToastContainer, useToast } from "../components/ui/Toast";
import {
  settingsApi,
  WebhookConfig,
  PullResult,
  AutoPullStatus,
  Log,
} from "../services/api";
import websocketService from "../services/websocket";
import { useLanguage } from "../contexts/LanguageContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type ConnectionStatus = "idle" | "testing" | "ok" | "error";

type RuleField = "severity" | "source" | "ip" | "message" | "user" | "action";
type RuleOperator = "equals" | "not_equals" | "contains" | "not_contains" | "starts_with" | "regex";
type RuleAction = "allow" | "deny";

interface FirewallRule {
  id: string;
  enabled: boolean;
  field: RuleField;
  operator: RuleOperator;
  value: string;
  action: RuleAction;
}

const RULE_FIELDS: RuleField[] = ["severity", "source", "ip", "message", "user", "action"];

const matchRule = (log: Log, rule: FirewallRule): boolean => {
  const fieldValue = (log[rule.field] ?? "").toString().toLowerCase();
  const ruleValue = rule.value.toLowerCase();

  switch (rule.operator) {
    case "equals":
      return fieldValue === ruleValue;
    case "not_equals":
      return fieldValue !== ruleValue;
    case "contains":
      return fieldValue.includes(ruleValue);
    case "not_contains":
      return !fieldValue.includes(ruleValue);
    case "starts_with":
      return fieldValue.startsWith(ruleValue);
    case "regex":
      try {
        return new RegExp(rule.value, "i").test(fieldValue);
      } catch {
        return false;
      }
    default:
      return false;
  }
};

const applyFirewallRules = (log: Log, rules: FirewallRule[]): boolean => {
  const activeRules = rules.filter((r) => r.enabled && r.value.trim());
  if (activeRules.length === 0) return true;

  for (const rule of activeRules) {
    const matched = matchRule(log, rule);
    if (matched && rule.action === "deny") return false;
    if (!matched && rule.action === "allow") return false;
  }
  return true;
};

let ruleIdCounter = 0;
const createRule = (): FirewallRule => ({
  id: `rule_${++ruleIdCounter}_${Date.now()}`,
  enabled: true,
  field: "severity",
  operator: "equals",
  value: "",
  action: "allow",
});

// ─── Status badge ─────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: ConnectionStatus; labels: { idle: string; testing: string; ok: string; error: string } }> = ({ status, labels }) => {
  const map: Record<
    ConnectionStatus,
    { label: string; cls: string; icon: React.ReactNode }
  > = {
    idle: {
      label: labels.idle,
      cls: "text-gray-400 bg-gray-500/10 border-gray-600",
      icon: <WifiOff className="w-3 h-3" />,
    },
    testing: {
      label: labels.testing,
      cls: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
      icon: <RefreshCw className="w-3 h-3 animate-spin" />,
    },
    ok: {
      label: labels.ok,
      cls: "text-green-400 bg-green-500/10 border-green-500/30",
      icon: <Wifi className="w-3 h-3" />,
    },
    error: {
      label: labels.error,
      cls: "text-red-400 bg-red-500/10 border-red-500/30",
      icon: <AlertTriangle className="w-3 h-3" />,
    },
  };
  const { label, cls, icon } = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cls}`}
    >
      {icon}
      {label}
    </span>
  );
};

// ─── Pull result panel ────────────────────────────────────────────────────────

const PullResultPanel: React.FC<{ result: PullResult; labels: { pullResult: string; fetched: string; saved: string; errors: string; andMore: string; visibleInLogViewer: string } }> = ({ result, labels }) => (
  <div className="mt-4 p-4 bg-gray-900/70 border border-gray-700 rounded-lg space-y-3">
    <div className="flex items-center gap-2 text-sm font-medium text-white">
      <Info className="w-4 h-4 text-cyan-400" />
      {labels.pullResult}
    </div>
    <div className="grid grid-cols-3 gap-3 text-center">
      {[
        {
          label: labels.fetched,
          value: result.fetched,
          color: "text-cyan-400",
        },
        {
          label: labels.saved,
          value: result.saved,
          color: "text-green-400",
        },
        {
          label: labels.errors,
          value: result.errors,
          color: result.errors > 0 ? "text-red-400" : "text-gray-500",
        },
      ].map(({ label, value, color }) => (
        <div key={label} className="bg-gray-800 rounded-lg py-3">
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
    {result.logs.length > 0 && (
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {result.logs.slice(0, 10).map((log: any, i: number) => (
          <div
            key={i}
            className="flex items-center gap-2 px-2 py-1 bg-gray-800/50 rounded text-xs"
          >
            <span
              className={`px-1.5 py-0.5 rounded font-medium ${
                log.severity === "critical"
                  ? "bg-red-500/20 text-red-400"
                  : log.severity === "high"
                    ? "bg-orange-500/20 text-orange-400"
                    : log.severity === "medium"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-gray-500/20 text-gray-400"
              }`}
            >
              {log.severity?.toUpperCase()}
            </span>
            <span className="text-gray-300 truncate">{log.message}</span>
            <span className="text-gray-500 flex-shrink-0 font-mono">
              {log.ip}
            </span>
          </div>
        ))}
        {result.logs.length > 10 && (
          <p className="text-xs text-gray-500 text-center pt-1">
            …{labels.andMore} {result.logs.length - 10} {labels.visibleInLogViewer}
          </p>
        )}
      </div>
    )}
  </div>
);

// ─── Defaults ─────────────────────────────────────────────────────────────────

const defaultConfig: WebhookConfig = {
  enabled: false,
  host: "",
  port: "443",
  path: "/api/logs/ingest",
  apiKey: "",
};

// ─── Main page ────────────────────────────────────────────────────────────────

const Integrations: React.FC = () => {
  const toast = useToast();
  const { t } = useLanguage();

  const [config, setConfig] = useState<WebhookConfig>(defaultConfig);
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPulling, setIsPulling] = useState(false);
  const [pullResult, setPullResult] = useState<PullResult | null>(null);
  const [pullLimit, setPullLimit] = useState<number>(100);
  const [autoPull, setAutoPull] = useState<AutoPullStatus | null>(null);
  const [autoPullInterval, setAutoPullInterval] = useState<number>(1);
  const [isTogglingAutoPull, setIsTogglingAutoPull] = useState(false);
  const [realtimeLogs, setRealtimeLogs] = useState<Log[]>([]);
  const realtimeLogsRef = useRef<HTMLDivElement>(null);
  const [firewallRules, setFirewallRules] = useState<FirewallRule[]>([]);
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const filteredLogs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return realtimeLogs.filter((log) => {
      // Firewall rules
      if (!applyFirewallRules(log, firewallRules)) return false;
      // Text search
      if (q) {
        const haystack = `${log.message} ${log.source} ${log.ip} ${log.user ?? ""} ${log.action}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      // Date range
      if (filterDateFrom) {
        if (new Date(log.timestamp) < new Date(filterDateFrom)) return false;
      }
      if (filterDateTo) {
        if (new Date(log.timestamp) > new Date(filterDateTo + "T23:59:59")) return false;
      }
      return true;
    });
  }, [realtimeLogs, firewallRules, searchQuery, filterDateFrom, filterDateTo]);

  const activeRuleCount = firewallRules.filter((r) => r.enabled && r.value.trim()).length;
  const blockedCount = realtimeLogs.length - filteredLogs.length;

  const addRule = () => setFirewallRules((prev) => [...prev, createRule()]);
  const removeRule = (id: string) => setFirewallRules((prev) => prev.filter((r) => r.id !== id));
  const updateRule = (id: string, patch: Partial<FirewallRule>) =>
    setFirewallRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const clearRules = () => {
    setFirewallRules([]);
    setShowRuleBuilder(false);
  };

  // Subscribe to WebSocket for real-time logs
  const handleNewLog = useCallback((log: Log) => {
    setRealtimeLogs((prev) => [log, ...prev].slice(0, 50));
  }, []);

  useEffect(() => {
    websocketService.connect();
    websocketService.onNewLog(handleNewLog);
    return () => {
      websocketService.offNewLog(handleNewLog);
    };
  }, [handleNewLog]);

  // Load config and auto-pull status on mount
  useEffect(() => {
    settingsApi
      .getWebhookConfig()
      .then(setConfig)
      .catch(() => {
        try {
          const saved = localStorage.getItem("siem_webhook_config");
          if (saved) setConfig({ ...defaultConfig, ...JSON.parse(saved) });
        } catch {
          /* ignore */
        }
      })
      .finally(() => setIsLoading(false));

    settingsApi
      .getAutoPullStatus()
      .then((s) => {
        setAutoPull(s);
        setAutoPullInterval(s.intervalSeconds);
      })
      .catch(() => {});
  }, []);

  const patch = (p: Partial<WebhookConfig>) =>
    setConfig((c) => ({ ...c, ...p }));

  // ── Test connection ─────────────────────────────────────────────────────
  const handleTest = async () => {
    if (!config.host) {
      toast.error(t.integrations.enterHostBeforeTesting);
      return;
    }
    setStatus("testing");
    try {
      const protocol = config.port === "443" ? "https" : "http";
      const url = `${protocol}://${config.host}:${config.port}${config.path}`;
      const res = await fetch(url, {
        method: "HEAD",
        headers: config.apiKey ? { "x-api-key": config.apiKey } : {},
        signal: AbortSignal.timeout(5000),
      });
      if (res.status < 600) {
        setStatus("ok");
        toast.success(
          `${t.integrations.serverResponded} ${res.status} ${t.integrations.endpointReachable}`,
        );
      } else {
        setStatus("error");
        toast.error(t.integrations.unreachable);
      }
    } catch (err: any) {
      setStatus("error");
      toast.error(
        err?.name === "TimeoutError"
          ? t.integrations.connectionTimedOut
          : t.integrations.couldNotReach,
      );
    }
  };

  // ── Save config ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const saved = await settingsApi.saveWebhookConfig(config);
      setConfig(saved);
      localStorage.setItem("siem_webhook_config", JSON.stringify(saved));
      toast.success(t.integrations.settingsSaved);
    } catch (err: any) {
      toast.error(err?.message || t.integrations.failedToSave);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Pull logs from remote server ────────────────────────────────────────
  const handlePull = async () => {
    if (!config.host) {
      toast.error(t.integrations.saveConfigFirst);
      return;
    }
    setIsPulling(true);
    setPullResult(null);
    try {
      const result = await settingsApi.pullLogs({ limit: pullLimit });
      setPullResult(result);
      if (result.saved > 0) {
        toast.success(
          `${t.integrations.pulledNewLogs} ${result.saved} ${t.integrations.refreshLogViewer}`,
        );
      } else if (result.fetched === 0) {
        toast.info(t.integrations.noLogsReturned);
      } else {
        toast.warning(
          `${t.integrations.fetched} ${result.fetched} ${t.integrations.fetchedButSaved} (${result.errors} ${t.integrations.errors})`,
        );
      }
    } catch (err: any) {
      toast.error(err?.message || t.integrations.pullFailed);
    } finally {
      setIsPulling(false);
    }
  };

  // ── Toggle auto-pull ────────────────────────────────────────────────
  const handleToggleAutoPull = async () => {
    setIsTogglingAutoPull(true);
    try {
      if (autoPull?.running) {
        const status = await settingsApi.stopAutoPull();
        setAutoPull(status);
        toast.info(t.integrations.autoPullStopped);
      } else {
        if (!config.host) {
          toast.error(t.integrations.saveConfigFirst);
          setIsTogglingAutoPull(false);
          return;
        }
        const status = await settingsApi.startAutoPull(autoPullInterval);
        setAutoPull(status);
        toast.success(
          `${t.integrations.autoPullStarted} (${t.integrations.every} ${autoPullInterval}s) ${t.integrations.newLogsRealtime}`,
        );
      }
    } catch (err: any) {
      toast.error(err?.message || t.integrations.failedToggleAutoPull);
    } finally {
      setIsTogglingAutoPull(false);
    }
  };

  const endpointUrl = config.host
    ? `${config.port === "443" ? "https" : "http"}://${config.host}:${config.port}${config.path}`
    : null;

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-2xl">
      <ToastContainer toasts={toast.toasts} onRemove={toast.remove} />

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">{t.integrations.title}</h2>
        <p className="text-gray-400 text-sm">
          {t.integrations.subtitle}
        </p>
      </div>

      {/* Webhook card */}
      <div
        className={`bg-gray-800/50 backdrop-blur border rounded-xl transition-all duration-300 ${config.enabled ? "border-gray-600" : "border-gray-700/50"}`}
      >
        {/* Card header */}
        <div className="p-5 flex items-center justify-between gap-4 border-b border-gray-700/60">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg flex-shrink-0">
              <Webhook className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-0.5">
                <h3 className="text-white font-semibold">{t.integrations.webhookHttp}</h3>
                <StatusBadge status={status} labels={{ idle: t.integrations.notTested, testing: t.integrations.testing, ok: t.integrations.connected, error: t.integrations.unreachable }} />
              </div>
              <p className="text-gray-400 text-sm">
                {t.integrations.webhookDesc}
              </p>
            </div>
          </div>
          {/* Enable toggle */}
          <button
            onClick={() => patch({ enabled: !config.enabled })}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${config.enabled ? "bg-cyan-500" : "bg-gray-600"}`}
            title={config.enabled ? "Disable" : "Enable"}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.enabled ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
        </div>

        {/* Fields */}
        <div className="p-5 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-5 h-5 text-gray-400 animate-spin mr-2" />
              <span className="text-gray-400 text-sm">{t.integrations.loadingConfig}</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs text-gray-400 mb-1.5">
                    {t.integrations.hostIp}
                  </label>
                  <input
                    type="text"
                    value={config.host}
                    onChange={(e) => {
                      patch({ host: e.target.value });
                      setStatus("idle");
                    }}
                    placeholder="192.168.1.100 or logs.company.com"
                    className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">
                    {t.integrations.port}
                  </label>
                  <input
                    type="text"
                    value={config.port}
                    onChange={(e) => {
                      patch({ port: e.target.value });
                      setStatus("idle");
                    }}
                    placeholder="443"
                    className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  {t.integrations.endpointPath}
                </label>
                <input
                  type="text"
                  value={config.path}
                  onChange={(e) => patch({ path: e.target.value })}
                  placeholder="/api/logs/ingest"
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  {t.integrations.apiKey}{" "}
                  <span className="text-gray-600">{t.integrations.apiKeyHeader}</span>
                </label>
                <input
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => patch({ apiKey: e.target.value })}
                  placeholder="siem-ingest-key-xxxxxxxx"
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              {endpointUrl && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg">
                  <span className="text-xs text-gray-500">POST</span>
                  <span className="text-xs text-cyan-400 font-mono truncate">
                    {endpointUrl}
                  </span>
                </div>
              )}

              {/* Actions row */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleTest}
                  disabled={status === "testing"}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-all disabled:opacity-50 text-sm"
                >
                  {status === "testing" ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wifi className="w-4 h-4" />
                  )}
                  {t.integrations.test}
                </button>

                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-all disabled:opacity-50 text-sm font-medium"
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {t.integrations.save}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pull logs card */}
      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl">
        <div className="p-5 border-b border-gray-700/60">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Download className="w-4 h-4 text-cyan-400" />
            {t.integrations.pullLogsTitle}
          </h3>
          <p className="text-gray-400 text-sm mt-0.5">
            {t.integrations.fetchLogsVia}{" "}
            <code className="bg-gray-900 px-1 py-0.5 rounded text-gray-300 text-xs">
              GET{" "}
              {config.host
                ? `${config.port === "443" ? "https" : "http"}://${config.host}:${config.port}${config.path.replace(/\/ingest$/, "/logs")}`
                : "<host>/logs"}
            </code>{" "}
            {t.integrations.andStoreLocally}
          </p>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                {t.integrations.maxLogsToFetch}
              </label>
              <select
                value={pullLimit}
                onChange={(e) => setPullLimit(Number(e.target.value))}
                className="px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              >
                {[50, 100, 250, 500, 1000].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 flex items-end">
              <button
                onClick={handlePull}
                disabled={isPulling || !config.host}
                className="flex items-center gap-2 px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {isPulling ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> {t.integrations.pulling}
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" /> {t.integrations.fetchLogs}
                  </>
                )}
              </button>
            </div>
          </div>

          {!config.host && (
            <p className="text-xs text-yellow-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {t.integrations.configureHostAbove}
            </p>
          )}

          {pullResult && <PullResultPanel result={pullResult} labels={{ pullResult: t.integrations.pullResult, fetched: t.integrations.fetched, saved: t.integrations.saved, errors: t.integrations.errors, andMore: t.integrations.andMore, visibleInLogViewer: t.integrations.visibleInLogViewer }} />}
        </div>
      </div>

      {/* Auto-pull card */}
      <div
        className={`bg-gray-800/50 backdrop-blur border rounded-xl transition-all duration-300 ${autoPull?.running ? "border-green-500/40" : "border-gray-700"}`}
      >
        <div className="p-5 border-b border-gray-700/60">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Timer className="w-4 h-4 text-green-400" />
            {t.integrations.autoPullTitle}
            {autoPull?.running && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                {t.integrations.autoPullActive}
              </span>
            )}
          </h3>
          <p className="text-gray-400 text-sm mt-0.5">
            {t.integrations.autoPullDesc}
          </p>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                {t.integrations.intervalSeconds}
              </label>
              <select
                value={autoPullInterval}
                onChange={(e) => setAutoPullInterval(Number(e.target.value))}
                disabled={autoPull?.running}
                className="px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50"
              >
                {[1, 5, 10, 15, 30, 60, 120].map((n) => (
                  <option key={n} value={n}>
                    {n < 60 ? `${n}s` : `${n / 60}m`}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 flex items-end">
              <button
                onClick={handleToggleAutoPull}
                disabled={isTogglingAutoPull || !config.host}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium ${
                  autoPull?.running
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {isTogglingAutoPull ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : autoPull?.running ? (
                  <>
                    <Square className="w-4 h-4" /> {t.integrations.stop}
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> {t.integrations.startAutoPull}
                  </>
                )}
              </button>
            </div>
          </div>

          {autoPull?.lastPullAt && (
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>
                {t.integrations.lastPull}{" "}
                {new Date(autoPull.lastPullAt).toLocaleTimeString()}
              </span>
              {autoPull.lastPullResult && (
                <span>
                  ({autoPull.lastPullResult.saved} {t.integrations.saved},{" "}
                  {autoPull.lastPullResult.errors} {t.integrations.errors})
                </span>
              )}
            </div>
          )}

          {!config.host && (
            <p className="text-xs text-yellow-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {t.integrations.configureHostFirst}
            </p>
          )}

          {/* Real-time log feed */}
          {realtimeLogs.length > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                  {autoPull?.running && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  )}
                  {t.integrations.liveLogs} ({filteredLogs.length}/{realtimeLogs.length})
                </span>
                <button
                  onClick={() => setRealtimeLogs([])}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {t.integrations.clear}
                </button>
              </div>

              {/* Search + Date filters */}
              <div className="flex flex-wrap items-end gap-3 mb-2">
                {/* Search */}
                <div className="flex-1 min-w-[180px]">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t.logs.searchPlaceholder}
                      className="w-full pl-8 pr-3 py-1.5 bg-gray-950 border border-gray-700 rounded-lg text-white text-xs placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Date from */}
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {t.integrations.dateFrom}
                  </label>
                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="px-2 py-1.5 bg-gray-950 border border-gray-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>

                {/* Date to */}
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {t.integrations.dateTo}
                  </label>
                  <input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="px-2 py-1.5 bg-gray-950 border border-gray-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>

                {/* Clear search+dates */}
                {(searchQuery || filterDateFrom || filterDateTo) && (
                  <button
                    onClick={() => { setSearchQuery(""); setFilterDateFrom(""); setFilterDateTo(""); }}
                    className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-3 h-3" />
                    {t.integrations.resetFilters}
                  </button>
                )}
              </div>

              {/* Firewall Rules Panel */}
              <div className="mb-2 border border-gray-700/50 rounded-lg overflow-hidden">
                {/* Header */}
                <button
                  onClick={() => setShowRuleBuilder(!showRuleBuilder)}
                  className="w-full flex items-center justify-between p-3 bg-gray-900/70 hover:bg-gray-900 transition-colors"
                >
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-300">
                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                    {t.integrations.firewallRules}
                    {activeRuleCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 text-[10px] font-semibold">
                        {activeRuleCount} {t.integrations.activeRules}
                      </span>
                    )}
                    {blockedCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[10px] font-semibold">
                        {blockedCount} {t.integrations.blocked}
                      </span>
                    )}
                  </div>
                  <Filter className={`w-3.5 h-3.5 text-gray-500 transition-transform ${showRuleBuilder ? "rotate-180" : ""}`} />
                </button>

                {/* Rules list */}
                {showRuleBuilder && (
                  <div className="p-3 bg-gray-900/40 space-y-2 border-t border-gray-700/50">
                    {firewallRules.length === 0 && (
                      <p className="text-[11px] text-gray-500 text-center py-2">
                        <ShieldOff className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                        {t.integrations.noRules}
                      </p>
                    )}

                    {firewallRules.map((rule) => (
                      <div
                        key={rule.id}
                        className={`flex flex-wrap items-center gap-2 p-2 rounded-lg border transition-all ${
                          rule.enabled
                            ? "bg-gray-800/60 border-gray-600/50"
                            : "bg-gray-800/20 border-gray-700/30 opacity-50"
                        }`}
                      >
                        {/* Enable toggle */}
                        <button
                          onClick={() => updateRule(rule.id, { enabled: !rule.enabled })}
                          className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                            rule.enabled
                              ? "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                              : "bg-gray-700 text-gray-500 hover:bg-gray-600"
                          }`}
                          title={rule.enabled ? "Disable" : "Enable"}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                        </button>

                        {/* Action: allow / deny */}
                        <select
                          value={rule.action}
                          onChange={(e) => updateRule(rule.id, { action: e.target.value as RuleAction })}
                          className={`px-2 py-1 rounded text-[10px] font-bold border-0 cursor-pointer ${
                            rule.action === "allow"
                              ? "bg-green-500/15 text-green-400"
                              : "bg-red-500/15 text-red-400"
                          }`}
                        >
                          <option value="allow">{t.integrations.allow}</option>
                          <option value="deny">{t.integrations.deny}</option>
                        </select>

                        {/* Field */}
                        <select
                          value={rule.field}
                          onChange={(e) => updateRule(rule.id, { field: e.target.value as RuleField })}
                          className="px-2 py-1 bg-gray-950 border border-gray-700 rounded text-white text-[11px] focus:outline-none focus:border-cyan-500"
                        >
                          {RULE_FIELDS.map((f) => (
                            <option key={f} value={f}>
                              {t.integrations[`field${f.charAt(0).toUpperCase() + f.slice(1)}` as keyof typeof t.integrations]}
                            </option>
                          ))}
                        </select>

                        {/* Operator */}
                        <select
                          value={rule.operator}
                          onChange={(e) => updateRule(rule.id, { operator: e.target.value as RuleOperator })}
                          className="px-2 py-1 bg-gray-950 border border-gray-700 rounded text-white text-[11px] focus:outline-none focus:border-cyan-500"
                        >
                          <option value="equals">{t.integrations.equals}</option>
                          <option value="not_equals">{t.integrations.notEquals}</option>
                          <option value="contains">{t.integrations.contains}</option>
                          <option value="not_contains">{t.integrations.notContains}</option>
                          <option value="starts_with">{t.integrations.startsWith}</option>
                          <option value="regex">{t.integrations.regex}</option>
                        </select>

                        {/* Value */}
                        <input
                          type="text"
                          value={rule.value}
                          onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                          placeholder={
                            rule.field === "severity"
                              ? "critical, high, medium..."
                              : t.integrations.valuePlaceholder
                          }
                          className="flex-1 min-w-[120px] px-2 py-1 bg-gray-950 border border-gray-700 rounded text-white text-[11px] placeholder-gray-600 focus:outline-none focus:border-cyan-500"
                        />

                        {/* Delete */}
                        <button
                          onClick={() => removeRule(rule.id)}
                          className="w-5 h-5 rounded flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {/* Add / Clear buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={addRule}
                        className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-lg transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        {t.integrations.addRule}
                      </button>
                      {firewallRules.length > 0 && (
                        <button
                          onClick={clearRules}
                          className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors"
                        >
                          <X className="w-3 h-3" />
                          {t.integrations.clearRules}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div
                ref={realtimeLogsRef}
                className="space-y-1 max-h-64 overflow-y-auto rounded-lg border border-gray-700 bg-gray-900/70 p-2"
              >
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-4 text-xs text-gray-500">
                    {activeRuleCount > 0
                      ? `${blockedCount} ${t.integrations.blocked} — 0 ${t.integrations.passed}`
                      : t.integrations.noRules}
                  </div>
                ) : (
                  filteredLogs.map((log, i) => (
                    <div
                      key={log.id || i}
                      className="flex items-center gap-2 px-2 py-1.5 bg-gray-800/50 rounded text-xs animate-[fadeIn_0.3s_ease-in]"
                    >
                      <span className="text-gray-500 font-mono flex-shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
                          log.severity === "critical"
                            ? "bg-red-500/20 text-red-400"
                            : log.severity === "high"
                              ? "bg-orange-500/20 text-orange-400"
                              : log.severity === "medium"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : log.severity === "low"
                                  ? "bg-blue-500/20 text-blue-400"
                                  : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {log.severity?.toUpperCase()}
                      </span>
                      <span className="text-gray-300 truncate">{log.message}</span>
                      <span className="text-gray-500 flex-shrink-0 font-mono ml-auto">
                        {log.ip}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info tip */}
      <div className="flex items-start gap-3 p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-xl">
        <AlertTriangle className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-400 leading-relaxed">
          <code className="bg-gray-800 px-1 py-0.5 rounded text-gray-200">
            INGEST_API_KEY
          </code>{" "}
          {t.integrations.infoTip}{" "}
          <code className="bg-gray-800 px-1 py-0.5 rounded text-gray-200">
            .env
          </code>
          . Remote GET endpoint → JSON array /{" "}
          <code className="bg-gray-800 px-1 py-0.5 rounded text-gray-200">
            {"{ data: [] }"}
          </code>
        </p>
      </div>
    </div>
  );
};

export default Integrations;
