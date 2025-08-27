'use client';

import React, { useState, useCallback } from 'react';
import PromptMixer from '@/components/PromptMixer';
import PromptHistory from '@/components/PromptHistory';

interface PromptViewProps {
  /** Whether the OSC connection is active */
  isConnected: boolean;
  /** Callback to send OSC messages */
  onSend: (address: string, ...args: any[]) => void;
}

const PromptView: React.FC<PromptViewProps> = ({ isConnected, onSend }) => {
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [leftPrompt, setLeftPrompt] = useState('');
  const [rightPrompt, setRightPrompt] = useState('');
  const [currentBias, setCurrentBias] = useState(0.5);
  const [seedTravelSpeed, setSeedTravelSpeed] = useState(0.5);

  // Add unique prompt to history
  const addToHistory = useCallback((prompt: string) => {
    if (prompt.trim() && !promptHistory.includes(prompt.trim())) {
      setPromptHistory(prev => [prompt.trim(), ...prev]);
    }
  }, [promptHistory]);

  const handlePromptMix = (leftPrompt: string, rightPrompt: string, bias: number) => {
    setCurrentBias(bias);
    onSend('/prompt', leftPrompt, rightPrompt, bias);
  };

  const handleSeedTravelSpeedChange = (speed: number) => {
    setSeedTravelSpeed(speed);
    onSend('/seed_travel_speed', speed);
  };

  const handleLeftPromptChange = useCallback((prompt: string) => {
    setLeftPrompt(prompt);
    addToHistory(prompt);
  }, [addToHistory]);

  const handleRightPromptChange = useCallback((prompt: string) => {
    setRightPrompt(prompt);
    addToHistory(prompt);
  }, [addToHistory]);

  const handleSelectLeftFromHistory = useCallback((prompt: string) => {
    setLeftPrompt(prompt);
    // Also trigger OSC message with updated prompt, preserving current bias
    handlePromptMix(prompt, rightPrompt, currentBias);
  }, [rightPrompt, currentBias, handlePromptMix]);

  const handleSelectRightFromHistory = useCallback((prompt: string) => {
    setRightPrompt(prompt);
    // Also trigger OSC message with updated prompt, preserving current bias
    handlePromptMix(leftPrompt, prompt, currentBias);
  }, [leftPrompt, currentBias, handlePromptMix]);

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Main Prompt Mixer */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Prompt Mixer</h2>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Enter prompts on both sides and use the slider to bias between them (sends to /prompt)
          </p>
          <PromptMixer
            leftPrompt={leftPrompt}
            rightPrompt={rightPrompt}
            onChange={handlePromptMix}
            onLeftPromptChange={handleLeftPromptChange}
            onRightPromptChange={handleRightPromptChange}
            disabled={!isConnected}
            leftLabel="Left Prompt"
            rightLabel="Right Prompt"
            leftPlaceholder="Enter your left prompt here..."
            rightPlaceholder="Enter your right prompt here..."
          />
        </div>
      </div>

      {/* Prompt History */}
      <div className="flex-1 bg-white rounded-lg shadow-md p-6">
        <PromptHistory
          prompts={promptHistory}
          onSelectLeft={handleSelectLeftFromHistory}
          onSelectRight={handleSelectRightFromHistory}
        />
      </div>

      {/* Seed Travel Speed Control */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Seed Travel Speed</h2>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Control the speed of seed transitions (sends to /seed_travel_speed)
          </p>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700">
                Speed
              </label>
              <span className="text-sm font-medium text-gray-600">
                {seedTravelSpeed.toFixed(3)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.001"
              value={seedTravelSpeed}
              onChange={(e) => handleSeedTravelSpeedChange(parseFloat(e.target.value))}
              disabled={!isConnected}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Slow</span>
              <span>Fast</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptView;