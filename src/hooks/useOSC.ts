// src/hooks/useOSC.ts
import { useState, useEffect, useRef, useCallback } from 'react';

interface OSCMessage {
  address: string;
  args: any[];
}

interface OSCStatus {
  type: 'status' | 'error';
  message: string;
  touchdesignerHost?: string;
  touchdesignerPort?: number;
}

interface UseOSCOptions {
  bridgeHost?: string;
  bridgePort?: number;
  autoConnect?: boolean;
  reconnectDelay?: number;
}

export const useOSC = (options: UseOSCOptions = {}) => {
  const {
    bridgeHost = 'localhost',
    bridgePort = 8080,
    autoConnect = true,
    reconnectDelay = 3000
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [bridgeInfo, setBridgeInfo] = useState<OSCStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    setError(null);

    const url = `ws://${bridgeHost}:${bridgePort}`;
    console.log(`🔌 Connecting to OSC bridge at ${url}`);

    try {
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        console.log('✅ Connected to OSC bridge');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        setError(null);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'status') {
            setBridgeInfo(data);
            console.log('📋 Bridge info:', data.message);
          }
        } catch (err) {
          console.warn('⚠️  Could not parse bridge message:', event.data);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('🔌 Disconnected from OSC bridge');
        setIsConnected(false);
        setConnectionStatus('disconnected');

        // Attempt reconnection if not a manual close
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`🔄 Reconnection attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError('Max reconnection attempts reached');
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setError('Failed to connect to OSC bridge');
        setConnectionStatus('disconnected');
      };

    } catch (err) {
      console.error('❌ Connection error:', err);
      setError('Failed to create WebSocket connection');
      setConnectionStatus('disconnected');
    }
  }, [bridgeHost, bridgePort, reconnectDelay]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (wsRef.current) {
      wsRef.current.close(1000); // Normal closure
      wsRef.current = null;
    }

    setIsConnected(false);
    setConnectionStatus('disconnected');
    reconnectAttemptsRef.current = 0;
  }, []);

  const send = useCallback((address: string, ...args: any[]) => {
    if (!isConnected || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('⚠️  Cannot send OSC message: not connected');
      return false;
    }

    try {
      const message: OSCMessage = { address, args };
      wsRef.current.send(JSON.stringify(message));
      console.log(`📤 Sent OSC: ${address} ${args.join(' ')}`);
      return true;
    } catch (err) {
      console.error('❌ Failed to send OSC message:', err);
      return false;
    }
  }, [isConnected]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    connectionStatus,
    bridgeInfo,
    error,
    connect,
    disconnect,
    send
  };
};