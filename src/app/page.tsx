'use client';

import React, { useState } from 'react';
import { useOSC } from '@/hooks/useOSC';
import { PromptView, FXView } from '@/views';
import ConnectionStatus from '@/components/ConnectionStatus';

export default function Home() {
  const { isConnected, connectionStatus, bridgeInfo, error, connect, disconnect, send } = useOSC();
  const [activeTab, setActiveTab] = useState('prompt');

  const tabs = [
    { id: 'prompt', label: 'Prompt', component: <PromptView isConnected={isConnected} onSend={send} /> },
    { id: 'prefx', label: 'PreFX', component: <FXView isConnected={isConnected} onSend={send} fxType="pre" /> },
    { id: 'postfx', label: 'PostFX', component: <FXView isConnected={isConnected} onSend={send} fxType="post" /> },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Connection Status Header */}
      <ConnectionStatus
        connectionStatus={connectionStatus}
        isConnected={isConnected}
        bridgeInfo={bridgeInfo || undefined}
        error={error || undefined}
        onConnect={connect}
        onDisconnect={disconnect}
      />

      {/* Tabs - Full remaining height */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content - Takes remaining space */}
        <div className="flex-1 p-6 overflow-auto">
          {tabs.find(tab => tab.id === activeTab)?.component}
        </div>
      </div>
    </div>
  );
}