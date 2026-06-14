import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import type { Question, KeystrokeData, KeyTiming, ExamHealth } from '../types';

interface ExamScreenProps {
  sessionId: string;
  health: ExamHealth;
  regeneratingQuestionId?: string | null;
  onRegenerateComplete?: () => void;
  onRegenerateRequest?: (questionId: string) => void;
}

export function ExamScreen({ sessionId, health, regeneratingQuestionId, onRegenerateComplete, onRegenerateRequest: _onRegenerateRequest }: ExamScreenProps) {
  // Question state
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Timer state
  const [examTime, setExamTime] = useState(0);
  const [questionTime, setQuestionTime] = useState(0);

  // Keystroke tracking
  const keyTimingsRef = useRef<KeyTiming[]>([]);
  const lastKeyTimeRef = useRef<number>(Date.now());
  const keystrokeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch question
  const fetchQuestion = useCallback(async (index: number, isRegeneration = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const question = await apiService.getQuestion(sessionId, index);
      setCurrentQuestion(question);
      setQuestionIndex(index);
      setSelectedAnswer(null);
      setQuestionTime(0);
      keyTimingsRef.current = [];
      
      if (isRegeneration) {
        // Show regeneration notification
        setTimeout(() => {
          setError(null);
        }, 3000);
      }
    } catch (err) {
      setError('Failed to load question. Retrying...');
      // Auto-retry after 2 seconds
      setTimeout(() => fetchQuestion(index), 2000);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Initial load
  useEffect(() => {
    fetchQuestion(0);
  }, [fetchQuestion]);

  // Handle regeneration request from parent
  useEffect(() => {
    if (regeneratingQuestionId && currentQuestion) {
      if (regeneratingQuestionId === currentQuestion.id || regeneratingQuestionId === 'current') {
        fetchQuestion(questionIndex, true).then(() => {
          if (onRegenerateComplete) {
            onRegenerateComplete();
          }
        });
      }
    }
  }, [regeneratingQuestionId, currentQuestion, questionIndex, fetchQuestion, onRegenerateComplete]);

  // Exam timer
  useEffect(() => {
    const interval = setInterval(() => {
      setExamTime(prev => prev + 1);
      setQuestionTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Keystroke tracking
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    const now = Date.now();
    const timeSinceLast = now - lastKeyTimeRef.current;
    
    const timing: KeyTiming = {
      key: event.key,
      timeSinceLast,
      timestamp: now,
    };
    
    keyTimingsRef.current.push(timing);
    lastKeyTimeRef.current = now;
  }, []);

  // Send keystroke data every 10 seconds
  useEffect(() => {
    if (currentQuestion) {
      keystrokeIntervalRef.current = setInterval(async () => {
        if (keyTimingsRef.current.length > 0) {
          const data: KeystrokeData = {
            questionId: currentQuestion.id,
            keyTimings: [...keyTimingsRef.current],
            totalTime: questionTime,
            timestamp: Date.now(),
          };
          
          try {
            await apiService.sendKeystrokeData(data);
            keyTimingsRef.current = []; // Clear after successful send
          } catch (err) {
            console.error('Failed to send keystroke data:', err);
          }
        }
      }, 10000);
    }
    
    return () => {
      if (keystrokeIntervalRef.current) {
        clearInterval(keystrokeIntervalRef.current);
      }
    };
  }, [currentQuestion, questionTime]);

  // Handle answer selection
  const handleAnswerSelect = useCallback((answer: string) => {
    setSelectedAnswer(answer);
  }, []);

  // Submit answer and move to next question
  const handleNext = useCallback(async () => {
    if (!currentQuestion || !selectedAnswer) return;
    
    setIsLoading(true);
    
    try {
      await apiService.submitAnswer(currentQuestion.id, selectedAnswer, sessionId);
      // Move to next question
      await fetchQuestion(questionIndex + 1);
    } catch (err) {
      setError('Failed to submit answer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentQuestion, selectedAnswer, sessionId, questionIndex, fetchQuestion]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get health status color
  const getHealthColor = () => {
    switch (health.status) {
      case 'green': return 'bg-phoenix-success';
      case 'yellow': return 'bg-phoenix-warning';
      case 'red': return 'bg-phoenix-danger';
      default: return 'bg-phoenix-muted';
    }
  };

  if (isLoading && !currentQuestion) {
    return (
      <div className="min-h-screen bg-phoenix-dark flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-phoenix-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-phoenix-text font-mono">Loading question...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-phoenix-dark p-4"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Header with health indicator */}
      <header className="max-w-4xl mx-auto mb-6">
        <div className="bg-phoenix-panel border border-phoenix-border rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full animate-pulse-slow" />
            <div>
              <h1 className="text-phoenix-text font-bold font-mono">SECURE EXAMINATION</h1>
              <p className="text-xs text-phoenix-muted">Session: {sessionId.slice(0, 8)}...</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Health Indicator */}
            <div className="flex items-center gap-2" title={health.message}>
              <div className={`w-3 h-3 rounded-full ${getHealthColor()} ${health.status === 'green' ? 'animate-pulse' : ''}`} />
              <span className="text-xs text-phoenix-muted uppercase">{health.status}</span>
            </div>
            
            {/* Timer */}
            <div className="text-right">
              <div className="text-2xl font-mono font-bold text-phoenix-accent">
                {formatTime(examTime)}
              </div>
              <div className="text-xs text-phoenix-muted">Question: {formatTime(questionTime)}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto">
        {error && (
          <div className="mb-4 p-4 bg-phoenix-danger/10 border border-phoenix-danger/30 rounded-lg flex items-center gap-3">
            <svg className="w-5 h-5 text-phoenix-danger flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-phoenix-danger">{error}</p>
          </div>
        )}

        {currentQuestion && (
          <div className="bg-phoenix-panel border border-phoenix-border rounded-lg p-6 space-y-6">
            {/* Question */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-phoenix-accent">QUESTION {questionIndex + 1}</span>
                <span className="text-xs font-mono text-phoenix-muted">{currentQuestion.fragmentId}</span>
              </div>
              <h2 className="text-lg text-phoenix-text leading-relaxed">{currentQuestion.text}</h2>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(option)}
                  className={`w-full p-4 text-left rounded-lg border transition-all duration-200 flex items-center gap-4 ${
                    selectedAnswer === option
                      ? 'border-phoenix-accent bg-phoenix-accent/10 text-phoenix-accent'
                      : 'border-phoenix-border bg-phoenix-dark text-phoenix-text hover:border-phoenix-accent/50'
                  }`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-mono ${
                    selectedAnswer === option
                      ? 'bg-phoenix-accent text-phoenix-dark'
                      : 'bg-phoenix-border text-phoenix-muted'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="flex-1">{option}</span>
                  {selectedAnswer === option && (
                    <svg className="w-5 h-5 text-phoenix-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            {/* Next Button */}
            <div className="pt-4 border-t border-phoenix-border">
              <button
                onClick={handleNext}
                disabled={!selectedAnswer || isLoading}
                className="w-full py-3 px-4 bg-phoenix-accent text-phoenix-dark font-semibold rounded-lg hover:bg-phoenix-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    <span>Next Question</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ExamScreen;
