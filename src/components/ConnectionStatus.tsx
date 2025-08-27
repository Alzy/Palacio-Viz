'use client';

import React from 'react';

interface ConnectionStatusProps {
  /** Current connection status */
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'idle';
  /** Whether currently connected */
  isConnected: boolean;
  /** Bridge information */
  bridgeInfo?: {
    message: string;
    touchdesignerHost?: string;
    touchdesignerPort?: number;
  };
  /** Error message if any */
  error?: string;
  /** Connect function */
  onConnect: () => void;
  /** Disconnect function */
  onDisconnect: () => void;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  connectionStatus,
  isConnected,
  bridgeInfo,
  error,
  onConnect,
  onDisconnect,
}) => {
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'disconnected': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'disconnected': return '🔴';
      default: return '⚫';
    }
  };

  const getStatusText = () => {
    if (isConnected && bridgeInfo?.touchdesignerHost) {
      return `Connected to ${bridgeInfo.touchdesignerHost}:${bridgeInfo.touchdesignerPort}`;
    }
    return connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1);
  };

  return (
    <div className="bg-card border-b border-border px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - Status and info */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getStatusIcon()}</span>
            <span className={`font-medium text-sm ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
          
          {error && (
            <span className="text-destructive text-sm">
              Error: {error}
            </span>
          )}
        </div>

        {/* Right side - Connection controls */}
        <div className="flex space-x-2">
          <button
            onClick={onConnect}
            disabled={isConnected}
            className="bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground px-3 py-1 rounded text-sm transition-colors"
          >
            Connect
          </button>
          <button
            onClick={onDisconnect}
            disabled={!isConnected}
            className="bg-destructive hover:bg-destructive/90 disabled:bg-muted text-destructive-foreground px-3 py-1 rounded text-sm transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectionStatus;