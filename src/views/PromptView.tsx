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
      <div className="bg-card rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Prompt Mixer</h2>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
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
      <div className="bg-card rounded-lg shadow-md p-6 max-h-[30vh] flex flex-col">
        <PromptHistory
          prompts={promptHistory}
          onSelectLeft={handleSelectLeftFromHistory}
          onSelectRight={handleSelectRightFromHistory}
        />
      </div>

      {/* Seed Travel Speed Control */}
      <div className="bg-card rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Seed Travel Speed</h2>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Control the speed of seed transitions (sends to /seed_travel_speed)
          </p>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-foreground">
                Speed
              </label>
              <span className="text-sm font-medium text-muted-foreground">
                {seedTravelSpeed.toFixed(3)}
              </span>
            </div>
            <div className="relative">
              <div
                className="absolute inset-0 h-2 top-1.5 rounded-lg border border-border bg-muted"
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.001"
                value={seedTravelSpeed}
                onChange={(e) => handleSeedTravelSpeedChange(parseFloat(e.target.value))}
                disabled={!isConnected}
                className={`
                  relative w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer
                  disabled:cursor-not-allowed
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-white
                  [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-border
                  [&::-webkit-slider-thumb]:shadow-md
                  [&::-webkit-slider-thumb]:cursor-grab
                  [&::-webkit-slider-thumb]:transition-all
                  [&::-webkit-slider-thumb]:duration-150
                  [&::-webkit-slider-thumb]:mt-[-6px]
                  hover:[&::-webkit-slider-thumb]:border-ring
                  active:[&::-webkit-slider-thumb]:cursor-grabbing
                  [&::-moz-range-thumb]:appearance-none
                  [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-white
                  [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-border
                  [&::-moz-range-thumb]:cursor-grab
                `}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
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