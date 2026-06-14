export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'critical' | 'offline';
  latencyMs: number;
  lastUpdated: number;
  details?: Record<string, any>;
}

export interface SystemStatus {
  frontend: ServiceHealth;
  edge: ServiceHealth;
  crypto: ServiceHealth;
  aiml: ServiceHealth;
  blockchain: ServiceHealth;
}

export interface Block {
  index: number;
  timestamp: number;
  candidate_id: string;
  fragment_id: string;
  center_id: string;
  previous_hash: string;
  hash: string;
}

export interface BlockchainLog {
  chain: Block[];
  length: number;
}

export interface FragmentData {
  question_id: string;
  fragment_ids: string[];
}

export interface LeakResult {
  status: 'detected' | 'clean' | 'regenerated';
  message: string;
  compromised_hash?: string;
  new_fragment_id?: string;
}

export interface ExamSession {
  session_id: string;
  candidate_id: string;
  total_questions: number;
  message: string;
}

export interface ExamQuestion {
  session_id: string;
  question_number: number;
  total_questions: number;
  question_text: string;
  assembly_latency_ms: number;
}
