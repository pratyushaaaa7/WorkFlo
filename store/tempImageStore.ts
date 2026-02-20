import { create } from "zustand";

interface TempImageStore {
  images: { [key: string]: string[] }; // key is issueIndex, value is array of URIs
  setImagesForIssue: (issueIndex: number, imageUris: string[]) => void;
  updateImageForIssue: (
    issueIndex: number,
    oldUri: string,
    newUri: string,
  ) => void;
  addImageToIssue: (issueIndex: number, imageUri: string) => void;
  removeImageFromIssue: (issueIndex: number, imageUri: string) => void;
  clearAll: () => void;
}

export const useTempImageStore = create<TempImageStore>((set) => ({
  images: {},
  setImagesForIssue: (issueIndex, imageUris) =>
    set((state) => ({
      images: { ...state.images, [issueIndex]: imageUris },
    })),
  updateImageForIssue: (issueIndex, oldUri, newUri) =>
    set((state) => {
      const issueImages = state.images[issueIndex] || [];
      const updatedImages = issueImages.map((uri) =>
        uri === oldUri ? newUri : uri,
      );
      return {
        images: { ...state.images, [issueIndex]: updatedImages },
      };
    }),
  addImageToIssue: (issueIndex, imageUri) =>
    set((state) => {
      const issueImages = state.images[issueIndex] || [];
      return {
        images: { ...state.images, [issueIndex]: [...issueImages, imageUri] },
      };
    }),
  removeImageFromIssue: (issueIndex, imageUri) =>
    set((state) => {
      const issueImages = state.images[issueIndex] || [];
      return {
        images: {
          ...state.images,
          [issueIndex]: issueImages.filter((uri) => uri !== imageUri),
        },
      };
    }),
  clearAll: () => set({ images: {} }),
}));
