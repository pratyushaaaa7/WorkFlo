import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface SvrPhoto {
  id: string;
  uri: string;
  caption: string;
}

interface SvrStore {
  photosByProject: Record<string, SvrPhoto[]>;
  setPhotos: (projectId: string, photos: SvrPhoto[]) => void;
  updatePhoto: (
    projectId: string,
    id: string,
    updates: Partial<SvrPhoto>,
  ) => void;
  addPhoto: (projectId: string, photo: SvrPhoto) => void;
  removePhoto: (projectId: string, id: string) => void;
  clearPhotos: (projectId: string) => void;
}

export const useSvrStore = create<SvrStore>()(
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
      name: "svr-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
