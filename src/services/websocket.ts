import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_WS_URL || "http://localhost:3001";

class WebSocketService {
    private socket: Socket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;

    connect() {
        if (this.socket?.connected) {
            console.log("WebSocket already connected");
            return this.socket;
        }

        this.socket = io(SOCKET_URL, {
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: this.maxReconnectAttempts,
        });

        this.socket.on("connect", () => {
            console.log("✅ WebSocket connected:", this.socket?.id);
            this.reconnectAttempts = 0;
        });

        this.socket.on("disconnect", (reason) => {
            console.log("❌ WebSocket disconnected:", reason);
        });

        this.socket.on("connect_error", (error) => {
            console.error("WebSocket connection error:", error);
            this.reconnectAttempts++;

            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error("Max reconnection attempts reached");
            }
        });

        this.socket.on("error", (error) => {
            console.error("WebSocket error:", error);
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            console.log("WebSocket disconnected manually");
        }
    }

    // Подписка на новые логи
    onNewLog(callback: (log: any) => void) {
        if (this.socket) {
            this.socket.on("newLog", callback);
        } else {
            // Если socket ещё не создан — подождём connect
            const interval = setInterval(() => {
                if (this.socket) {
                    this.socket.on("newLog", callback);
                    clearInterval(interval);
                }
            }, 100);
        }
    }

    // Отписка от новых логов
    offNewLog(callback?: (log: any) => void) {
        if (this.socket) {
            if (callback) {
                this.socket.off("newLog", callback);
            } else {
                this.socket.off("newLog");
            }
        }
    }

    // Подписка на новые инциденты
    onNewIncident(callback: (incident: any) => void) {
        if (this.socket) {
            this.socket.on("newIncident", callback);
        }
    }

    // Отписка от новых инцидентов
    offNewIncident(callback?: (incident: any) => void) {
        if (this.socket) {
            if (callback) {
                this.socket.off("newIncident", callback);
            } else {
                this.socket.off("newIncident");
            }
        }
    }

    // Подписка на обновления метрик
    onMetricsUpdate(callback: (metrics: any) => void) {
        if (this.socket) {
            this.socket.on("metricsUpdate", callback);
        }
    }

    // Отписка от обновлений метрик
    offMetricsUpdate(callback?: (metrics: any) => void) {
        if (this.socket) {
            if (callback) {
                this.socket.off("metricsUpdate", callback);
            } else {
                this.socket.off("metricsUpdate");
            }
        }
    }

    // Проверка подключения
    isConnected(): boolean {
        return this.socket?.connected || false;
    }

    // Получение socket instance
    getSocket(): Socket | null {
        return this.socket;
    }

    // Ping-pong для проверки соединения
    ping(callback?: (data: any) => void) {
        if (this.socket) {
            this.socket.emit("ping", {}, callback);
        }
    }
}

// Экспортируем singleton instance
export const websocketService = new WebSocketService();

export default websocketService;
