import { create } from "zustand";

interface UiState {
  isOffline: boolean;
  pendingSyncCount: number;
  setIsOffline: (value: boolean) => void;
  setPendingSyncCount: (count: number) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isOffline: !navigator.onLine,
  pendingSyncCount: 0,
  setIsOffline: (value) => set({ isOffline: value }),
  setPendingSyncCount: (count) => set({ pendingSyncCount: count }),
}));
