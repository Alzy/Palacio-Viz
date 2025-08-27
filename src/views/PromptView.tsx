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

      {/* Prompt History Below */}
      <div className="flex-1 bg-white rounded-lg shadow-md p-6">
        <PromptHistory
          prompts={promptHistory}
          onSelectLeft={handleSelectLeftFromHistory}
          onSelectRight={handleSelectRightFromHistory}
        />
      </div>
    </div>
  );
};

export default PromptView;