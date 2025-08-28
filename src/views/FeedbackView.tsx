'use client';

import React, { useCallback, useRef, useEffect } from 'react';
import XYControl from '@/components/common/XYControl';
import Knob from '@/components/common/Knob';
import { useFeedbackStore } from '@/store/feedbackStore';

interface FeedbackViewProps {
  /** Whether the OSC connection is active */
  isConnected: boolean;
  /** Callback to send OSC messages */
  onSend: (address: string, ...args: any[]) => void;
}

const FeedbackView: React.FC<FeedbackViewProps> = ({
  isConnected,
  onSend,
}) => {
  const {
    brightnessContrast,
    blackLevel,
    saturation,
    setBrightnessContrast,
    setBlackLevel,
    setSaturation
  } = useFeedbackStore();

  const handleBrightnessContrastChange = useCallback((value: { x: number; y: number }) => {
    setBrightnessContrast(value.x, value.y);
    onSend('/feedback/brightness_contrast', value.x, value.y);
  }, [onSend, setBrightnessContrast]);

  const handleBlackLevelChange = useCallback((value: number) => {
    setBlackLevel(value);
    onSend('/feedback/black_level', value);
  }, [onSend, setBlackLevel]);

  const handleSaturationChange = useCallback((value: number) => {
    setSaturation(value);
    onSend('/feedback/saturation', value);
  }, [onSend, setSaturation]);

  const ControlCard: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
    <div className="bg-card rounded-lg shadow-md p-4 flex flex-col">
      <h3 className="text-lg font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground mb-4 flex-grow">{description}</p>
      {children}
    </div>
  );

  return (
    <div className="flex h-full gap-6">
      {/* Left Column - Brightness & Contrast */}
      <div className="flex-1">
        <ControlCard
          title="Brightness & Contrast"
          description="X: Brightness, Y: Contrast. Sends to /feedback/brightness_contrast"
        >
          <div className="w-full h-full min-h-[400px] aspect-square mx-auto">
            <XYControl
              value={brightnessContrast}
              onChange={handleBrightnessContrastChange}
              disabled={!isConnected}
              xTitle="Brightness"
              yTitle="Contrast"
            />
          </div>
        </ControlCard>
      </div>
      
      {/* Right Column - Stacked Knobs */}
      <div className="flex-1 flex flex-col gap-6">
        <ControlCard
          title="Black Level"
          description="Controls the black point. Sends to /feedback/black_level"
        >
          <div className="w-full h-full flex items-center justify-center">
            <Knob
              value={blackLevel}
              onChange={handleBlackLevelChange}
              min={0}
              max={1}
              step={0.01}
              disabled={!isConnected}
              size={120}
            />
          </div>
        </ControlCard>
        <ControlCard
          title="Saturation"
          description="Controls the color intensity. Sends to /feedback/saturation"
        >
          <div className="w-full h-full flex items-center justify-center">
            <Knob
              value={saturation}
              onChange={handleSaturationChange}
              min={0}
              max={2}
              step={0.01}
              disabled={!isConnected}
              size={120}
            />
          </div>
        </ControlCard>
      </div>
    </div>
  );
};

export default FeedbackView;