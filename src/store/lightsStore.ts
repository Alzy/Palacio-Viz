import { create } from 'zustand';

interface LightsState {
  leftColor: string;
  rightColor: string;
  lastChangeSource: 'user' | 'recall' | 'init';
  setColors: (leftColor: string, rightColor: string, source?: 'user' | 'recall') => void;
  recallColors: (leftColor: string, rightColor: string) => void;
}

export const useLightsStore = create<LightsState>((set) => ({
  leftColor: '#ff0000', // Default red
  rightColor: '#0000ff', // Default blue
  lastChangeSource: 'init',
  
  setColors: (leftColor: string, rightColor: string, source: 'user' | 'recall' = 'user') =>
    set({ leftColor, rightColor, lastChangeSource: source }),
  
  // Special action for recall operations - updates state and marks as recall
  recallColors: (leftColor: string, rightColor: string) =>
    set({ leftColor, rightColor, lastChangeSource: 'recall' }),
}));