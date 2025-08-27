'use client';

import React, { useState } from 'react';
import { useOSC } from '@/hooks/useOSC';
import { PromptView, FXView, FeedbackView } from '@/views';
import ConnectionStatus from '@/components/ConnectionStatus';

export default function Home() {
  const { isConnected, connectionStatus, bridgeInfo, error, connect, disconnect, send } = useOSC();
  const [activeTab, setActiveTab] = useState('prompt');

  const tabs = [
    { id: 'prompt', label: 'Prompt', component: <PromptView isConnected={isConnected} onSend={send} /> },
    { id: 'prefx', label: 'PreFX', component: <FXView isConnected={isConnected} onSend={send} fxType="pre" /> },
    { id: 'postfx', label: 'PostFX', component: <FXView isConnected={isConnected} onSend={send} fxType="post" /> },
    { id: 'feedback', label: 'Feedback', component: <FeedbackView isConnected={isConnected} onSend={send} /> },
  ];

  return (
    <div className="h-screen flex flex-col bg-background">
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
      <div className="flex-1 flex flex-col">
        {/* Tab Navigation */}
        <div className="border-b border-border bg-card">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
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