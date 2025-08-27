'use client';

import React, { useState, useCallback } from 'react';
import ColorMixer from '@/components/ColorMixer';
import ColorHistory from '@/components/ColorHistory';

interface LightsViewProps {
  /** Whether the OSC connection is active */
  isConnected: boolean;
  /** Callback to send OSC messages */
  onSend: (address: string, ...args: any[]) => void;
}

const LightsView: React.FC<LightsViewProps> = ({ isConnected, onSend }) => {
  const [leftColor, setLeftColor] = useState('#ff0000'); // Default red
  const [rightColor, setRightColor] = useState('#0000ff'); // Default blue

  // Convert hex color to RGB values (0-255)
  const hexToRgb = useCallback((hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }, []);

  // Send OSC message with normalized RGB values (0-1) and alpha locked to 1.0
  const sendColorMessage = useCallback((leftHex: string, rightHex: string) => {
    const leftRgb = hexToRgb(leftHex);
    const rightRgb = hexToRgb(rightHex);
    
    // Normalize to 0-1 range and set alpha to 1.0
    const leftNormalized = [
      leftRgb.r / 255,
      leftRgb.g / 255,
      leftRgb.b / 255,
      1.0 // Alpha locked to 1.0
    ];
    
    const rightNormalized = [
      rightRgb.r / 255,
      rightRgb.g / 255,
      rightRgb.b / 255,
      1.0 // Alpha locked to 1.0
    ];

    // Send both colors in a single message
    onSend('/lights', ...leftNormalized, ...rightNormalized);
  }, [hexToRgb, onSend]);

  const handleColorChange = useCallback((newLeftColor: string, newRightColor: string) => {
    setLeftColor(newLeftColor);
    setRightColor(newRightColor);
    sendColorMessage(newLeftColor, newRightColor);
  }, [sendColorMessage]);

  const handleLeftColorChange = useCallback((color: string) => {
    setLeftColor(color);
    sendColorMessage(color, rightColor);
  }, [rightColor, sendColorMessage]);

  const handleRightColorChange = useCallback((color: string) => {
    setRightColor(color);
    sendColorMessage(leftColor, color);
  }, [leftColor, sendColorMessage]);

  const handleRecall = useCallback((recalledLeftColor: string, recalledRightColor: string) => {
    setLeftColor(recalledLeftColor);
    setRightColor(recalledRightColor);
    sendColorMessage(recalledLeftColor, recalledRightColor);
  }, [sendColorMessage]);

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Main Color Mixer */}
      <div className="bg-card rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Light Color Mixer</h2>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select two colors for your lighting setup. Colors are sent to /lights with RGBA values (alpha locked to 1.0).
          </p>
          <ColorMixer
            leftColor={leftColor}
            rightColor={rightColor}
            onChange={handleColorChange}
            onLeftColorChange={handleLeftColorChange}
            onRightColorChange={handleRightColorChange}
            disabled={!isConnected}
            leftLabel="Light A"
            rightLabel="Light B"
          />
        </div>
      </div>

      {/* Color History */}
      <div className="bg-card rounded-lg shadow-md p-6 max-h-[50vh] flex flex-col">
        <ColorHistory
          currentColors={{ left: leftColor, right: rightColor }}
          onRecall={handleRecall}
          disabled={!isConnected}
        />
      </div>

      {/* OSC Info */}
      <div className="bg-muted rounded-lg p-4">
        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>OSC Endpoint:</strong> /lights</p>
          <p><strong>Parameters:</strong> r1, g1, b1, a1, r2, g2, b2, a2 (8 floats, 0.0-1.0 range)</p>
          <p><strong>Current Values:</strong></p>
          <div className="font-mono text-xs mt-2 space-y-1">
            {(() => {
              const leftRgb = hexToRgb(leftColor);
              const rightRgb = hexToRgb(rightColor);
              return (
                <>
                  <div>Light A: {(leftRgb.r/255).toFixed(3)}, {(leftRgb.g/255).toFixed(3)}, {(leftRgb.b/255).toFixed(3)}, 1.000</div>
                  <div>Light B: {(rightRgb.r/255).toFixed(3)}, {(rightRgb.g/255).toFixed(3)}, {(rightRgb.b/255).toFixed(3)}, 1.000</div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LightsView;