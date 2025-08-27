'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';

interface ColorPair {
  id: string;
  leftColor: string;
  rightColor: string;
  timestamp: number;
}

interface ColorHistoryProps {
  /** Current color pair */
  currentColors: { left: string; right: string };
  /** Callback when colors are recalled */
  onRecall: (leftColor: string, rightColor: string) => void;
  /** Whether the controls are disabled */
  disabled?: boolean;
}

const ColorHistory: React.FC<ColorHistoryProps> = ({
  currentColors,
  onRecall,
  disabled = false,
}) => {
  const [colorHistory, setColorHistory] = useState<ColorPair[]>([]);

  const handleSave = useCallback(() => {
    const newPair: ColorPair = {
      id: Date.now().toString(),
      leftColor: currentColors.left,
      rightColor: currentColors.right,
      timestamp: Date.now(),
    };

    setColorHistory(prev => [newPair, ...prev]);
  }, [currentColors]);

  const handleRecall = useCallback((pair: ColorPair) => {
    onRecall(pair.leftColor, pair.rightColor);
  }, [onRecall]);

  const handleRecallFlipped = useCallback((pair: ColorPair) => {
    onRecall(pair.rightColor, pair.leftColor);
  }, [onRecall]);

  const handleDelete = useCallback((id: string) => {
    setColorHistory(prev => prev.filter(pair => pair.id !== id));
  }, []);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="space-y-4">
      {/* Header with Save Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Color History</h3>
        <Button
          onClick={handleSave}
          disabled={disabled}
          size="sm"
          className="bg-primary hover:bg-primary/90"
        >
          Save Current Pair
        </Button>
      </div>

      {/* Current Colors Preview */}
      <div className="p-3 bg-muted rounded-lg">
        <div className="text-sm text-muted-foreground mb-2">Current Colors:</div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div 
              className="w-6 h-6 rounded border border-border shadow-sm"
              style={{ backgroundColor: currentColors.left }}
            />
            <span className="text-xs font-mono">{currentColors.left}</span>
          </div>
          <span className="text-muted-foreground">+</span>
          <div className="flex items-center gap-2">
            <div 
              className="w-6 h-6 rounded border border-border shadow-sm"
              style={{ backgroundColor: currentColors.right }}
            />
            <span className="text-xs font-mono">{currentColors.right}</span>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-2 max-h-[40vh] overflow-y-auto">
        {colorHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No saved color pairs yet.</p>
            <p className="text-xs mt-1">Save your current colors to build a history.</p>
          </div>
        ) : (
          colorHistory.map((pair) => (
            <div
              key={pair.id}
              className="p-3 bg-card border border-border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                {/* Color Preview */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded border border-border shadow-sm"
                      style={{ backgroundColor: pair.leftColor }}
                    />
                    <span className="text-xs font-mono">{pair.leftColor}</span>
                  </div>
                  <span className="text-muted-foreground">+</span>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded border border-border shadow-sm"
                      style={{ backgroundColor: pair.rightColor }}
                    />
                    <span className="text-xs font-mono">{pair.rightColor}</span>
                  </div>
                  <span className="text-xs text-muted-foreground ml-2">
                    {formatTime(pair.timestamp)}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1">
                  <Button
                    onClick={() => handleRecall(pair)}
                    disabled={disabled}
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                  >
                    Recall
                  </Button>
                  <Button
                    onClick={() => handleRecallFlipped(pair)}
                    disabled={disabled}
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                  >
                    Flip
                  </Button>
                  <Button
                    onClick={() => handleDelete(pair.id)}
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                  >
                    ×
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Instructions */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>• <strong>Recall:</strong> Load colors in original order</p>
        <p>• <strong>Flip:</strong> Load colors in swapped order</p>
        <p>• <strong>×:</strong> Delete from history</p>
      </div>
    </div>
  );
};

export default ColorHistory;