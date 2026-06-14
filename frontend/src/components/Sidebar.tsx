import React from 'react';

interface Props {
  activePanel: 'overview' | 'crypto' | 'leak' | 'blockchain';
  setActivePanel: (panel: 'overview' | 'crypto' | 'leak' | 'blockchain') => void;
}

export const Sidebar: React.FC<Props> = ({ activePanel, setActivePanel }) => {
  return (
    <aside className="w-64 bg-white border-r border-surface-200 flex flex-col h-full shrink-0">
      <div className="p-6 border-b border-surface-100">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg gradient-phoenix flex items-center justify-center shadow-glow-orange animate-pulse-glow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-ink-900">PHOENIX</h1>
        </div>
        <p className="text-xs font-medium text-ink-400 pl-11">Command Center</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <button 
          className={`nav-item ${activePanel === 'overview' ? 'active' : ''}`}
          onClick={() => setActivePanel('overview')}
        >
          <svg className="w-5 h-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          System Overview
        </button>

        <button 
          className={`nav-item ${activePanel === 'crypto' ? 'active' : ''}`}
          onClick={() => setActivePanel('crypto')}
        >
          <svg className="w-5 h-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Crypto Engine
        </button>

        <button 
          className={`nav-item ${activePanel === 'leak' ? 'active' : ''}`}
          onClick={() => setActivePanel('leak')}
        >
          <svg className="w-5 h-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Leak Simulation
        </button>

        <button 
          className={`nav-item ${activePanel === 'blockchain' ? 'active' : ''}`}
          onClick={() => setActivePanel('blockchain')}
        >
          <svg className="w-5 h-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Audit Trail
        </button>
      </nav>

      <div className="p-4 border-t border-surface-100 bg-surface-50">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-semibold text-ink-500">SYSTEM SECURE</span>
        </div>
      </div>
    </aside>
  );
};
