import { useState, useCallback, useRef, useEffect } from "react";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import Dashboard from "./pages/Dashboard";
import LogsViewer from "./pages/LogsViewer";
import Incidents from "./pages/Incidents";
import Analytics from "./pages/Analytics";
import Alerts from "./pages/Alerts";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Integrations from "./pages/Integrations";
import { LanguageProvider, useLanguage } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ApiError, logsApi, incidentsApi, type Log, type Incident } from "./services/api";
import ws from "./services/websocket";

type TabId =
    | "dashboard"
    | "logs"
    | "incidents"
    | "analytics"
    | "integrations"
    | "alerts"
    | "settings";

const VALID_TABS: TabId[] = [
    "dashboard",
    "logs",
    "incidents",
    "analytics",
    "integrations",
    "alerts",
    "settings",
];

function PageRouter({
    tab,
    logs,
    incidents,
    onRefresh,
}: {
    tab: TabId;
    logs: Log[];
    incidents: Incident[];
    onRefresh: () => void;
}) {
    switch (tab) {
        case "dashboard":
            return <Dashboard logs={logs} incidents={incidents} />;
        case "logs":
            return <LogsViewer onRefresh={onRefresh} />;
        case "incidents":
            return <Incidents incidents={incidents} onRefresh={onRefresh} />;
        case "analytics":
            return <Analytics logs={logs} />;
        case "integrations":
            return <Integrations />;
        case "alerts":
            return <Alerts />;
        case "settings":
            return <Settings />;
        default:
            return <Dashboard logs={logs} incidents={incidents} />;
    }
}

function LoadingScreen() {
    return (
        <div className="flex items-center justify-center h-full">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Loading SIEM Platform…</p>
            </div>
        </div>
    );
}

function ErrorScreen({
    message,
    onRetry,
}: {
    message: string;
    onRetry: () => void;
}) {
    return (
        <div className="flex items-center justify-center h-full">
            <div className="text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">⚠️</span>
                </div>
                <p className="text-red-400 mb-4">{message}</p>
                <button
                    onClick={onRetry}
                    className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-all"
                >
                    Retry
                </button>
            </div>
        </div>
    );
}

