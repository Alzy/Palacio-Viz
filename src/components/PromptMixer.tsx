'use client';

import React, { useState, useCallback, useEffect } from 'react';
import DebouncedTextInput from './common/DebouncedTextInput';

export interface PromptMixerProps {
  /** Initial left prompt text */
  leftPrompt?: string;
  /** Initial right prompt text */
  rightPrompt?: string;
  /** Initial bias value (0-1, where 0 is fully left, 1 is fully right, 0.5 is center) */
  initialBias?: number;
  /** Callback fired when left prompt changes */
  onLeftPromptChange?: (prompt: string) => void;
  /** Callback fired when right prompt changes */
  onRightPromptChange?: (prompt: string) => void;
  /** Callback fired when bias changes */
  onBiasChange?: (bias: number) => void;
  /** Callback fired when any value changes */
  onChange?: (leftPrompt: string, rightPrompt: string, bias: number) => void;
  /** Placeholder text for left input */
  leftPlaceholder?: string;
  /** Placeholder text for right input */
  rightPlaceholder?: string;
  /** Label for left input */
  leftLabel?: string;
  /** Label for right input */
  rightLabel?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Custom class name */
  className?: string;
  /** Height of the text areas */
  textAreaHeight?: string;
}

export interface PromptMixerValue {
  leftPrompt: string;
  rightPrompt: string;
  bias: number;
}

const PromptMixer: React.FC<PromptMixerProps> = ({
  leftPrompt = '',
  rightPrompt = '',
  initialBias = 0.5,
  onLeftPromptChange,
  onRightPromptChange,
  onBiasChange,
  onChange,
  leftPlaceholder = 'Enter left prompt...',
  rightPlaceholder = 'Enter right prompt...',
  leftLabel = 'Left Prompt',
  rightLabel = 'Right Prompt',
  disabled = false,
  className = '',
  textAreaHeight = 'h-32',
}) => {
  const [leftText, setLeftText] = useState(leftPrompt);
  const [rightText, setRightText] = useState(rightPrompt);
  const [bias, setBias] = useState(initialBias);

  // Sync with prop changes
  useEffect(() => {
    setLeftText(leftPrompt || '');
  }, [leftPrompt]);

  useEffect(() => {
    setRightText(rightPrompt || '');
  }, [rightPrompt]);

  // Handle left prompt changes
  const handleLeftPromptChange = useCallback((value: string) => {
    setLeftText(value);
    onLeftPromptChange?.(value);
    onChange?.(value, rightText, bias);
  }, [rightText, bias, onLeftPromptChange, onChange]);

  // Handle right prompt changes
  const handleRightPromptChange = useCallback((value: string) => {
    setRightText(value);
    onRightPromptChange?.(value);
    onChange?.(leftText, value, bias);
  }, [leftText, bias, onRightPromptChange, onChange]);

  // Handle bias changes
  const handleBiasChange = useCallback((value: number) => {
    setBias(value);
    onBiasChange?.(value);
    onChange?.(leftText, rightText, value);
  }, [leftText, rightText, onBiasChange, onChange]);

  // Get bias percentage for display
  const getBiasPercentage = () => {
    if (bias < 0.5) {
      return `${Math.round((0.5 - bias) * 200)}% Left`;
    } else if (bias > 0.5) {
      return `${Math.round((bias - 0.5) * 200)}% Right`;
    } else {
      return 'Balanced';
    }
  };

  // Get slider background gradient based on bias
  const getSliderBackground = () => {
    return {
      background: `linear-gradient(to right, hsla(220, 80%, 60%, 0.5), hsla(0, 80%, 60%, 0.5))`,
    };
  };

  return (
    <div className={`w-full space-y-4 ${className}`}>
      {/* Prompt Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Prompt */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            {leftLabel}
          </label>
          <DebouncedTextInput
            value={leftText}
            onChange={handleLeftPromptChange}
            placeholder={leftPlaceholder}
            disabled={disabled}
            className={`
              focus:ring-blue-500 focus:border-blue-500
              ${textAreaHeight}
            `}
            multiline={true}
            rows={4}
          />
        </div>

        {/* Right Prompt */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            {rightLabel}
          </label>
          <DebouncedTextInput
            value={rightText}
            onChange={handleRightPromptChange}
            placeholder={rightPlaceholder}
            disabled={disabled}
            className={`
              focus:ring-red-500 focus:border-red-500
              ${textAreaHeight}
            `}
            multiline={true}
            rows={4}
          />
        </div>
      </div>

      {/* Bias Slider Section */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-foreground">
            Prompt Bias
          </label>
          <span className="text-sm font-medium text-muted-foreground">
            {getBiasPercentage()}
          </span>
        </div>
        
        <div className="relative">
          {/* Slider Track with Gradient */}
          <div
            className="absolute inset-0 h-2 top-1.5 rounded-lg border border-border"
            style={getSliderBackground()}
          />
          
          {/* Slider Input */}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={bias}
            onChange={(e) => handleBiasChange(parseFloat(e.target.value))}
            disabled={disabled}
            className={`
              relative w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer
              disabled:cursor-not-allowed
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:h-5
              [&::-webkit-slider-thumb]:w-5
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-white
              [&::-webkit-slider-thumb]:border-2
              [&::-webkit-slider-thumb]:border-border
              [&::-webkit-slider-thumb]:shadow-md
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:transition-all
              [&::-webkit-slider-thumb]:duration-150
              [&::-webkit-slider-thumb]:mt-[-6px]
              hover:[&::-webkit-slider-thumb]:border-ring
              hover:[&::-webkit-slider-thumb]:shadow-lg
              [&::-moz-range-thumb]:h-5
              [&::-moz-range-thumb]:w-5
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-card
              [&::-moz-range-thumb]:border-2
              [&::-moz-range-thumb]:border-border
              [&::-moz-range-thumb]:cursor-pointer
              [&::-moz-range-thumb]:border-none
              [&::-moz-range-track]:bg-transparent
              [&::-moz-range-track]:h-2
            `}
          />
        </div>

        {/* Bias Labels */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full opacity-60"></div>
            <span>Left Bias</span>
          </span>
          <span className="text-muted-foreground/50">Center</span>
          <span className="flex items-center space-x-1">
            <span>Right Bias</span>
            <div className="w-3 h-3 bg-red-500 rounded-full opacity-60"></div>
          </span>
        </div>
      </div>

    </div>
  );
};

export default PromptMixer;