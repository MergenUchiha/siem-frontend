import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastItemProps {
    toast: Toast;
    onRemove: (id: string) => void;
}

const ICONS = {
    success: <CheckCircle className="w-5 h-5 text-green-400" />,
    error: <XCircle className="w-5 h-5 text-red-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
    info: <Info className="w-5 h-5 text-cyan-400" />,
};

const STYLES = {
    success: "border-green-500/30 bg-green-500/10",
    error: "border-red-500/30   bg-red-500/10",
    warning: "border-yellow-500/30 bg-yellow-500/10",
    info: "border-cyan-500/30  bg-cyan-500/10",
};

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Slide in
        requestAnimationFrame(() => setVisible(true));

        // Auto-dismiss after 4 s
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(() => onRemove(toast.id), 300);
        }, 4000);

        return () => clearTimeout(timer);
    }, [toast.id, onRemove]);

    return (
        <div
            className={`
        flex items-start space-x-3 p-4 rounded-xl border shadow-xl
        transition-all duration-300
        ${STYLES[toast.type]}
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
      `}
        >
            <div className="flex-shrink-0 mt-0.5">{ICONS[toast.type]}</div>
            <p className="text-sm text-white flex-1 leading-relaxed">
                {toast.message}
            </p>
            <button
                onClick={() => {
                    setVisible(false);
                    setTimeout(() => onRemove(toast.id), 300);
                }}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-white rounded transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

// ── Container ──────────────────────────────────────────────────────────────

interface ToastContainerProps {
    toasts: Toast[];
    onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
    toasts,
    onRemove,
}) => (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3 w-80 pointer-events-none">
        {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
                <ToastItem toast={t} onRemove={onRemove} />
            </div>
        ))}
    </div>
);

// ── Hook ───────────────────────────────────────────────────────────────────

export const useToast = () => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const show = useCallback((message: string, type: ToastType = "info") => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setToasts((prev) => [...prev, { id, type, message }]);
    }, []);

    const remove = useCallback(
        (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)),
        [],
    );

    // Memoised so callers can list `toast` in a dependency array. Rebuilt every
    // render, it made any effect or callback that used it restart endlessly,
    // which is why the `exhaustive-deps` warnings here had been left alone.
    return useMemo(
        () => ({
            toasts,
            remove,
            success: (msg: string) => show(msg, "success"),
            error: (msg: string) => show(msg, "error"),
            warning: (msg: string) => show(msg, "warning"),
            info: (msg: string) => show(msg, "info"),
        }),
        [toasts, remove, show],
    );
};
