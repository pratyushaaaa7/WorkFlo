// store/useScrollStore.ts
import { create } from "zustand";

type ScrollState = {
  // Scroll position per meeting
  scrollByMeeting: Record<string, number>;

  // Save scroll for a meeting
  setScrollForMeeting: (meetingId: string, y: number) => void;

  // Get scroll for a meeting
  getScrollForMeeting: (meetingId: string) => number;

  // Optional: reset scroll for a meeting
  resetScrollForMeeting: (meetingId: string) => void;
};

export const useScrollStore = create<ScrollState>((set, get) => ({
  scrollByMeeting: {},

  setScrollForMeeting: (meetingId, y) =>
    set((state) => ({
      scrollByMeeting: {
        ...state.scrollByMeeting,
        [meetingId]: y,
      },
    })),

  getScrollForMeeting: (meetingId) =>
    get().scrollByMeeting[meetingId] ?? 0,

  resetScrollForMeeting: (meetingId) =>
    set((state) => {
      const updated = { ...state.scrollByMeeting };
      delete updated[meetingId];
      return { scrollByMeeting: updated };
    }),
}));
