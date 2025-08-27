'use client';

import React from 'react';
import PromptMixer from '@/components/PromptMixer';

interface PromptViewProps {
  /** Whether the OSC connection is active */
  isConnected: boolean;
  /** Callback to send OSC messages */
  onSend: (address: string, ...args: any[]) => void;
}

const PromptView: React.FC<PromptViewProps> = ({ isConnected, onSend }) => {
  const handlePromptMix = (leftPrompt: string, rightPrompt: string, bias: number) => {
    onSend('/prompt', leftPrompt, rightPrompt, bias);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Prompt Mixer</h2>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Enter prompts on both sides and use the slider to bias between them (sends to /prompt)
          </p>
          <PromptMixer
            onChange={handlePromptMix}
            disabled={!isConnected}
            leftLabel="Left Prompt"
            rightLabel="Right Prompt"
            leftPlaceholder="Enter your left prompt here..."
            rightPlaceholder="Enter your right prompt here..."
          />
        </div>
      </div>
    </div>
  );
};

export default PromptView;