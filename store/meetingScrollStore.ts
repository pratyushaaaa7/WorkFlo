// store/useScrollStore.ts
import { create } from "zustand";

type ScrollState = {
  minutesScrollY: number;
  setMinutesScrollY: (y: number) => void;
};

export const useScrollStore = create<ScrollState>((set) => ({
  minutesScrollY: 0,
  setMinutesScrollY: (y) => set({ minutesScrollY: y }),
}));
