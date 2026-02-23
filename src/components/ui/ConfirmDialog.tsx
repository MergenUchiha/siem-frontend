import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "warning" | "info";
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = "danger",
    onConfirm,
    onCancel,
}) => {
    if (!isOpen) return null;

    const colors = {
        danger: {
            icon: "text-red-400",
            btn: "bg-red-500 hover:bg-red-600",
            ring: "bg-red-500/20",
        },
        warning: {
            icon: "text-yellow-400",
            btn: "bg-yellow-500 hover:bg-yellow-600",
            ring: "bg-yellow-500/20",
        },
        info: {
            icon: "text-cyan-400",
            btn: "bg-cyan-500 hover:bg-cyan-600",
            ring: "bg-cyan-500/20",
        },
    }[variant];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-sm shadow-2xl">
                {/* Header */}
                <div className="flex items-start justify-between p-5 border-b border-gray-700">
                    <div className="flex items-center space-x-3">
                        <div
                            className={`w-10 h-10 rounded-full ${colors.ring} flex items-center justify-center flex-shrink-0`}
                        >
                            <AlertTriangle
                                className={`w-5 h-5 ${colors.icon}`}
                            />
                        </div>
                        <h3 className="text-white font-semibold">{title}</h3>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5">
                    <p className="text-gray-400 text-sm leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="flex items-center space-x-3 p-5 border-t border-gray-700">
                    <button
                        onClick={onConfirm}
                        className={`flex-1 py-2 rounded-lg text-white font-medium transition-all ${colors.btn}`}
                    >
                        {confirmLabel}
                    </button>
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all"
                    >
                        {cancelLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
