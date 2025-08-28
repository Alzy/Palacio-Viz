import { create } from 'zustand';

interface PromptState {
  leftPrompt: string;
  rightPrompt: string;
  currentBias: number;
  seedTravelSpeed: number;
  lastChangeSource: 'user' | 'recall' | 'init';
  setLeftPrompt: (prompt: string) => void;
  setRightPrompt: (prompt: string) => void;
  setBias: (bias: number) => void;
  setSeedTravelSpeed: (speed: number) => void;
  setPrompts: (leftPrompt: string, rightPrompt: string, bias: number) => void;
  recallPrompts: (leftPrompt: string, rightPrompt: string, bias: number) => void;
}

export const usePromptStore = create<PromptState>((set) => ({
  leftPrompt: '',
  rightPrompt: '',
  currentBias: 0.5,
  seedTravelSpeed: 0.5,
  lastChangeSource: 'init',
  
  setLeftPrompt: (prompt: string) => 
    set({ leftPrompt: prompt, lastChangeSource: 'user' }),
  
  setRightPrompt: (prompt: string) => 
    set({ rightPrompt: prompt, lastChangeSource: 'user' }),
  
  setBias: (bias: number) => 
    set({ currentBias: bias, lastChangeSource: 'user' }),
  
  setSeedTravelSpeed: (speed: number) => 
    set({ seedTravelSpeed: speed, lastChangeSource: 'user' }),
  
  setPrompts: (leftPrompt: string, rightPrompt: string, bias: number) => 
    set({ leftPrompt, rightPrompt, currentBias: bias, lastChangeSource: 'user' }),
  
  // Special action for recall operations
  recallPrompts: (leftPrompt: string, rightPrompt: string, bias: number) => 
    set({ leftPrompt, rightPrompt, currentBias: bias, lastChangeSource: 'recall' }),
}));