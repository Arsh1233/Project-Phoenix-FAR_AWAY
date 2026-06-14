import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export const EdgeAgentPanel: React.FC = () => {
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  
  // Session Simulation State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  const fetchStats = async () => {
    try {
      const stats = await apiService.getEdgeCacheStats();
      setCacheStats(stats);
    } catch (e) {
      console.error("Failed to fetch cache stats");
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleClearCache = async () => {
    setLoading(true);
    try {
      await apiService.clearEdgeCache();
      await fetchStats();
    } catch (e) {
      alert("Failed to clear cache");
    }
    setLoading(false);
  };

  const handleStartExam = async () => {
    setSessionLoading(true);
    try {
      const candidateId = `demo-user-${Math.floor(Math.random() * 1000)}`;
      const res = await apiService.startExamSession(candidateId, 5, 3);
      setSessionId(res.session_id);
      setHistory([]);
      setCurrentQuestion(null);
      await fetchStats(); // cache will be updated
    } catch (e) {
      alert("Failed to start exam. Ensure Edge Agent is running.");
    }
    setSessionLoading(false);
  };

  const handleNextQuestion = async () => {
    if (!sessionId) return;
    setSessionLoading(true);
    try {
      const res = await apiService.getNextQuestion(sessionId);
      if (res.message && res.message.includes("complete")) {
        alert("Exam complete!");
        setSessionId(null);
      } else {
        setCurrentQuestion(res);
        setHistory(prev => [...prev, res]);
      }
    } catch (e) {
      alert("Failed to fetch next question.");
    }
    setSessionLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-ink-900 mb-2">Edge Agent Monitoring</h2>
        <p className="text-ink-500">Monitor local fragment cache and exam session assembly latencies.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cache Stats Panel */}
        <div className="space-y-6">
          <div className="card p-6 bg-white">
            <h3 className="text-lg font-semibold text-ink-900 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-phoenix-100 text-phoenix-600 flex items-center justify-center text-sm">1</span>
                Local Fragment Cache
              </span>
              <button 
                onClick={handleClearCache}
                disabled={loading}
                className="text-sm px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
              >
                Clear Cache
              </button>
            </h3>
            
            {cacheStats ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-surface-50 border border-surface-100">
                  <div className="text-sm text-ink-500 font-medium">Cached Fragments</div>
                  <div className="text-2xl font-bold text-ink-900">{cacheStats.total_items}</div>
                </div>
                <div className="p-4 rounded-xl bg-surface-50 border border-surface-100">
                  <div className="text-sm text-ink-500 font-medium">Cache Hits</div>
                  <div className="text-2xl font-bold text-emerald-600">{cacheStats.hits}</div>
                </div>
                <div className="p-4 rounded-xl bg-surface-50 border border-surface-100">
                  <div className="text-sm text-ink-500 font-medium">Cache Misses</div>
                  <div className="text-2xl font-bold text-red-500">{cacheStats.misses}</div>
                </div>
                <div className="p-4 rounded-xl bg-surface-50 border border-surface-100">
                  <div className="text-sm text-ink-500 font-medium">Hit Rate</div>
                  <div className="text-2xl font-bold text-phoenix-600">
                    {cacheStats.hits + cacheStats.misses > 0 
                      ? Math.round((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100) 
                      : 0}%
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-ink-500 text-sm">Loading stats...</div>
            )}
          </div>
        </div>

        {/* Session Simulation Panel */}
        <div className="space-y-6">
          <div className="card p-6 bg-white">
            <h3 className="text-lg font-semibold text-ink-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-phoenix-100 text-phoenix-600 flex items-center justify-center text-sm">2</span>
              Exam Assembly Simulator
            </h3>
            
            {!sessionId ? (
              <div className="text-center py-8">
                <p className="text-ink-500 mb-4">Start a simulated exam session to see real-time fragment assembly latency.</p>
                <button 
                  onClick={handleStartExam}
                  disabled={sessionLoading}
                  className="btn-primary"
                >
                  {sessionLoading ? 'Starting...' : 'Start Exam Session'}
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-ink-500">Session Active</div>
                  <button 
                    onClick={handleNextQuestion}
                    disabled={sessionLoading}
                    className="btn-primary"
                  >
                    {sessionLoading ? 'Loading...' : 'Fetch Next Question'}
                  </button>
                </div>

                {currentQuestion && (
                  <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold uppercase text-ink-400 tracking-wider">
                        Question {currentQuestion.question_number} / {currentQuestion.total_questions}
                      </span>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        currentQuestion.assembly_latency_ms < 10 ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {currentQuestion.assembly_latency_ms}ms Assembly
                      </span>
                    </div>
                    <p className="text-ink-900 font-medium">
                      {currentQuestion.question_text}
                    </p>
                  </div>
                )}

                {history.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-ink-700 mb-2">History</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                      {history.slice().reverse().map((h, i) => (
                        <div key={i} className="flex justify-between items-center p-2 text-sm bg-white border border-surface-100 rounded-lg">
                          <span className="text-ink-600 truncate w-2/3">Q{h.question_number}: {h.question_text}</span>
                          <span className="text-ink-400">{h.assembly_latency_ms}ms</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
