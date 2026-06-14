import axios, { AxiosInstance, AxiosError } from 'axios';
import type { BiometricData, AuthResponse, Question, KeystrokeData } from '../types';

interface ApiError {
  message: string;
  code: string;
  status: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiService {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.clearToken();
          localStorage.removeItem('phoenix_session');
          window.location.href = '/';
        }
        return Promise.reject(this.handleError(error));
      }
    );

    // Load token from localStorage on init
    this.loadToken();
  }

  private loadToken(): void {
    const session = localStorage.getItem('phoenix_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        this.token = parsed.token;
      } catch {
        console.error('Failed to parse session');
      }
    }
  }

  private handleError(error: AxiosError): ApiError {
    if (error.response) {
      const data = error.response.data as { message?: string; code?: string };
      return {
        message: data.message || 'An error occurred',
        code: data.code || 'UNKNOWN_ERROR',
        status: error.response.status,
      };
    }
    return {
      message: error.message || 'Network error',
      code: 'NETWORK_ERROR',
      status: 0,
    };
  }

  setToken(token: string): void {
    this.token = token;
  }

  clearToken(): void {
    this.token = null;
  }

  // Authentication endpoint
  async authenticate(biometricData: BiometricData): Promise<AuthResponse> {
    // For demo: mock response if no backend
    if (import.meta.env.VITE_MOCK_API === 'true') {
      await new Promise(resolve => setTimeout(resolve, 1500));
      return {
        token: 'mock_jwt_token_' + Date.now(),
        sessionId: 'session_' + Math.random().toString(36).substring(7),
        expiresAt: Date.now() + 3600000,
      };
    }

    const response = await this.client.post<AuthResponse>('/auth', biometricData);
    return response.data;
  }

  // Fetch question fragment from Edge Agent
  async getQuestion(sessionId: string, questionIndex: number): Promise<Question> {
    if (import.meta.env.VITE_MOCK_API === 'true') {
      await new Promise(resolve => setTimeout(resolve, 300));
      return this.getMockQuestion(questionIndex);
    }

    const response = await this.client.get<Question>(`/questions/${questionIndex}`, {
      headers: { 'X-Session-Id': sessionId },
    });
    return response.data;
  }

  // Submit answer
  async submitAnswer(questionId: string, answer: string, sessionId: string): Promise<void> {
    if (import.meta.env.VITE_MOCK_API === 'true') {
      await new Promise(resolve => setTimeout(resolve, 200));
      return;
    }

    await this.client.post('/answers', { questionId, answer, sessionId });
  }

  // Send keystroke timing data for behavioral fingerprinting
  async sendKeystrokeData(data: KeystrokeData): Promise<void> {
    if (import.meta.env.VITE_MOCK_API === 'true') {
      // Silently succeed in mock mode
      return;
    }

    await this.client.post('/fingerprint/verify', data);
  }

  // Request fragment regeneration
  async requestRegeneration(questionId: string, reason: string): Promise<Question> {
    if (import.meta.env.VITE_MOCK_API === 'true') {
      await new Promise(resolve => setTimeout(resolve, 500));
      return this.getMockQuestion(parseInt(questionId.split('_')[1] || '0'));
    }

    const response = await this.client.post<Question>('/fragments/regenerate', {
      questionId,
      reason,
    });
    return response.data;
  }

  // Mock question generator
  private getMockQuestion(index: number): Question {
    const questions = [
      {
        id: 'q_0',
        text: 'Which cryptographic algorithm is used for asymmetric encryption in PHOENIX?',
        options: ['AES-256', 'RSA-4096', 'ChaCha20', 'Blowfish'],
        correctAnswer: 'RSA-4096',
        fragmentId: 'frag_001',
      },
      {
        id: 'q_1',
        text: 'What is the primary purpose of Shamir Secret Sharing in the PHOENIX system?',
        options: ['Data compression', 'Key distribution', 'Error correction', 'Load balancing'],
        correctAnswer: 'Key distribution',
        fragmentId: 'frag_002',
      },
      {
        id: 'q_2',
        text: 'Which component is responsible for real-time threat detection?',
        options: ['Edge Agent', 'Crypto Service', 'AI Sentinel', 'Storage Node'],
        correctAnswer: 'AI Sentinel',
        fragmentId: 'frag_003',
      },
      {
        id: 'q_3',
        text: 'What happens when a security breach is detected during an exam?',
        options: ['Session continues', 'Fragment regeneration triggered', 'Results discarded', 'System reboots'],
        correctAnswer: 'Fragment regeneration triggered',
        fragmentId: 'frag_004',
      },
      {
        id: 'q_4',
        text: 'Which hashing algorithm is used for fingerprint verification?',
        options: ['MD5', 'SHA-1', 'SHA-256', 'BLAKE3'],
        correctAnswer: 'SHA-256',
        fragmentId: 'frag_005',
      },
    ];
    
    return questions[index % questions.length];
  }
}

export const apiService = new ApiService();
export default apiService;
