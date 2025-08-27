'use client';

import React, { useState } from 'react';
import { useOSC } from '@/hooks/useOSC';
import { PromptView, FXView } from '@/views';

export default function Home() {
  const { isConnected, connectionStatus, bridgeInfo, error, connect, disconnect, send } = useOSC();
  const [activeTab, setActiveTab] = useState('prompt');

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

  const tabs = [
    { id: 'prompt', label: 'Prompt', component: <PromptView isConnected={isConnected} onSend={send} /> },
    { id: 'prefx', label: 'PreFX', component: <FXView isConnected={isConnected} onSend={send} fxType="pre" /> },
    { id: 'postfx', label: 'PostFX', component: <FXView isConnected={isConnected} onSend={send} fxType="post" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            OSC TouchDesigner Remote
          </h1>
          <p className="text-gray-600">
            Send OSC messages to TouchDesigner via WebSocket-to-UDP bridge
          </p>
        </div>

        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl">{getStatusIcon()}</span>
            <span className={`font-semibold capitalize ${getStatusColor()}`}>
              {connectionStatus}
            </span>
          </div>

          {bridgeInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-blue-800 text-sm">
                <strong>Bridge:</strong> {bridgeInfo.message}
              </p>
              {bridgeInfo.touchdesignerHost && (
                <p className="text-blue-700 text-sm">
                  <strong>TouchDesigner:</strong> {bridgeInfo.touchdesignerHost}:{bridgeInfo.touchdesignerPort}
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-800 text-sm">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={connect}
              disabled={isConnected}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Connect
            </button>
            <button
              onClick={disconnect}
              disabled={!isConnected}
              className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6">
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

          {/* Tab Content */}
          <div className="p-6">
            {tabs.find(tab => tab.id === activeTab)?.component}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            📋 TouchDesigner Setup
          </h3>
          <ol className="list-decimal list-inside text-yellow-700 space-y-1 text-sm">
            <li>Open TouchDesigner</li>
            <li>Add an <strong>OSC In CHOP</strong></li>
            <li>Set the port to <strong>7000</strong></li>
            <li>Set Active to <strong>On</strong></li>
            <li>Make sure the bridge server is running: <code>node bridge.js</code></li>
            <li>Click Connect above and start sending messages!</li>
          </ol>
          <div className="mt-4 text-sm text-yellow-700">
            <p><strong>OSC Endpoints:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><code>/prompt</code> - Prompt mixer (leftPrompt, rightPrompt, bias)</li>
              <li><code>/prefx</code> - PreFX XY control (x, y)</li>
              <li><code>/postfx</code> - PostFX XY control (x, y)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}