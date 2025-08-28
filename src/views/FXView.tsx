'use client';

import React, { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import XYControl from '@/components/common/XYControl';
import Knob from '@/components/common/Knob';
import {
  ColorPicker,
  ColorPickerSelection,
  ColorPickerHue,
  ColorPickerAlpha
} from '@/components/ui/shadcn-io/color-picker';
import { usePreFXStore, usePostFXStore } from '@/store/fxStore';

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
  const useStore = fxType === 'pre' ? usePreFXStore : usePostFXStore;
  
  // Use atomic selectors to minimize re-renders (following strategy doc)
  const brightnessContrast = useStore((state) => state.brightnessContrast);
  const zoom = useStore((state) => state.zoom);
  const pan = useStore((state) => state.pan);
  const blackLevel = useStore((state) => state.blackLevel);
  const saturation = useStore((state) => state.saturation);
  const tintColor = useStore((state) => state.tintColor);
  const lastChangeSource = useStore((state) => state.lastChangeSource);
  
  // Get store actions
  const setBrightnessContrast = useStore((state) => state.setBrightnessContrast);
  const setZoom = useStore((state) => state.setZoom);
  const setPan = useStore((state) => state.setPan);
  const setBlackLevel = useStore((state) => state.setBlackLevel);
  const setSaturation = useStore((state) => state.setSaturation);
  const setTintColor = useStore((state) => state.setTintColor);

  // Following the transient updates pattern from the strategy document:
  // Use refs to track state without causing re-renders during interaction
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const [colorPickerKey, setColorPickerKey] = useState(0);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUserInteractingRef = useRef(false);
  
  // Subscribe to store changes for external updates (strategy doc pattern)
  useEffect(() => {
    const unsubscribe = useStore.subscribe((state) => {
      // Only update if it was an external change and user is not currently interacting
      if (state.lastChangeSource === 'recall' && !isUserInteractingRef.current) {
        // Force ColorPicker remount for external changes (like presets)
        setColorPickerKey(prev => prev + 1);
      }
    });
    
    return unsubscribe;
  }, [useStore]);

  // Debounced store update function (strategy doc: "Consider Debouncing for Commit or Heavy Work")
  const debouncedStoreUpdate = useCallback((hexColor: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      setTintColor(hexColor, 'user');
      isUserInteractingRef.current = false; // Mark interaction as complete
    }, 300); // 300ms debounce for store updates
  }, [setTintColor]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Immediate onChange handler for responsive UI, debounced store updates
  const handleTintChange = useCallback((rgba: number[]) => {
    const r = Math.round(rgba[0]);
    const g = Math.round(rgba[1]);
    const b = Math.round(rgba[2]);
    const a = rgba[3] ?? 1.0;
    const hexColor = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
    
    // Mark that user is actively interacting
    isUserInteractingRef.current = true;
    
    // Send OSC message immediately for real-time control
    onSend(`/${fxType}/tint`, r / 255, g / 255, b / 255, a);
    
    // Debounce store updates to reduce reactivity issues
    debouncedStoreUpdate(hexColor);
  }, [fxType, onSend, debouncedStoreUpdate]);

  const handleBrightnessContrastChange = useCallback((value: { x: number; y: number }) => {
    setBrightnessContrast(value.x, value.y);
    onSend(`/${fxType}/brightness_contrast`, value.x, value.y);
  }, [fxType, onSend, setBrightnessContrast]);

  const handleZoomChange = useCallback((value: { x: number; y: number }) => {
    setZoom(value.x, value.y);
    onSend(`/${fxType}/zoom`, value.x, value.y);
  }, [fxType, onSend, setZoom]);

  const handlePanChange = useCallback((value: { x: number; y: number }) => {
    setPan(value.x, value.y);
    onSend(`/${fxType}/pan`, value.x, value.y);
  }, [fxType, onSend, setPan]);

  const handleBlackLevelChange = useCallback((value: number) => {
    setBlackLevel(value);
    onSend(`/${fxType}/black_level`, value);
  }, [fxType, onSend, setBlackLevel]);

  const handleSaturationChange = useCallback((value: number) => {
    setSaturation(value);
    onSend(`/${fxType}/saturation`, value);
  }, [fxType, onSend, setSaturation]);

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
                value={brightnessContrast}
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
            <div className="w-full h-full min-h-[200px] p-4" ref={colorPickerRef}>
              <ColorPicker
                key={`tint-${fxType}-${colorPickerKey}`}
                defaultValue={tintColor}
                onChange={handleTintChange as any}
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
      
      {/* Third Row - Zoom and Pan */}
      <div className="flex flex-1 gap-6">
        <div className="flex-1">
          <ControlCard
            title="Zoom Control"
            description={`X: Zoom X, Y: Zoom Y. Sends to /${fxType}/zoom`}
          >
            <div className="w-full h-full min-h-[200px] aspect-square mx-auto">
              <XYControl
                value={zoom}
                onChange={handleZoomChange}
                disabled={!isConnected}
                xTitle="Zoom X"
                yTitle="Zoom Y"
              />
            </div>
          </ControlCard>
        </div>
        <div className="flex-1">
          <ControlCard
            title="Pan Control"
            description={`X: Pan X, Y: Pan Y. Sends to /${fxType}/pan`}
          >
            <div className="w-full h-full min-h-[200px] aspect-square mx-auto">
              <XYControl
                value={pan}
                onChange={handlePanChange}
                disabled={!isConnected}
                xTitle="Pan X"
                yTitle="Pan Y"
              />
            </div>
          </ControlCard>
        </div>
      </div>
    </div>
  );
};

export default FXView;