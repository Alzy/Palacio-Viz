import { create } from 'zustand';

interface FeedbackState {
  // XY Control values (0-1 range)
  brightnessContrast: { x: number; y: number };
  
  // Knob values
  blackLevel: number;
  saturation: number;
  
  lastChangeSource: 'user' | 'recall' | 'init';
  
  // Actions
  setBrightnessContrast: (x: number, y: number) => void;
  setBlackLevel: (value: number) => void;
  setSaturation: (value: number) => void;
  setAllValues: (values: Partial<Omit<FeedbackState, 'lastChangeSource' | keyof FeedbackActions>>) => void;
  recallValues: (values: Partial<Omit<FeedbackState, 'lastChangeSource' | keyof FeedbackActions>>) => void;
}

type FeedbackActions = {
  setBrightnessContrast: (x: number, y: number) => void;
  setBlackLevel: (value: number) => void;
  setSaturation: (value: number) => void;
  setAllValues: (values: Partial<Omit<FeedbackState, 'lastChangeSource' | keyof FeedbackActions>>) => void;
  recallValues: (values: Partial<Omit<FeedbackState, 'lastChangeSource' | keyof FeedbackActions>>) => void;
};

export const useFeedbackStore = create<FeedbackState>((set) => ({
  brightnessContrast: { x: 0.5, y: 0.5 },
  blackLevel: 0,
  saturation: 1,
  lastChangeSource: 'init',
  
  setBrightnessContrast: (x: number, y: number) => 
    set({ brightnessContrast: { x, y }, lastChangeSource: 'user' }),
  
  setBlackLevel: (value: number) => 
    set({ blackLevel: value, lastChangeSource: 'user' }),
  
  setSaturation: (value: number) => 
    set({ saturation: value, lastChangeSource: 'user' }),
  
  setAllValues: (values) => 
    set({ ...values, lastChangeSource: 'user' }),
  
  recallValues: (values) => 
    set({ ...values, lastChangeSource: 'recall' }),
}));