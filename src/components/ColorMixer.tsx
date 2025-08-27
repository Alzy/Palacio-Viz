'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import {
  ColorPicker,
  ColorPickerSelection,
  ColorPickerHue,
  ColorPickerAlpha
} from '@/components/ui/shadcn-io/color-picker';
import { useLightsStore } from '@/store/lightsStore';

interface ColorMixerProps {
  /** Callback when colors change (for OSC messaging) */
  onChange: (leftColor: string, rightColor: string) => void;
  /** Whether the controls are disabled */
  disabled?: boolean;
  /** Label for left color picker */
  leftLabel?: string;
  /** Label for right color picker */
  rightLabel?: string;
}

const ColorMixer: React.FC<ColorMixerProps> = ({
  onChange,
  disabled = false,
  leftLabel = "Left Color",
  rightLabel = "Right Color",
}) => {
  const { leftColor, rightColor, setColors, lastChangeSource } = useLightsStore();
  
  // Use keys to force ColorPicker re-render when colors are recalled
  const leftKeyRef = useRef(0);
  const rightKeyRef = useRef(0);

  // Update keys when colors change from recalls
  useEffect(() => {
    if (lastChangeSource === 'recall') {
      leftKeyRef.current += 1;
      rightKeyRef.current += 1;
    }
  }, [leftColor, rightColor, lastChangeSource]);

  const handleLeftColorChange = useCallback((rgba: any) => {
    // Convert RGBA array to hex color
    const r = Math.round(rgba[0]);
    const g = Math.round(rgba[1]);
    const b = Math.round(rgba[2]);
    const hexColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    
    // Update store and signal change to parent for OSC
    setColors(hexColor, rightColor, 'user');
    onChange(hexColor, rightColor);
  }, [rightColor, onChange, setColors]);

  const handleRightColorChange = useCallback((rgba: any) => {
    // Convert RGBA array to hex color
    const r = Math.round(rgba[0]);
    const g = Math.round(rgba[1]);
    const b = Math.round(rgba[2]);
    const hexColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    
    // Update store and signal change to parent for OSC
    setColors(leftColor, hexColor, 'user');
    onChange(leftColor, hexColor);
  }, [leftColor, onChange, setColors]);
  return (
    <div className="space-y-6">
      {/* Color Pickers Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Color Picker */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">
              {leftLabel}
            </label>
            <div 
              className="w-8 h-8 rounded border border-border shadow-sm"
              style={{ backgroundColor: leftColor }}
            />
          </div>
          <div className="h-[200px]">
            <ColorPicker
              key={`left-${leftKeyRef.current}`}
              defaultValue={leftColor}
              onChange={handleLeftColorChange}
              className="h-full"
            >
              <div className="space-y-3 h-full flex flex-col">
                <div className="flex-1 min-h-[120px] w-full">
                  <ColorPickerSelection className="w-full h-full" />
                </div>
                <div className="space-y-2">
                  <ColorPickerHue />
                  {/* Alpha locked to 1.0, so we don't include ColorPickerAlpha */}
                </div>
              </div>
            </ColorPicker>
          </div>
        </div>

        {/* Right Color Picker */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">
              {rightLabel}
            </label>
            <div 
              className="w-8 h-8 rounded border border-border shadow-sm"
              style={{ backgroundColor: rightColor }}
            />
          </div>
          <div className="h-[200px]">
            <ColorPicker
              key={`right-${rightKeyRef.current}`}
              defaultValue={rightColor}
              onChange={handleRightColorChange}
              className="h-full"
            >
              <div className="space-y-3 h-full flex flex-col">
                <div className="flex-1 min-h-[120px] w-full">
                  <ColorPickerSelection className="w-full h-full" />
                </div>
                <div className="space-y-2">
                  <ColorPickerHue />
                  {/* Alpha locked to 1.0, so we don't include ColorPickerAlpha */}
                </div>
              </div>
            </ColorPicker>
          </div>
        </div>
      </div>

      {/* Color Values Display */}
      <div className="grid grid-cols-2 gap-6">
        <div className="text-center">
          <div className="text-xs text-muted-foreground">
            {leftLabel}: {leftColor}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground">
            {rightLabel}: {rightColor}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorMixer;