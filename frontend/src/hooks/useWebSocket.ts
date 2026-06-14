import { useEffect, useRef, useState, useCallback } from 'react';
import type { WebSocketMessage, ExamHealth } from '../types';

interface UseWebSocketProps {
  sessionId: string | null;
  onMessage: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  health: ExamHealth;
  sendMessage: (message: Partial<WebSocketMessage>) => void;
  simulateRegeneration: (questionId: string) => void;
  simulateLeak: () => void;
}

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';

export function useWebSocket({
  sessionId,
  onMessage,
  onConnect,
  onDisconnect,
}: UseWebSocketProps): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [health, setHealth] = useState<ExamHealth>({
    status: 'red',
    message: 'Disconnected',
    fragmentsValid: false,
    connectionActive: false,
    lastUpdated: Date.now(),
  });
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const healthCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateHealth = useCallback((status: ExamHealth['status'], message: string) => {
    setHealth({
      status,
      message,
      fragmentsValid: status === 'green',
      connectionActive: status !== 'red',
      lastUpdated: Date.now(),
    });
  }, []);

  const connect = useCallback(() => {
    if (!sessionId) return;
    
    try {
      const wsUrl = `${WS_URL}?sessionId=${sessionId}`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('[WebSocket] Connected');
        setIsConnected(true);
        updateHealth('green', 'All systems operational');
        onConnect?.();
        
        // Send connection acknowledgment
        ws.send(JSON.stringify({
          type: 'connected',
          payload: { message: 'Client connected' },
          timestamp: Date.now(),
        }));
      };
      
      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('[WebSocket] Received:', message);
          
          // Handle health updates
          if (message.type === 'health') {
            const rawStatus = message.payload.status || 'healthy';
            // Map WebSocket status values to ExamHealth status
            const statusMap: Record<string, 'green' | 'yellow' | 'red'> = {
              healthy: 'green',
              degraded: 'yellow',
              critical: 'red',
              ping: 'green',
              green: 'green',
              yellow: 'yellow',
              red: 'red',
            };
            const status = statusMap[rawStatus] || 'green';
            const msg = message.payload.message || 'System healthy';
            updateHealth(status, msg);
          }
          
          // Handle regeneration
          if (message.type === 'regenerate') {
            updateHealth('yellow', 'Regenerating fragment...');
          }
          
          onMessage(message);
        } catch (err) {
          console.error('[WebSocket] Failed to parse message:', err);
        }
      };
      
      ws.onclose = () => {
        console.log('[WebSocket] Disconnected');
        setIsConnected(false);
        updateHealth('red', 'Connection lost');
        onDisconnect?.();
        
        // Attempt reconnection
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('[WebSocket] Attempting reconnection...');
          connect();
        }, 5000);
      };
      
      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        updateHealth('red', 'Connection error');
      };
      
      wsRef.current = ws;
    } catch (err) {
      console.error('[WebSocket] Failed to connect:', err);
      updateHealth('red', 'Failed to establish connection');
    }
  }, [sessionId, onConnect, onDisconnect, onMessage, updateHealth]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (healthCheckRef.current) {
      clearInterval(healthCheckRef.current);
      healthCheckRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((message: Partial<WebSocketMessage>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const fullMessage: WebSocketMessage = {
        type: message.type || 'health',
        payload: message.payload || {},
        timestamp: Date.now(),
      };
      wsRef.current.send(JSON.stringify(fullMessage));
    } else {
      console.warn('[WebSocket] Cannot send message - not connected');
    }
  }, []);

  // Development helpers
  const simulateRegeneration = useCallback((questionId: string) => {
    const message: WebSocketMessage = {
      type: 'regenerate',
      payload: { questionId, fragmentId: `frag_${questionId}` },
      timestamp: Date.now(),
    };
    onMessage(message);
    updateHealth('yellow', 'Regenerating fragment...');
  }, [onMessage, updateHealth]);

  const simulateLeak = useCallback(() => {
    const message: WebSocketMessage = {
      type: 'regenerate',
      payload: { 
        questionId: 'current',
        fragmentId: 'frag_current',
        reason: 'security_breach_detected'
      },
      timestamp: Date.now(),
    };
    onMessage(message);
    updateHealth('yellow', 'Security event detected - regenerating...');
  }, [onMessage, updateHealth]);

  // Connect when sessionId is provided
  useEffect(() => {
    if (sessionId) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [sessionId, connect, disconnect]);

  // Health check ping every 30 seconds
  useEffect(() => {
    if (isConnected) {
      healthCheckRef.current = setInterval(() => {
        sendMessage({
          type: 'health',
          payload: { status: 'ping' },
        });
      }, 30000);
    }
    return () => {
      if (healthCheckRef.current) {
        clearInterval(healthCheckRef.current);
      }
    };
  }, [isConnected, sendMessage]);

  return {
    isConnected,
    health,
    sendMessage,
    simulateRegeneration,
    simulateLeak,
  };
}

export default useWebSocket;
