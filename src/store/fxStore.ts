'use client';

import { create } from 'zustand';

interface FXState {
  // XY Control values (0-1 range)
  brightnessContrast: { x: number; y: number };
  zoom: { x: number; y: number };
  pan: { x: number; y: number };
  
  // Knob values
  blackLevel: number;
  saturation: number;
  
  // Color picker value (RGBA format to preserve alpha)
  tintColor: { r: number; g: number; b: number; a: number };
  
  lastChangeSource: 'user' | 'recall' | 'init';
  
  // Actions
  setBrightnessContrast: (x: number, y: number) => void;
  setZoom: (x: number, y: number) => void;
  setPan: (x: number, y: number) => void;
  setBlackLevel: (value: number) => void;
  setSaturation: (value: number) => void;
  setTintColor: (color: { r: number; g: number; b: number; a: number }, source?: 'user' | 'recall') => void;
  setAllValues: (values: Partial<Omit<FXState, 'lastChangeSource' | keyof FXActions>>) => void;
  recallValues: (values: Partial<Omit<FXState, 'lastChangeSource' | keyof FXActions>>) => void;
}

type FXActions = {
  setBrightnessContrast: (x: number, y: number) => void;
  setZoom: (x: number, y: number) => void;
  setPan: (x: number, y: number) => void;
  setBlackLevel: (value: number) => void;
  setSaturation: (value: number) => void;
  setTintColor: (color: { r: number; g: number; b: number; a: number }, source?: 'user' | 'recall') => void;
  setAllValues: (values: Partial<Omit<FXState, 'lastChangeSource' | keyof FXActions>>) => void;
  recallValues: (values: Partial<Omit<FXState, 'lastChangeSource' | keyof FXActions>>) => void;
};

// Create separate stores for pre and post FX
const createFXStore = () => create<FXState>((set) => ({
  brightnessContrast: { x: 0.5, y: 0.5 },
  zoom: { x: 1.0, y: 1.0 },
  pan: { x: 0.5, y: 0.5 },
  blackLevel: 0,
  saturation: 1,
  tintColor: { r: 255, g: 0, b: 0, a: 1 },
  lastChangeSource: 'init',
  
  setBrightnessContrast: (x: number, y: number) => 
    set({ brightnessContrast: { x, y }, lastChangeSource: 'user' }),
  
  setZoom: (x: number, y: number) => 
    set({ zoom: { x, y }, lastChangeSource: 'user' }),
  
  setPan: (x: number, y: number) => 
    set({ pan: { x, y }, lastChangeSource: 'user' }),
  
  setBlackLevel: (value: number) => 
    set({ blackLevel: value, lastChangeSource: 'user' }),
  
  setSaturation: (value: number) => 
    set({ saturation: value, lastChangeSource: 'user' }),
  
  setTintColor: (color: { r: number; g: number; b: number; a: number }, source: 'user' | 'recall' = 'user') =>
    set({ tintColor: color, lastChangeSource: source }),
  
  setAllValues: (values) => 
    set({ ...values, lastChangeSource: 'user' }),
  
  recallValues: (values) => 
    set({ ...values, lastChangeSource: 'recall' }),
}));

export const usePreFXStore = createFXStore();
export const usePostFXStore = createFXStore();