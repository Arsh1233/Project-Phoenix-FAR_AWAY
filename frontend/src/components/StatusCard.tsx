import React from 'react';
import type { ServiceHealth } from '../types';

interface Props {
  title: string;
  health: ServiceHealth;
  icon: React.ReactNode;
}

export const StatusCard: React.FC<Props> = ({ title, health, icon }) => {
  const getStatusColor = () => {
    switch (health.status) {
      case 'healthy': return 'green';
      case 'degraded': return 'yellow';
      case 'critical':
      case 'offline': return 'red';
      default: return 'red';
    }
  };

  const getStatusText = () => {
    switch (health.status) {
      case 'healthy': return 'Online & Healthy';
      case 'degraded': return 'Degraded Performance';
      case 'critical': return 'Critical Error';
      case 'offline': return 'Service Offline';
      default: return 'Unknown';
    }
  };

  return (
    <div className="card p-5 flex flex-col justify-between h-full bg-white relative overflow-hidden group">
      {/* Decorative gradient blob */}
      <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-500 bg-status-${getStatusColor()}`}></div>
      
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-surface-50 rounded-lg text-ink-700">
            {icon}
          </div>
          <h3 className="font-semibold text-ink-900">{title}</h3>
        </div>
        <div className={`status-dot ${getStatusColor()}`} title={getStatusText()} />
      </div>
      
      <div>
        <div className="text-2xl font-bold text-ink-900 mb-1">
          {health.status === 'offline' ? '--' : `${health.latencyMs}ms`}
        </div>
        <div className="text-sm font-medium text-ink-500 flex items-center justify-between">
          <span>Latency</span>
          <span className={`text-${getStatusColor()} bg-${getStatusColor()}-100/10 px-2 py-0.5 rounded-full text-xs font-semibold`}>
            {health.status.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
};
