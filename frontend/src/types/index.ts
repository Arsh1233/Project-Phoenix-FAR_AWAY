export interface BiometricData {
  faceImage: string | null;
  fingerprintHash: string;
  timestamp: number;
}

export interface AuthResponse {
  token: string;
  sessionId: string;
  expiresAt: number;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer?: string;
  fragmentId: string;
}

export interface KeystrokeData {
  questionId: string;
  keyTimings: KeyTiming[];
  totalTime: number;
  timestamp: number;
}

export interface KeyTiming {
  key: string;
  timeSinceLast: number;
  timestamp: number;
}

export interface WebSocketMessage {
  type: 'regenerate' | 'health' | 'error' | 'connected';
  payload: {
    questionId?: string;
    fragmentId?: string;
    status?: 'healthy' | 'degraded' | 'critical' | 'ping';
    message?: string;
    reason?: string;
  };
  timestamp: number;
}

export type ExamStatus = 'idle' | 'connecting' | 'authenticated' | 'loading' | 'active' | 'regenerating' | 'error';

export interface ExamHealth {
  status: 'green' | 'yellow' | 'red';
  message: string;
  fragmentsValid: boolean;
  connectionActive: boolean;
  lastUpdated: number;
}
