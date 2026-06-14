import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import type { BlockchainLog } from '../types';

export const BlockchainPanel: React.FC = () => {
  const [logs, setLogs] = useState<BlockchainLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{status: string, message: string} | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await apiService.getBlockchainLogs();
      setLogs(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleVerify = async () => {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await apiService.verifyBlockchain();
      setVerifyResult(res);
    } catch (e: any) {
      setVerifyResult({ status: 'error', message: e.response?.data?.detail || 'Verification failed!' });
    }
    setVerifying(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="max-w-6xl mx-auto animate-fade-in h-full flex flex-col">
      <div className="mb-6 flex justify-between items-end shrink-0">
        <div>
          <h2 className="text-3xl font-bold text-ink-900 mb-2">Audit Trail</h2>
          <p className="text-ink-500">Immutable blockchain ledger recording every fragment access.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchLogs} className="btn-secondary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Refresh Ledger
          </button>
          <button onClick={handleVerify} disabled={verifying} className="btn-primary">
            {verifying ? 'Verifying...' : 'Verify Chain Integrity'}
          </button>
        </div>
      </div>

      {verifyResult && (
        <div className={`mb-6 p-4 rounded-lg border flex items-start gap-3 animate-slide-in shrink-0 ${verifyResult.status === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {verifyResult.status === 'success' ? (
             <svg className="w-6 h-6 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          ) : (
            <svg className="w-6 h-6 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          )}
          <div>
            <h4 className="font-bold">{verifyResult.status === 'success' ? 'Chain Verified' : 'Integrity Compromised'}</h4>
            <p className="text-sm opacity-90">{verifyResult.message}</p>
          </div>
        </div>
      )}

      <div className="card bg-surface-50 border-surface-200 flex-1 overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-surface-200 border-t-phoenix-500 rounded-full animate-spin"></div>
          </div>
        ) : !logs || logs.chain.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-ink-500">
            No blocks found in the chain.
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto p-8 flex items-center min-h-[400px]">
            <div className="flex items-center space-x-0 w-max">
              {logs.chain.map((block, i) => (
                <div key={block.index} className="flex items-center">
                  <div className="w-80 bg-white border border-surface-200 rounded-xl shadow-sm hover:shadow-md transition-shadow shrink-0 relative overflow-hidden group">
                    <div className="h-1 w-full gradient-phoenix absolute top-0 left-0"></div>
                    <div className="p-4 border-b border-surface-100 flex justify-between items-center bg-surface-50">
                      <span className="text-xs font-bold text-ink-500 uppercase tracking-wider">Block #{block.index}</span>
                      <span className="text-xs font-mono text-ink-400">{new Date(block.timestamp * 1000).toLocaleTimeString()}</span>
                    </div>
                    <div className="p-4 space-y-3 font-mono text-xs">
                      <div>
                        <span className="text-ink-400 block mb-1">Hash</span>
                        <div className="truncate text-phoenix-600 font-semibold" title={block.hash}>{block.hash}</div>
                      </div>
                      <div>
                        <span className="text-ink-400 block mb-1">Previous Hash</span>
                        <div className="truncate text-ink-600" title={block.previous_hash}>{block.previous_hash}</div>
                      </div>
                      {block.index !== 0 && (
                        <div className="pt-3 border-t border-surface-100 mt-3 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-ink-400">Candidate:</span>
                            <span className="text-ink-900 truncate max-w-[140px]">{block.candidate_id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-ink-400">Center:</span>
                            <span className="text-ink-900">{block.center_id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-ink-400">Fragment:</span>
                            <span className="text-ink-900 truncate max-w-[140px]">{block.fragment_id}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {i < logs.chain.length - 1 && (
                    <div className="w-12 h-0.5 bg-phoenix-300 relative shrink-0">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-phoenix-300 transform rotate-45 translate-x-1"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
