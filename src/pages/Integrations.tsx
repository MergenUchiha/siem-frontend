import React, { useState, useEffect } from "react";
import {
    Webhook,
    Wifi,
    WifiOff,
    RefreshCw,
    AlertTriangle,
    CheckCircle2,
    Download,
    Info,
} from "lucide-react";
import { ToastContainer, useToast } from "../components/ui/Toast";
import { settingsApi, WebhookConfig, PullResult } from "../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type ConnectionStatus = "idle" | "testing" | "ok" | "error";

// ─── Status badge ─────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: ConnectionStatus }> = ({ status }) => {
    const map: Record<
        ConnectionStatus,
        { label: string; cls: string; icon: React.ReactNode }
    > = {
        idle: {
            label: "Not tested",
            cls: "text-gray-400 bg-gray-500/10 border-gray-600",
            icon: <WifiOff className="w-3 h-3" />,
        },
        testing: {
            label: "Testing…",
            cls: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
            icon: <RefreshCw className="w-3 h-3 animate-spin" />,
        },
        ok: {
            label: "Connected",
            cls: "text-green-400 bg-green-500/10 border-green-500/30",
            icon: <Wifi className="w-3 h-3" />,
        },
        error: {
            label: "Unreachable",
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

const PullResultPanel: React.FC<{ result: PullResult }> = ({ result }) => (
    <div className="mt-4 p-4 bg-gray-900/70 border border-gray-700 rounded-lg space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-white">
            <Info className="w-4 h-4 text-cyan-400" />
            Pull result
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
            {[
                {
                    label: "Fetched",
                    value: result.fetched,
                    color: "text-cyan-400",
                },
                {
                    label: "Saved",
                    value: result.saved,
                    color: "text-green-400",
                },
                {
                    label: "Errors",
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
                        <span className="text-gray-300 truncate">
                            {log.message}
                        </span>
                        <span className="text-gray-500 flex-shrink-0 font-mono">
                            {log.ip}
                        </span>
                    </div>
                ))}
                {result.logs.length > 10 && (
                    <p className="text-xs text-gray-500 text-center pt-1">
                        …and {result.logs.length - 10} more (visible in Log
                        Viewer)
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

    const [config, setConfig] = useState<WebhookConfig>(defaultConfig);
    const [status, setStatus] = useState<ConnectionStatus>("idle");
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isPulling, setIsPulling] = useState(false);
    const [pullResult, setPullResult] = useState<PullResult | null>(null);
    const [pullLimit, setPullLimit] = useState<number>(100);

    // Load config from backend on mount
    useEffect(() => {
        settingsApi
            .getWebhookConfig()
            .then(setConfig)
            .catch(() => {
                try {
                    const saved = localStorage.getItem("siem_webhook_config");
                    if (saved)
                        setConfig({ ...defaultConfig, ...JSON.parse(saved) });
                } catch {
                    /* ignore */
                }
            })
            .finally(() => setIsLoading(false));
    }, []);

    const patch = (p: Partial<WebhookConfig>) =>
        setConfig((c) => ({ ...c, ...p }));

    // ── Test connection ─────────────────────────────────────────────────────
    const handleTest = async () => {
        if (!config.host) {
            toast.error("Enter a host before testing");
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
                    `Server responded with ${res.status} — endpoint reachable`,
                );
            } else {
                setStatus("error");
                toast.error("Unexpected response from server");
            }
        } catch (err: any) {
            setStatus("error");
            toast.error(
                err?.name === "TimeoutError"
                    ? "Connection timed out (5s)"
                    : "Could not reach the server — check host and port",
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
            toast.success("Settings saved");
        } catch (err: any) {
            toast.error(err?.message || "Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    };

    // ── Pull logs from remote server ────────────────────────────────────────
    const handlePull = async () => {
        if (!config.host) {
            toast.error("Save the integration config first");
            return;
        }
        setIsPulling(true);
        setPullResult(null);
        try {
            const result = await settingsApi.pullLogs({ limit: pullLimit });
            setPullResult(result);
            if (result.saved > 0) {
                toast.success(
                    `Pulled ${result.saved} new log${result.saved !== 1 ? "s" : ""} — refresh Log Viewer to see them`,
                );
            } else if (result.fetched === 0) {
                toast.info("Remote server returned no logs");
            } else {
                toast.warning(
                    `Fetched ${result.fetched} logs but saved 0 (${result.errors} errors)`,
                );
            }
        } catch (err: any) {
            toast.error(err?.message || "Pull failed");
        } finally {
            setIsPulling(false);
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
                <h2 className="text-2xl font-bold text-white mb-1">
                    Integrations
                </h2>
                <p className="text-gray-400 text-sm">
                    Connect external log sources to your SIEM
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
                                <h3 className="text-white font-semibold">
                                    Webhook / HTTP
                                </h3>
                                <StatusBadge status={status} />
                            </div>
                            <p className="text-gray-400 text-sm">
                                Push logs from any service or pull from remote
                                server
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
                            <span className="text-gray-400 text-sm">
                                Loading config…
                            </span>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs text-gray-400 mb-1.5">
                                        Host / IP
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
                                        Port
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
                                    Endpoint path
                                </label>
                                <input
                                    type="text"
                                    value={config.path}
                                    onChange={(e) =>
                                        patch({ path: e.target.value })
                                    }
                                    placeholder="/api/logs/ingest"
                                    className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1.5">
                                    API Key{" "}
                                    <span className="text-gray-600">
                                        (x-api-key header)
                                    </span>
                                </label>
                                <input
                                    type="password"
                                    value={config.apiKey}
                                    onChange={(e) =>
                                        patch({ apiKey: e.target.value })
                                    }
                                    placeholder="siem-ingest-key-xxxxxxxx"
                                    className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors"
                                />
                            </div>

                            {endpointUrl && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg">
                                    <span className="text-xs text-gray-500">
                                        POST
                                    </span>
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
                                    Test
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
                                    Save
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
                        Pull Logs from Remote Server
                    </h3>
                    <p className="text-gray-400 text-sm mt-0.5">
                        Fetch logs via{" "}
                        <code className="bg-gray-900 px-1 py-0.5 rounded text-gray-300 text-xs">
                            GET{" "}
                            {config.host
                                ? `${config.port === "443" ? "https" : "http"}://${config.host}:${config.port}${config.path.replace(/\/ingest$/, "/logs")}`
                                : "<host>/logs"}
                        </code>{" "}
                        and store them locally.
                    </p>
                </div>

                <div className="p-5 space-y-4">
                    <div className="flex items-center gap-3">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1.5">
                                Max logs to fetch
                            </label>
                            <select
                                value={pullLimit}
                                onChange={(e) =>
                                    setPullLimit(Number(e.target.value))
                                }
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
                                        <RefreshCw className="w-4 h-4 animate-spin" />{" "}
                                        Pulling…
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4" /> Fetch
                                        Logs
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {!config.host && (
                        <p className="text-xs text-yellow-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Configure and save a remote host above before
                            pulling logs.
                        </p>
                    )}

                    {pullResult && <PullResultPanel result={pullResult} />}
                </div>
            </div>

            {/* Info tip */}
            <div className="flex items-start gap-3 p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-400 leading-relaxed">
                    Set{" "}
                    <code className="bg-gray-800 px-1 py-0.5 rounded text-gray-200">
                        INGEST_API_KEY
                    </code>{" "}
                    in your backend{" "}
                    <code className="bg-gray-800 px-1 py-0.5 rounded text-gray-200">
                        .env
                    </code>
                    . Remote GET endpoint must return a JSON array or{" "}
                    <code className="bg-gray-800 px-1 py-0.5 rounded text-gray-200">
                        {"{ data: [] }"}
                    </code>{" "}
                    shape.
                </p>
            </div>
        </div>
    );
};

export default Integrations;
