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

type RGBA = { r: number; g: number; b: number; a: number };

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const toHex2 = (n: number) => n.toString(16).padStart(2, '0');
const rgbaToHex = ({ r, g, b }: RGBA) => `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`;
const hexToRgba = (hex?: string): RGBA => {
  if (!hex || !/^#([0-9a-f]{6})$/i.test(hex)) return { r: 255, g: 0, b: 0, a: 1 };
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
    a: 1,
  };
};
const colorEq = (a: RGBA, b: RGBA) =>
  a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a;

interface FXViewProps {
  /** Whether the OSC connection is active */
  isConnected: boolean;
  /** Callback to send OSC messages */
  onSend?: (address: string, ...args: any[]) => void;
  /** FX type - determines OSC endpoint */
  fxType: 'pre' | 'post';
}

const FXView: React.FC<FXViewProps> = ({
  isConnected,
  onSend,
  fxType,
}) => {
  const useStore = fxType === 'pre' ? usePreFXStore : usePostFXStore;

  // Atomic selectors (same as your file)
  const brightnessContrast = useStore((state) => state.brightnessContrast);
  const zoom = useStore((state) => state.zoom);
  const pan = useStore((state) => state.pan);
  const blackLevel = useStore((state) => state.blackLevel);
  const saturation = useStore((state) => state.saturation);
  const tintColor = useStore((state) => state.tintColor);
  const lastChangeSource = useStore((state) => state.lastChangeSource);

  // Actions
  const setBrightnessContrast = useStore((state) => state.setBrightnessContrast);
  const setZoom = useStore((state) => state.setZoom);
  const setPan = useStore((state) => state.setPan);
  const setBlackLevel = useStore((state) => state.setBlackLevel);
  const setSaturation = useStore((state) => state.setSaturation);
  const setTintColor = useStore((state) => state.setTintColor);

  // ----- Tint color: dual-mode control -----
  const storeRGBA = useMemo(() => hexToRgba(tintColor), [tintColor]);
  const [uiColor, setUiColor] = useState<RGBA>(storeRGBA);
  const liveRef = useRef<RGBA>(storeRGBA);      // latest live color during drag (no re-render)
  const interactingRef = useRef(false);         // true while dragging
  const ignoreNextOnChangeRef = useRef(false);  // guard when controlled to avoid echo loops

  // If your store uses a 'recall' flag to remount the picker, keep your key
  const tintKeyRef = useRef(0);
  useEffect(() => {
    if (lastChangeSource === 'recall') tintKeyRef.current += 1;
  }, [lastChangeSource]);

  // Store -> Local sync ONLY when not dragging (prevents loops)
  useEffect(() => {
    if (interactingRef.current) return;
    const next = storeRGBA;
    if (!colorEq(next, uiColor)) {
      ignoreNextOnChangeRef.current = true; // silence one echo from controlled picker
      setUiColor(next);
      liveRef.current = next;
      setTimeout(() => { ignoreNextOnChangeRef.current = false; }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeRGBA]);

  // Single commit to store (and one optional OSC send) on release
  const commitTint = useCallback((c: RGBA) => {
    const hex = rgbaToHex(c);
    // match your action signature if it accepts a source:
    try {
      // @ts-ignore - support (hex, 'user') signature if present
      setTintColor(hex, 'user');
    } catch {
      setTintColor(hex as any);
    }
    if (isConnected && onSend) onSend(`/${fxType}/tint`, c.r / 255, c.g / 255, c.b / 255, clamp01(c.a));
  }, [fxType, isConnected, onSend, setTintColor]);

  // Picker change:
  //  - while dragging: update only ref (no setState → no re-render → pointer stays)
  //  - not dragging: controlled path with guard to avoid echo loops
  const handleTintChange = useCallback((rgba: number[]) => {
    const [r, g, b, a] = rgba;
    const next: RGBA = { r: Math.round(r), g: Math.round(g), b: Math.round(b), a: clamp01(a) };
    if (onSend) onSend(`/${fxType}/tint`, r / 255, g / 255, b / 255, a);

    if (interactingRef.current) {
      liveRef.current = next;
      return;
    }
    if (ignoreNextOnChangeRef.current) return;
    setUiColor(prev => (colorEq(prev, next) ? prev : next));
    liveRef.current = next;
  }, []);

  // Other controls (keep your immediate send behavior + styling)
  const handleBrightnessContrastChange = useCallback((value: { x: number; y: number }) => {
    setBrightnessContrast(value.x, value.y);
    onSend?.(`/${fxType}/brightness_contrast`, value.x, value.y);
  }, [fxType, onSend, setBrightnessContrast]);

  const handleZoomChange = useCallback((value: { x: number; y: number }) => {
    setZoom(value.x, value.y);
    onSend?.(`/${fxType}/zoom`, value.x, value.y);
  }, [fxType, onSend, setZoom]);

  const handlePanChange = useCallback((value: { x: number; y: number }) => {
    setPan(value.x, value.y);
    onSend?.(`/${fxType}/pan`, value.x, value.y);
  }, [fxType, onSend, setPan]);

  const handleBlackLevelChange = useCallback((value: number) => {
    setBlackLevel(value);
    onSend?.(`/${fxType}/black_level`, value);
  }, [fxType, onSend, setBlackLevel]);

  const handleSaturationChange = useCallback((value: number) => {
    setSaturation(value);
    onSend?.(`/${fxType}/saturation`, value);
  }, [fxType, onSend, setSaturation]);

  const ControlCard: React.FC<{ title: string; description: string; children: React.ReactNode; className?: string; }> = ({ title, description, children, className }) => (
    <div className={`bg-card rounded-lg shadow-md p-4 flex flex-col ${className}`}>
      <h3 className="text-lg font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground mb-4 flex-grow">{description}</p>
      {children}
    </div>
  );

  // Dual-mode control for the picker:
  //  - Not dragging: controlled with value={rgbaToHex(uiColor)}
  //  - Dragging:     uncontrolled (omit 'value'), keeps pointer capture
  const pickerControlledProps = !interactingRef.current
    ? { value: rgbaToHex(uiColor) }
    : {};

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
            description={`Color tinting effect. Commit on release → /${fxType}/tint`}
            className="h-full"
          >
            <div
              className="w-full h-full min-h-[200px] p-4"
              onPointerDownCapture={() => { interactingRef.current = true; }}
              onPointerUpCapture={() => {
                interactingRef.current = false;
                setUiColor(liveRef.current);     // sync UI once
                commitTint(liveRef.current);      // single store/OSC commit
              }}
              onPointerCancelCapture={() => {
                interactingRef.current = false;
                setUiColor(liveRef.current);
                commitTint(liveRef.current);
              }}
            >
              <ColorPicker
                key={`tint-${fxType}-${tintKeyRef.current}`}
                {...pickerControlledProps}
                // NOTE: during drag we omit 'value', so this becomes uncontrolled and smooth
                onChange={handleTintChange as any}  // [r,g,b,a]
                className="w-full h-full"
              >
                <ColorPickerSelection className="flex-1" />
                <div className="space-y-2">
                  <ColorPickerHue />
                  <div className="bg-gray-400">
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
