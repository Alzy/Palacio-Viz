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
  // Stabilize store reference to prevent callback recreation
  const useStore = useMemo(() => fxType === 'pre' ? usePreFXStore : usePostFXStore, [fxType]);

  // Atomic selectors (same as your file)
  const brightnessContrast = useStore((state) => state.brightnessContrast);
  const zoom = useStore((state) => state.zoom);
  const pan = useStore((state) => state.pan);
  const blackLevel = useStore((state) => state.blackLevel);
  const saturation = useStore((state) => state.saturation);
  const tintColor = useStore((state) => state.tintColor);
  const lastChangeSource = useStore((state) => state.lastChangeSource);

  // Actions - use stable selectors to prevent recreation
  const setBrightnessContrast = useStore(useCallback((state) => state.setBrightnessContrast, []));
  const setZoom = useStore(useCallback((state) => state.setZoom, []));
  const setPan = useStore(useCallback((state) => state.setPan, []));
  const setBlackLevel = useStore(useCallback((state) => state.setBlackLevel, []));
  const setSaturation = useStore(useCallback((state) => state.setSaturation, []));
  const setTintColor = useStore(useCallback((state) => state.setTintColor, []));

  // ----- Tint color: dual-mode control -----
  const storeRGBA = useMemo(() => tintColor, [tintColor]);
  const [uiColor, setUiColor] = useState<RGBA>(storeRGBA);
  const liveRef = useRef<RGBA>(storeRGBA);      // latest live color during drag (no re-render)
  const interactingRef = useRef(false);         // true while dragging
  const ignoreNextOnChangeRef = useRef(false);  // guard when controlled to avoid echo loops

  // ----- XY Controls: dual-mode controls -----
  // Brightness/Contrast
  const [uiBrightnessContrast, setUiBrightnessContrast] = useState(brightnessContrast);
  const brightnessContrastLiveRef = useRef(brightnessContrast);
  const brightnessContrastInteractingRef = useRef(false);

  // Zoom
  const [uiZoom, setUiZoom] = useState(zoom);
  const zoomLiveRef = useRef(zoom);
  const zoomInteractingRef = useRef(false);

  // Pan
  const [uiPan, setUiPan] = useState(pan);
  const panLiveRef = useRef(pan);
  const panInteractingRef = useRef(false);

  // ----- Knob Controls: simple controlled (same as FeedbackView) -----
  const [uiBlackLevel, setUiBlackLevel] = useState(blackLevel);
  const [uiSaturation, setUiSaturation] = useState(saturation);

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

  // Sync XY controls from store when not interacting
  useEffect(() => {
    if (!brightnessContrastInteractingRef.current) {
      setUiBrightnessContrast(brightnessContrast);
      brightnessContrastLiveRef.current = brightnessContrast;
    }
  }, [brightnessContrast]);

  useEffect(() => {
    if (!zoomInteractingRef.current) {
      setUiZoom(zoom);
      zoomLiveRef.current = zoom;
    }
  }, [zoom]);

  useEffect(() => {
    if (!panInteractingRef.current) {
      setUiPan(pan);
      panLiveRef.current = pan;
    }
  }, [pan]);

  // Sync knob controls from store
  useEffect(() => {
    setUiBlackLevel(blackLevel);
  }, [blackLevel]);

  useEffect(() => {
    setUiSaturation(saturation);
  }, [saturation]);

  // Single commit to store (and one optional OSC send) on release
  const commitTint = useCallback((c: RGBA) => {
    setTintColor({ r: c.r, g: c.g, b: c.b, a: clamp01(c.a) }, 'user');
    if (isConnected && onSend) onSend(`/${fxType}/tint`, c.r / 255, c.g / 255, c.b / 255, clamp01(c.a));
  }, [fxType, isConnected, onSend, setTintColor]);

  // Picker change:
  //  - while dragging: update only ref (no setState → no re-render → pointer stays)
  //  - not dragging: controlled path with guard to avoid echo loops
  const handleTintChange = (rgba: number[]) => {
    const [r, g, b, a] = rgba;
    const next: RGBA = { r: Math.round(r), g: Math.round(g), b: Math.round(b), a: clamp01(a) };
    if (onSend) {
      if (!colorEq(next, tintColor)) onSend(`/${fxType}/tint`, r / 255, g / 255, b / 255, a);
    }

    if (interactingRef.current) {
      liveRef.current = next;
      return;
    }
    if (ignoreNextOnChangeRef.current) return;
    setUiColor(prev => (colorEq(prev, next) ? prev : next));
    liveRef.current = next;
  };

  // XY Controls: dual-mode pattern (same as tint)
  const handleBrightnessContrastChange = useCallback((value: { x: number; y: number }) => {
    onSend?.(`/${fxType}/brightness_contrast`, value.x, value.y);
    if (brightnessContrastInteractingRef.current) {
      brightnessContrastLiveRef.current = value;
      return;
    }
    setUiBrightnessContrast(value);
    brightnessContrastLiveRef.current = value;
  }, [fxType, onSend]);

  const handleBrightnessContrastEnd = useCallback((value: { x: number; y: number }) => {
    brightnessContrastInteractingRef.current = false;
    setUiBrightnessContrast(value);
    setBrightnessContrast(value.x, value.y);
  }, [setBrightnessContrast]);

  const handleZoomChange = useCallback((value: { x: number; y: number }) => {
    onSend?.(`/${fxType}/zoom`, value.x, value.y);
    if (zoomInteractingRef.current) {
      zoomLiveRef.current = value;
      return;
    }
    setUiZoom(value);
    zoomLiveRef.current = value;
  }, [fxType, onSend]);

  const handleZoomEnd = useCallback((value: { x: number; y: number }) => {
    zoomInteractingRef.current = false;
    setUiZoom(value);
    setZoom(value.x, value.y);
  }, [setZoom]);

  const handlePanChange = useCallback((value: { x: number; y: number }) => {
    onSend?.(`/${fxType}/pan`, value.x, value.y);
    if (panInteractingRef.current) {
      panLiveRef.current = value;
      return;
    }
    setUiPan(value);
    panLiveRef.current = value;
  }, [fxType, onSend]);

  const handlePanEnd = useCallback((value: { x: number; y: number }) => {
    panInteractingRef.current = false;
    setUiPan(value);
    setPan(value.x, value.y);
  }, [setPan]);

  // Knob Controls: clean and simple (same as FeedbackView)
  const handleBlackLevelChange = useCallback((value: number) => {
    onSend?.(`/${fxType}/black_level`, value);
  }, [fxType, onSend]);

  const handleBlackLevelChangeEnd = useCallback((value: number) => {
    setUiBlackLevel(value);
    setBlackLevel(value);
  }, [setBlackLevel]);

  const handleSaturationChange = useCallback((value: number) => {
    onSend?.(`/${fxType}/saturation`, value);
  }, [fxType, onSend]);

  const handleSaturationChangeEnd = useCallback((value: number) => {
    setUiSaturation(value);
    setSaturation(value);
  }, [setSaturation]);

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
  // Dual-mode control props for all controls
  const pickerControlledProps = !interactingRef.current
    ? { value: `rgba(${uiColor.r}, ${uiColor.g}, ${uiColor.b}, ${uiColor.a})` }
    : {};

  const brightnessContrastControlledProps = !brightnessContrastInteractingRef.current
    ? { value: uiBrightnessContrast }
    : {};

  const zoomControlledProps = !zoomInteractingRef.current
    ? { value: uiZoom }
    : {};

  const panControlledProps = !panInteractingRef.current
    ? { value: uiPan }
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
            <div
              className="w-full h-full min-h-[200px] aspect-square mx-auto"
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
                value={uiBlackLevel}
                onChange={handleBlackLevelChange}
                onChangeEnd={handleBlackLevelChangeEnd}
                valueMin={0}
                valueMax={1}
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
                value={uiSaturation}
                onChange={handleSaturationChange}
                onChangeEnd={handleSaturationChangeEnd}
                valueMin={0}
                valueMax={2}
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
            <div
              className="w-full h-full min-h-[200px] aspect-square mx-auto"
              onPointerDownCapture={() => { zoomInteractingRef.current = true; }}
            >
              <XYControl
                {...zoomControlledProps}
                onChange={handleZoomChange}
                onChangeEnd={handleZoomEnd}
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
            <div
              className="w-full h-full min-h-[200px] aspect-square mx-auto"
              onPointerDownCapture={() => { panInteractingRef.current = true; }}
            >
              <XYControl
                {...panControlledProps}
                onChange={handlePanChange}
                onChangeEnd={handlePanEnd}
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
