import React, { useState } from 'react';
import { AlertTriangle, Eye, CheckCircle, Clock, Filter, Tag, Plus, Edit, Trash2 } from 'lucide-react';
import { Incident } from '../types';
import { incidentsApi } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

interface IncidentsProps {
  incidents: Incident[];
  onRefresh?: () => void;
}

const Incidents: React.FC<IncidentsProps> = ({ incidents, onRefresh }) => {
  const { t } = useLanguage();
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredIncidents = incidents.filter(incident => {
    const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || incident.severity === severityFilter;
    return matchesStatus && matchesSeverity;
  });

  const statusColors: Record<string, string> = {
    open: 'bg-red-500/20 text-red-400 border-red-500/30',
    investigating: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    resolved: 'bg-green-500/20 text-green-400 border-green-500/30',
    closed: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  };

  const severityColors: Record<string, string> = {
    critical: 'text-red-400',
    high: 'text-orange-400',
    medium: 'text-yellow-400',
    low: 'text-blue-400'
  };

  const stats = {
    open: incidents.filter(i => i.status === 'open').length,
    investigating: incidents.filter(i => i.status === 'investigating').length,
    resolved: incidents.filter(i => i.status === 'resolved').length
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const affectedSystems = (formData.get('affectedSystems') as string).split(',').map(s => s.trim());
    const tags = (formData.get('tags') as string).split(',').map(s => s.trim()).filter(Boolean);

    const incidentData = {
      title: formData.get('title') as string,
      severity: formData.get('severity') as string,
      affectedSystems,
      description: formData.get('description') as string,
      assignedTo: formData.get('assignedTo') as string || undefined,
      tags: tags.length > 0 ? tags : undefined
    };

    try {
      await incidentsApi.create(incidentData);
      setShowCreateModal(false);
      if (onRefresh) onRefresh();
      alert(t.notificationTypes.newSecurityIncident);
    } catch (error) {
      console.error('Failed to create incident:', error);
      alert('Failed to create incident');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;

    setIsUpdating(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const updateData = {
      status: formData.get('status') as string,
      assignedTo: formData.get('assignedTo') as string || undefined,
      description: formData.get('description') as string || undefined,
    };

    try {
      await incidentsApi.update(selectedIncident.id, updateData);
      setShowUpdateModal(false);
      setSelectedIncident(null);
      if (onRefresh) onRefresh();
      alert('Incident updated successfully!');
    } catch (error) {
      console.error('Failed to update incident:', error);
      alert('Failed to update incident');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteIncident = async (id: string) => {
    if (!confirm('Are you sure you want to delete this incident?')) return;

    try {
      await incidentsApi.delete(id);
      if (onRefresh) onRefresh();
      alert('Incident deleted successfully!');
    } catch (error) {
      console.error('Failed to delete incident:', error);
      alert('Failed to delete incident');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 hover:border-red-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-400 text-sm mb-1">{t.incidents.openIncidents}</p>
              <p className="text-3xl font-bold text-white">{stats.open}</p>
              <p className="text-xs text-gray-400 mt-1">{t.incidents.requiresAttention}</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-red-400 opacity-50" />
          </div>
        </div>
        
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 hover:border-yellow-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-400 text-sm mb-1">{t.incidents.investigating}</p>
              <p className="text-3xl font-bold text-white">{stats.investigating}</p>
              <p className="text-xs text-gray-400 mt-1">{t.incidents.inProgress}</p>
            </div>
            <Eye className="w-12 h-12 text-yellow-400 opacity-50" />
          </div>
        </div>
        
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 hover:border-green-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 text-sm mb-1">{t.incidents.resolved}</p>
              <p className="text-3xl font-bold text-white">{stats.resolved}</p>
              <p className="text-xs text-gray-400 mt-1">{t.incidents.completed}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-400 opacity-50" />
          </div>
        </div>
      </div>

      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="all">{t.incidents.allStatuses}</option>
              <option value="open">{t.statuses.open}</option>
              <option value="investigating">{t.statuses.investigating}</option>
              <option value="resolved">{t.statuses.resolved}</option>
              <option value="closed">{t.statuses.closed}</option>
            </select>
            
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="all">{t.incidents.allSeverities}</option>
              <option value="critical">{t.severity.critical}</option>
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

      <div className="space-y-4">
        {filteredIncidents.map(incident => (
          <div 
            key={incident.id} 
            className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
                    {incident.title}
                  </h3>
                  <span className={`px-2 py-1 rounded text-xs border ${statusColors[incident.status]}`}>
                    {t.statuses[incident.status as keyof typeof t.statuses]?.toUpperCase() || incident.status.toUpperCase()}
                  </span>
                  <span className={`text-sm font-medium ${severityColors[incident.severity]}`}>
                    {t.severity[incident.severity as keyof typeof t.severity]?.toUpperCase() || incident.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">{incident.description}</p>
              </div>

              <div className="flex items-center space-x-2 ml-4">
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
                
                <button
                  onClick={() => handleDeleteIncident(incident.id)}
                  className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                  title={t.common.delete}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-700">
              <div>
                <p className="text-xs text-gray-500 mb-2 flex items-center">
                  <Tag className="w-3 h-3 mr-1" />
                  {t.incidents.affectedSystems}
                </p>
                <div className="flex flex-wrap gap-2">
                  {incident.affectedSystems.map(system => (
                    <span 
                      key={system} 
                      className="px-2 py-1 bg-gray-900 border border-gray-700 rounded text-xs text-cyan-400"
                    >
                      {system}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-xs text-gray-500 mb-2 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {t.logs.timestamp}
                </p>
                <p className="text-sm text-gray-300">
                  {new Date(incident.timestamp).toLocaleString()}
                </p>
              </div>
              
              {incident.assignedTo && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">{t.incidents.assignedTo}</p>
                  <p className="text-sm text-gray-300">{incident.assignedTo}</p>
                </div>
              )}
            </div>
            
            {incident.tags && incident.tags.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <div className="flex flex-wrap gap-2">
                  {incident.tags.map(tag => (
                    <span 
                      key={tag} 
                      className="px-2 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded text-xs"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {filteredIncidents.length === 0 && (
        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-12 text-center">
          <CheckCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">{t.incidents.noIncidents}</p>
          <p className="text-gray-500 text-sm mt-2">{t.incidents.adjustFilters}</p>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md my-8">
            <h3 className="text-xl font-bold text-white mb-4">{t.incidents.createIncident}</h3>
            <form onSubmit={handleCreateIncident} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">{t.incidents.title || 'Title'}</label>
                <input
                  name="title"
                  type="text"
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  placeholder="Incident title"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">{t.logs.severity}</label>
                <select
                  name="severity"
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="low">{t.severity.low}</option>
                  <option value="medium">{t.severity.medium}</option>
                  <option value="high">{t.severity.high}</option>
                  <option value="critical">{t.severity.critical}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">{t.incidents.affectedSystems}</label>
                <input
                  name="affectedSystems"
                  type="text"
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  placeholder="Web Server, Database"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">{t.incidents.description}</label>
                <textarea
                  name="description"
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  placeholder="Incident description..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">{t.incidents.assignedTo}</label>
                <input
                  name="assignedTo"
                  type="email"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">{t.incidents.tags}</label>
                <input
                  name="tags"
                  type="text"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  placeholder="malware, network, critical"
                />
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-all disabled:opacity-50"
                >
                  {isCreating ? t.common.loading : t.incidents.createIncident}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all"
                >
                  {t.common.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUpdateModal && selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">{t.incidents.updateIncident}</h3>
            <form onSubmit={handleUpdateIncident} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">{t.common.status}</label>
                <select
                  name="status"
                  defaultValue={selectedIncident.status}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="open">{t.statuses.open}</option>
                  <option value="investigating">{t.statuses.investigating}</option>
                  <option value="resolved">{t.statuses.resolved}</option>
                  <option value="closed">{t.statuses.closed}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">{t.incidents.assignedTo}</label>
                <input
                  name="assignedTo"
                  type="email"
                  defaultValue={selectedIncident.assignedTo}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">{t.incidents.description}</label>
                <textarea
                  name="description"
                  defaultValue={selectedIncident.description}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-all disabled:opacity-50"
                >
                  {isUpdating ? t.common.loading : t.incidents.updateIncident}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUpdateModal(false);
                    setSelectedIncident(null);
                  }}
                  className="flex-1 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all"
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