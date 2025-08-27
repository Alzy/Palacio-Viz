'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useLightsStore } from '@/store/lightsStore';

interface ColorPair {
  id: string;
  leftColor: string;
  rightColor: string;
  timestamp: number;
}

interface ColorHistoryProps {
  /** Whether the controls are disabled */
  disabled?: boolean;
}

const STORAGE_KEY = 'lights-color-history';

const ColorHistory: React.FC<ColorHistoryProps> = ({
  disabled = false,
}) => {
  const { leftColor, rightColor, recallColors } = useLightsStore();
  const [colorHistory, setColorHistory] = useState<ColorPair[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setColorHistory(parsed);
      }
    } catch (error) {
      console.error('Failed to load color history:', error);
    }
  }, []);

  // Save history to localStorage whenever it changes
  const saveToStorage = useCallback((history: ColorPair[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save color history:', error);
    }
  }, []);

  const handleSave = useCallback(() => {
    const newPair: ColorPair = {
      id: Date.now().toString(),
      leftColor,
      rightColor,
      timestamp: Date.now(),
    };

    const newHistory = [newPair, ...colorHistory];
    setColorHistory(newHistory);
    saveToStorage(newHistory);
  }, [leftColor, rightColor, colorHistory, saveToStorage]);

  const handleRecall = useCallback((pair: ColorPair) => {
    recallColors(pair.leftColor, pair.rightColor);
  }, [recallColors]);

  const handleRecallFlipped = useCallback((pair: ColorPair) => {
    recallColors(pair.rightColor, pair.leftColor);
  }, [recallColors]);

  const handleDelete = useCallback((id: string) => {
    const newHistory = colorHistory.filter(pair => pair.id !== id);
    setColorHistory(newHistory);
    saveToStorage(newHistory);
  }, [colorHistory, saveToStorage]);

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
              style={{ backgroundColor: leftColor }}
            />
            <span className="text-xs font-mono">{leftColor}</span>
          </div>
          <span className="text-muted-foreground">+</span>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded border border-border shadow-sm"
              style={{ backgroundColor: rightColor }}
            />
            <span className="text-xs font-mono">{rightColor}</span>
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