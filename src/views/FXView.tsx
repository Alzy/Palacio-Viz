'use client';

import React, { useState, useCallback, useRef } from 'react';
import XYControl from '@/components/common/XYControl';
import Knob from '@/components/common/Knob';
import {
  ColorPicker,
  ColorPickerSelection,
  ColorPickerHue,
  ColorPickerAlpha
} from '@/components/ui/shadcn-io/color-picker';
import {bgWhite} from "next/dist/lib/picocolors";

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
  const [tintColor, setTintColor] = useState('#ff0000'); // Default red for visibility
  
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

  const handleTintChange = useCallback((rgba: any) => {
    // rgba comes as [r, g, b, a] where r,g,b are 0-255 and a is 0-1
    const normalizedRgba = [
      rgba[0] / 255,
      rgba[1] / 255,
      rgba[2] / 255,
      rgba[3] // Alpha is already 0-1
    ];
    
    onSend(`/${fxType}/tint`, ...normalizedRgba);
  }, [fxType, onSend]);

  const ControlCard: React.FC<{ title: string; description: string; children: React.ReactNode; className?: string; }> = ({ title, description, children, className }) => (
    <div className={`bg-card rounded-lg shadow-md p-4 flex flex-col ${className}`}>
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
        <div className="flex-1 h-full">
          <ControlCard
            title="Tint Control"
            description={`Color tinting effect. Sends RGBA floats to /${fxType}/tint`}
            className={`h-full`}
          >
            <div className="w-full h-full min-h-[200px] p-4">
              <ColorPicker
                defaultValue="#ff0000"
                onChange={handleTintChange}
                className="w-full h-full"
              >
                <ColorPickerSelection className={'flex-1'}  />
                <div className="space-y-2">
                  <ColorPickerHue />
                  <div className={`bg-gray-400`}>
                    <ColorPickerAlpha />
                  </div>

                </div>
              </ColorPicker>
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