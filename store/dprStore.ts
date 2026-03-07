import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface DprPhoto {
  id: string;
  uri: string;
  caption: string;
}

interface DprStore {
  photosByProject: Record<string, DprPhoto[]>;
  setPhotos: (projectId: string, photos: DprPhoto[]) => void;
  updatePhoto: (
    projectId: string,
    id: string,
    updates: Partial<DprPhoto>,
  ) => void;
  addPhoto: (projectId: string, photo: DprPhoto) => void;
  removePhoto: (projectId: string, id: string) => void;
  clearPhotos: (projectId: string) => void;
}

export const useDprStore = create<DprStore>()(
  persist(
    (set) => ({
      photosByProject: {},
      setPhotos: (projectId, photos) =>
        set((state) => ({
          photosByProject: { ...state.photosByProject, [projectId]: photos },
        })),
      updatePhoto: (projectId, id, updates) =>
        set((state) => {
          const projectPhotos = state.photosByProject[projectId] || [];
          return {
            photosByProject: {
              ...state.photosByProject,
              [projectId]: projectPhotos.map((p) =>
                p.id === id ? { ...p, ...updates } : p,
              ),
            },
          };
        }),
      addPhoto: (projectId, photo) =>
        set((state) => {
          const projectPhotos = state.photosByProject[projectId] || [];
          return {
            photosByProject: {
              ...state.photosByProject,
              [projectId]: [...projectPhotos, photo],
            },
          };
        }),
      removePhoto: (projectId, id) =>
        set((state) => {
          const projectPhotos = state.photosByProject[projectId] || [];
          return {
            photosByProject: {
              ...state.photosByProject,
              [projectId]: projectPhotos.filter((p) => p.id !== id),
            },
          };
        }),
      clearPhotos: (projectId) =>
        set((state) => ({
          photosByProject: { ...state.photosByProject, [projectId]: [] },
        })),
    }),
    {
      name: "dpr-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
