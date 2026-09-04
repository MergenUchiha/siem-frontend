import { io, Socket } from "socket.io-client";
import type { DashboardMetrics, Incident, Log } from "./api";

const SOCKET_URL = import.meta.env.VITE_WS_URL || "http://localhost:3001";

type UnauthorizedHandler = () => void;

class WebSocketService {
    private socket: Socket | null = null;
    private maxReconnectAttempts = 5;
    private onUnauthorized: UnauthorizedHandler | null = null;

    /** Called when the server refuses the handshake, so the app can log out. */
    setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
        this.onUnauthorized = handler;
    }

    connect() {
        if (this.socket?.connected) {
            return this.socket;
        }

        // The gateway verifies this token and closes the connection without
        // it. Passing it through `auth` keeps it out of the request URL, where
        // it would end up in proxy and server logs.
        this.socket = io(SOCKET_URL, {
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: this.maxReconnectAttempts,
            auth: { token: localStorage.getItem("token") ?? "" },
        });

        this.socket.on("disconnect", (reason) => {
            if (reason !== "io client disconnect") {
                console.warn("WebSocket disconnected:", reason);
            }
        });

        this.socket.on("unauthorized", () => {
            console.warn("WebSocket rejected the token");
            this.onUnauthorized?.();
        });

        this.socket.on("connect_error", (error) => {
            console.warn("WebSocket connection error:", error.message);
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
        }
    }

    /**
     * Subscribes to new logs. Callers connect first; the previous version
     * polled every 100ms waiting for a socket to appear and left the interval
     * running forever if one never did.
     */
    onNewLog(callback: (log: Log) => void) {
        this.socket?.on("newLog", callback);
    }

    /** Unsubscribes from new logs. */
    offNewLog(callback?: (log: Log) => void) {
        if (this.socket) {
            if (callback) {
                this.socket.off("newLog", callback);
            } else {
                this.socket.off("newLog");
            }
        }
    }

    /** Subscribes to new incidents. */
    onNewIncident(callback: (incident: Incident) => void) {
        if (this.socket) {
            this.socket.on("newIncident", callback);
        }
    }

    /** Unsubscribes from new incidents. */
    offNewIncident(callback?: (incident: Incident) => void) {
        if (this.socket) {
            if (callback) {
                this.socket.off("newIncident", callback);
            } else {
                this.socket.off("newIncident");
            }
        }
    }

    /** Subscribes to metrics updates. */
    onMetricsUpdate(callback: (metrics: DashboardMetrics) => void) {
        if (this.socket) {
            this.socket.on("metricsUpdate", callback);
        }
    }

    /** Unsubscribes from metrics updates. */
    offMetricsUpdate(callback?: (metrics: DashboardMetrics) => void) {
        if (this.socket) {
            if (callback) {
                this.socket.off("metricsUpdate", callback);
            } else {
                this.socket.off("metricsUpdate");
            }
        }
    }

    /** Whether the socket is currently connected. */
    isConnected(): boolean {
        return this.socket?.connected || false;
    }

    /** The underlying socket, or null when disconnected. */
    getSocket(): Socket | null {
        return this.socket;
    }

    /** Round-trip check. */
    ping(callback?: (data: { timestamp: string }) => void) {
        if (this.socket) {
            this.socket.emit("ping", {}, callback);
        }
    }
}

// A single shared connection for the whole app.
export const websocketService = new WebSocketService();

export default websocketService;
