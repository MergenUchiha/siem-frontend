/**
 * LogsViewer.tsx — server-side pagination
 *
 * Logs are fetched from the backend per-page with filters applied server-side.
 * This removes the 100-log cap and lets users browse all logs in the database.
 */

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
    Search,
    Filter,
    Download,
    Plus,
    X,
    Calendar,
    User,
    Server,
    Activity,
    RefreshCw,
} from "lucide-react";
import type { Log } from "../types";
import { logsApi, type LogFilters } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import { ToastContainer, useToast } from "../components/ui/Toast";
import { useDebounce } from "../hooks/useApi";

// ─── Severity badge ───────────────────────────────────────────────────────────

const SEVERITY_CLASSES: Record<string, string> = {
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    info: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

function SeverityBadge({
    severity,
    label,
}: {
    severity: string;
    label: string;
}) {
    return (
        <span
            className={`px-2 py-1 rounded text-xs border ${SEVERITY_CLASSES[severity] ?? SEVERITY_CLASSES.info}`}
        >
            {label}
        </span>
    );
}

// ─── Filter state ─────────────────────────────────────────────────────────────

interface Filters {
    search: string;
    severity: string;
    source: string;
    dateFrom: string;
    dateTo: string;
}

// ─── Main component ───────────────────────────────────────────────────────────

interface LogsViewerProps {
    logs?: Log[];
    onRefresh?: () => void;
}

const LOGS_PER_PAGE = 20;

const LogsViewer: React.FC<LogsViewerProps> = ({ onRefresh }) => {
    const { t } = useLanguage();
    const toast = useToast();

    // ── Filters ────────────────────────────────────────────────────────────────
    const [filters, setFilters] = useState<Filters>({
        search: "",
        severity: "all",
        source: "all",
        dateFrom: "",
        dateTo: "",
    });
    const [page, setPage] = useState(1);

    const setFilter = useCallback(
        <K extends keyof Filters>(key: K, val: Filters[K]) => {
            setFilters((f) => ({ ...f, [key]: val }));
            setPage(1);
        },
        [],
    );

    const debouncedSearch = useDebounce(filters.search, 300);

    // ── Server-side data ──────────────────────────────────────────────────────
    const [logs, setLogs] = useState<Log[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [sources, setSources] = useState<string[]>([]);

    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: LogFilters = {
                page,
                limit: LOGS_PER_PAGE,
            };
            if (filters.severity !== "all") params.severity = filters.severity as any;
            if (filters.source !== "all") params.source = filters.source;
            if (debouncedSearch) params.search = debouncedSearch;
            if (filters.dateFrom) params.dateFrom = filters.dateFrom;
            if (filters.dateTo) params.dateTo = filters.dateTo;

            const res = await logsApi.getAll(params);
            setLogs(res.data ?? []);
            setTotal(res.total);
            setTotalPages(res.totalPages);
        } catch (err: any) {
            toast.error(err.message ?? "Failed to load logs");
        } finally {
            setIsLoading(false);
        }
    }, [page, filters.severity, filters.source, debouncedSearch, filters.dateFrom, filters.dateTo]);

    // Fetch sources once on mount
    useEffect(() => {
        logsApi.getAll({ limit: 1000 }).then((res) => {
            const uniqueSources = [...new Set((res.data ?? []).map((l) => l.source))];
            setSources(uniqueSources);
        }).catch(() => {});
    }, []);

    // Refetch when page or filters change
    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // ── Pagination numbers ────────────────────────────────────────────────────
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * LOGS_PER_PAGE;

    const pageNumbers = useMemo(() => {
        const count = Math.min(5, totalPages);
        const base = Math.max(
            1,
            Math.min(safePage - 2, totalPages - count + 1),
        );
        return Array.from({ length: count }, (_, i) => base + i);
    }, [totalPages, safePage]);

    // ── Export ─────────────────────────────────────────────────────────────────
    const handleExport = useCallback(async () => {
        try {
            // Fetch all filtered logs for export (up to 10000)
            const params: LogFilters = { limit: 10000 };
            if (filters.severity !== "all") params.severity = filters.severity as any;
            if (filters.source !== "all") params.source = filters.source;
            if (debouncedSearch) params.search = debouncedSearch;
            if (filters.dateFrom) params.dateFrom = filters.dateFrom;
            if (filters.dateTo) params.dateTo = filters.dateTo;

            const res = await logsApi.getAll(params);
            const allLogs = res.data ?? [];

            const header = [
                t.logs.timestamp,
                t.logs.severity,
                t.logs.source,
                t.logs.message,
                t.logs.ipAddress,
                t.logs.user,
            ];
            const rows = allLogs.map((log) => [
                new Date(log.timestamp).toLocaleString(),
                log.severity,
                log.source,
                `"${log.message.replace(/"/g, '""')}"`,
                log.ip,
                log.user ?? "",
            ]);
            const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `siem-logs-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err: any) {
            toast.error(err.message ?? "Export failed");
        }
    }, [filters, debouncedSearch, t]);

    // ── Create log modal ───────────────────────────────────────────────────────
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);

    const handleCreateLog = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setCreating(true);
        const fd = new FormData(e.currentTarget);
        try {
            await logsApi.create({
                source: fd.get("source") as string,
                severity: fd.get("severity") as any,
                message: fd.get("message") as string,
                ip: fd.get("ip") as string,
                action: fd.get("action") as string,
                user: (fd.get("user") as string) || undefined,
            });
            toast.success(t.notificationTypes.logCreatedMessage);
            setShowCreate(false);
            (e.target as HTMLFormElement).reset();
            fetchLogs();
            onRefresh?.();
        } catch (err: any) {
            toast.error(err.message ?? "Failed to create log");
        } finally {
            setCreating(false);
        }
    };

    // ── Details modal ──────────────────────────────────────────────────────────
    const [selectedLog, setSelectedLog] = useState<Log | null>(null);

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            <ToastContainer toasts={toast.toasts} onRemove={toast.remove} />

            {/* Filter bar */}
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                        <Filter className="w-5 h-5 mr-2 text-cyan-400" />
                        {t.logs.filters}
                    </h3>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setShowCreate(true)}
                            className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            <span>{t.logs.createLog}</span>
                        </button>
                        <button
                            onClick={handleExport}
                            className="flex items-center space-x-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/30 transition-all"
                        >
                            <Download className="w-4 h-4" />
                            <span>{t.logs.exportCSV}</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder={t.logs.searchPlaceholder}
                            value={filters.search}
                            onChange={(e) =>
                                setFilter("search", e.target.value)
                            }
                            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                    </div>

                    <select
                        value={filters.severity}
                        onChange={(e) => setFilter("severity", e.target.value)}
                        className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    >
                        <option value="all">{t.logs.allSeverities}</option>
                        {["critical", "high", "medium", "low", "info"].map(
                            (s) => (
                                <option key={s} value={s}>
                                    {t.severity[s as keyof typeof t.severity]}
                                </option>
                            ),
                        )}
                    </select>

                    <select
                        value={filters.source}
                        onChange={(e) => setFilter("source", e.target.value)}
                        className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    >
                        <option value="all">{t.logs.allSources}</option>
                        {sources.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Date range filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1.5 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                            {t.integrations.dateFrom}
                        </label>
                        <input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => setFilter("dateFrom", e.target.value)}
                            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1.5 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                            {t.integrations.dateTo}
                        </label>
                        <input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => setFilter("dateTo", e.target.value)}
                            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-900/50">
                            <tr>
                                {[
                                    t.logs.timestamp,
                                    t.logs.severity,
                                    t.logs.source,
                                    t.logs.message,
                                    t.logs.ipAddress,
                                    t.logs.user,
                                ].map((h) => (
                                    <th
                                        key={h}
                                        className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-6 py-12 text-center text-gray-400"
                                    >
                                        <RefreshCw className="w-5 h-5 animate-spin inline mr-2" />
                                        {t.common.loading}...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-6 py-12 text-center text-gray-500"
                                    >
                                        No logs match your filters
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr
                                        key={log.id}
                                        onClick={() => setSelectedLog(log)}
                                        className="hover:bg-gray-900/50 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                            {new Date(
                                                log.timestamp,
                                            ).toLocaleString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                second: "2-digit",
                                            })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <SeverityBadge
                                                severity={log.severity}
                                                label={(
                                                    t.severity[
                                                        log.severity as keyof typeof t.severity
                                                    ] ?? log.severity
                                                ).toUpperCase()}
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white group-hover:text-cyan-400 transition-colors">
                                            {log.source}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-300 max-w-md">
                                            <div
                                                className="truncate"
                                                title={log.message}
                                            >
                                                {log.message}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-400 font-mono">
                                            {log.ip}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                            {log.user ?? t.logs.noUser}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="bg-gray-900/50 px-6 py-4 border-t border-gray-700 flex items-center justify-between">
                    <p className="text-sm text-gray-400">
                        {t.logs.showing} {total === 0 ? 0 : start + 1}–
                        {Math.min(start + LOGS_PER_PAGE, total)}{" "}
                        {t.logs.of} {total}
                    </p>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={safePage === 1}
                            className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t.logs.previous}
                        </button>
                        {pageNumbers.map((n) => (
                            <button
                                key={n}
                                onClick={() => setPage(n)}
                                className={`px-3 py-1 rounded text-sm transition-colors ${
                                    safePage === n
                                        ? "bg-cyan-500 text-white"
                                        : "bg-gray-800 border border-gray-700 text-white hover:bg-gray-700"
                                }`}
                            >
                                {n}
                            </button>
                        ))}
                        <button
                            onClick={() =>
                                setPage((p) => Math.min(totalPages, p + 1))
                            }
                            disabled={safePage === totalPages}
                            className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t.logs.next}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Details Modal ── */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white">
                                {t.logs.logDetails}
                            </h3>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <SeverityBadge
                                    severity={selectedLog.severity}
                                    label={(
                                        t.severity[
                                            selectedLog.severity as keyof typeof t.severity
                                        ] ?? selectedLog.severity
                                    ).toUpperCase()}
                                />
                                <span className="text-sm text-gray-400">
                                    ID: {selectedLog.id}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    {
                                        icon: (
                                            <Calendar className="w-4 h-4 text-cyan-400" />
                                        ),
                                        label: t.logs.timestamp,
                                        value: new Date(
                                            selectedLog.timestamp,
                                        ).toLocaleString(),
                                    },
                                    {
                                        icon: (
                                            <Server className="w-4 h-4 text-cyan-400" />
                                        ),
                                        label: t.logs.source,
                                        value: selectedLog.source,
                                    },
                                    {
                                        icon: (
                                            <Activity className="w-4 h-4 text-cyan-400" />
                                        ),
                                        label: t.logs.ipAddress,
                                        value: selectedLog.ip,
                                    },
                                    {
                                        icon: (
                                            <User className="w-4 h-4 text-cyan-400" />
                                        ),
                                        label: t.logs.user,
                                        value:
                                            selectedLog.user ?? t.logs.noUser,
                                    },
                                ].map(({ icon, label, value }) => (
                                    <div
                                        key={label}
                                        className="bg-gray-800/50 rounded-lg p-4"
                                    >
                                        <div className="flex items-center space-x-2 mb-2">
                                            {icon}
                                            <span className="text-xs text-gray-400">
                                                {label}
                                            </span>
                                        </div>
                                        <p className="text-white text-sm font-mono">
                                            {value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-gray-800/50 rounded-lg p-4">
                                <span className="text-xs text-gray-400 block mb-2">
                                    {t.logs.action}
                                </span>
                                <p className="text-white text-sm">
                                    {selectedLog.action}
                                </p>
                            </div>
                            <div className="bg-gray-800/50 rounded-lg p-4">
                                <span className="text-xs text-gray-400 block mb-2">
                                    {t.logs.message}
                                </span>
                                <p className="text-white text-sm leading-relaxed">
                                    {selectedLog.message}
                                </p>
                            </div>
                            {selectedLog.details &&
                                Object.keys(selectedLog.details).length > 0 && (
                                    <div className="bg-gray-800/50 rounded-lg p-4">
                                        <span className="text-xs text-gray-400 block mb-2">
                                            {t.logs.additionalDetails}
                                        </span>
                                        <pre className="text-xs text-gray-300 overflow-x-auto p-3 bg-gray-900 rounded">
                                            {JSON.stringify(
                                                selectedLog.details,
                                                null,
                                                2,
                                            )}
                                        </pre>
                                    </div>
                                )}
                        </div>
                        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-6">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="w-full py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                            >
                                {t.common.close}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Create Log Modal ── */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-white mb-4">
                            {t.logs.createNewLog}
                        </h3>
                        <form onSubmit={handleCreateLog} className="space-y-4">
                            {[
                                {
                                    name: "source",
                                    label: t.logs.source,
                                    type: "text",
                                    placeholder: "Web Server",
                                    required: true,
                                },
                                {
                                    name: "message",
                                    label: t.logs.message,
                                    type: "text",
                                    placeholder: "Log message",
                                    required: true,
                                },
                                {
                                    name: "ip",
                                    label: t.logs.ipAddress,
                                    type: "text",
                                    placeholder: "192.168.1.1",
                                    required: true,
                                },
                                {
                                    name: "action",
                                    label: t.logs.action,
                                    type: "text",
                                    placeholder: "Login Attempt",
                                    required: true,
                                },
                                {
                                    name: "user",
                                    label: t.logs.user,
                                    type: "text",
                                    placeholder: "username",
                                    required: false,
                                },
                            ].map(
                                ({
                                    name,
                                    label,
                                    type,
                                    placeholder,
                                    required,
                                }) => (
                                    <div key={name}>
                                        <label className="block text-sm text-gray-400 mb-2">
                                            {label}
                                        </label>
                                        <input
                                            name={name}
                                            type={type}
                                            placeholder={placeholder}
                                            required={required}
                                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                                        />
                                    </div>
                                ),
                            )}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">
                                    {t.logs.severity}
                                </label>
                                <select
                                    name="severity"
                                    required
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                                >
                                    {[
                                        "info",
                                        "low",
                                        "medium",
                                        "high",
                                        "critical",
                                    ].map((s) => (
                                        <option key={s} value={s}>
                                            {
                                                t.severity[
                                                    s as keyof typeof t.severity
                                                ]
                                            }
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center space-x-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-all disabled:opacity-50"
                                >
                                    {creating
                                        ? t.common.loading
                                        : t.logs.createLog}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="flex-1 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                                >
                                    {t.common.cancel}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LogsViewer;
