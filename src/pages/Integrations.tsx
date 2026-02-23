import React, { useState, useEffect } from "react";
import {
    Webhook,
    Wifi,
    WifiOff,
    RefreshCw,
    AlertTriangle,
    CheckCircle2,
} from "lucide-react";
import { ToastContainer, useToast } from "../components/ui/Toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type ConnectionStatus = "idle" | "testing" | "ok" | "error";

interface WebhookConfig {
    enabled: boolean;
    host: string;
    port: string;
    path: string;
    apiKey: string;
}

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

// ─── Main page ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "siem_webhook_config";

const defaultConfig: WebhookConfig = {
    enabled: false,
    host: "",
    port: "443",
    path: "/api/logs/ingest",
    apiKey: "",
};

const Integrations: React.FC = () => {
    const toast = useToast();

    const [config, setConfig] = useState<WebhookConfig>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) return { ...defaultConfig, ...JSON.parse(saved) };
        } catch {
            /* ignore */
        }
        return defaultConfig;
    });

    const [status, setStatus] = useState<ConnectionStatus>("idle");
    const [isSaving, setIsSaving] = useState(false);

    // Persist whenever config changes
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }, [config]);

    const patch = (p: Partial<WebhookConfig>) =>
        setConfig((c) => ({ ...c, ...p }));

    // ── Test connection ───────────────────────────────────────────────────────
    const handleTest = async () => {
        if (!config.host) {
            toast.error("Enter a host before testing");
            return;
        }

        setStatus("testing");

        try {
            const protocol = config.port === "443" ? "https" : "http";
            const url = `${protocol}://${config.host}:${config.port}${config.path}`;

            // Send a HEAD or OPTIONS request — non-destructive probe
            const res = await fetch(url, {
                method: "HEAD",
                headers: config.apiKey ? { "x-api-key": config.apiKey } : {},
                signal: AbortSignal.timeout(5000),
            });

            // Any response (even 4xx) means the server is reachable
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
            if (err?.name === "TimeoutError") {
                toast.error("Connection timed out (5s)");
            } else {
                toast.error("Could not reach the server — check host and port");
            }
        }
    };

    // ── Save ─────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        setIsSaving(true);
        try {
            // TODO: replace with real API call when backend endpoint is ready
            // await fetch('/api/integrations/webhook', {
            //   method: 'POST',
            //   headers: getAuthHeaders(),
            //   body: JSON.stringify(config),
            // });
            await new Promise((r) => setTimeout(r, 400)); // remove when API is connected
            toast.success("Settings saved");
        } catch {
            toast.error("Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    };

    const endpointUrl = config.host
        ? `${config.port === "443" ? "https" : "http"}://${config.host}:${config.port}${config.path}`
        : null;

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 max-w-2xl">
            <ToastContainer toasts={toast.toasts} onRemove={toast.remove} />

            {/* Page header */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                    Integrations
                </h2>
                <p className="text-gray-400 text-sm">
                    Connect external log sources to your SIEM
                </p>
            </div>

            {/* Card */}
            <div
                className={`bg-gray-800/50 backdrop-blur border rounded-xl transition-all duration-300 ${
                    config.enabled ? "border-gray-600" : "border-gray-700/50"
                }`}
            >
                {/* Card header */}
                <div className="p-5 flex items-center justify-between gap-4 border-b border-gray-700/60">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500
              flex items-center justify-center text-white shadow-lg flex-shrink-0"
                        >
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
                                Push logs from any service via HTTP POST
                            </p>
                        </div>
                    </div>

                    {/* Enable toggle */}
                    <button
                        onClick={() => patch({ enabled: !config.enabled })}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full
              transition-colors ${config.enabled ? "bg-cyan-500" : "bg-gray-600"}`}
                        title={config.enabled ? "Disable" : "Enable"}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                config.enabled
                                    ? "translate-x-6"
                                    : "translate-x-1"
                            }`}
                        />
                    </button>
                </div>

                {/* Fields */}
                <div className="p-5 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        {/* Host */}
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
                                className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-white text-sm
                           placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                        </div>

                        {/* Port */}
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
                                className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-white text-sm
                           placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Path */}
                    <div>
                        <label className="block text-xs text-gray-400 mb-1.5">
                            Endpoint path
                        </label>
                        <input
                            type="text"
                            value={config.path}
                            onChange={(e) => patch({ path: e.target.value })}
                            placeholder="/api/logs/ingest"
                            className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-white text-sm
                         placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                    </div>

                    {/* API Key */}
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
                            onChange={(e) => patch({ apiKey: e.target.value })}
                            placeholder="siem-ingest-key-xxxxxxxx"
                            className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-white text-sm
                         placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                    </div>

                    {/* Computed URL preview */}
                    {endpointUrl && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg">
                            <span className="text-xs text-gray-500">POST</span>
                            <span className="text-xs text-cyan-400 font-mono truncate">
                                {endpointUrl}
                            </span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-1">
                        <button
                            onClick={handleTest}
                            disabled={status === "testing"}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg
                         hover:bg-gray-600 hover:text-white transition-all disabled:opacity-50 text-sm"
                        >
                            {status === "testing" ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <Wifi className="w-4 h-4" />
                            )}
                            Test Connection
                        </button>

                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg
                         hover:bg-cyan-600 transition-all disabled:opacity-50 text-sm font-medium"
                        >
                            {isSaving ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <CheckCircle2 className="w-4 h-4" />
                            )}
                            Save
                        </button>
                    </div>
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
                    </code>{" "}
                    — clients must send it as the{" "}
                    <code className="bg-gray-800 px-1 py-0.5 rounded text-gray-200">
                        x-api-key
                    </code>{" "}
                    header. Default value is{" "}
                    <code className="bg-gray-800 px-1 py-0.5 rounded text-gray-200">
                        REDACTED-ROTATE-INGEST-API-KEY
                    </code>
                    .
                </p>
            </div>
        </div>
    );
};

export default Integrations;
