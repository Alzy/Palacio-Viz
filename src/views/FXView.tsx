'use client';

import React from 'react';
import XYControl from '@/components/common/XYControl';

interface FXViewProps {
  /** Whether the OSC connection is active */
  isConnected: boolean;
  /** Callback to send OSC messages */
  onSend: (address: string, ...args: any[]) => void;
  /** FX type - determines OSC endpoint */
  fxType: 'pre' | 'post';
  /** Title for the FX section */
  title?: string;
}

const FXView: React.FC<FXViewProps> = ({ 
  isConnected, 
  onSend, 
  fxType,
  title 
}) => {
  const handleXYChange = (x: number, y: number) => {
    onSend(`/${fxType}fx`, x, y);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">
          {title || `${fxType.charAt(0).toUpperCase() + fxType.slice(1)}FX Control`}
        </h2>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Drag the point to send X/Y coordinates to TouchDesigner (sends to /{fxType}fx)
          </p>
          <div className="flex justify-center">
            <div className="w-80 h-80">
              <XYControl
                onChange={handleXYChange}
                disabled={!isConnected}
                className="border-2 border-gray-200 rounded-lg"
                xTitle="Horizontal"
                yTitle="Vertical"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FXView;