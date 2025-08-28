'use client';

import React, { useState, useCallback, useEffect } from 'react';
import PromptMixer from '@/components/PromptMixer';
import PromptHistory from '@/components/PromptHistory';
import { usePromptStore } from '@/store/promptStore';

interface PromptViewProps {
  /** Whether the OSC connection is active */
  isConnected: boolean;
  /** Callback to send OSC messages */
  onSend: (address: string, ...args: any[]) => void;
}

const STORAGE_KEY = 'prompt-history';

const PromptView: React.FC<PromptViewProps> = ({ isConnected, onSend }) => {
  const {
    leftPrompt,
    rightPrompt,
    currentBias,
    seedTravelSpeed,
    setLeftPrompt,
    setRightPrompt,
    setBias,
    setSeedTravelSpeed,
    setPrompts
  } = usePromptStore();
  
  const [promptHistory, setPromptHistory] = useState<string[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setPromptHistory(parsed);
      }
    } catch (error) {
      console.error('Failed to load prompt history:', error);
    }
  }, []);

  // Save history to localStorage whenever it changes
  const saveToStorage = useCallback((history: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save prompt history:', error);
    }
  }, []);

  // Add unique prompt to history
  const addToHistory = useCallback((prompt: string) => {
    if (prompt.trim() && !promptHistory.includes(prompt.trim())) {
      const newHistory = [prompt.trim(), ...promptHistory];
      setPromptHistory(newHistory);
      saveToStorage(newHistory);
    }
  }, [promptHistory, saveToStorage]);

  const handlePromptMix = useCallback((leftPrompt: string, rightPrompt: string, bias: number) => {
    setPrompts(leftPrompt, rightPrompt, bias);
    onSend('/prompt', leftPrompt, rightPrompt, bias);
  }, [setPrompts, onSend]);

  const handleSeedTravelSpeedChange = useCallback((speed: number) => {
    setSeedTravelSpeed(speed);
    onSend('/seed_travel_speed', speed);
  }, [setSeedTravelSpeed, onSend]);

  const handleLeftPromptChange = useCallback((prompt: string) => {
    setLeftPrompt(prompt);
    addToHistory(prompt);
  }, [setLeftPrompt, addToHistory]);

  const handleRightPromptChange = useCallback((prompt: string) => {
    setRightPrompt(prompt);
    addToHistory(prompt);
  }, [setRightPrompt, addToHistory]);

  const handleSelectLeftFromHistory = useCallback((prompt: string) => {
    setLeftPrompt(prompt);
    // Also trigger OSC message with updated prompt, preserving current bias
    handlePromptMix(prompt, rightPrompt, currentBias);
  }, [setLeftPrompt, rightPrompt, currentBias, handlePromptMix]);

  const handleSelectRightFromHistory = useCallback((prompt: string) => {
    setRightPrompt(prompt);
    // Also trigger OSC message with updated prompt, preserving current bias
    handlePromptMix(leftPrompt, prompt, currentBias);
  }, [setRightPrompt, leftPrompt, currentBias, handlePromptMix]);

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