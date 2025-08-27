'use client';

import React, { useState } from 'react';
import { useOSC } from '@/hooks/useOSC';
import XYControl from '@/components/XYControl';

export default function Home() {
  const { isConnected, connectionStatus, bridgeInfo, error, connect, disconnect, send } = useOSC();
  const [customMessage, setCustomMessage] = useState('');
  const [customAddress, setCustomAddress] = useState('/hello');

  const sendHello = () => {
    send('/hello', 'world', Date.now());
  };

  const sendCustomMessage = () => {
    if (customAddress && customMessage) {
      send(customAddress, customMessage);
    }
  };

  const sendSliderValue = (value: number) => {
    send('/slider1', value);
  };

  const sendButton = (buttonName: string, state: number) => {
    send(`/button/${buttonName}`, state);
  };

  const sendColor = () => {
    const r = Math.random();
    const g = Math.random();
    const b = Math.random();
    send('/color', r, g, b);
  };

  const sendXYValue = (x: number, y: number) => {
    send('/xy', x, y);
  };

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

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
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

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Quick OSC Messages</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Hello World Button */}
            <button
              onClick={sendHello}
              disabled={!isConnected}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              📨 Send Hello World
            </button>

            {/* Random Color */}
            <button
              onClick={sendColor}
              disabled={!isConnected}
              className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              🌈 Send Random Color
            </button>

            {/* Play Button */}
            <button
              onMouseDown={() => sendButton('play', 1)}
              onMouseUp={() => sendButton('play', 0)}
              onMouseLeave={() => sendButton('play', 0)}
              disabled={!isConnected}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              ▶️ Play (Hold)
            </button>

            {/* Stop Button */}
            <button
              onClick={() => sendButton('stop', 1)}
              disabled={!isConnected}
              className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              ⏹️ Stop
            </button>
          </div>
        </div>

        {/* Slider Control */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Slider Control</h2>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Slider Value (sends to /slider1)
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              disabled={!isConnected}
              onChange={(e) => sendSliderValue(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>

        {/* XY Control */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">XY Control</h2>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Drag the point to send X/Y coordinates to TouchDesigner (sends to /xy)
            </p>
            <div className="flex justify-center">
              <div className="w-80 h-80">
                <XYControl
                  onChange={sendXYValue}
                  disabled={!isConnected}
                  className="border-2 border-gray-200 rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Custom Message */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Custom OSC Message</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OSC Address
              </label>
              <input
                type="text"
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                placeholder="/your/address"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <input
                type="text"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Your message here"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={sendCustomMessage}
              disabled={!isConnected || !customAddress || !customMessage}
              className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Send Custom Message
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
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
        </div>
      </div>
    </div>
  );
}