import { useState, useCallback, useEffect } from 'react';
import { Login } from './components/Login';
import { ExamScreen } from './components/ExamScreen';
import { useWebSocket } from './hooks/useWebSocket';
import { apiService } from './services/api';
import type { WebSocketMessage, ExamStatus } from './types';
import './index.css';

function App() {
  const [examStatus, setExamStatus] = useState<ExamStatus>('idle');
  const [token, setToken] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [regeneratingQuestionId, setRegeneratingQuestionId] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const session = localStorage.getItem('phoenix_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.expiresAt > Date.now()) {
          setToken(parsed.token);
          setSessionId(parsed.sessionId);
          apiService.setToken(parsed.token);
          setExamStatus('authenticated');
        } else {
          // Session expired, clear it
          localStorage.removeItem('phoenix_session');
        }
      } catch (err) {
        console.error('Failed to parse session:', err);
        localStorage.removeItem('phoenix_session');
      }
    }
  }, []);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'regenerate':
        if (message.payload.questionId) {
          setRegeneratingQuestionId(message.payload.questionId);
          setExamStatus('regenerating');
        }
        break;
      case 'health':
        // Health status is handled by the hook
        break;
      case 'error':
        setExamStatus('error');
        break;
      default:
        break;
    }
  }, []);

  // Initialize WebSocket connection
  const { 
    isConnected, 
    health, 
    simulateRegeneration, 
    simulateLeak 
  } = useWebSocket({
    sessionId,
    onMessage: handleWebSocketMessage,
    onConnect: () => {
      if (examStatus === 'connecting') {
        setExamStatus('active');
      }
    },
    onDisconnect: () => {
      // Optionally handle disconnect
    },
  });

  // Handle successful authentication
  const handleAuthenticated = useCallback((newToken: string, newSessionId: string) => {
    setToken(newToken);
    setSessionId(newSessionId);
    setExamStatus('connecting');
  }, []);

  // Handle regeneration completion
  const handleRegenerateComplete = useCallback(() => {
    setRegeneratingQuestionId(null);
    setExamStatus('active');
  }, []);

  // Handle logout
  const handleLogout = useCallback(() => {
    setToken(null);
    setSessionId(null);
    setExamStatus('idle');
    apiService.clearToken();
    localStorage.removeItem('phoenix_session');
  }, []);

  return (
    <div className="min-h-screen bg-phoenix-dark">
      {/* Dev Controls - Only visible in development */}
      {import.meta.env.DEV && examStatus === 'active' && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          <div className="bg-phoenix-panel border border-phoenix-border rounded-lg p-3 shadow-lg">
            <p className="text-xs text-phoenix-muted mb-2 font-mono uppercase">Dev Controls</p>
            <div className="flex gap-2">
              <button
                onClick={() => simulateRegeneration('current')}
                className="px-3 py-1.5 bg-phoenix-warning/20 text-phoenix-warning text-xs rounded hover:bg-phoenix-warning/30 transition-colors"
              >
                Regenerate
              </button>
              <button
                onClick={simulateLeak}
                className="px-3 py-1.5 bg-phoenix-danger/20 text-phoenix-danger text-xs rounded hover:bg-phoenix-danger/30 transition-colors"
              >
                Simulate Leak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      {examStatus !== 'idle' && (
        <div className="fixed top-0 left-0 right-0 z-40">
          <div className="bg-phoenix-panel/95 backdrop-blur border-b border-phoenix-border">
            <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-phoenix-success animate-pulse' : 'bg-phoenix-danger'
                  }`} />
                  <span className="text-xs text-phoenix-muted font-mono">
                    {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
                  </span>
                </div>
                {sessionId && (
                  <span className="text-xs text-phoenix-muted font-mono">
                    SESSION: {sessionId.slice(0, 8).toUpperCase()}...
                  </span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-phoenix-muted hover:text-phoenix-danger transition-colors flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={examStatus !== 'idle' ? 'pt-14' : ''}>
        {examStatus === 'idle' || examStatus === 'authenticated' ? (
          <Login onAuthenticated={handleAuthenticated} />
        ) : (
          sessionId && (
            <ExamScreen
              sessionId={sessionId}
              health={health}
              regeneratingQuestionId={regeneratingQuestionId}
              onRegenerateComplete={handleRegenerateComplete}
            />
          )
        )}
      </main>
    </div>
  );
}

export default App;
