import axios from 'axios';
import type { 
  SystemStatus, 
  BlockchainLog, 
  LeakResult, 
  ExamSession, 
  ExamQuestion 
} from '../types';

// API Base URLs for local development
const EDGE_URL = import.meta.env.VITE_EDGE_URL || 'http://localhost:5000';
const CRYPTO_URL = import.meta.env.VITE_CRYPTO_URL || 'http://localhost:8080';
const AIML_URL = import.meta.env.VITE_AIML_URL || 'http://localhost:8001';
const BLOCKCHAIN_URL = import.meta.env.VITE_BLOCKCHAIN_URL || 'http://localhost:8000';

class ApiService {
  
  // --- Health Checks ---
  async checkHealth(): Promise<SystemStatus> {
    const status: SystemStatus = {
      frontend: { status: 'healthy', latencyMs: 0, lastUpdated: Date.now() },
      edge: { status: 'offline', latencyMs: 0, lastUpdated: Date.now() },
      crypto: { status: 'offline', latencyMs: 0, lastUpdated: Date.now() },
      aiml: { status: 'offline', latencyMs: 0, lastUpdated: Date.now() },
      blockchain: { status: 'offline', latencyMs: 0, lastUpdated: Date.now() }
    };

    const checkService = async (url: string, key: keyof SystemStatus, path: string = '/health') => {
      const start = performance.now();
      try {
        const res = await axios.get(`${url}${path}`, { timeout: 3000 });
        status[key] = {
          status: 'healthy',
          latencyMs: Math.round(performance.now() - start),
          lastUpdated: Date.now(),
          details: res.data
        };
      } catch (e) {
        status[key] = {
          status: 'offline',
          latencyMs: 0,
          lastUpdated: Date.now()
        };
      }
    };

    await Promise.all([
      checkService(EDGE_URL, 'edge', '/health'),
      checkService(CRYPTO_URL, 'crypto', '/health'),
      // AIML doesn't have a direct health endpoint in main_ai.py, checking docs instead
      checkService(AIML_URL, 'aiml', '/docs'), 
      checkService(BLOCKCHAIN_URL, 'blockchain', '/logs') // Checking logs acts as health check
    ]);

    return status;
  }

  // --- Exam Simulator (Edge) ---
  async startExamSession(candidateId: string, n: number = 5, k: number = 3): Promise<ExamSession> {
    const res = await axios.post(`${EDGE_URL}/exam/start`, {
      candidate_id: candidateId,
      n,
      k
    });
    return res.data;
  }

  async getNextQuestion(sessionId: string): Promise<ExamQuestion> {
    const res = await axios.post(`${EDGE_URL}/exam/next`, { session_id: sessionId });
    return res.data;
  }

  async getEdgeCacheStats(): Promise<any> {
    const res = await axios.get(`${EDGE_URL}/cache/stats`);
    return res.data;
  }

  async clearEdgeCache(): Promise<{cleared: number}> {
    const res = await axios.post(`${EDGE_URL}/cache/clear`);
    return res.data;
  }

  // --- Crypto Lab (Crypto) ---
  async generateFragments(questions: string[], n: number = 5, k: number = 3): Promise<Record<string, string[]>> {
    const res = await axios.post(`${CRYPTO_URL}/fragment/generate`, {
      questions,
      n,
      k,
      t0: 0
    });
    return res.data.question_fragments;
  }

  async assembleFragments(questionId: string, fragmentIds: string[]): Promise<{question_text: string}> {
    const res = await axios.post(`${CRYPTO_URL}/fragment/assemble`, {
      question_id: questionId,
      fragment_ids: fragmentIds
    });
    return res.data;
  }

  // --- Leak Simulation (Edge -> AIML) ---
  async triggerLeakSimulation(fragmentId: string, questionId: string): Promise<LeakResult> {
    // We hit the Edge agent's callback endpoint directly to simulate a Dark Web leak detection
    const res = await axios.post(`${EDGE_URL}/callback/leak`, {
      fragment_id: fragmentId,
      question_id: questionId,
      compromised_hash: 'simulated_leak_' + Date.now().toString(16)
    });
    return res.data;
  }

  // --- Blockchain Audit Trail ---
  async getBlockchainLogs(): Promise<BlockchainLog> {
    const res = await axios.get(`${BLOCKCHAIN_URL}/logs`);
    return res.data;
  }

  async verifyBlockchain(): Promise<{status: string, message: string}> {
    const res = await axios.get(`${BLOCKCHAIN_URL}/logs/verify`);
    return res.data;
  }
}

export const apiService = new ApiService();
export default apiService;