function AppContent() {
    const { t } = useLanguage();

    const [isAuthenticated, setIsAuthenticated] = useState(
        () => !!localStorage.getItem("token"),
    );

    // The active tab survives a reload.
    const [activeTab, setActiveTab] = useState<TabId>(() => {
        const saved = localStorage.getItem("activeTab") as TabId;
        return saved && VALID_TABS.includes(saved) ? saved : "dashboard";
    });

    const handleSetTab = useCallback((tab: string) => {
        const validTab = tab as TabId;
        setActiveTab(validTab);
        localStorage.setItem("activeTab", validTab);
    }, []);

    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        setSidebarOpen(false);
    }, [activeTab]);

    const [logs, setLogs] = useState<Log[]>([]);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [dataError, setDataError] = useState<string | null>(null);
    const logIdsRef = useRef<Set<string>>(new Set());

    // Declared before the effects that list it as a dependency: a `const` read
    // from a dependency array during render is still in the temporal dead zone
    // if it is declared further down, which throws on the first render.
    const handleLogout = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("notifications");
        localStorage.removeItem("activeTab");
        logIdsRef.current.clear();
        setIsAuthenticated(false);
        setActiveTab("dashboard");
        setLogs([]);
        setIncidents([]);
    }, []);

    const loadData = useCallback(async () => {
        if (!isAuthenticated) return;
        setIsLoading(true);
        setDataError(null);
        try {
            const [logsRes, incidentsRes] = await Promise.all([
                logsApi.getAll({ limit: 100 }),
                incidentsApi.getAll(),
            ]);
            const logsData = logsRes.data ?? [];
            logIdsRef.current = new Set(logsData.map((l) => l.id));
            setLogs(logsData);
            setIncidents(Array.isArray(incidentsRes) ? incidentsRes : []);
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                handleLogout();
                return;
            }
            setDataError(
                err instanceof ApiError ? err.message : "Failed to load data",
            );
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, handleLogout]);

    useEffect(() => {
        if (isAuthenticated) loadData();
    }, [isAuthenticated, loadData]);

    // ── WebSocket ───────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!isAuthenticated) return;

        ws.connect();
        // The gateway now checks the handshake token; a rejected connection
        // means the stored token is stale, so drop it rather than reconnecting
        // in a loop.
        ws.setUnauthorizedHandler(() => handleLogout());

        const onLog = (log: Log) => {
            if (logIdsRef.current.has(log.id)) return;
            logIdsRef.current.add(log.id);
            setLogs((prev) => [log, ...prev.slice(0, 199)]);

            if (log.severity === "critical" || log.severity === "high") {
                window.addNotification?.({
                    title: `${log.severity.toUpperCase()} ${t.notificationTypes.newSecurityEvent}`,
                    message: log.message,
                    type: log.severity === "critical" ? "critical" : "warning",
                    time: t.time.justNow,
                });
            }
        };

        const onIncident = (incident: Incident) => {
            setIncidents((prev) => {
                if (prev.some((i) => i.id === incident.id)) return prev;
                return [incident, ...prev];
            });
            window.addNotification?.({
                title: t.notificationTypes.newSecurityIncident,
                message: incident.title,
                type: incident.severity === "critical" ? "critical" : "warning",
                time: t.time.justNow,
            });
        };

        ws.onNewLog(onLog);
        ws.onNewIncident(onIncident);

        return () => {
            ws.setUnauthorizedHandler(null);
            ws.offNewLog(onLog);
            ws.offNewIncident(onIncident);
            ws.disconnect();
        };
    }, [isAuthenticated, t, handleLogout]);

    const handleLogin = useCallback(() => {
        setIsAuthenticated(true);
        const user = JSON.parse(localStorage.getItem("user") ?? "{}") as {
            name?: string;
        };
        window.addNotification?.({
            title: t.notificationTypes.welcome,
            message: `${t.notificationTypes.welcomeMessage} ${user.name}`,
            type: "info",
            time: t.time.justNow,
        });
    }, [t]);

    const handleRefresh = useCallback(() => {
        loadData();
        window.addNotification?.({
            title: t.notificationTypes.dataRefreshed,
            message: t.notificationTypes.dataRefreshedMessage,
            type: "info",
            time: t.time.justNow,
        });
    }, [loadData, t]);

    if (!isAuthenticated) return <Login onLogin={handleLogin} />;

    const renderMain = () => {
        if (isLoading) return <LoadingScreen />;
        if (dataError)
            return <ErrorScreen message={dataError} onRetry={loadData} />;
        return (
            <PageRouter
                tab={activeTab}
                logs={logs}
                incidents={incidents}
                onRefresh={loadData}
            />
        );
    };

    return (
        <div className="flex h-screen bg-gray-950 overflow-hidden">
            <Sidebar
                activeTab={activeTab}
                setActiveTab={handleSetTab}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Header
                    setSidebarOpen={setSidebarOpen}
                    onRefresh={handleRefresh}
                    onLogout={handleLogout}
                />

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 scrollbar-custom">
                    <div className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl">
                        {renderMain()}
                    </div>
                </main>

                <footer className="bg-gray-900/50 backdrop-blur border-t border-cyan-500/20 px-6 py-3">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <div>
                            <span>SIEM Light v1.0.0</span>
                            <span className="mx-2">•</span>
                            <span>
                                {logs.length} {t.logs.title}
                            </span>
                            <span className="mx-2">•</span>
                            <span>
                                {incidents.length} {t.sidebar.incidents}
                            </span>
                        </div>
                        <span>© 2026 Security Operations Center</span>
                    </div>
                </footer>
            </div>
        </div>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <LanguageProvider>
                <AppContent />
            </LanguageProvider>
        </ThemeProvider>
    );
}
