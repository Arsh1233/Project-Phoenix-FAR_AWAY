import React, { useState } from 'react';
import { apiService } from '../services/api';
import type { LeakResult } from '../types';

export const LeakSimPanel: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<{time: string, msg: string, type: 'info'|'warning'|'success'}[]>([]);
  const [result, setResult] = useState<LeakResult | null>(null);

  const addLog = (msg: string, type: 'info'|'warning'|'success' = 'info') => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg, type }]);
  };

  const simulateLeak = async () => {
    setLoading(true);
    setLogs([]);
    setResult(null);
    
    addLog('Starting exam session to generate baseline fragments...', 'info');
    try {
      // 1. Start a session
      await apiService.startExamSession('demo-candidate', 5, 3);
      addLog(`Session started. Q1 Fragments generated.`, 'success');
      
      // Wait a moment for visual effect
      await new Promise(r => setTimeout(r, 1000));
      
      // 2. We need a fragment to leak. For the demo, we'll just pull a fragment from crypto manually or assume Edge has one.
      // Since edge doesn't expose raw fragments, we'll ask crypto for a fake one just to simulate the callback.
      const frags = await apiService.generateFragments(["Dummy Question for Leak"], 5, 3);
      const qId = Object.keys(frags)[0];
      const leakedFragId = frags[qId][0];
      
      addLog(`Simulated Dark Web Crawler found hash matching Fragment [${leakedFragId.substring(0,8)}...]`, 'warning');
      await new Promise(r => setTimeout(r, 1500));
      
      addLog(`Sending callback to Edge Agent leak handler...`, 'info');
      const res = await apiService.triggerLeakSimulation(leakedFragId, qId);
      
      setResult(res);
      addLog(`Response: ${res.message}`, res.status === 'regenerated' ? 'success' : 'warning');
      
      if (res.status === 'regenerated') {
        addLog(`New fragment distributed to replace compromised one.`, 'success');
      }
      
    } catch (e) {
      console.error(e);
      addLog('Simulation failed. Ensure all services are running.', 'warning');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-ink-900 mb-2">Leak Simulation</h2>
          <p className="text-ink-500">Trigger a simulated paper leak and watch the system automatically respond and self-heal.</p>
        </div>
        <button 
          onClick={simulateLeak}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Running Simulation</>
          ) : (
            <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> Trigger Leak Simulation</>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-6 bg-white">
            <h3 className="text-lg font-semibold text-ink-900 mb-4">Response Pipeline</h3>
            <div className="space-y-0">
              {/* Pipeline visual */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${logs.length > 0 ? 'bg-phoenix-500 text-white' : 'bg-surface-200 text-ink-400'}`}>1</div>
                  <div className={`w-0.5 h-10 ${logs.length > 1 ? 'bg-phoenix-500' : 'bg-surface-200'}`}></div>
                </div>
                <div className="pt-1 pb-10">
                  <p className="font-semibold text-ink-900 text-sm">Exam Active</p>
                  <p className="text-xs text-ink-500">Session started normally</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${logs.length > 1 ? 'bg-red-500 text-white animate-pulse' : 'bg-surface-200 text-ink-400'}`}>2</div>
                  <div className={`w-0.5 h-10 ${logs.length > 2 ? 'bg-red-500' : 'bg-surface-200'}`}></div>
                </div>
                <div className="pt-1 pb-10">
                  <p className="font-semibold text-ink-900 text-sm">Leak Detected</p>
                  <p className="text-xs text-ink-500">Dark web crawler finds hash</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${logs.length > 2 ? 'bg-phoenix-500 text-white' : 'bg-surface-200 text-ink-400'}`}>3</div>
                  <div className={`w-0.5 h-10 ${logs.length > 3 ? 'bg-phoenix-500' : 'bg-surface-200'}`}></div>
                </div>
                <div className="pt-1 pb-10">
                  <p className="font-semibold text-ink-900 text-sm">Self-Healing</p>
                  <p className="text-xs text-ink-500">Fragment regeneration triggered</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${result ? 'bg-green-500 text-white' : 'bg-surface-200 text-ink-400'}`}>4</div>
                </div>
                <div className="pt-1">
                  <p className="font-semibold text-ink-900 text-sm">Exam Continues</p>
                  <p className="text-xs text-ink-500">Zero disruption to candidate</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card bg-[#111827] border-ink-700 h-full flex flex-col overflow-hidden shadow-elevated">
            <div className="bg-[#1f2937] px-4 py-2 border-b border-ink-700 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="text-ink-400 text-xs font-mono ml-2">system-logs ~ leak-simulation</span>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto font-mono text-sm space-y-2 h-[400px]">
              {logs.length === 0 ? (
                <div className="text-ink-500 h-full flex items-center justify-center">
                  Waiting for simulation trigger...
                </div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="flex gap-3 animate-slide-in">
                    <span className="text-ink-500 shrink-0">[{log.time}]</span>
                    <span className={`
                      ${log.type === 'info' ? 'text-blue-400' : ''}
                      ${log.type === 'warning' ? 'text-yellow-400' : ''}
                      ${log.type === 'success' ? 'text-green-400' : ''}
                    `}>
                      {log.msg}
                    </span>
                  </div>
                ))
              )}
            </div>
            
            {result && result.status === 'regenerated' && (
              <div className="bg-[#1f2937] p-4 border-t border-ink-700 animate-slide-up">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <h4 className="text-green-400 font-semibold mb-1">Regeneration Successful</h4>
                    <p className="text-ink-300 text-sm font-mono">Old Hash: <span className="text-red-400 line-through">{result.compromised_hash?.substring(0, 16)}...</span></p>
                    <p className="text-ink-300 text-sm font-mono">New Frag: <span className="text-green-400">{result.new_fragment_id?.substring(0, 16)}...</span></p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
