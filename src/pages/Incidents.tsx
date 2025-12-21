import React, { useState } from 'react';
import { AlertTriangle, Eye, CheckCircle, Clock, Filter, Tag } from 'lucide-react';
import { Incident } from '../types';

interface IncidentsProps {
  incidents: Incident[];
}

const Incidents: React.FC<IncidentsProps> = ({ incidents }) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

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

  // Stats
  const stats = {
    open: incidents.filter(i => i.status === 'open').length,
    investigating: incidents.filter(i => i.status === 'investigating').length,
    resolved: incidents.filter(i => i.status === 'resolved').length
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 hover:border-red-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-400 text-sm mb-1">Open Incidents</p>
              <p className="text-3xl font-bold text-white">{stats.open}</p>
              <p className="text-xs text-gray-400 mt-1">Requires attention</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-red-400 opacity-50" />
          </div>
        </div>
        
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 hover:border-yellow-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-400 text-sm mb-1">Investigating</p>
              <p className="text-3xl font-bold text-white">{stats.investigating}</p>
              <p className="text-xs text-gray-400 mt-1">In progress</p>
            </div>
            <Eye className="w-12 h-12 text-yellow-400 opacity-50" />
          </div>
        </div>
        
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 hover:border-green-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 text-sm mb-1">Resolved</p>
              <p className="text-3xl font-bold text-white">{stats.resolved}</p>
              <p className="text-xs text-gray-400 mt-1">Completed</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-400 opacity-50" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Incidents List */}
      <div className="space-y-4">
        {filteredIncidents.map(incident => (
          <div 
            key={incident.id} 
            className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
                    {incident.title}
                  </h3>
                  <span className={`px-2 py-1 rounded text-xs border ${statusColors[incident.status]}`}>
                    {incident.status.toUpperCase()}
                  </span>
                  <span className={`text-sm font-medium ${severityColors[incident.severity]}`}>
                    {incident.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">{incident.description}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-700">
              <div>
                <p className="text-xs text-gray-500 mb-2 flex items-center">
                  <Tag className="w-3 h-3 mr-1" />
                  Affected Systems
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
                  Timestamp
                </p>
                <p className="text-sm text-gray-300">
                  {new Date(incident.timestamp).toLocaleString()}
                </p>
              </div>
              
              {incident.assignedTo && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Assigned To</p>
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
          <p className="text-gray-400 text-lg">No incidents found</p>
          <p className="text-gray-500 text-sm mt-2">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
};

export default Incidents;