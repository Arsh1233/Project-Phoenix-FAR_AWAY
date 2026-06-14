import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { OverviewPanel } from './OverviewPanel';
import { CryptoPanel } from './CryptoPanel';
import { LeakSimPanel } from './LeakSimPanel';
import { BlockchainPanel } from './BlockchainPanel';
import { EdgeAgentPanel } from './EdgeAgentPanel';
import { apiService } from '../services/api';
import type { SystemStatus } from '../types';

type PanelType = 'overview' | 'crypto' | 'edge' | 'leak' | 'blockchain';

export const Dashboard: React.FC = () => {
  const [activePanel, setActivePanel] = useState<PanelType>('overview');
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = async () => {
    setRefreshing(true);
    try {
      const currentStatus = await apiService.checkHealth();
      setStatus(currentStatus);
    } catch (e) {
      console.error('Failed to fetch system status', e);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    fetchStatus();
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const renderPanel = () => {
    switch (activePanel) {
      case 'overview':
        return <OverviewPanel status={status} refreshing={refreshing} onRefresh={fetchStatus} />;
      case 'crypto':
        return <CryptoPanel />;
      case 'edge':
        return <EdgeAgentPanel />;
      case 'leak':
        return <LeakSimPanel />;
      case 'blockchain':
        return <BlockchainPanel />;
      default:
        return <OverviewPanel status={status} refreshing={refreshing} onRefresh={fetchStatus} />;
    }
  };

  return (
    <div className="flex h-screen bg-surface-50 overflow-hidden font-sans text-ink-900">
      <Sidebar activePanel={activePanel} setActivePanel={setActivePanel} />
      
      <main className="flex-1 overflow-y-auto p-8 h-full bg-surface-100/50">
        <div className="h-full">
          {renderPanel()}
        </div>
      </main>
    </div>
  );
};
