import { create } from "zustand";

type ILRFilterStore = {
 filter: "All" | "Open" | "Closed";
  searchQuery: string;
  startDate: Date | null;
  endDate: Date | null;

  setFilter: (v: "All" | "Open" | "Closed") => void;
  setSearchQuery: (q: string) => void;
  setStartDate: (d: Date | null) => void;
  setEndDate: (d: Date | null) => void;
  reset: () => void;
};

export const useILRFilterStore = create<ILRFilterStore>((set) => ({
  filter: "All",
  searchQuery: "",
  startDate: null,
  endDate: null,

  setFilter: (filter) => set({ filter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setStartDate: (startDate) => set({ startDate }),
  setEndDate: (endDate) => set({ endDate }),

  reset: () =>
    set({
      filter: "All",
      searchQuery: "",
      startDate: null,
      endDate: null,
    }),
}));
