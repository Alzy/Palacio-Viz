'use client';

import React, { useState, useCallback, useRef } from 'react';
import XYControl from '@/components/common/XYControl';
import Knob from '@/components/common/Knob';

interface FXViewProps {
  /** Whether the OSC connection is active */
  isConnected: boolean;
  /** Callback to send OSC messages */
  onSend: (address: string, ...args: any[]) => void;
  /** FX type - determines OSC endpoint */
  fxType: 'pre' | 'post';
}

const FXView: React.FC<FXViewProps> = ({
  isConnected,
  onSend,
  fxType,
}) => {
  const [blackLevel, setBlackLevel] = useState(0);
  const [saturation, setSaturation] = useState(1);
  
  // Use refs to avoid re-renders during drag operations
  const blackLevelRef = useRef(blackLevel);
  const saturationRef = useRef(saturation);

  const handleBrightnessContrastChange = useCallback((x: number, y: number) => {
    onSend(`/${fxType}/brightness_contrast`, x, y);
  }, [fxType, onSend]);

  const handleBlackLevelChange = useCallback((value: number) => {
    blackLevelRef.current = value;
    setBlackLevel(value);
    onSend(`/${fxType}/black_level`, value);
  }, [fxType, onSend]);

  const handleSaturationChange = useCallback((value: number) => {
    saturationRef.current = value;
    setSaturation(value);
    onSend(`/${fxType}/saturation`, value);
  }, [fxType, onSend]);

  const ControlCard: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
    <div className="bg-card rounded-lg shadow-md p-4 flex flex-col">
      <h3 className="text-lg font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground mb-4 flex-grow">{description}</p>
      {children}
    </div>
  );

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Top Row */}
      <div className="flex flex-1 gap-6">
        <div className="flex-1">
          <ControlCard
            title="Brightness & Contrast"
            description={`X: Brightness, Y: Contrast. Sends to /${fxType}/brightness_contrast`}
          >
            <div className="w-full h-full min-h-[200px] aspect-square mx-auto">
              <XYControl
                onChange={handleBrightnessContrastChange}
                disabled={!isConnected}
                xTitle="Brightness"
                yTitle="Contrast"
              />
            </div>
          </ControlCard>
        </div>
        <div className="flex-1">
          <ControlCard
            title="Future Control"
            description="This space is reserved for a future feature."
          >
            <div className="flex-grow flex items-center justify-center">
              <p className="text-muted-foreground italic">Coming soon...</p>
            </div>
          </ControlCard>
        </div>
      </div>
      
      {/* Bottom Row */}
      <div className="flex flex-1 gap-6">
        <div className="flex-1">
          <ControlCard
              title="Black Level"
              description={`Controls the black point. Sends to /${fxType}/black_level`}
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
        </div>
        <div className="flex-1">
          <ControlCard
              title="Saturation"
              description={`Controls the color intensity. Sends to /${fxType}/saturation`}
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
    </div>
  );
};

export default FXView;