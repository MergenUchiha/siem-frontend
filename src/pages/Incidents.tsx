import React, { useState } from "react";
import {
    AlertTriangle,
    Eye,
    CheckCircle,
    Clock,
    Filter,
    Tag,
    Plus,
    Edit,
    Trash2,
} from "lucide-react";
import type { Incident } from "../types";
import {
    incidentsApi,
    type IncidentStatus,
    type SeverityLevel,
} from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { ToastContainer, useToast } from "../components/ui/Toast";

interface IncidentsProps {
    incidents: Incident[];
    onRefresh?: () => void;
}

const Incidents: React.FC<IncidentsProps> = ({ incidents, onRefresh }) => {
    const { t } = useLanguage();
    const toast = useToast();

    // ── Filters ────────────────────────────────────────────────────────────────
    const [statusFilter, setSeverityFilter2] = useState("all"); // status filter
    const [severityFilter, setSeverityFilter] = useState("all");

    // ── Modals ─────────────────────────────────────────────────────────────────
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
        null,
    );

    // ── Loading flags ──────────────────────────────────────────────────────────
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    // ── Delete confirm ─────────────────────────────────────────────────────────
    // FIX: replaces native confirm() — stores the id to delete, null = closed
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    // ── Derived ────────────────────────────────────────────────────────────────
    const filteredIncidents = incidents.filter((incident) => {
        const matchesStatus =
            statusFilter === "all" || incident.status === statusFilter;
        const matchesSeverity =
            severityFilter === "all" || incident.severity === severityFilter;
        return matchesStatus && matchesSeverity;
    });

    const stats = {
        open: incidents.filter((i) => i.status === "open").length,
        investigating: incidents.filter((i) => i.status === "investigating")
            .length,
        resolved: incidents.filter((i) => i.status === "resolved").length,
    };

    // ── Style maps ─────────────────────────────────────────────────────────────
    const statusColors: Record<string, string> = {
        open: "bg-red-500/20 text-red-400 border-red-500/30",
        investigating: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        resolved: "bg-green-500/20 text-green-400 border-green-500/30",
        closed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    };

    const severityColors: Record<string, string> = {
        critical: "text-red-400",
        high: "text-orange-400",
        medium: "text-yellow-400",
        low: "text-blue-400",
    };

    // ── Handlers ───────────────────────────────────────────────────────────────

    const handleCreateIncident = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);

        const form = e.target as HTMLFormElement;
        const fd = new FormData(form);

        const affectedSystems = (fd.get("affectedSystems") as string)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        const tags = (fd.get("tags") as string)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

        try {
            await incidentsApi.create({
                title: fd.get("title") as string,
                severity: fd.get("severity") as SeverityLevel,
                affectedSystems,
                description: fd.get("description") as string,
                assignedTo: (fd.get("assignedTo") as string) || undefined,
                tags: tags.length > 0 ? tags : undefined,
            });
            setShowCreateModal(false);
            form.reset();
            onRefresh?.();
            toast.success("Incident created successfully");
        } catch (err) {
            console.error("Failed to create incident:", err);
            toast.error("Failed to create incident");
        } finally {
            setIsCreating(false);
        }
    };

    const handleUpdateIncident = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedIncident) return;
        setIsUpdating(true);

        const fd = new FormData(e.target as HTMLFormElement);

        try {
            await incidentsApi.update(selectedIncident.id, {
                status: (fd.get("status") as IncidentStatus) || undefined,
                assignedTo: (fd.get("assignedTo") as string) || undefined,
                description: (fd.get("description") as string) || undefined,
            });
            setShowUpdateModal(false);
            setSelectedIncident(null);
            onRefresh?.();
            toast.success("Incident updated successfully");
        } catch (err) {
            console.error("Failed to update incident:", err);
            toast.error("Failed to update incident");
        } finally {
            setIsUpdating(false);
        }
    };

    // FIX: open ConfirmDialog instead of calling confirm()
    const requestDelete = (id: string) => setDeleteTarget(id);

    const handleDeleteConfirmed = async () => {
        if (!deleteTarget) return;
        try {
            await incidentsApi.delete(deleteTarget);
            onRefresh?.();
            toast.success("Incident deleted");
        } catch (err) {
            console.error("Failed to delete incident:", err);
            toast.error("Failed to delete incident");
        } finally {
            setDeleteTarget(null);
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* FIX: toast container — bottom-right toasts */}
            <ToastContainer toasts={toast.toasts} onRemove={toast.remove} />

            {/* FIX: custom confirm dialog instead of window.confirm() */}
            <ConfirmDialog
                isOpen={!!deleteTarget}
                title="Delete Incident"
                message="Are you sure you want to delete this incident? This action cannot be undone."
                confirmLabel="Delete"
                cancelLabel={t.common.cancel}
                variant="danger"
                onConfirm={handleDeleteConfirmed}
                onCancel={() => setDeleteTarget(null)}
            />

            {/* ── Stats cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 hover:border-red-500/50 transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-400 text-sm mb-1">
                                {t.incidents.openIncidents}
                            </p>
                            <p className="text-3xl font-bold text-white">
                                {stats.open}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                {t.incidents.requiresAttention}
                            </p>
                        </div>
                        <AlertTriangle className="w-12 h-12 text-red-400 opacity-50" />
                    </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 hover:border-yellow-500/50 transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-yellow-400 text-sm mb-1">
                                {t.incidents.investigating}
                            </p>
                            <p className="text-3xl font-bold text-white">
                                {stats.investigating}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                {t.incidents.inProgress}
                            </p>
                        </div>
                        <Eye className="w-12 h-12 text-yellow-400 opacity-50" />
                    </div>
                </div>

                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 hover:border-green-500/50 transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-400 text-sm mb-1">
                                {t.incidents.resolved}
                            </p>
                            <p className="text-3xl font-bold text-white">
                                {stats.resolved}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                {t.incidents.completed}
                            </p>
                        </div>
                        <CheckCircle className="w-12 h-12 text-green-400 opacity-50" />
                    </div>
                </div>
            </div>

            {/* ── Filter bar ── */}
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />

                        <select
                            value={statusFilter}
                            onChange={(e) => setSeverityFilter2(e.target.value)}
                            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
                        >
                            <option value="all">
                                {t.incidents.allStatuses}
                            </option>
                            <option value="open">{t.statuses.open}</option>
                            <option value="investigating">
                                {t.statuses.investigating}
                            </option>
                            <option value="resolved">
                                {t.statuses.resolved}
                            </option>
                            <option value="closed">{t.statuses.closed}</option>
                        </select>

                        <select
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value)}
                            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
                        >
                            <option value="all">
                                {t.incidents.allSeverities}
                            </option>
                            <option value="critical">
                                {t.severity.critical}
                            </option>
                            <option value="high">{t.severity.high}</option>
                            <option value="medium">{t.severity.medium}</option>
                            <option value="low">{t.severity.low}</option>
                        </select>
                    </div>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        <span>{t.incidents.createIncident}</span>
                    </button>
                </div>
            </div>

            {/* ── Incident list ── */}
            <div className="space-y-4">
                {filteredIncidents.map((incident) => (
                    <div
                        key={incident.id}
                        className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all group"
                    >
                        {/* Header row */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                    <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors truncate">
                                        {incident.title}
                                    </h3>
                                    <span
                                        className={`px-2 py-1 rounded text-xs border flex-shrink-0 ${statusColors[incident.status]}`}
                                    >
                                        {t.statuses[
                                            incident.status as keyof typeof t.statuses
                                        ]?.toUpperCase() ??
                                            incident.status.toUpperCase()}
                                    </span>
                                    <span
                                        className={`text-sm font-medium flex-shrink-0 ${severityColors[incident.severity]}`}
                                    >
                                        {t.severity[
                                            incident.severity as keyof typeof t.severity
                                        ]?.toUpperCase() ??
                                            incident.severity.toUpperCase()}
                                    </span>
                                </div>
                                <p className="text-gray-400 text-sm">
                                    {incident.description}
                                </p>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                                <button
                                    onClick={() => {
                                        setSelectedIncident(incident);
                                        setShowUpdateModal(true);
                                    }}
                                    className="p-2 bg-gray-700 text-gray-400 rounded-lg hover:bg-gray-600 hover:text-white transition-all"
                                    title={t.common.edit}
                                >
                                    <Edit className="w-4 h-4" />
                                </button>

                                {/* FIX: was handleDeleteIncident(id) with confirm() — now opens ConfirmDialog */}
                                <button
                                    onClick={() => requestDelete(incident.id)}
                                    className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                                    title={t.common.delete}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Meta row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-700">
                            {/* Affected systems */}
                            <div>
                                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                    <Tag className="w-3 h-3" />
                                    {t.incidents.affectedSystems}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {incident.affectedSystems.map((system) => (
                                        <span
                                            key={system}
                                            className="px-2 py-1 bg-gray-900 border border-gray-700 rounded text-xs text-cyan-400"
                                        >
                                            {system}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Timestamp */}
                            <div>
                                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {t.logs.timestamp}
                                </p>
                                <p className="text-sm text-gray-300">
                                    {new Date(
                                        incident.timestamp,
                                    ).toLocaleString()}
                                </p>
                            </div>

                            {/* Assigned to */}
                            {incident.assignedTo && (
                                <div>
                                    <p className="text-xs text-gray-500 mb-2">
                                        {t.incidents.assignedTo}
                                    </p>
                                    <p className="text-sm text-gray-300">
                                        {incident.assignedTo}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Tags */}
                        {incident.tags && incident.tags.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-700 flex flex-wrap gap-2">
                                {incident.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="px-2 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded text-xs"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Empty state */}
            {filteredIncidents.length === 0 && (
                <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-12 text-center">
                    <CheckCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">
                        {t.incidents.noIncidents}
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                        {t.incidents.adjustFilters}
                    </p>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════════
          CREATE MODAL
      ═══════════════════════════════════════════════════════════════════════ */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto p-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md my-8">
                        <h3 className="text-xl font-bold text-white mb-6">
                            {t.incidents.createIncident}
                        </h3>

                        <form
                            onSubmit={handleCreateIncident}
                            className="space-y-4"
                        >
                            {/* Title */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">
                                    Title *
                                </label>
                                <input
                                    name="title"
                                    type="text"
                                    required
                                    placeholder="Incident title"
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            {/* Severity */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">
                                    {t.logs.severity} *
                                </label>
                                <select
                                    name="severity"
                                    required
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                                >
                                    <option value="low">
                                        {t.severity.low}
                                    </option>
                                    <option value="medium">
                                        {t.severity.medium}
                                    </option>
                                    <option value="high">
                                        {t.severity.high}
                                    </option>
                                    <option value="critical">
                                        {t.severity.critical}
                                    </option>
                                </select>
                            </div>

                            {/* Affected systems */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">
                                    {t.incidents.affectedSystems} *{" "}
                                    <span className="text-gray-500">
                                        (comma-separated)
                                    </span>
                                </label>
                                <input
                                    name="affectedSystems"
                                    type="text"
                                    required
                                    placeholder="Web Server, Database"
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">
                                    {t.incidents.description} *
                                </label>
                                <textarea
                                    name="description"
                                    required
                                    rows={3}
                                    placeholder="Incident description..."
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 resize-none"
                                />
                            </div>

                            {/* Assigned to */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">
                                    {t.incidents.assignedTo}
                                </label>
                                <input
                                    name="assignedTo"
                                    type="email"
                                    placeholder="user@example.com"
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            {/* Tags */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">
                                    {t.incidents.tags}{" "}
                                    <span className="text-gray-500">
                                        (comma-separated)
                                    </span>
                                </label>
                                <input
                                    name="tags"
                                    type="text"
                                    placeholder="malware, network, critical"
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex items-center space-x-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="flex-1 py-2.5 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-all disabled:opacity-50 font-medium"
                                >
                                    {isCreating
                                        ? t.common.loading
                                        : t.incidents.createIncident}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all"
                                >
                                    {t.common.cancel}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════════
          UPDATE MODAL
      ═══════════════════════════════════════════════════════════════════════ */}
            {showUpdateModal && selectedIncident && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-white mb-6">
                            {t.incidents.updateIncident}
                        </h3>

                        <form
                            onSubmit={handleUpdateIncident}
                            className="space-y-4"
                        >
                            {/* Status */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">
                                    {t.common.status}
                                </label>
                                <select
                                    name="status"
                                    defaultValue={selectedIncident.status}
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                                >
                                    <option value="open">
                                        {t.statuses.open}
                                    </option>
                                    <option value="investigating">
                                        {t.statuses.investigating}
                                    </option>
                                    <option value="resolved">
                                        {t.statuses.resolved}
                                    </option>
                                    <option value="closed">
                                        {t.statuses.closed}
                                    </option>
                                </select>
                            </div>

                            {/* Assigned to */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">
                                    {t.incidents.assignedTo}
                                </label>
                                <input
                                    name="assignedTo"
                                    type="email"
                                    defaultValue={
                                        selectedIncident.assignedTo ?? ""
                                    }
                                    placeholder="user@example.com"
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">
                                    {t.incidents.description}
                                </label>
                                <textarea
                                    name="description"
                                    defaultValue={selectedIncident.description}
                                    rows={3}
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 resize-none"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex items-center space-x-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="flex-1 py-2.5 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-all disabled:opacity-50 font-medium"
                                >
                                    {isUpdating
                                        ? t.common.loading
                                        : t.incidents.updateIncident}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowUpdateModal(false);
                                        setSelectedIncident(null);
                                    }}
                                    className="flex-1 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all"
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

export default Incidents;
