'use client';

import React, { useCallback, useRef, useEffect, useState, useMemo } from 'react';
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
  // Atomic selectors
  const brightnessContrast = useFeedbackStore((state) => state.brightnessContrast);
  const blackLevel = useFeedbackStore((state) => state.blackLevel);
  const saturation = useFeedbackStore((state) => state.saturation);
  const lastChangeSource = useFeedbackStore((state) => state.lastChangeSource);

  // Actions - use stable selectors to prevent recreation
  const setBrightnessContrast = useFeedbackStore(useCallback((state) => state.setBrightnessContrast, []));
  const setBlackLevel = useFeedbackStore(useCallback((state) => state.setBlackLevel, []));
  const setSaturation = useFeedbackStore(useCallback((state) => state.setSaturation, []));

  // ----- XY Control: dual-mode control -----
  const [uiBrightnessContrast, setUiBrightnessContrast] = useState(brightnessContrast);
  const brightnessContrastLiveRef = useRef(brightnessContrast);
  const brightnessContrastInteractingRef = useRef(false);

  // ----- Knob Controls: simpler responsive pattern -----
  const [uiBlackLevel, setUiBlackLevel] = useState(blackLevel);
  const [uiSaturation, setUiSaturation] = useState(saturation);

  // Sync controls from store when not interacting
  useEffect(() => {
    if (!brightnessContrastInteractingRef.current) {
      setUiBrightnessContrast(brightnessContrast);
      brightnessContrastLiveRef.current = brightnessContrast;
    }
  }, [brightnessContrast]);

  useEffect(() => {
    setUiBlackLevel(blackLevel);
  }, [blackLevel]);

  useEffect(() => {
    setUiSaturation(saturation);
  }, [saturation]);

  // XY Control: dual-mode pattern
  const handleBrightnessContrastChange = useCallback((value: { x: number; y: number }) => {
    onSend('/feedback/brightness_contrast', value.x, value.y);
    if (brightnessContrastInteractingRef.current) {
      brightnessContrastLiveRef.current = value;
      return;
    }
    setUiBrightnessContrast(value);
    brightnessContrastLiveRef.current = value;
  }, [onSend]);

  const handleBrightnessContrastEnd = useCallback((value: { x: number; y: number }) => {
    brightnessContrastInteractingRef.current = false;
    setUiBrightnessContrast(value);
    setBrightnessContrast(value.x, value.y);
  }, [setBrightnessContrast]);

  // Knob Controls: immediate update pattern (knobs don't support uncontrolled mode)
  const handleBlackLevelChange = useCallback((value: number) => {
    setUiBlackLevel(value);
    setBlackLevel(value);
    onSend('/feedback/black_level', value);
  }, [onSend, setBlackLevel]);

  const handleSaturationChange = useCallback((value: number) => {
    setUiSaturation(value);
    setSaturation(value);
    onSend('/feedback/saturation', value);
  }, [onSend, setSaturation]);

  // Dual-mode control props
  const brightnessContrastControlledProps = !brightnessContrastInteractingRef.current
    ? { value: uiBrightnessContrast }
    : {};


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
          <div
            className="w-full h-full min-h-[400px] aspect-square mx-auto"
            onPointerDownCapture={() => { brightnessContrastInteractingRef.current = true; }}
          >
            <XYControl
              {...brightnessContrastControlledProps}
              onChange={handleBrightnessContrastChange}
              onChangeEnd={handleBrightnessContrastEnd}
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
              value={uiBlackLevel}
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
              value={uiSaturation}
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