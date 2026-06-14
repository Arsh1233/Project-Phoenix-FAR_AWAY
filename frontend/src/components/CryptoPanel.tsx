import React, { useState } from 'react';
import { apiService } from '../services/api';

export const CryptoPanel: React.FC = () => {
  const [questionText, setQuestionText] = useState('Identify the correct sequence of phases in the cell cycle: (A) G1 -> S -> G2 -> M (B) M -> G1 -> G2 -> S (C) S -> G1 -> G2 -> M (D) G1 -> G2 -> S -> M');
  const [n, setN] = useState(5);
  const [k, setK] = useState(3);
  const [fragments, setFragments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [assembledText, setAssembledText] = useState('');
  const [questionId, setQuestionId] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setFragments([]);
    setAssembledText('');
    try {
      const res = await apiService.generateFragments([questionText], n, k);
      const qId = Object.keys(res)[0];
      setQuestionId(qId);
      setFragments(res[qId]);
    } catch (e) {
      console.error(e);
      alert('Failed to generate fragments. Ensure Crypto Service is running.');
    }
    setLoading(false);
  };

  const handleAssemble = async () => {
    if (fragments.length < k) {
      alert(`Need at least ${k} fragments to assemble!`);
      return;
    }
    setLoading(true);
    try {
      // Pick first k fragments to assemble
      const assembleIds = fragments.slice(0, k);
      const res = await apiService.assembleFragments(questionId, assembleIds);
      setAssembledText(res.question_text);
    } catch (e) {
      console.error(e);
      alert('Failed to assemble fragments.');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-ink-900 mb-2">Crypto Engine Lab</h2>
        <p className="text-ink-500">Interactive demonstration of Shamir's Secret Sharing & AES-GCM encryption.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="card p-6 bg-white">
            <h3 className="text-lg font-semibold text-ink-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-phoenix-100 text-phoenix-600 flex items-center justify-center text-sm">1</span>
              Input & Configuration
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Secret Text (Question)</label>
                <textarea 
                  className="w-full border border-surface-200 rounded-lg p-3 text-ink-900 focus:outline-none focus:ring-2 focus:ring-phoenix-500"
                  rows={3}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                ></textarea>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Total Fragments (n)</label>
                  <input 
                    type="number" 
                    className="w-full border border-surface-200 rounded-lg p-2 text-ink-900"
                    value={n}
                    onChange={(e) => setN(parseInt(e.target.value))}
                    min={2} max={10}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Threshold (k)</label>
                  <input 
                    type="number" 
                    className="w-full border border-surface-200 rounded-lg p-2 text-ink-900"
                    value={k}
                    onChange={(e) => setK(parseInt(e.target.value))}
                    min={2} max={n}
                  />
                </div>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={loading || !questionText}
                className="btn-primary w-full mt-4"
              >
                {loading ? 'Processing...' : 'Encrypt & Split'}
              </button>
            </div>
          </div>

          {assembledText && (
            <div className="card p-6 bg-white border-green-200 animate-slide-up">
              <h3 className="text-lg font-semibold text-green-700 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Successfully Assembled
              </h3>
              <p className="text-ink-900 font-medium bg-green-50 p-3 rounded-lg border border-green-100">
                "{assembledText}"
              </p>
            </div>
          )}
        </div>

        <div className="card p-6 bg-white min-h-[400px]">
          <h3 className="text-lg font-semibold text-ink-900 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-phoenix-100 text-phoenix-600 flex items-center justify-center text-sm">2</span>
            Generated Fragments
          </h3>

          {fragments.length === 0 ? (
            <div className="h-full flex items-center justify-center text-ink-400 border-2 border-dashed border-surface-200 rounded-lg p-8 text-center">
              Configure parameters and click "Encrypt & Split" to see SSS fragments.
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="text-sm text-ink-500 mb-4">
                <p>AES-256 Key split into <strong className="text-ink-900">{n} fragments</strong>.</p>
                <p>Any <strong className="text-ink-900">{k} fragments</strong> are required to assemble the plaintext.</p>
              </div>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {fragments.map((id, i) => (
                  <div key={id} className="p-3 bg-surface-50 border border-surface-200 rounded-lg flex items-center justify-between group hover:border-phoenix-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded bg-surface-200 text-ink-500 flex items-center justify-center text-xs font-mono">{i + 1}</span>
                      <span className="font-mono text-xs text-ink-600">{id}</span>
                    </div>
                    {i < k && <span className="badge badge-green">Assembly Set</span>}
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-surface-100">
                <button 
                  onClick={handleAssemble}
                  disabled={loading}
                  className="btn-secondary w-full"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  Assemble with {k} Fragments
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
